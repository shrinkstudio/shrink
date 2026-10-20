// -----------------------------------------
// TESTIMONIALS — one card, quotes swap in place on a timer
// -----------------------------------------
// Markup (CSS/layout built in Webflow, the Testimonial Slider component):
//   [data-testimonials="6"]               ← root; seconds per slide, 0 = click only
//     [data-testimonials-item]            ← each Collection Item (stacked in one grid cell)
//     [data-testimonials-dots]            ← holds one blueprint:
//       [data-testimonials-dot] > bar > [data-testimonials-dot-fill]
//     [data-testimonials-count]           ← "1 / 6"
//
// The dot blueprint is copied once per item; its bar widens into a pill while
// active and the fill runs left to right as the timer. Autoplay pauses on hover,
// focus and off screen. Each item cross-fades as one piece (logo, quote, author
// and photo together) with a small rise; reduced motion drops the rise.
// One item: no dots, no timer.
// -----------------------------------------

type Vars = Record<string, unknown>;

interface Tween {
  kill(): void;
  pause(): void;
  resume(): void;
  progress(value: number): void;
}

interface Timeline extends Tween {
  to(target: unknown, vars: Vars, position?: number): Timeline;
  fromTo(target: unknown, from: Vars, to: Vars, position?: number): Timeline;
}

interface GsapLike {
  set(target: unknown, vars: Vars): void;
  to(target: unknown, vars: Vars): Tween;
  fromTo(target: unknown, from: Vars, to: Vars): Tween;
  timeline(vars?: Vars): Timeline;
}

interface Slide {
  item: HTMLElement;
  dot: HTMLButtonElement;
  bar: HTMLElement;
  fill: HTMLElement;
}

const DOT_WIDTH = '0.375rem';
const PILL_WIDTH = '2.5rem';
/* px the incoming card rises from */
const RISE = 12;

