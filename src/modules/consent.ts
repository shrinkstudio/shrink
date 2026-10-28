// -----------------------------------------
// CONSENT — CookieYes drives what PostHog is allowed to do
// -----------------------------------------
// PostHog starts straight away (Site settings > Custom code > Head) opted out
// by default with cookieless_mode 'on_reject': until a visitor accepts, events
// go out under PostHog's server-side daily hash ($posthog_cookieless), nothing
// is written to cookies or storage, and session recording is off. The project
// has Cookieless tracking on (Settings > Web analytics) or those events drop.
// Accepting analytics opts in (cookies, so returning visitors are recognised),
// starts session recording and, on a fresh yes, sends a $pageview for the
// current page so the new session has it; a refusal opts out again, which
// clears the PostHog cookie and goes back to cookieless.
//
// GA4 loads only after an analytics yes (Google consent mode basic): nothing
// from Google downloads or runs before that, so CookieYes can load async. On a
// yes this sets consent (ad storage follows the advertisement category), then
// config, then injects gtag.js. While the old head snippet still loads gtag.js
// itself, only the consent update is sent.
//
// CookieYes API used: window.getCkyConsent() for the stored choice on load,
// and the `cookieyes_consent_update` document event when the banner is
// answered or the choice changes.
// -----------------------------------------

const GA_ID = 'G-G2Y3LBQPRZ';

interface CkyConsent {
  isUserActionCompleted?: boolean;
  categories?: Record<string, boolean>;
}

interface PostHogLike {
  set_config?: (config: Record<string, unknown>) => void;
  capture?: (event: string) => void;
  has_opted_in_capturing?: () => boolean;
  opt_in_capturing?: () => void;
  opt_out_capturing?: () => void;
  startSessionRecording?: () => void;
  stopSessionRecording?: () => void;
}

declare global {
  interface Window {
    getCkyConsent?: () => CkyConsent;
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let granted: boolean | null = null;

/** true once the visitor has accepted analytics (track.ts only stores UTMs then) */
export const hasAnalyticsConsent = () => granted === true;

const posthog = () => (window as unknown as { posthog?: PostHogLike }).posthog;

const googleConsent = (analytics: boolean, ads: boolean) => {
  const ad = ads ? 'granted' : 'denied';
  return {
    analytics_storage: analytics ? 'granted' : 'denied',
    ad_storage: ad,
    ad_user_data: ad,
    ad_personalization: ad,
  };
};

const startGoogle = (ads: boolean) => {
  window.dataLayer ||= [];
  // gtag.js only reads commands pushed as `arguments` objects, never arrays
  window.gtag ||= function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer?.push(arguments);
  };
  window.gtag('consent', 'update', googleConsent(true, ads));
  if (document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) return;
  window.gtag('js', new Date());
  window.gtag('config', GA_ID);
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.append(script);
};

const apply = (allow: boolean, ads = false) => {
  if (allow === granted) return;
  granted = allow;
  try {
    if (allow) startGoogle(ads);
    else window.gtag?.('consent', 'update', googleConsent(false, false));
  } catch {
    // consent must never break the page
  }
  const ph = posthog();
  if (!ph) return;
  try {
    if (allow) {
      const wasIn = ph.has_opted_in_capturing?.() ?? true;
      ph.opt_in_capturing?.();
      ph.set_config?.({ disable_session_recording: false });
      ph.startSessionRecording?.();
      // a fresh yes starts a new session; log the page they're on so it isn't blank
      if (!wasIn) ph.capture?.('$pageview');
    } else {
      ph.stopSessionRecording?.();
      ph.set_config?.({ disable_session_recording: true });
      ph.opt_out_capturing?.();
    }
  } catch {
    // consent must never break the page
  }
};

const readStored = () => {
  try {
    const consent = window.getCkyConsent?.();
    if (!consent?.isUserActionCompleted) return;
    apply(!!consent.categories?.analytics, !!consent.categories?.advertisement);
  } catch {
    // CookieYes not ready yet; the update event covers it
  }
};

const onUpdate = (e: Event) => {
  const detail = (e as CustomEvent<{ accepted?: string[]; rejected?: string[] }>).detail;
  if (!detail) return readStored();
  const accepted = detail.accepted ?? [];
  apply(accepted.includes('analytics'), accepted.includes('advertisement'));
};

export function initConsent(): void {
  document.addEventListener('cookieyes_consent_update', onUpdate);
  readStored();
  // CookieYes loads async; look again once the page has settled
  window.setTimeout(readStored, 1500);
}
