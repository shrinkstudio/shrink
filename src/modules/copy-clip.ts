// -----------------------------------------
// COPY CLIP — click to copy a value to the clipboard
// -----------------------------------------
// Markup:
//   button[data-copy-clip="hey@shrink.studio"]   ← copies the attribute value,
//                                                  or its own text when empty
//     [data-copy-icon="idle"] / [data-copy-icon="done"]   ← CSS swaps these
//
// On copy the trigger gets [data-copied] for a moment and screen readers
// hear "Copied". Styling lives in the "Copy Clip" embed in Webflow.
// -----------------------------------------

const RESET_MS = 2000;

let region: HTMLElement | null = null;
const timers = new WeakMap<HTMLElement, number>();

const announce = (message: string) => {
  if (!region) {
    region = document.createElement('div');
    region.setAttribute('aria-live', 'polite');
    region.className = 'u-sr-only';
    document.body.append(region);
  }
  region.textContent = '';
  // a fresh text node after a tick so repeat copies are announced again
  window.setTimeout(() => {
    if (region) region.textContent = message;
  }, 50);
};

const writeText = async (value: string) => {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    // older browsers and non-secure origins
    const field = document.createElement('textarea');
    field.value = value;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.append(field);
    field.select();
    const ok = document.execCommand('copy');
    field.remove();
    return ok;
  }
};

const onClick = async (event: MouseEvent) => {
  const trigger = (event.target as HTMLElement).closest<HTMLElement>('[data-copy-clip]');
  if (!trigger) return;
  event.preventDefault();

  const value = (trigger.getAttribute('data-copy-clip') || trigger.textContent || '').trim();
  if (!value || !(await writeText(value))) return;

  trigger.setAttribute('data-copied', '');
  announce(`Copied ${value}`);
  window.clearTimeout(timers.get(trigger));
  timers.set(
    trigger,
    window.setTimeout(() => trigger.removeAttribute('data-copied'), RESET_MS)
  );
};

let bound = false;

/**
 * Labels every copy trigger and starts listening (one delegated listener).
 * Safe to call repeatedly.
 */
export const initCopyClip = (scope: ParentNode = document) => {
  for (const trigger of scope.querySelectorAll<HTMLElement>('[data-copy-clip]')) {
    if (trigger.hasAttribute('aria-label')) continue;
    const value = (trigger.getAttribute('data-copy-clip') || trigger.textContent || '').trim();
    if (value) trigger.setAttribute('aria-label', `Copy ${value}`);
  }
  if (bound) return;
  document.addEventListener('click', onClick);
  bound = true;
};

export const destroyCopyClip = () => {
  document.removeEventListener('click', onClick);
  bound = false;
};
