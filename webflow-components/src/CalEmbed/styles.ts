/**
 * Scoped styles for Cal Embed (Shadow DOM). Only the wrapper and the fallback
 * link; the calendar styles itself inside Cal's iframe. Tokens mirror ss-2027.
 */

export const css = /* css */ `
:host { all: initial; display: block; }
* { box-sizing: border-box; }

.cal {
  --ink: #0a0a0a;
  --muted: #50565f;
  --ease: cubic-bezier(0.65, 0.05, 0, 1);
  --font: "Helvetica Now Display", "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-family: var(--font);
  color: var(--ink);
  width: 100%;
}

/* calendar */
.cal_target { width: 100%; min-height: 0; }

/* Cal's embed.js styles its iframe from document <head>, which can't reach the
   shadow root, so the iframe falls back to the browser's inset border */
.cal_target cal-inline,
.cal_target iframe {
  display: block;
  width: 100%;
  border: 0;
  margin: 0;
}
.cal[data-state="loading"] .cal_target { min-height: 28rem; }
.cal[data-state="error"] .cal_target { display: none; }

/* fallback */
.cal_fallback {
  display: inline-flex;
  gap: 0.375rem;
  color: inherit;
  font-size: 1.125rem;
  text-decoration: underline;
  text-underline-offset: 0.2em;
  transition: opacity 0.4s var(--ease);
}
.cal_fallback:hover { opacity: 0.6; }

.cal_note { margin: 0; color: var(--muted); font-size: 1rem; }
`;
