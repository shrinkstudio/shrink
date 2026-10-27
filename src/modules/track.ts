// -----------------------------------------
// TRACK — named PostHog events, set from Webflow attributes
// -----------------------------------------
// Gives the moments that matter a name (and the page some context) so they can
// be counted and filtered in PostHog. Hooks are wired now; the full tracking
// sweep (PostHog install, funnels) happens before launch.
//
// Markup:
//   [data-track="solution-click"]           click → event of that name
//     data-track-label="..."                optional detail sent with it
//   [data-track-context]                    page context, sent with every event
//     data-track-type="article"             eg. type, category, solution
//     data-track-category="Visibility"
//   [data-track-read="article-read"]        fires once when the end of this
//                                           element scrolls into view
//
// Site-wide, no markup needed:
//   contact_form_submitted                  any Webflow form submit (form name, page)
//   guide_downloaded                        the Resource form (guide title)
//   call_booked                             a Cal.com embed booking succeeds
//   scroll_depth                            25 / 50 / 75 / 100 percent, once each per page
//
// Attribution: utm_* from the landing URL ride along on every event and go
// into every form as hidden inputs, so the Airtable record says which post
// sent the lead. The UTMs are only kept across pages (sessionStorage) once
// analytics consent is given; without it they still work on the landing page,
// which is where post links point (guide pages, /calls/*, /contact).
//
// Sends `posthog.capture(name, props)` when PostHog is on the page (the snippet
// lives in Site settings > Custom code > Head); does nothing otherwise.
// -----------------------------------------

import { hasAnalyticsConsent } from './consent';

type Props = Record<string, string>;

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
const UTM_STORE = 'shrink_utm';

declare global {
  interface Window {
    posthog?: { capture?: (name: string, props?: Props) => void };
  }
}

let context: Props = {};
const cleanups: Array<() => void> = [];

// data-track-foo-bar → { 'foo-bar': value }, minus the event name itself
function readProps(el: HTMLElement, skip: string[]): Props {
  const props: Props = {};
  for (const { name, value } of Array.from(el.attributes)) {
    if (!name.startsWith('data-track-') || skip.includes(name) || !value.trim()) continue;
    props[name.slice('data-track-'.length)] = value.trim();
  }
  return props;
}

// UTMs from this URL, else the ones kept from the landing page this session
function readUtm(): Props {
  const params = new URLSearchParams(window.location.search);
  const fromUrl: Props = {};
  UTM_KEYS.forEach((k) => {
    const v = params.get(k)?.trim();
    if (v) fromUrl[k] = v.slice(0, 100);
  });
  try {
    if (Object.keys(fromUrl).length) {
      if (hasAnalyticsConsent()) sessionStorage.setItem(UTM_STORE, JSON.stringify(fromUrl));
      return fromUrl;
    }
    const kept = sessionStorage.getItem(UTM_STORE);
    return kept ? (JSON.parse(kept) as Props) : {};
  } catch {
    return fromUrl;
  }
}

export function track(name: string, props: Props = {}): void {
  const payload = { ...readUtm(), ...context, ...props, path: window.location.pathname };
  try {
    window.posthog?.capture?.(name, payload);
  } catch {
    // analytics must never break the page
  }
}

function setContext(scope: ParentNode) {
  const el = scope.querySelector<HTMLElement>('[data-track-context]');
  if (!el) return;
  context = readProps(el, ['data-track-context']);
}

function bindClicks(scope: ParentNode) {
  scope.querySelectorAll<HTMLElement>('[data-track]').forEach((el) => {
    const name = el.getAttribute('data-track')?.trim();
    if (!name) return;
    const onClick = () => track(name, readProps(el, ['data-track']));
    el.addEventListener('click', onClick);
    cleanups.push(() => el.removeEventListener('click', onClick));
  });
}

// the read event fires when the element's last child is on screen
function bindReads(scope: ParentNode) {
  scope.querySelectorAll<HTMLElement>('[data-track-read]').forEach((el) => {
    const name = el.getAttribute('data-track-read')?.trim() || 'read';
    const end = (el.querySelector('.w-richtext') ?? el).lastElementChild ?? el;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      track(name);
      observer.disconnect();
    });
    observer.observe(end);
    cleanups.push(() => observer.disconnect());
  });
}

// every form submit, named after the Webflow form (Enquiry, Resource, Pre-call...)
function bindForms(scope: ParentNode) {
  const utm = readUtm();
  scope.querySelectorAll<HTMLFormElement>('form').forEach((form) => {
    // hidden utm_* inputs, so the submission (and Airtable) carries the source
    Object.entries(utm).forEach(([k, v]) => {
      if (form.querySelector(`input[name="${k}"]`)) return;
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = k;
      input.value = v;
      form.append(input);
    });

    const formName = form.getAttribute('data-name') || form.getAttribute('name') || 'unknown';
    const onSubmit = () => {
      track('contact_form_submitted', { form_name: formName, page: window.location.pathname });
      if (formName.toLowerCase() === 'resource') {
        const guide =
          form.querySelector<HTMLInputElement>('input[name="Guide"]')?.value ||
          document.querySelector('h1')?.textContent?.trim() ||
          'unknown';
        track('guide_downloaded', { guide });
      }
    };
    form.addEventListener('submit', onSubmit);
    cleanups.push(() => form.removeEventListener('submit', onSubmit));
  });
}

// Cal.com embeds post { originator: 'CAL', type: 'bookingSuccessful' | 'bookingSuccessfulV2' }
// to the parent page; both fire for one booking, so count it once per page
function bindBookings() {
  let booked = false;
  const onMessage = (e: MessageEvent) => {
    if (
      booked ||
      !/(^|\.)cal\.com$/.test(new URL(e.origin || 'about:blank', location.href).hostname)
    )
      return;
    const data = e.data as { originator?: string; type?: string } | null;
    if (data?.originator !== 'CAL' || !/^bookingSuccessful/.test(data.type || '')) return;
    booked = true;
    track('call_booked', { page: window.location.pathname });
  };
  window.addEventListener('message', onMessage);
  cleanups.push(() => window.removeEventListener('message', onMessage));
}

/* scroll milestones, percent of the page */
const MILESTONES = [25, 50, 75, 100];

function bindScrollDepth() {
  const reached = new Set<number>();
  let ticking = false;
  const measure = () => {
    ticking = false;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return;
    const percent = Math.round((window.scrollY / docHeight) * 100);
    MILESTONES.forEach((milestone) => {
      if (percent < milestone || reached.has(milestone)) return;
      reached.add(milestone);
      track('scroll_depth', { percent: String(milestone), page: window.location.pathname });
    });
    if (reached.size === MILESTONES.length) window.removeEventListener('scroll', onScroll);
  };
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(measure);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  cleanups.push(() => window.removeEventListener('scroll', onScroll));
}

export function initTrack(scope: ParentNode = document): void {
  setContext(scope);
  bindClicks(scope);
  bindReads(scope);
  bindForms(scope);
  bindBookings();
  bindScrollDepth();
}

export function destroyTrack(): void {
  cleanups.forEach((fn) => fn());
  cleanups.length = 0;
  context = {};
}
