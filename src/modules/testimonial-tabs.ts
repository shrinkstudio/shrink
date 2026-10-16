// -----------------------------------------
// TESTIMONIAL TABS — Segmented Control switches testimonial panels (About page)
// -----------------------------------------
// Markup (CSS/layout built in Webflow, the Testimonial Card component):
//   [data-testimonial-card]                 ← root
//     [data-segmented]                      ← Segmented Control (Tabs slot); one
//                                             Segment per client, same order as panels
//     [data-testimonial-panel]              ← each Collection Item (Items slot)
//       [data-testimonial-quote]            ← the long quote (muted by CSS)
//       [data-testimonial-highlight]        ← hidden; the sentence to show in full colour
//
// segmented.ts owns the control (pill, roles, keys); this listens for its
// `segmented:change` and shows panel n, with a short fade. Segments and panels
// are paired by order and linked with aria-controls/labelledby. One panel: the
// control hides. The highlight sentence is wrapped in .testimonial-card_highlight;
// with no highlight (or no match) the quote gets data-testimonial-quote="full"
// so CSS shows it all in full colour.
// -----------------------------------------

import type { SegmentedChange } from './segmented';

interface GsapLite {
  fromTo(target: unknown, from: Record<string, unknown>, to: Record<string, unknown>): unknown;
}

const cleanups: Array<() => void> = [];
let uid = 0;

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function highlightQuote(panel: HTMLElement) {
  const quote = panel.querySelector<HTMLElement>('[data-testimonial-quote]');
  if (!quote || quote.querySelector('.testimonial-card_highlight')) return;
  const sentence = panel.querySelector('[data-testimonial-highlight]')?.textContent?.trim();
  const text = quote.textContent ?? '';
  const at = sentence ? text.indexOf(sentence) : -1;
  if (!sentence || at < 0) {
    quote.setAttribute('data-testimonial-quote', 'full');
    return;
  }
  const mark = document.createElement('span');
  mark.className = 'testimonial-card_highlight';
  mark.textContent = sentence;
  quote.replaceChildren(text.slice(0, at), mark, text.slice(at + sentence.length));
}

function setup(root: HTMLElement) {
  const panels = Array.from(root.querySelectorAll<HTMLElement>('[data-testimonial-panel]'));
  const control = root.querySelector<HTMLElement>('[data-segmented]');
  if (!panels.length) return;

  panels.forEach(highlightQuote);

  if (panels.length < 2 || !control) {
    if (control) control.hidden = true;
    panels.forEach((panel, i) => (panel.hidden = i > 0));
    return;
  }

  const segments = Array.from(control.querySelectorAll<HTMLElement>('[data-segment]'));
  const id = `testimonial-${++uid}`;
  panels.forEach((panel, i) => {
    const seg = segments[i];
    panel.setAttribute('role', 'tabpanel');
    panel.id = `${id}-panel-${i}`;
    if (!seg) return;
    seg.id ||= `${id}-tab-${i}`;
    seg.setAttribute('aria-controls', panel.id);
    panel.setAttribute('aria-labelledby', seg.id);
  });

  let current = Math.max(
    0,
    segments.findIndex((s) => s.classList.contains('is-active'))
  );
  const show = (index: number, fade: boolean) => {
    panels.forEach((panel, i) => (panel.hidden = i !== index));
    const gsap = (window as unknown as { gsap?: GsapLite }).gsap;
    if (fade && gsap && !reduced()) {
      gsap.fromTo(panels[index], { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' });
    }
    current = index;
  };

  const onChange = (event: Event) => {
    const { index } = (event as CustomEvent<SegmentedChange>).detail;
    if (index !== current && panels[index]) show(index, true);
  };
  control.addEventListener('segmented:change', onChange);
  cleanups.push(() => control.removeEventListener('segmented:change', onChange));

  show(Math.min(current, panels.length - 1), false);
}

export function initTestimonialTabs(scope: ParentNode = document): void {
  scope.querySelectorAll<HTMLElement>('[data-testimonial-card]').forEach(setup);
}

export function destroyTestimonialTabs(): void {
  cleanups.forEach((fn) => fn());
  cleanups.length = 0;
}
