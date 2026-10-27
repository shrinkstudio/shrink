// -----------------------------------------
// CONSENT — CookieYes drives what PostHog is allowed to do
// -----------------------------------------
// PostHog starts straight away (Site settings > Custom code > Head) opted out
// by default with cookieless_mode 'on_reject': until a visitor accepts, events
// go out under PostHog's server-side daily hash ($posthog_cookieless), nothing
// is written to cookies or storage, and session recording is off. The project
// has Cookieless tracking on (Settings > Web analytics) or those events drop.
// Accepting analytics opts in (cookies, so returning visitors are recognised)
// and starts session recording; a refusal opts out again, which clears the
// PostHog cookie and goes back to cookieless.
//
// CookieYes API used: window.getCkyConsent() for the stored choice on load,
// and the `cookieyes_consent_update` document event when the banner is
// answered or the choice changes. GA4 needs none of this: CookieYes sets
// Google consent mode itself.
// -----------------------------------------

interface CkyConsent {
  isUserActionCompleted?: boolean;
  categories?: Record<string, boolean>;
}

interface PostHogLike {
  set_config?: (config: Record<string, unknown>) => void;
  opt_in_capturing?: () => void;
  opt_out_capturing?: () => void;
  startSessionRecording?: () => void;
  stopSessionRecording?: () => void;
}

declare global {
  interface Window {
    getCkyConsent?: () => CkyConsent;
  }
}

let granted: boolean | null = null;

/** true once the visitor has accepted analytics (track.ts only stores UTMs then) */
export const hasAnalyticsConsent = () => granted === true;

const posthog = () => (window as unknown as { posthog?: PostHogLike }).posthog;

const apply = (allow: boolean) => {
  if (allow === granted) return;
  granted = allow;
  const ph = posthog();
  if (!ph) return;
  try {
    if (allow) {
      ph.opt_in_capturing?.();
      ph.set_config?.({ disable_session_recording: false });
      ph.startSessionRecording?.();
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
    apply(!!consent.categories?.analytics);
  } catch {
    // CookieYes not ready yet; the update event covers it
  }
};

const onUpdate = (e: Event) => {
  const detail = (e as CustomEvent<{ accepted?: string[]; rejected?: string[] }>).detail;
  if (!detail) return readStored();
  apply((detail.accepted ?? []).includes('analytics'));
};

export function initConsent(): void {
  document.addEventListener('cookieyes_consent_update', onUpdate);
  readStored();
  // CookieYes loads async; look again once the page has settled
  window.setTimeout(readStored, 1500);
}
