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
 * The active pill gets `is-list-active`, matching Finsweet's own default.
 */

const ELEMENT_ATTRIBUTE = 'fs-list-element';
const FIELD_ATTRIBUTE = 'fs-list-field';
const VALUE_ATTRIBUTE = 'fs-list-value';

const BUTTON_ELEMENT = 'filter-button';
const ACTIVE_CLASS = 'is-list-active';
const FORM_ID = 'fs-list-button-filters';

/**
 * @returns The value a pill should select. Falls back to its text content so
 * CMS-bound pills work without binding an attribute.
 */
const getButtonValue = (button: HTMLElement) => {
  const explicit = button.getAttribute(VALUE_ATTRIBUTE);
  if (explicit !== null) return explicit.trim();

  return button.textContent?.trim() || '';
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
  const buttons = [
    ...document.querySelectorAll<HTMLElement>(`[${ELEMENT_ATTRIBUTE}="${BUTTON_ELEMENT}"]`),
  ];
  if (!buttons.length) return;

  const form = document.createElement('form');
  form.id = FORM_ID;
  form.setAttribute(ELEMENT_ATTRIBUTE, 'filters');
  form.style.display = 'none';

  const radios = new Map<HTMLElement, HTMLInputElement>();

  for (const button of buttons) {
    const field = button.getAttribute(FIELD_ATTRIBUTE)?.trim();
    if (!field) continue;

    const value = getButtonValue(button);

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

  document.body.append(form);

  const sync = () => {
    for (const [button, radio] of radios) {
      button.classList.toggle(ACTIVE_CLASS, radio.checked);
      button.setAttribute('aria-pressed', `${radio.checked}`);
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
