// -----------------------------------------
// FORM VALIDATE — live field validation for Webflow forms
// -----------------------------------------
// Rules come from the native attributes on each input (required, type="email",
// minlength, maxlength, pattern), read through the browser's constraint API.
// This module only writes state; every visual lives in Webflow (classes, the
// "Forms" embed). No classes are added or removed.
//
// Markup:
//   [data-form-validate]               ← form block (or the <form> itself)
//     [data-validate]                  ← one per field group
//       input / textarea / select
//       [data-validate-message]        ← error text, shown on error
//       [data-validate-icon]           ← success tick, shown when valid
//     [data-validate] > [data-validate-group data-min data-max]
//                                      ← checkbox / radio group; radios need 1
//     [data-submit]                    ← any trigger (eg. the Button component)
//
// State written to [data-validate]: data-state="valid" | "error", data-filled.
// The input gets aria-invalid, and aria-describedby points at its message.
// A field shows nothing until it has been left once (or the form is
// submitted); after that it updates as you type.
// -----------------------------------------

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTROL = 'input:not([type="hidden"]):not([type="submit"]), textarea, select';

let uid = 0;
const cleanups: (() => void)[] = [];

type Field = {
  group: HTMLElement;
  controls: (HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)[];
  choice: HTMLElement | null;
  started: boolean;
};

const isFilled = (field: Field) =>
  field.choice
    ? field.controls.some((c) => (c as HTMLInputElement).checked)
    : field.controls[0].value.trim() !== '';

const isValid = (field: Field) => {
  if (field.choice) {
    const inputs = field.controls as HTMLInputElement[];
    const checked = inputs.filter((input) => input.checked).length;
    if (inputs[0]?.type === 'radio') return checked >= 1;
    const min = Number(field.choice.getAttribute('data-min')) || 1;
    const max = Number(field.choice.getAttribute('data-max')) || inputs.length;
    return checked >= min && checked <= max;
  }

  const control = field.controls[0];
  if (!control.checkValidity()) return false;

  const value = control.value.trim();
  if (!value) return true;

  // the browser only enforces minlength on typed edits, so check it here too
  if (!(control instanceof HTMLSelectElement)) {
    const min = Number(control.getAttribute('minlength')) || 0;
    const max = Number(control.getAttribute('maxlength')) || Infinity;
    if (value.length < min || value.length > max) return false;
  }
  if (control instanceof HTMLInputElement && control.type === 'email') return EMAIL.test(value);
  return true;
};

const render = (field: Field) => {
  const { group, controls } = field;
  const filled = isFilled(field);
  const valid = isValid(field);

  group.toggleAttribute('data-filled', filled);

  // optional and empty: no verdict either way
  const optionalEmpty = valid && !filled;
  const state = !field.started || optionalEmpty ? '' : valid ? 'valid' : 'error';

  if (state) group.setAttribute('data-state', state);
  else group.removeAttribute('data-state');

  for (const control of controls) {
    if (state === 'error') control.setAttribute('aria-invalid', 'true');
    else control.removeAttribute('aria-invalid');
  }
};

const describe = (field: Field) => {
  const message = field.group.querySelector<HTMLElement>('[data-validate-message]');
  if (!message) return;
  message.id ||= `validate-message-${(uid += 1)}`;
  message.setAttribute('aria-live', 'polite');
  for (const control of field.controls) {
    const ids = (control.getAttribute('aria-describedby') || '').split(' ').filter(Boolean);
    if (!ids.includes(message.id))
      control.setAttribute('aria-describedby', [...ids, message.id].join(' '));
  }
};

