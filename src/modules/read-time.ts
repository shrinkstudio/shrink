// -----------------------------------------
// READ TIME — "N min read" from article length
// -----------------------------------------
// Fills a text element with an estimated reading time, counted from the words
// in the article body. Runs once per page; no-ops quietly on pages without the
// markup.
//
// Markup (CSS/layout built in Webflow):
//   [data-read-time]           ← the text element to fill, e.g. "[Read Time]"
//   [data-read-time-source]    ← the element to count (optional; falls back to
//                                the first .w-richtext on the page)
//
// data-read-time="230" overrides the words-per-minute rate per element.
// -----------------------------------------

const DEFAULT_WPM = 225;

let filled: Array<{ element: HTMLElement; previous: string }> = [];

/**
 * Initialises every read-time element within the given scope.
 * Safe to call repeatedly — already-filled elements are skipped.
 *
 * @param scope The subtree to scan. Defaults to the whole document.
 */
export const initReadTime = (scope: ParentNode = document) => {
  const outputs = [...scope.querySelectorAll<HTMLElement>('[data-read-time]')];
  if (!outputs.length) return;

  const source =
    scope.querySelector<HTMLElement>('[data-read-time-source]') ||
    scope.querySelector<HTMLElement>('.w-richtext');
  if (!source) return;

  const words = (source.innerText || '').trim().split(/\s+/).filter(Boolean).length;
  if (!words) return;

  for (const output of outputs) {
    if (output.hasAttribute('data-read-time-init')) continue;
    output.setAttribute('data-read-time-init', '');

    const wpm = Number(output.getAttribute('data-read-time')) || DEFAULT_WPM;
    const minutes = Math.max(1, Math.ceil(words / wpm));

    filled.push({ element: output, previous: output.textContent || '' });
    output.textContent = `${minutes} min read`;
  }
};

/**
 * Restores the placeholder text, so the module can be re-initialised on a page
 * transition without stale estimates surviving.
 */
export const destroyReadTime = () => {
  for (const { element, previous } of filled) {
    element.textContent = previous;
    element.removeAttribute('data-read-time-init');
  }
  filled = [];
};
