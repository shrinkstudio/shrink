// -----------------------------------------
// TOC — table of contents, auto-built from headings
// -----------------------------------------
// Generates a table of contents from the h2–h6 headings in a content area and
// highlights the current section as you scroll. Based on the Finsweet Attributes
// `fs-toc-*` contract (so their docs + markup apply) but a lean version we own,
// no external deps.
//
// Markup (CSS/layout built in Webflow):
//   [fs-toc-element="contents"]            ← the rich text / body to scan
//   [fs-toc-element="table"]               ← empty wrapper the links go into
//     [fs-toc-element="link"]              ← ONE link template (styled once);
//                                            cloned per heading, then removed
//
// Each generated link gets href="#<slug>", data-toc-level="2..6" (indent deeper
// levels via CSS), and .is-active on the current section (also aria-current).
// Omit headings: prefix a heading's text with [fs-toc-omit], or put the
// fs-toc-omit attribute on any wrapper to skip every heading inside it (handy
// for CMS meta blocks). [fs-toc-h3] etc. overrides a heading's level. Setting
// fs-toc-offsettop="96" (px, on the contents or table element) sets the scroll
// offset for a sticky header.
//
// Posts without headings get no TOC: the link template is removed, the table
// gets data-toc-empty, and an optional [fs-toc-element="wrap"] around the whole
// TOC block (heading included) is hidden.
// -----------------------------------------

const TOC = 'toc';
const el = (name: string) => `[fs-${TOC}-element="${name}"]`;

const OMIT_RE = /^\s*\[fs-toc-omit\]/i;
const LEVEL_RE = /^\s*\[fs-toc-h([2-6])\]/i;
const ZERO_WIDTH_RE = new RegExp('[\u200B-\u200D\uFEFF]', 'g');

interface StoredListener {
  element: Element | Window;
  type: string;
  handler: EventListener;
}

let listeners: StoredListener[] = [];
let created: Element[] = [];

const listen = (element: Element | Window, type: string, handler: EventListener) => {
  element.addEventListener(type, handler);
  listeners.push({ element, type, handler });
};

const cleanText = (raw: string) =>
  raw.replace(ZERO_WIDTH_RE, '').replace(OMIT_RE, '').replace(LEVEL_RE, '').trim();

const levelOf = (heading: HTMLElement) => {
  const override = heading.textContent?.match(LEVEL_RE);
  return override ? Number(override[1]) : Number(heading.tagName[1]);
};

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'section';

const ensureId = (heading: HTMLElement, used: Set<string>): string => {
  let id = heading.id || slugify(cleanText(heading.textContent || ''));
  if (used.has(id)) {
    let n = 2;
    while (used.has(`${id}-${n}`)) n += 1;
    id = `${id}-${n}`;
  }
  used.add(id);
  heading.id = id;
  return id;
};

/**
 * Builds a link for one heading — a clone of the template if provided, else a
 * bare anchor. Returns the anchor to wire up (found within the clone if the
 * template itself is not the <a>).
 */
const buildLink = (
  template: HTMLElement | null
): { root: HTMLElement; anchor: HTMLAnchorElement } => {
  if (!template) {
    const a = document.createElement('a');
    a.className = 'toc_link';
    return { root: a, anchor: a };
  }
  const root = template.cloneNode(true) as HTMLElement;
  root.removeAttribute(`fs-${TOC}-element`);
  const anchor = (
    root instanceof HTMLAnchorElement ? root : root.querySelector('a')
  ) as HTMLAnchorElement;
  return { root, anchor };
};

/**
 * Initialises the TOC within the given scope. No-ops on pages without a TOC.
 * Safe to call repeatedly — an already-built table is skipped.
 *
 * @param scope The subtree to scan. Defaults to the whole document.
 */
export const initToc = (scope: ParentNode = document) => {
  const contents = scope.querySelector<HTMLElement>(el('contents'));
  const table = scope.querySelector<HTMLElement>(el('table'));
  if (!contents || !table || table.hasAttribute('data-toc-init')) return;

  // Skip headings marked with a [fs-toc-omit] text prefix, sitting inside an
  // element that carries the fs-toc-omit attribute (e.g. a meta / "at a glance"
  // block), or empty after cleaning.
  const headings = [...contents.querySelectorAll<HTMLElement>('h2, h3, h4, h5, h6')].filter(
    (h) =>
      !OMIT_RE.test(h.textContent || '') &&
      !h.closest(`[fs-${TOC}-omit]`) &&
      cleanText(h.textContent || '')
  );

  const template = scope.querySelector<HTMLElement>(el('link'));

  // No headings, no TOC: never leave the styled template link showing.
  if (!headings.length) {
    template?.remove();
    table.setAttribute('data-toc-empty', '');
    const wrap = scope.querySelector<HTMLElement>(el('wrap'));
    if (wrap) wrap.style.display = 'none';
    return;
  }

  table.setAttribute('data-toc-init', '');
  const offsetTop =
    Number(
      contents.getAttribute(`fs-${TOC}-offsettop`) || table.getAttribute(`fs-${TOC}-offsettop`)
    ) || 0;
  const hideHash = contents.getAttribute(`fs-${TOC}-hideurlhash`) === 'true';

  const used = new Set<string>();
  const entries: Array<{ anchor: HTMLAnchorElement; heading: HTMLElement }> = [];

  for (const heading of headings) {
    const id = ensureId(heading, used);
    heading.style.scrollMarginTop = `${offsetTop}px`;

    const { root, anchor } = buildLink(template);
    if (!anchor) continue;

    anchor.setAttribute('href', `#${id}`);
    anchor.textContent = cleanText(heading.textContent || '');
    anchor.style.transition = 'opacity 0.3s ease';
    root.setAttribute('data-toc-level', String(levelOf(heading)));

    const jump = (event: Event) => {
      event.preventDefault();
      heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (!hideHash) history.replaceState(null, '', `#${id}`);
    };
    listen(anchor, 'click', jump);

    table.append(root);
    created.push(root);
    entries.push({ anchor, heading });
  }

  // The template was a styling stand-in; drop it so only real links remain.
  template?.remove();

  // Highlight the current section: the last heading scrolled past the offset.
  let frame = 0;
  const paint = () => {
    frame = 0;
    const line = offsetTop + 1;
    let active = 0;
    for (let i = 0; i < entries.length; i += 1) {
      if (entries[i].heading.getBoundingClientRect().top - line <= 0) active = i;
      else break;
    }
    entries.forEach(({ anchor }, i) => {
      const on = i === active;
      anchor.classList.toggle('is-active', on);
      anchor.style.opacity = on ? '1' : '0.5';
      if (on) anchor.setAttribute('aria-current', 'true');
      else anchor.removeAttribute('aria-current');
    });
  };

  const onScroll = () => {
    if (!frame) frame = requestAnimationFrame(paint);
  };

  listen(window, 'scroll', onScroll);
  listen(window, 'resize', onScroll);
  paint();
};

/**
 * Tears down the TOC, so the module can be re-initialised on a page transition
 * without stacking duplicate links or listeners.
 */
export const destroyToc = () => {
  for (const { element, type, handler } of listeners) {
    element.removeEventListener(type, handler);
  }
  listeners = [];

  for (const node of created) node.remove();
  created = [];

  document
    .querySelectorAll('[data-toc-init]')
    .forEach((node) => node.removeAttribute('data-toc-init'));
};
