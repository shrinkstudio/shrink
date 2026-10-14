// -----------------------------------------
// HOVER LIST — Flip-powered hover highlight
// -----------------------------------------
// A single background/fill element flips between list items on hover, giving a
// highlight that travels smoothly between nav links.
//
// Markup (CSS/layout built in Webflow):
//   [data-hover-list]                      ← list root (optional — see fallback)
//     [data-hover-item]                    ← each item (one per link)
//       [data-hover-background] > [data-hover-fill]
//       [data-hover-visual]                ← the link; background is flipped into it
//
// [data-hover-list="slide"] keeps the background inside the list and slides it
// under the items instead (the list needs position: relative and isolation).
//
// Author one background/fill per item in the Designer if that's easier — only
// the first survives at runtime; the rest are removed, since the whole point is
// that ONE background travels between items.
//
// Requires GSAP + the Flip plugin as globals (loaded from CDN in the page head,
// the same as every other Shrink bundle):
//   <script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
//   <script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/Flip.min.js"></script>
// Without them the nav still works — this just no-ops (no highlight).
// -----------------------------------------

import { canHover, type GsapTimeline } from '../utils/gsap';

interface StoredListener {
  element: Element;
  type: string;
  handler: EventListener;
}

let timelines: GsapTimeline[] = [];
let listeners: StoredListener[] = [];

/**
 * Initialises every hover list within the given scope.
 * Safe to call repeatedly — already-initialised roots are skipped.
 *
 * @param scope The subtree to scan. Defaults to the whole document.
 */
export const initHoverList = (scope: ParentNode = document) => {
  const { gsap, Flip } = window;

  // Graceful no-op until GSAP/Flip are loaded, and on touch screens, where
  // there is no hover to follow.
  if (!gsap || !Flip || !canHover()) return;

  gsap.registerPlugin(Flip);

  // Root on [data-hover-list]; fall back to the nearest list ancestor shared by
  // the items, so it still works without the extra wrapper attribute.
  let components = [...scope.querySelectorAll<HTMLElement>('[data-hover-list]')];

  if (!components.length) {
    const roots = new Set<HTMLElement>();

    scope.querySelectorAll<HTMLElement>('[data-hover-item]').forEach((item) => {
      const root = item.closest<HTMLElement>('[role="list"], ul, ol') || item.parentElement;
      if (root) roots.add(root);
    });

    components = [...roots];
  }

  for (const component of components) {
    if (component.hasAttribute('data-hover-init')) continue;

    const items = [...component.querySelectorAll<HTMLElement>('[data-hover-item]')];
    if (!items.length) continue;

    // Keep a single background to flip around; drop the duplicates.
    component.querySelectorAll('[data-hover-background]').forEach((el, i) => i && el.remove());

    const background = component.querySelector<HTMLElement>('[data-hover-background]');
    const fill = component.querySelector<HTMLElement>('[data-hover-fill]');
    if (!background || !fill) continue;

    component.setAttribute('data-hover-init', '');

    let hoverBetween = false;

    const tl = gsap.timeline({
      paused: true,
      onReverseComplete: () => {
        hoverBetween = false;
      },
    });

    tl.fromTo(fill, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.2 });
    timelines.push(tl);

    // [data-hover-list="slide"]: the background stays a child of the list and
    // slides under the items, so it can never land on top of their text
    const slide = component.getAttribute('data-hover-list') === 'slide';
    if (slide) {
      component.prepend(background);
      gsap.set(background, { top: 0, left: 0, right: 'auto', bottom: 'auto' });
    }

    const slideTo = (item: HTMLElement) => {
      const target = item.querySelector<HTMLElement>('[data-hover-visual]') || item;
      const box = target.getBoundingClientRect();
      const root = component.getBoundingClientRect();
      const to = {
        x: box.left - root.left - component.clientLeft,
        y: box.top - root.top - component.clientTop,
        width: box.width,
        height: box.height,
      };
      if (hoverBetween) gsap.to(background, { ...to, duration: 0.3, ease: 'power1.inOut' });
      else gsap.set(background, to);
    };

    const flipInto = (item: HTMLElement) => {
      if (slide) {
        slideTo(item);
        return;
      }

      const state = Flip.getState(background);

      item.querySelector<HTMLElement>('[data-hover-visual]')?.prepend(background);

      // Skip the flip on first entry, or the background animates in from
      // wherever it happened to be authored.
      if (hoverBetween) Flip.from(state, { duration: 0.3, ease: 'power1.inOut' });
    };

    for (const item of items) {
      const handler = () => {
        flipInto(item);
        hoverBetween = true;
      };

      item.addEventListener('mouseenter', handler);
      listeners.push({ element: item, type: 'mouseenter', handler });
    }

    const enterHandler = () => tl.play();
    const leaveHandler = () => tl.reverse();

    component.addEventListener('mouseenter', enterHandler);
    component.addEventListener('mouseleave', leaveHandler);

    listeners.push(
      { element: component, type: 'mouseenter', handler: enterHandler },
      { element: component, type: 'mouseleave', handler: leaveHandler }
    );
  }
};

/**
 * Tears down every hover list, so the module can be re-initialised on a page
 * transition without stacking duplicate timelines or listeners.
 */
export const destroyHoverList = () => {
  for (const tl of timelines) {
    try {
      tl.kill();
    } catch {
      // A timeline can already be dead if GSAP was torn down first.
    }
  }

  timelines = [];

  for (const { element, type, handler } of listeners) {
    element.removeEventListener(type, handler);
  }

  listeners = [];

  document.querySelectorAll('[data-hover-init]').forEach((el) => {
    el.removeAttribute('data-hover-init');
  });
};
