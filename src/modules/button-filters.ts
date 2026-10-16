/**
 * Button-driven filters for the vendored Finsweet list.
 *
 * Finsweet only reads filters from real form fields, and only initialises
 * filtering at all when it finds a `<form fs-list-element="filters">`
 * (see packages/list/src/factory.ts). Plain `<button>` pills are invisible to
 * it. Rather than reimplement filtering, this builds that form as a hidden
 * radio group and forwards button clicks into it — Finsweet still does all the
 * real work (matching, facets, tags, query params), so there's no second
 * filtering implementation to keep in sync.
 *
 * Markup, on each visible pill:
 *   fs-list-element="filter-button"  opts the element in
 *   fs-list-field="category"         the item field to filter on
 *   fs-list-value="Craft"            the value it selects
 *
 * `fs-list-value` may be omitted, in which case the pill's own text is used —
 * which means a CMS-bound pill needs no attribute binding at all. Set it to an
 * empty string for the "All" pill, which clears the field instead.
 *
 * Group mode, for pills that can't take attributes (eg. Tag component
 * instances): put the attributes on a wrapper instead and every direct child
 * becomes a pill, valued by its text. A child reading "All" clears the field.
 *   fs-list-element="filter-buttons"  fs-list-field="topic"
 *   data-active-class="w-variant-…"   optional extra class for the active pill
 *                                     (eg. the Tag's Selected variant class)
 *
 * The radios live inside the nearest `form[fs-list-element="filters"]` when
 * there is one, so a search field and the pills filter together. Otherwise a
 * hidden form is created.
 *
 * The active pill gets `is-list-active`, matching Finsweet's own default.
 */

const ELEMENT_ATTRIBUTE = 'fs-list-element';
const FIELD_ATTRIBUTE = 'fs-list-field';
const VALUE_ATTRIBUTE = 'fs-list-value';

const BUTTON_ELEMENT = 'filter-button';
const GROUP_ELEMENT = 'filter-buttons';
const ALL_LABEL = 'all';
const ACTIVE_CLASS = 'is-list-active';
const FORM_ID = 'fs-list-button-filters';

/**
 * @returns The value a pill should select. Falls back to its text content so
 * CMS-bound pills work without binding an attribute.
 */
const getButtonValue = (button: HTMLElement) => {
  const explicit = button.getAttribute(VALUE_ATTRIBUTE);
  if (explicit !== null) return explicit.trim();

  const text = button.textContent?.trim() || '';
  return text.toLowerCase() === ALL_LABEL ? '' : text;
};

type Pill = { el: HTMLElement; field: string; activeClass?: string };

/** Single pills plus the children of every pill group. */
const collectPills = (): Pill[] => {
  const pills: Pill[] = [];

  document
    .querySelectorAll<HTMLElement>(`[${ELEMENT_ATTRIBUTE}="${BUTTON_ELEMENT}"]`)
    .forEach((el) => {
      const field = el.getAttribute(FIELD_ATTRIBUTE)?.trim();
      if (field) pills.push({ el, field });
    });

  document
    .querySelectorAll<HTMLElement>(`[${ELEMENT_ATTRIBUTE}="${GROUP_ELEMENT}"]`)
    .forEach((group) => {
      const field = group.getAttribute(FIELD_ATTRIBUTE)?.trim();
      if (!field) return;
      const activeClass = group.dataset.activeClass?.trim() || undefined;
      // .filter_btn anywhere inside (eg. Filter Buttons in a CMS list), else the children
      const nested = group.querySelectorAll<HTMLElement>('.filter_btn');
      const els = nested.length ? Array.from(nested) : Array.from(group.children);
      for (const el of els) {
        if (el instanceof HTMLElement) pills.push({ el, field, activeClass });
      }
    });

  return pills;
};

/**
 * Wires up any button-driven filters on the page.
 * Must run *before* the list is initialised, so the hidden form exists by the
 * time Finsweet looks for it.
 *
 * @returns A `sync` function that re-reads the radios and repaints the pills,
 * plus a `destroy` cleanup. `undefined` if there are no button filters.
 */
export const initButtonFilters = () => {
  const pills = collectPills();
  if (!pills.length) return;

  // share the page's filter form (eg. with a search field) when there is one
  const hostForm = pills[0].el.closest<HTMLFormElement>(`form[${ELEMENT_ATTRIBUTE}="filters"]`);
  const form = document.createElement(hostForm ? 'div' : 'form');
  form.id = FORM_ID;
  if (!hostForm) form.setAttribute(ELEMENT_ATTRIBUTE, 'filters');
  form.style.display = 'none';

  const radios = new Map<HTMLElement, HTMLInputElement>();
  const activeClasses = new Map<HTMLElement, string | undefined>();

  for (const { el: button, field, activeClass } of pills) {
    const value = getButtonValue(button);
    activeClasses.set(button, activeClass);

    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = `${FORM_ID}-${field}`;
    radio.value = value;
    radio.setAttribute(FIELD_ATTRIBUTE, field);
    radio.setAttribute(VALUE_ATTRIBUTE, value);

    // An empty value carries no condition, so the empty pill is the "All" state.
    radio.checked = !value;

    form.append(radio);
    radios.set(button, radio);
  }

  if (!radios.size) return;

  (hostForm ?? document.body).append(form);

  const sync = () => {
    for (const [button, radio] of radios) {
      button.classList.toggle(ACTIVE_CLASS, radio.checked);
      const extra = activeClasses.get(button);
      if (extra) button.classList.toggle(extra, radio.checked);
      // Tag pills carry a cover link; that's the focusable control
      const control = button.matches('a, button')
        ? button
        : (button.querySelector('a, button') ?? button);
      control.setAttribute('role', 'button');
      control.setAttribute('aria-pressed', `${radio.checked}`);
    }
  };

  const handleClick = (event: Event) => {
    const button = event.currentTarget as HTMLElement;

    const radio = radios.get(button);
    if (!radio) return;

    // The pills are <button> elements inside our injected form's sibling tree,
    // but may also be real submit buttons — never let them submit.
    event.preventDefault();

    radio.checked = true;
    radio.dispatchEvent(new Event('input', { bubbles: true }));
    radio.dispatchEvent(new Event('change', { bubbles: true }));

    sync();
  };

  for (const button of radios.keys()) {
    button.addEventListener('click', handleClick);
  }

  sync();

  return {
    sync,
    destroy: () => {
      for (const button of radios.keys()) {
        button.removeEventListener('click', handleClick);
      }

      form.remove();
    },
  };
};
