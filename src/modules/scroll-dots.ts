// -----------------------------------------
// SCROLL DOTS — dots for a horizontally swiped row (eg. needs cards on phones)
// -----------------------------------------
// Markup (CSS/layout built in Webflow, dots use the progress-dot classes):
//   [data-scroll-list="needs"]            ← the scrolling row; its children are the slides
//   [data-scroll-dots="needs"]            ← holds one blueprint:
//     [data-scroll-dot] > bar > fill      ← copied once per slide as a <button>
//
// The dot for the slide nearest the row's start gets aria-current="true"; CSS
// (Custom Code) widens its bar into a pill and fills it. Clicking a dot scrolls
// its slide into place. Where the row doesn't scroll (desktop) CSS hides the dots.
// -----------------------------------------

let cleanups: (() => void)[] = [];

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const setup = (dotsWrap: HTMLElement) => {
  const name = dotsWrap.getAttribute('data-scroll-dots');
  const list = document.querySelector<HTMLElement>(`[data-scroll-list="${name}"]`);
  const blueprint = dotsWrap.querySelector<HTMLElement>('[data-scroll-dot]');
  if (!list || !blueprint) return;

  const slides = [...list.children] as HTMLElement[];
  if (slides.length < 2) return;

  dotsWrap.setAttribute('data-scroll-dots-init', '');
  dotsWrap.setAttribute('role', 'group');
  if (!dotsWrap.hasAttribute('aria-label')) dotsWrap.setAttribute('aria-label', 'Choose a card');
  blueprint.remove();

  const dots = slides.map((_, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = blueprint.className;
    dot.setAttribute('data-scroll-dot', '');
    dot.setAttribute('aria-label', `Show card ${index + 1} of ${slides.length}`);
    dot.innerHTML = blueprint.innerHTML;
    dotsWrap.appendChild(dot);
    return dot;
  });

  /** Where a slide's left edge sits in the row's scroll space, minus the snap padding. */
  const offsetOf = (slide: HTMLElement) => {
    const pad = parseFloat(getComputedStyle(list).scrollPaddingLeft) || 0;
    return (
      list.scrollLeft + slide.getBoundingClientRect().left - list.getBoundingClientRect().left - pad
    );
  };

  let active = -1;
  const sync = () => {
    let nearest = 0;
    let best = Infinity;
    slides.forEach((slide, index) => {
      const distance = Math.abs(offsetOf(slide) - list.scrollLeft);
      if (distance < best) {
        best = distance;
        nearest = index;
      }
    });
    if (nearest === active) return;
    active = nearest;
    dots.forEach((dot, index) => dot.setAttribute('aria-current', String(index === active)));
  };

  let frame = 0;
  const onScroll = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(sync);
  };
  const onClick = (e: Event) => {
    const index = dots.indexOf(
      (e.target as Element).closest('[data-scroll-dot]') as HTMLButtonElement
    );
    if (index < 0) return;
    list.scrollTo({ left: offsetOf(slides[index]), behavior: reduced() ? 'auto' : 'smooth' });
  };

  list.addEventListener('scroll', onScroll, { passive: true });
  dotsWrap.addEventListener('click', onClick);
  window.addEventListener('resize', onScroll);
  sync();

  cleanups.push(() => {
    cancelAnimationFrame(frame);
    list.removeEventListener('scroll', onScroll);
    dotsWrap.removeEventListener('click', onClick);
    window.removeEventListener('resize', onScroll);
    dots.forEach((dot) => dot.remove());
    dotsWrap.appendChild(blueprint);
    dotsWrap.removeAttribute('data-scroll-dots-init');
  });
};

/** Wires every dots row in the scope to its scroll list. Skips ones already running. */
export const initScrollDots = (scope: ParentNode = document) => {
  scope
    .querySelectorAll<HTMLElement>('[data-scroll-dots]:not([data-scroll-dots-init])')
    .forEach(setup);
};

export const destroyScrollDots = () => {
  cleanups.forEach((fn) => fn());
  cleanups = [];
};
