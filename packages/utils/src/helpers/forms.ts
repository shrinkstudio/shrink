import { FORM_CSS_CLASSES } from '../constants';
import type { FormField, FormFieldType } from '../types';
import { simulateEvent } from './events';
import { isBoolean, isHTMLInputElement, isHTMLSelectElement, isNotEmpty } from './guards';

/**
 * Gets the value of a given form field.
 * @param formField A {@link FormField} element.
 * @param customValueAttribute Optional custom value attribute used to identify checkboxes and radios.
 */
export const getFormFieldValue = (formField: FormField, customValueAttribute?: string): string | string[] => {
  const type = formField.type as FormFieldType;

  let value: string | string[];

  switch (type) {
    // Checkbox
    case 'checkbox': {
      // Group
      const groupCheckboxes = getCheckboxGroup(formField.name, formField.form, customValueAttribute);
      if (groupCheckboxes?.length) {
        value = [];

        for (const checkbox of groupCheckboxes) {
          const checkboxValue = customValueAttribute
            ? (checkbox.getAttribute(customValueAttribute) ?? checkbox.value)
            : checkbox.value;

          if (!checkboxValue || !checkbox.checked) continue;

          value.push(checkboxValue);
        }

        break;
      }

      // Single
      const { checked } = formField as HTMLInputElement;
      value = checked ? 'true' : '';

      break;
    }

    // Radio
    case 'radio': {
      const checkedRadio = formField.form?.querySelector<HTMLInputElement>(
        `input[name="${formField.name}"][type="radio"]:checked`
      );

      value = checkedRadio
        ? customValueAttribute
          ? (checkedRadio.getAttribute(customValueAttribute) ?? checkedRadio.value)
          : checkedRadio.value
        : '';

      break;
    }

    // Select multiple
    case 'select-multiple': {
      value = [...(formField as HTMLSelectElement).selectedOptions].map((option) => option.value).filter(Boolean);

      break;
    }

    // Dates
    case 'date':
    case 'month':
    case 'week':
    case 'time': {
      const { valueAsDate, value: _value } = formField as HTMLInputElement;
      value = valueAsDate ? valueAsDate.toISOString() : _value;

      break;
    }

    // Default - Text
    default: {
      value = formField.value;
    }
  }

  return value;
};

/**
 * Sets a value to a FormField element and emits `click`, `input` and `change` Events.
 *
 * @param element The FormField to update.
 * @param value `boolean` for Checkboxes and Radios, `string` for the rest.
 */
export const setFormFieldValue = (
  formField: FormField,
  value: string | boolean | string[],
  customValueAttribute?: string
): void => {
  const type = formField.type as FormFieldType;

  switch (type) {
    // Checkboxes
    case 'checkbox': {
      if (!isHTMLInputElement(formField)) break;

      // Single checkbox
      if (!Array.isArray(value)) {
        const check = isBoolean(value) ? value : value === 'true';

        if (check !== formField.checked) {
          formField.checked = check;

          simulateEvent(formField, ['click', 'input', 'change']);
        }

        break;
      }

      const groupCheckboxes = getCheckboxGroup(formField.name, formField.form, customValueAttribute);
      if (!groupCheckboxes?.length) break;

      for (const checkbox of groupCheckboxes) {
        const checkboxValue = customValueAttribute
          ? (checkbox.getAttribute(customValueAttribute) ?? checkbox.value)
          : checkbox.value;

        const check = value.includes(checkboxValue);

        if (check !== checkbox.checked) {
          checkbox.checked = check;

          simulateEvent(checkbox, ['click', 'input', 'change']);
        }
      }

      break;
    }

    // Radios
    case 'radio': {
      if (Array.isArray(value)) break;

      const groupRadios = getRadioGroupInputs(formField);

      for (const radio of groupRadios) {
        const radioValue = customValueAttribute
          ? (radio.getAttribute(customValueAttribute) ?? radio.value)
          : radio.value;

        const check = radioValue === value;

        if (check !== radio.checked) {
          radio.checked = check;

          simulateEvent(radio, ['click', 'input', 'change']);

          if (check) continue;

          // When unchecking a custom Webflow radio, we need to manually remove the focus and checked classes
          const customRadio = radio.parentElement?.querySelector(`.${FORM_CSS_CLASSES.radioInput}`);
          if (!customRadio) continue;

          customRadio.classList.remove(FORM_CSS_CLASSES.checkboxOrRadioFocus, FORM_CSS_CLASSES.checkboxOrRadioChecked);
        }
      }

      break;
    }

    // Select-multiple
    case 'select-multiple': {
      if (!Array.isArray(value) || !isHTMLSelectElement(formField)) break;

      for (const option of formField.options) {
        const select = value.includes(option.value);

        if (select !== option.selected) {
          option.selected = select;

          simulateEvent(option, ['input', 'change']);
        }
      }

      break;
    }

    // Other
    default: {
      if (Array.isArray(value)) break;

      if (formField.value !== value) {
        formField.value = value.toString();

        simulateEvent(formField, ['input', 'change']);
      }
    }
  }
};

/**
 * Retrieves all radio inputs that belong to the same group.
 * @param radio A radio input element that belongs to the group.
 * @param form The form element that contains the radio inputs. If not provided, it will be inferred from the radio input.
 * @returns An array of radio inputs.
 */
export const getRadioGroupInputs = (radio: FormField): HTMLInputElement[] => {
  if (!radio.form) return [];

  return [...radio.form.querySelectorAll<HTMLInputElement>(`input[name="${radio.name}"][type="${radio.type}"]`)];
};

/**
 * @returns All the checkboxes in a group.
 * @param name The name of the group.
 * @param form The form element containing the group.
 * @param customValueAttribute Optional custom value attribute used to identify checkboxes.
 */
export const getCheckboxGroup = (name: string, form: HTMLFormElement | null, customValueAttribute?: string) => {
  const groupSelector = [
    `input[name="${name}"][type="checkbox"][value]`,
    customValueAttribute && `input[name="${name}"][type="checkbox"][${customValueAttribute}]`,
  ]
    .filter(isNotEmpty)
    .join(',');

  const groupCheckboxes = form?.querySelectorAll<HTMLInputElement>(groupSelector);
  return groupCheckboxes;
};

/**
 * Gets the wrapper element for a given form field.
 * @param formField The FormField element to get the wrapper for.
 * @returns The closest wrapper element or the formField itself if no wrapper is found.
 */
export const getFormFieldWrapper = (formField: FormField) => {
  const wrapper = formField.closest<HTMLElement>(
    `.${FORM_CSS_CLASSES.checkboxField}, .${FORM_CSS_CLASSES.radioField}, label`
  );
  return wrapper || formField;
};
