// -----------------------------------------
// INVIEW — one-time "has scrolled into view" class
// -----------------------------------------
// Adds .is-inview to an element the first time it scrolls into view, so CSS can
// play an entrance once. Behaviour only: every keyframe, duration and hidden
// state lives in Webflow. Without this module nothing is hidden, the content
// just shows.
//
// Markup (CSS built in Webflow):
//   [data-inview]                 ← gets .is-inview once ~30% visible
//     [data-in="up"]              ← a piece CSS animates (names are CSS-side)
//     [data-in-delay="0.3"]       ← its delay in seconds, exposed as --d
//   [data-inview-stagger="0.12"]  ← optional wrapper: each [data-inview] inside
//                                   gets --c = its index × the step (seconds)
//
// data-inview="0.5" overrides the visible fraction per element. The document
// element gets [data-inview-ready] once this is running, so CSS can hide the
// pieces only when something will reveal them.
// -----------------------------------------

const DEFAULT_THRESHOLD = 0.3;

let observers: IntersectionObserver[] = [];
let touched: HTMLElement[] = [];

/**
 * Initialises every in-view element within the given scope.
 * Safe to call repeatedly — already-observed elements are skipped.
 *
 * @param scope The subtree to scan. Defaults to the whole document.
 */
export const initInview = (scope: ParentNode = document) => {
  const targets = [...scope.querySelectorAll<HTMLElement>('[data-inview]')].filter(
    (target) => !target.hasAttribute('data-inview-init')
  );
  if (!targets.length) return;

  // Delays and stagger steps are authored as attributes; CSS reads them as
  // custom properties.
  for (const piece of scope.querySelectorAll<HTMLElement>('[data-in-delay]')) {
    const delay = Number(piece.getAttribute('data-in-delay'));
    if (Number.isFinite(delay)) piece.style.setProperty('--d', String(delay));
  }

  for (const group of scope.querySelectorAll<HTMLElement>('[data-inview-stagger]')) {
    const step = Number(group.getAttribute('data-inview-stagger')) || 0;
    group.querySelectorAll<HTMLElement>('[data-inview]').forEach((target, index) => {
      target.style.setProperty('--c', String(Number((index * step).toFixed(3))));
    });
  }

  for (const target of targets) {
    target.setAttribute('data-inview-init', '');
    touched.push(target);

    // No observer support: show everything rather than leave it hidden.
    if (!('IntersectionObserver' in window)) {
      target.classList.add('is-inview');
      continue;
    }

    const threshold = Number(target.getAttribute('data-inview')) || DEFAULT_THRESHOLD;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-inview');
          observer.unobserve(entry.target);
        }
      },
      { threshold }
    );
    observer.observe(target);
    observers.push(observer);
  }

  document.documentElement.setAttribute('data-inview-ready', '');
};

/**
 * Stops observing and clears the state, so the module can be re-initialised on
 * a page transition and entrances play again.
 */
export const destroyInview = () => {
  for (const observer of observers) observer.disconnect();
  observers = [];

  for (const target of touched) {
    target.classList.remove('is-inview');
    target.removeAttribute('data-inview-init');
  }
  touched = [];

  document.documentElement.removeAttribute('data-inview-ready');
};
