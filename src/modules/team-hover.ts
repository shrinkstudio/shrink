// -----------------------------------------
// TEAM HOVER — cursor-following GIF over a CMS list
// -----------------------------------------
// Hovering a team member shows their GIF, which follows the cursor. Moving to
// another member swaps the GIF; leaving the list hides it.
//
// Markup (CSS/layout built in Webflow):
//   [data-team-list]                     ← the Collection List
//     [data-team-item]                   ← each Collection Item
//       [data-team-gif]                  ← <img> bound to the GIF field, hidden
//   [data-team-follower]                 ← empty wrapper the GIF is moved into
//
// The GIF lives inside its own item and is *moved* into the follower on hover,
// rather than swapping a single <img src>. Swapping src on a GIF gives a blank
// frame and re-decodes the file every time; moving the element keeps it decoded
// and already playing.
//
// The follower is relocated to <body> on init: it's position:fixed, and any
// ancestor with a transform/filter/will-change would otherwise become its
// containing block and break the tracking.
//
// Requires GSAP as a global (see utils/gsap.ts). No-ops without it, on touch
// devices, and for users who prefer reduced motion.
// -----------------------------------------

import { canHover } from '../utils/gsap';

interface StoredListener {
  element: Element | Window;
  type: string;
  handler: EventListener;
}

let listeners: StoredListener[] = [];
let followers: HTMLElement[] = [];

const listen = (element: Element | Window, type: string, handler: EventListener) => {
  element.addEventListener(type, handler);
  listeners.push({ element, type, handler });
};

/**
 * @returns The follower belonging to this list — a sibling if there is one, so
 * multiple lists can each have their own, otherwise the first on the page.
 */
const findFollower = (component: HTMLElement) =>
  component.parentElement?.querySelector<HTMLElement>('[data-team-follower]') ??
  document.querySelector<HTMLElement>('[data-team-follower]');

/**
 * Initialises every team hover list within the given scope.
 * Safe to call repeatedly — already-initialised lists are skipped.
 *
 * @param scope The subtree to scan. Defaults to the whole document.
 */
export const initTeamHover = (scope: ParentNode = document) => {
  const { gsap } = window;

  if (!gsap || !canHover()) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  for (const component of scope.querySelectorAll<HTMLElement>('[data-team-list]')) {
    if (component.hasAttribute('data-team-init')) continue;

    const items = [...component.querySelectorAll<HTMLElement>('[data-team-item]')];
    const follower = findFollower(component);
    if (!items.length || !follower) continue;

    component.setAttribute('data-team-init', '');

    // See the note above: fixed positioning must not be trapped in a
    // transformed ancestor.
    document.body.append(follower);
    followers.push(follower);

    gsap.set(follower, { position: 'fixed', top: 0, left: 0, opacity: 0, pointerEvents: 'none' });

    const xTo = gsap.quickTo(follower, 'x', { ease: 'power3', duration: 0.4 });
    const yTo = gsap.quickTo(follower, 'y', { ease: 'power3', duration: 0.4 });

    // Flip the GIF back across the cursor near the viewport edges so it never
    // pushes outside the window.
    let xPercent = -50;
    let yPercent = -50;

    const track = (event: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const { offsetWidth, offsetHeight } = follower;

      const nextX = event.clientX + offsetWidth / 2 > innerWidth ? -100 : -50;
      const nextY = event.clientY + offsetHeight / 2 > innerHeight ? -100 : -50;

      if (nextX !== xPercent || nextY !== yPercent) {
        xPercent = nextX;
        yPercent = nextY;
        gsap.to(follower, { xPercent, yPercent, duration: 0.3, ease: 'power3' });
      }

      xTo(event.clientX);
      yTo(event.clientY);
    };

    const show = (event: MouseEvent) => {
      // Jump to the cursor before fading in, or the GIF flies in from wherever
      // it was last left.
      gsap.set(follower, { x: event.clientX, y: event.clientY, xPercent, yPercent });
      gsap.to(follower, { opacity: 1, duration: 0.2, ease: 'power2.out' });
    };

    const hide = () => {
      gsap.to(follower, { opacity: 0, duration: 0.2, ease: 'power2.out' });
    };

    listen(component, 'mouseenter', show as EventListener);
    listen(component, 'mouseleave', hide as EventListener);
    listen(component, 'mousemove', track as EventListener);

    for (const item of items) {
      const gif = item.querySelector<HTMLElement>('[data-team-gif]');
      if (!gif) continue;

      listen(item, 'mouseenter', () => {
        // One GIF visible at a time: the follower only ever holds the current one.
        follower.replaceChildren(gif);
      });
    }
  }
};

/**
 * Tears down every team hover list, so the module can be re-initialised on a
 * page transition without stacking duplicate listeners.
 */
export const destroyTeamHover = () => {
  for (const { element, type, handler } of listeners) {
    element.removeEventListener(type, handler);
  }

  listeners = [];

  // The follower was moved to <body>; drop it so a re-init doesn't leave
  // orphans behind.
  for (const follower of followers) follower.remove();
  followers = [];

  document.querySelectorAll('[data-team-init]').forEach((el) => {
    el.removeAttribute('data-team-init');
  });
};