let cleanups: (() => void)[] = [];

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const setup = (root: HTMLElement, gsap: GsapLike) => {
  const items = [...root.querySelectorAll<HTMLElement>('[data-testimonials-item]')];
  const dotsWrap = root.querySelector<HTMLElement>('[data-testimonials-dots]');
  const blueprint = dotsWrap?.querySelector<HTMLElement>('[data-testimonials-dot]');
  const count = root.querySelector<HTMLElement>('[data-testimonials-count]');
  if (!items.length || !dotsWrap || !blueprint) return;

  root.setAttribute('data-testimonials-init', '');
  const seconds = items.length > 1 ? Number(root.getAttribute('data-testimonials')) || 0 : 0;
  blueprint.remove();

  // dots: real buttons, whatever element the blueprint was authored as
  const slides: Slide[] = items.map((item, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = blueprint.className;
    dot.setAttribute('data-testimonials-dot', '');
    dot.setAttribute('aria-label', `Show testimonial ${index + 1} of ${items.length}`);
    dot.innerHTML = blueprint.innerHTML;
    dotsWrap.appendChild(dot);

    const fill = dot.querySelector<HTMLElement>('[data-testimonials-dot-fill]') ?? dot;
    return { item, dot, bar: (fill.parentElement as HTMLElement) ?? dot, fill };
  });

  // display classes beat [hidden], so hide inline
  if (items.length < 2) {
    dotsWrap.style.display = 'none';
    if (count) count.style.display = 'none';
  }

  let active = 0;
  let transition: Timeline | null = null;
  let timer: Tween | null = null;
  let inView = false;
  let held = false;

  const setStatus = (slide: Slide, status: 'active' | 'leaving' | 'inactive') => {
    const on = status === 'active';
    slide.item.setAttribute('data-testimonials-status', status);
    slide.item.setAttribute('aria-hidden', String(!on));
    slide.item.toggleAttribute('inert', !on);
    gsap.set(slide.item, { visibility: status === 'inactive' ? 'hidden' : 'visible' });
    slide.dot.setAttribute('data-testimonials-status', on ? 'active' : 'inactive');
    slide.dot.setAttribute('aria-current', String(on));
    gsap.to(slide.bar, { width: on ? PILL_WIDTH : DOT_WIDTH, duration: 0.6, ease: 'power3.inOut' });
  };

  const syncTimer = () => {
    if (!timer) return;
    if (inView && !held) timer.resume();
    else timer.pause();
  };

  const startTimer = () => {
    timer?.kill();
    timer = null;
    gsap.set(
      slides.map((s) => s.fill),
      { scaleX: 0, transformOrigin: 'left center' }
    );
    const { fill } = slides[active];
    if (!seconds) {
      gsap.set(fill, { scaleX: 1 });
      return;
    }
    timer = gsap.fromTo(
      fill,
      { scaleX: 0 },
      {
        scaleX: 1,
        duration: seconds,
        ease: 'none',
        onComplete: () => goTo((active + 1) % slides.length),
      }
    );
    syncTimer();
  };

  const goTo = (next: number) => {
    if (next === active) return;
    transition?.progress(1);

    const outgoing = slides[active];
    const incoming = slides[next];
    setStatus(outgoing, 'leaving');
    setStatus(incoming, 'active');
    active = next;
    if (count) count.textContent = `${next + 1} / ${slides.length}`;
    startTimer();

    const rise = reduced() ? 0 : RISE;
    transition = gsap.timeline({
      onComplete: () => {
        setStatus(outgoing, 'inactive');
        gsap.set([outgoing.item, incoming.item], { clearProps: 'transform,opacity' });
        transition = null;
      },
    });
    transition
      .to(outgoing.item, { opacity: 0, y: -rise, duration: 0.35, ease: 'power2.out' }, 0)
      .fromTo(
        incoming.item,
        { opacity: 0, y: rise },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' },
        0.2
      );
  };

  // input
  const onDots = (e: Event) => {
    const dot = (e.target as Element).closest('[data-testimonials-dot]');
    const index = slides.findIndex((s) => s.dot === dot);
    if (index > -1) goTo(index);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const step = e.key === 'ArrowRight' ? 1 : -1;
    const next = (active + step + slides.length) % slides.length;
    goTo(next);
    slides[next].dot.focus();
  };
  const hold = () => {
    held = true;
    syncTimer();
  };
  const release = (e: Event) => {
    if (e instanceof FocusEvent && root.contains(e.relatedTarget as Node)) return;
    held = false;
    syncTimer();
  };

  dotsWrap.addEventListener('click', onDots);
  dotsWrap.addEventListener('keydown', onKey);
  root.addEventListener('pointerenter', hold);
  root.addEventListener('pointerleave', release);
  root.addEventListener('focusin', hold);
  root.addEventListener('focusout', release);

  const io = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    syncTimer();
  });
  io.observe(root);

  slides.forEach((s, i) => setStatus(s, i === active ? 'active' : 'inactive'));
  if (count) count.textContent = `1 / ${slides.length}`;
  startTimer();

  cleanups.push(() => {
    io.disconnect();
    timer?.kill();
    transition?.kill();
    dotsWrap.removeEventListener('click', onDots);
    dotsWrap.removeEventListener('keydown', onKey);
    root.removeEventListener('pointerenter', hold);
    root.removeEventListener('pointerleave', release);
    root.removeEventListener('focusin', hold);
    root.removeEventListener('focusout', release);
    slides.forEach((s) => s.dot.remove());
    dotsWrap.appendChild(blueprint);
    root.removeAttribute('data-testimonials-init');
  });
};

/** Starts every testimonial slider in the scope. Skips ones already running. */
export const initTestimonials = (scope: ParentNode = document) => {
  const { gsap } = window as unknown as { gsap?: GsapLike };
  if (!gsap) return;

  scope
    .querySelectorAll<HTMLElement>('[data-testimonials]:not([data-testimonials-init])')
    .forEach((root) => setup(root, gsap));
};

export const destroyTestimonials = () => {
  cleanups.forEach((fn) => fn());
  cleanups = [];
};
