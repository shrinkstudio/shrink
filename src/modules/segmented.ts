// -----------------------------------------
// SEGMENTED — Segmented Control primitive (sliding pill)
// -----------------------------------------
// Markup (Webflow components, Primitives):
//   [data-segmented] (.segmented)            ← Segmented Control; aria-label = Label prop
//     .segmented_indicator                   ← the white pill, absolute in the track
//     .segmented_list (slot)
//       button[data-segment] (.segment)      ← Segment; Button Class is-active = selected on load
//
// Segments may sit inside a Collection List (wrapper/list/item u-d-contents).
// The pill takes the active Segment's box; CSS on .segmented_indicator owns
// the slide (300ms power1.inOut, same as the nav hover pill). No slide on
// first paint, on resize or with reduced motion.
//
// Click, arrow keys, Home and End select. Each change dispatches a bubbling
// `segmented:change` event with { index } so other modules (eg.
// testimonial-tabs) can switch their content.
// -----------------------------------------

export interface SegmentedChange {
  index: number;
}

const ACTIVE = 'is-active';
const cleanups: Array<() => void> = [];

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function setup(root: HTMLElement) {
  if (root.hasAttribute('data-segmented-ready')) return;
  const segments = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-segment]'));
  const indicator = root.querySelector<HTMLElement>('.segmented_indicator');
  if (!segments.length) return;
  root.setAttribute('data-segmented-ready', '');
  root.setAttribute('role', 'tablist');
  // CMS list/listitem roles between the tablist and its tabs break the pattern
  segments.forEach((seg) => {
    for (let el = seg.parentElement; el && el !== root; el = el.parentElement) {
      if (el.hasAttribute('role')) el.setAttribute('role', 'presentation');
    }
  });

  let current = Math.max(
    0,
    segments.findIndex((s) => s.classList.contains(ACTIVE))
  );

  // the pill matches the active Segment's box inside the track
  const place = (animate: boolean) => {
    const seg = segments[current];
    if (!indicator || !seg) return;
    const track = root.getBoundingClientRect();
    const box = seg.getBoundingClientRect();
    if (!animate || reduced()) indicator.style.transition = 'none';
    indicator.style.width = `${box.width}px`;
    indicator.style.transform = `translateX(${box.left - track.left - root.clientLeft}px)`;
    if (!animate || reduced()) {
      void indicator.offsetWidth;
      indicator.style.transition = '';
    }
  };

  const sync = () =>
    segments.forEach((seg, i) => {
      const on = i === current;
      seg.classList.toggle(ACTIVE, on);
      seg.setAttribute('role', 'tab');
      seg.setAttribute('aria-selected', `${on}`);
      seg.tabIndex = on ? 0 : -1;
    });

  const select = (index: number, focus = false) => {
    if (index === current) return;
    current = index;
    sync();
    place(true);
    if (focus) segments[index].focus();
    root.dispatchEvent(
      new CustomEvent<SegmentedChange>('segmented:change', { bubbles: true, detail: { index } })
    );
  };

  const onClick = (event: Event) => {
    const i = segments.indexOf(event.currentTarget as HTMLButtonElement);
    if (i >= 0) select(i);
  };
  const onKey = (event: KeyboardEvent) => {
    const keys: Record<string, number> = {
      ArrowRight: current + 1,
      ArrowLeft: current - 1,
      Home: 0,
      End: segments.length - 1,
    };
    if (!(event.key in keys)) return;
    event.preventDefault();
    select((keys[event.key] + segments.length) % segments.length, true);
  };

  segments.forEach((seg) => {
    seg.addEventListener('click', onClick);
    seg.addEventListener('keydown', onKey);
  });
  const resize = new ResizeObserver(() => place(false));
  resize.observe(root);

  cleanups.push(() => {
    resize.disconnect();
    segments.forEach((seg) => {
      seg.removeEventListener('click', onClick);
      seg.removeEventListener('keydown', onKey);
    });
    root.removeAttribute('data-segmented-ready');
  });

  sync();
  place(false);
  // webfonts change Segment widths after first paint
  document.fonts?.ready.then(() => place(false));
}

export function initSegmented(scope: ParentNode = document): void {
  scope.querySelectorAll<HTMLElement>('[data-segmented]').forEach(setup);
}

export function destroySegmented(): void {
  cleanups.forEach((fn) => fn());
  cleanups.length = 0;
}
