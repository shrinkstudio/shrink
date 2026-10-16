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
// Sends `posthog.capture(name, props)` when PostHog is on the page; does
// nothing otherwise.
// -----------------------------------------

type Props = Record<string, string>;

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

export function track(name: string, props: Props = {}): void {
  const payload = { ...context, ...props, path: window.location.pathname };
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

export function initTrack(scope: ParentNode = document): void {
  setContext(scope);
  bindClicks(scope);
  bindReads(scope);
}

export function destroyTrack(): void {
  cleanups.forEach((fn) => fn());
  cleanups.length = 0;
  context = {};
}
