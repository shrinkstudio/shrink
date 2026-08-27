export type Sorting = {
  fieldKey?: string;
  direction?: SortingDirection;
  interacted?: boolean;
};

/**
 * Sorting
 */
export type SortingDirection = 'asc' | 'desc';

/**
 * Dropdown
 */
export interface DropdownOption {
  element: HTMLAnchorElement;
  sortKey?: string;
  direction?: SortingDirection;
  selected: boolean;
}

export type DropdownOptions = DropdownOption[];

export type DropdownLabelData = {
  element: Element;
  originalHTML: string;
  updateContent: (option: DropdownOption) => void;
};
