// -----------------------------------------
// TESTIMONIAL TABS — client tabs over full testimonial panels (About page)
// -----------------------------------------
// Markup (CSS/layout built in Webflow, the Testimonial Card component):
//   [data-testimonial-card]                 ← root
//     [data-testimonial-tabs]               ← empty; the tab buttons are built here
//     [data-testimonial-panel="CloudNC"]    ← each Collection Item; value = tab label
//       [data-testimonial-quote]            ← the long quote (muted by CSS)
//       [data-testimonial-highlight]        ← hidden; the sentence to show in full colour
//
// Tabs are real buttons (filter_btn, is-list-active when selected) with
// tablist/tab/tabpanel roles and arrow, Home and End keys. Click only, no
// timer. One panel: the tabs hide. The highlight sentence is wrapped in
// .testimonial-card_highlight; with no highlight (or no match) the quote gets
// data-testimonial-quote="full" so CSS shows it all in full colour.
// -----------------------------------------

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
  const tablist = root.querySelector<HTMLElement>('[data-testimonial-tabs]');
  if (!panels.length) return;

  panels.forEach(highlightQuote);

  if (panels.length < 2 || !tablist) {
    if (tablist) tablist.hidden = true;
    return;
  }

  const id = `testimonial-${++uid}`;
  tablist.setAttribute('role', 'tablist');
  tablist.replaceChildren();

  const tabs = panels.map((panel, i) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'filter_btn';
    tab.id = `${id}-tab-${i}`;
    tab.textContent = panel.getAttribute('data-testimonial-panel')?.trim() || `${i + 1}`;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', `${id}-panel-${i}`);
    panel.id = `${id}-panel-${i}`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
    tablist.append(tab);
    return tab;
  });

  let current = -1;
  const select = (index: number, focus = false) => {
    if (index === current) return;
    tabs.forEach((tab, i) => {
      const on = i === index;
      tab.classList.toggle('is-list-active', on);
      tab.setAttribute('aria-selected', `${on}`);
      tab.tabIndex = on ? 0 : -1;
      panels[i].hidden = !on;
    });
    if (focus) tabs[index].focus();
    const gsap = (window as unknown as { gsap?: GsapLite }).gsap;
    if (current !== -1 && gsap && !reduced()) {
      gsap.fromTo(panels[index], { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' });
    }
    current = index;
  };

  const onClick = (event: Event) => {
    const i = tabs.indexOf(event.currentTarget as HTMLButtonElement);
    if (i >= 0) select(i);
  };
  const onKey = (event: KeyboardEvent) => {
    const keys: Record<string, number> = {
      ArrowRight: current + 1,
      ArrowLeft: current - 1,
      Home: 0,
      End: tabs.length - 1,
    };
    if (!(event.key in keys)) return;
    event.preventDefault();
    select((keys[event.key] + tabs.length) % tabs.length, true);
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', onClick);
    tab.addEventListener('keydown', onKey);
  });
  cleanups.push(() =>
    tabs.forEach((tab) => {
      tab.removeEventListener('click', onClick);
      tab.removeEventListener('keydown', onKey);
    })
  );

  select(0);
}

export function initTestimonialTabs(scope: ParentNode = document): void {
  scope.querySelectorAll<HTMLElement>('[data-testimonial-card]').forEach(setup);
}

export function destroyTestimonialTabs(): void {
  cleanups.forEach((fn) => fn());
  cleanups.length = 0;
}
