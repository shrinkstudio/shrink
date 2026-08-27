export type FormField = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

export type FormFieldType =
  // Input element types
  | 'text'
  | 'password'
  | 'email'
  | 'number'
  | 'tel'
  | 'url'
  | 'search'
  | 'date'
  | 'time'
  | 'datetime-local'
  | 'month'
  | 'week'
  | 'color'
  | 'file'
  | 'range'
  | 'checkbox'
  | 'radio'
  | 'hidden'
  | 'submit'
  | 'reset'
  | 'button'
  | 'image'
  // Select element types
  | 'select-one'
  | 'select-multiple'
  // Textarea element type
  | 'textarea';
