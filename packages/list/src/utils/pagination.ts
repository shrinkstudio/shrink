/**
 * Extracts the {@link URLSearchParams} from a list's Pagination Button.
 * @param paginationButton A {@link PaginationButtonElement}.
 *
 * @returns The search params as {@link Object.entries}, if the button is valid.
 */
export const getPaginationSearchEntries = (paginationButton: HTMLAnchorElement) => {
  const { href } = paginationButton;

  const { searchParams } = new URL(href);

  const searchEntries = [...searchParams.entries()];
  return searchEntries;
};
