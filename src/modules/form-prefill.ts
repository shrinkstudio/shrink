// -----------------------------------------
// FORM PREFILL — values the CMS and URL know but the form can't bind
// -----------------------------------------
// 1. ?service=<name> ticks the matching radio in any form on the page, eg.
//    /contact?service=development ticks #lead-need-development. Matches the
//    radio id suffix, its value, or its label text (case-insensitive).
// 2. [data-prefill-guide] on a form block adds a hidden "Guide" input holding
//    the page h1, so the Resource submission says which guide was taken
//    (Webflow can't bind CMS fields to hidden inputs).
// 3. [data-guide-download] is revealed once the form succeeds (see below).
//
// Inputs get `change` events so form-validate and :has(:checked) chip styles
// update as if clicked.
// -----------------------------------------

const norm = (v: string | null | undefined) =>
  (v || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

function preselectService(scope: ParentNode) {
  const wanted = norm(new URLSearchParams(window.location.search).get('service'));
  if (!wanted) return;

  const radios = scope.querySelectorAll<HTMLInputElement>('form input[type="radio"]');
  const match = Array.from(radios).find((radio) => {
    const label = radio.closest('label')?.textContent;
    return (
      norm(radio.id).endsWith(wanted) || norm(radio.value) === wanted || norm(label) === wanted
    );
  });
  if (!match || match.checked) return;

  match.checked = true;
  match.dispatchEvent(new Event('change', { bubbles: true }));
}

function addGuideField(scope: ParentNode) {
  const title = document.querySelector('h1')?.textContent?.trim();
  if (!title) return;

  scope.querySelectorAll<HTMLElement>('[data-prefill-guide]').forEach((block) => {
    const form = block instanceof HTMLFormElement ? block : block.querySelector('form');
    if (!form || form.querySelector('input[name="Guide"]')) return;
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'Guide';
    input.value = title;
    form.prepend(input);
  });
}

// 3. [data-guide-download] stays hidden until the Resource form in the same
//    section shows Webflow's success state (.w-form-done becomes visible).
function revealDownload(scope: ParentNode) {
  scope.querySelectorAll<HTMLElement>('[data-guide-download]').forEach((download) => {
    const done = download.closest('section, .section')?.querySelector<HTMLElement>('.w-form-done');
    if (!done) return;
    download.hidden = true;
    const observer = new MutationObserver(() => {
      if (getComputedStyle(done).display === 'none') return;
      download.hidden = false;
      observer.disconnect();
    });
    observer.observe(done, { attributes: true, attributeFilter: ['style'] });
    observers.push(observer);
  });
}

const observers: MutationObserver[] = [];

export function initFormPrefill(scope: ParentNode = document): void {
  preselectService(scope);
  addGuideField(scope);
  revealDownload(scope);
}

export function destroyFormPrefill(): void {
  observers.forEach((o) => o.disconnect());
  observers.length = 0;
}