const setup = (root: HTMLElement) => {
  const form = root instanceof HTMLFormElement ? root : root.querySelector('form');
  if (!form || form.hasAttribute('data-validate-init')) return;
  form.setAttribute('data-validate-init', '');

  // we show our own messages; stop the browser's bubbles
  form.noValidate = true;

  const fields: Field[] = [...root.querySelectorAll<HTMLElement>('[data-validate]')]
    .map((group) => {
      const choice = group.querySelector<HTMLElement>('[data-validate-group]');
      const controls = [...(choice || group).querySelectorAll<Field['controls'][number]>(CONTROL)];
      return { group, controls, choice, started: false };
    })
    .filter((field) => field.controls.length);

  // empty placeholder options in a required select can't be picked again
  for (const select of form.querySelectorAll('select')) {
    for (const option of select.options) if (option.value === '') option.disabled = true;
  }

  for (const field of fields) {
    describe(field);

    const onLeave = () => {
      field.started = true;
      render(field);
    };
    const onChange = () => {
      const [control] = field.controls;
      // a pick is a decision; typing is judged on leave, except a now-valid email
      if (control instanceof HTMLSelectElement) field.started = true;
      else if (!field.started && (field.choice || (control as HTMLInputElement).type === 'email')) {
        field.started = isValid(field);
      }
      render(field);
    };

    for (const control of field.controls) {
      control.addEventListener('blur', onLeave);
      control.addEventListener(
        control instanceof HTMLSelectElement || field.choice ? 'change' : 'input',
        onChange
      );
      cleanups.push(() => {
        control.removeEventListener('blur', onLeave);
        control.removeEventListener('input', onChange);
        control.removeEventListener('change', onChange);
      });
    }
  }

  const validateAll = () => {
    let first: HTMLElement | null = null;
    for (const field of fields) {
      field.started = true;
      render(field);
      if (!first && !isValid(field)) [first] = field.controls;
    }
    first?.focus();
    return !first;
  };

  // Capture phase on the document runs before Webflow's own submit handler,
  // so an invalid form never reaches it.
  const onSubmit = (event: Event) => {
    if (event.target !== form) return;
    if (validateAll()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  };
  document.addEventListener('submit', onSubmit, true);

  // [data-submit] can be any element, eg. the animated Button component
  const onTrigger = (event: Event) => {
    const trigger = (event.target as HTMLElement).closest('[data-submit]');
    if (!trigger || !root.contains(trigger)) return;
    event.preventDefault();
    form.requestSubmit();
  };
  root.addEventListener('click', onTrigger);

  // a link used as the trigger is announced and keyed like a button
  for (const trigger of root.querySelectorAll<HTMLElement>('[data-submit]')) {
    if (!(trigger instanceof HTMLButtonElement)) trigger.setAttribute('role', 'button');
  }
  const onTriggerKey = (event: KeyboardEvent) => {
    const trigger = (event.target as HTMLElement).closest('[data-submit]');
    if (!trigger || event.key !== ' ' || trigger instanceof HTMLButtonElement) return;
    event.preventDefault();
    form.requestSubmit();
  };
  root.addEventListener('keydown', onTriggerKey);

  // Webflow swaps the form for its done / fail message; move focus there so
  // screen readers hear the outcome instead of losing their place
  const notices = [...root.querySelectorAll<HTMLElement>('.w-form-done, .w-form-fail')];
  const shown = new WeakSet<HTMLElement>();
  for (const notice of notices) {
    notice.tabIndex = -1;
    if (notice.classList.contains('w-form-fail')) notice.setAttribute('role', 'alert');
  }
  const observer = new MutationObserver(() => {
    for (const notice of notices) {
      const visible = getComputedStyle(notice).display !== 'none';
      if (visible && !shown.has(notice)) {
        shown.add(notice);
        notice.focus();
      } else if (!visible) shown.delete(notice);
    }
  });
  for (const notice of notices)
    observer.observe(notice, { attributes: true, attributeFilter: ['style'] });

  // Enter in a single-line field submits through the same path
  const onKey = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement;
    if (event.key !== 'Enter' || target.tagName === 'TEXTAREA' || target.closest('[data-submit]'))
      return;
    if (!(target instanceof HTMLInputElement)) return;
    event.preventDefault();
    form.requestSubmit();
  };
  form.addEventListener('keydown', onKey);

  cleanups.push(() => {
    document.removeEventListener('submit', onSubmit, true);
    root.removeEventListener('click', onTrigger);
    root.removeEventListener('keydown', onTriggerKey);
    observer.disconnect();
    form.removeEventListener('keydown', onKey);
    form.removeAttribute('data-validate-init');
  });
};

/**
 * Sets up validation on every [data-form-validate] block within the scope.
 * Safe to call repeatedly; set-up forms are skipped.
 */
export const initFormValidate = (scope: ParentNode = document) => {
  scope.querySelectorAll<HTMLElement>('[data-form-validate]').forEach(setup);
};

export const destroyFormValidate = () => {
  while (cleanups.length) cleanups.pop()?.();
};
