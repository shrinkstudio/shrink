/**
 * Shared scoped styles for the Shrink Tools code components (Shadow DOM).
 *
 * The components read the ss-2027 MAST variables from the host page. Custom
 * properties inherit through the shadow boundary, so `--primary--text`,
 * `--_components---button--border-radius` and friends resolve exactly as they
 * do for native elements in the same Section. Every var() carries a fallback
 * so the local preview (no site CSS) still renders in the right palette.
 *
 * Tokens: `.sk` sets the semantic set the site's Section component sets
 * (`--primary--*`, `--input--*`) and the component-level aliases used below.
 * `.sk.theme-dark` repeats the site's dark Section variant.
 */

export const tokens = /* css */ `
:host { all: initial; display: block; }
*, *::before, *::after { box-sizing: border-box; }

.sk {
  --sk-font: var(--_typography---fonts--primary-font, "Inter Variable", Arial, sans-serif);
  --sk-text: var(--primary--text, #0a0a0a);
  --sk-muted: var(--primary--text-muted, #50565f);
  --sk-bg: var(--primary--background, #ffffff);
  --sk-surface: var(--primary--surface, #f4f4f5);
  --sk-surface-hover: var(--primary--surface-hover, #e6e6e7);
  --sk-border: var(--_color---neutral--light-gray-2, #e6e6e7);
  --sk-border-strong: var(--_color---neutral--mid-gray-1, #cccccc);
  --sk-accent: var(--primary--accent, #0a0a0a);
  --sk-blue: var(--_color---primary--blue, #4469fc);
  --sk-error: var(--_color---feedback--error, #d92d20);
  --sk-success: var(--_color---feedback--success, #15803d);
  --sk-input-bg: var(--input--background, #ffffff);
  --sk-input-border: var(--sk-border);
  --sk-input-border-hover: var(--input--border-hover, #444444);
  --sk-placeholder: var(--input--placeholder, #a3a3a3);

  --sk-radius-card: var(--_components---card--border-radius, 0.75rem);
  --sk-radius-button: var(--_components---button--border-radius, 0.5rem);
  --sk-radius-input: var(--_components---input--border-radius, 0.5rem);
  --sk-radius-tag: var(--_components---tag--border-radius, 0.375rem);
  --sk-card-padding: var(--_components---card--padding, clamp(1rem, 0.86rem + 0.71vw, 1.5rem));

  --sk-gap-sm: var(--_layout---grid--gap-sm, 8px);
  --sk-gap-button: var(--_layout---grid--gap-button, 16px);
  --sk-gap-md: var(--_layout---grid--gap-md, 24px);
  --sk-gap-main: var(--_layout---grid--gap-main, 40px);

  --sk-size-eyebrow: var(--_typography---eyebrow--font-size, 0.75rem);
  --sk-size-h3: var(--_typography---h3--font-size, clamp(1.5rem, 1.27rem + 1.14vw, 2.3rem));
  --sk-size-h4: var(--_typography---h4--font-size, clamp(1.3rem, 1.24rem + 0.29vw, 1.5rem));
  --sk-size-h5: var(--_typography---h5--font-size, clamp(1.1rem, 1.07rem + 0.14vw, 1.2rem));
  --sk-size-body: var(--_typography---paragraph-body--font-size, clamp(0.9rem, 0.87rem + 0.14vw, 1rem));
  --sk-size-sm: var(--_typography---paragraph-sm--font-size, clamp(0.8rem, 0.77rem + 0.14vw, 0.9rem));
  --sk-size-label: var(--_components---input-label--font-size, 0.875rem);
  --sk-size-list: var(--_components---list--font-size, 0.875rem);

  --sk-ease: cubic-bezier(0.65, 0.05, 0, 1);
  --sk-hover-ms: calc(var(--_components---button--hover-duration-ms, 550) * 1ms);

  font-family: var(--sk-font);
  font-size: var(--sk-size-body);
  font-weight: 500;
  line-height: 1.6;
  color: var(--sk-text);
  width: 100%;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

/* The site's dark Section variant, for a dark card on a light page */
.sk.theme-dark {
  --sk-text: var(--_color---neutral--white, #ffffff);
  --sk-muted: var(--_color---neutral--muted-dark, #8b9199);
  --sk-bg: var(--_color---neutral--black, #0a0a0a);
  --sk-surface: var(--_color---neutral--dark-gray, #171717);
  --sk-surface-hover: var(--_color---neutral--mid-gray-2, #444444);
  --sk-border: var(--_color---neutral--mid-gray-2, #444444);
  --sk-border-strong: var(--_color---neutral--muted, #50565f);
  --sk-accent: var(--_color---neutral--white, #ffffff);
  --sk-input-bg: var(--_color---neutral--dark-gray, #171717);
  --sk-input-border-hover: var(--_color---neutral--mid-gray-1, #cccccc);
  --sk-placeholder: var(--_color---neutral--muted-dark, #8b9199);
}

/* Frame: "card" draws the site's Card (light-gray, card radius + padding).
   Default "none" sits inside whatever the page wraps it in (a Card instance). */
.sk.frame-card {
  background: var(--sk-surface);
  border-radius: var(--sk-radius-card);
  padding: var(--sk-card-padding);
}
.sk.frame-card.theme-dark { background: var(--sk-bg); }
`;

export const controls = /* css */ `
/* ---- type ---- */
.sk-eyebrow {
  margin: 0 0 1.25em;
  font-size: var(--sk-size-eyebrow);
  line-height: 1.2;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: var(--sk-muted);
}
.sk-title {
  margin: 0;
  font-size: var(--sk-size-h4);
  line-height: 1.4;
  font-weight: 500;
  letter-spacing: -0.02em;
  color: var(--sk-text);
  text-wrap: pretty;
}
.sk-title--lg { font-size: var(--sk-size-h3); line-height: 1.2; }
.sk-body {
  margin: 0.4em 0 0;
  font-size: var(--sk-size-body);
  line-height: 1.6;
  color: var(--sk-muted);
  max-width: 52ch;
  text-wrap: pretty;
}
.sk-small { font-size: var(--sk-size-sm); line-height: 1.5; color: var(--sk-muted); margin: 0; }
.sk-label {
  margin: 0 0 0.625rem;
  font-size: var(--sk-size-label);
  line-height: 1.5em;
  font-weight: 500;
  color: var(--sk-muted);
}
.sk-num { font-variant-numeric: tabular-nums; }

/* ---- intro bullets (numbered-list look) ---- */
.sk-points { list-style: none; margin: var(--sk-gap-md) 0 0; padding: 0; display: flex; flex-direction: column; }
.sk-point {
  display: flex; gap: 1rem; align-items: baseline;
  padding: 0.875rem 0; border-top: 1px solid var(--sk-border);
  font-size: var(--sk-size-list); line-height: 1.5; color: var(--sk-text);
}
.sk-point:first-child { border-top: 0; padding-top: 0; }
.sk-point::before { content: "\\2192"; color: var(--sk-muted); min-width: 1.25rem; }

/* ---- buttons (site Button component) ---- */
.sk-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 0.4em;
  padding: 0.5em 0.75em;
  font-family: var(--sk-font); font-size: 1rem; line-height: 1.3em; font-weight: 400; letter-spacing: 0;
  color: var(--sk-bg); background: var(--sk-accent);
  border: 1px solid transparent; border-radius: var(--sk-radius-button);
  cursor: pointer; text-decoration: none; text-align: center; white-space: nowrap;
  transition: background-color var(--sk-hover-ms) var(--sk-ease), color var(--sk-hover-ms) var(--sk-ease),
    border-color var(--sk-hover-ms) var(--sk-ease), opacity 0.3s var(--sk-ease), transform 0.2s var(--sk-ease);
}
.sk-btn:hover { background: var(--sk-blue); color: #ffffff; }
.sk-btn:active { transform: scale(0.96); }
.sk-btn:focus-visible { outline: 2px solid var(--sk-accent); outline-offset: 2px; }
.sk-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
.sk-btn:disabled:hover { background: var(--sk-accent); color: var(--sk-bg); }
/* secondary sits on the grey card, so it takes the input surface (white) and a hairline */
.sk-btn--secondary { background: var(--sk-input-bg); border-color: var(--sk-border); color: var(--sk-text); }
.sk-btn--secondary:hover { background: var(--sk-input-bg); border-color: var(--sk-text); color: var(--sk-text); }
.sk-btn--secondary:disabled:hover { background: var(--sk-input-bg); border-color: var(--sk-border); color: var(--sk-text); }
.sk-btn--full { width: 100%; }

/* text link with the site's underline-on-hover */
.sk-link {
  display: inline-flex; gap: 0.375rem; align-items: baseline;
  color: var(--sk-text); font-size: var(--sk-size-body); text-decoration: underline;
  text-decoration-color: transparent; text-underline-offset: 0.2em;
  transition: text-decoration-color 0.3s var(--sk-ease), opacity 0.3s var(--sk-ease);
}
.sk-link:hover { text-decoration-color: currentColor; }
.sk-link:focus-visible { outline: 2px solid var(--sk-accent); outline-offset: 2px; border-radius: 2px; }

.sk-actions { display: flex; flex-wrap: wrap; gap: var(--sk-gap-sm) var(--sk-gap-button); align-items: center; margin-top: var(--sk-gap-md); }
.sk-actions--between { justify-content: space-between; }

/* ---- progress ---- */
.sk-progress { display: flex; align-items: center; gap: 0.875rem; margin-bottom: var(--sk-gap-md); }
.sk-dots { display: flex; gap: 4px; flex: 1; }
.sk-dot { height: 3px; flex: 1; background: var(--sk-border); border-radius: 2px; transition: background-color 0.35s var(--sk-ease); }
.sk-dot.is-done, .sk-dot.is-active { background: var(--sk-blue); }
.sk-count { font-size: var(--sk-size-sm); color: var(--sk-muted); white-space: nowrap; font-variant-numeric: tabular-nums; }

/* ---- option rows (radio / checkbox) ---- */
.sk-options { display: flex; flex-direction: column; gap: var(--sk-gap-sm); margin-top: var(--sk-gap-md); }
.sk-option {
  display: flex; align-items: flex-start; gap: 0.75rem; width: 100%; text-align: left;
  font-family: var(--sk-font); font-size: var(--sk-size-body); line-height: 1.5; font-weight: 500; color: var(--sk-text);
  background: var(--sk-input-bg); border: 1px solid var(--sk-input-border); border-radius: var(--sk-radius-input);
  padding: 0.75rem 1rem; cursor: pointer;
  transition: border-color 0.2s var(--sk-ease), background-color 0.2s var(--sk-ease);
}
.sk-option:hover { border-color: var(--sk-input-border-hover); }
.sk-option:focus-visible { outline: 2px solid var(--sk-accent); outline-offset: 2px; }
.sk-option.is-selected { border-color: var(--sk-text); }
.sk-option.is-disabled { opacity: 0.45; cursor: not-allowed; }
.sk-option.is-disabled:hover { border-color: var(--sk-input-border); }
.sk-option-mark {
  flex: 0 0 auto; width: 1rem; height: 1rem; margin-top: 0.25em; position: relative;
  border: 1px solid var(--sk-border-strong); border-radius: 50%; background: var(--sk-input-bg);
  transition: border-color 0.2s var(--sk-ease), background-color 0.2s var(--sk-ease);
}
.sk-option--multi .sk-option-mark { border-radius: 0.125rem; }
.sk-option.is-selected .sk-option-mark { border-color: var(--sk-text); background: var(--sk-text); }
.sk-option.is-selected .sk-option-mark::after {
  content: ""; position: absolute; inset: 0; background: var(--sk-bg);
  clip-path: polygon(20% 50%, 42% 72%, 80% 30%, 72% 22%, 42% 56%, 28% 42%);
}
.sk-option-text { display: flex; flex-direction: column; gap: 0.1em; }
.sk-option-hint { font-size: var(--sk-size-sm); color: var(--sk-muted); line-height: 1.4; }

/* ---- list rows (site numbered-list) ---- */
.sk-rows { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
.sk-row {
  display: flex; gap: 1rem; align-items: baseline; justify-content: space-between;
  padding: 0.875rem 0; border-top: 1px solid var(--sk-border);
  font-size: var(--sk-size-list); line-height: 1.5; color: var(--sk-text);
}
.sk-row:first-child { border-top: 0; padding-top: 0; }
.sk-row-main { display: flex; gap: 1rem; align-items: baseline; min-width: 0; }
.sk-row-marker { min-width: 1.25rem; color: var(--sk-muted); font-variant-numeric: tabular-nums; flex: none; }
.sk-row-value { color: var(--sk-muted); white-space: nowrap; font-variant-numeric: tabular-nums; }

/* ---- panel (a white card inside the grey card, like the site's price rows) ---- */
.sk-panel {
  background: var(--sk-bg); border: 1px solid var(--sk-border); border-radius: var(--sk-radius-card);
  padding: var(--sk-card-padding);
}
.sk-block { margin-top: var(--sk-gap-main); }
.sk-block--tight { margin-top: var(--sk-gap-md); }

/* ---- form (site Input / Input Label / Checkbox) ---- */
.sk-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.sk-field { display: flex; flex-direction: column; margin-bottom: 1rem; }
.sk-field-label { margin-bottom: 0.625rem; font-size: var(--sk-size-label); line-height: 1.5em; font-weight: 500; color: var(--sk-text); }
.sk-input {
  width: 100%; padding: 0.75rem 1rem; margin: 0;
  font-family: var(--sk-font); font-size: 1rem; line-height: 1.5em; font-weight: 500; letter-spacing: 0;
  color: var(--sk-text); background: var(--sk-input-bg);
  border: 1px solid var(--sk-input-border); border-radius: var(--sk-radius-input); outline: none;
  transition: border-color 0.2s var(--sk-ease);
}
.sk-input::placeholder { color: var(--sk-placeholder); }
.sk-input:hover { border-color: var(--sk-input-border-hover); }
.sk-input:focus { border-color: var(--sk-accent); }
.sk-input[aria-invalid="true"] { border-color: var(--sk-error); }
.sk-check { display: flex; align-items: flex-start; gap: 0.625rem; margin: 0 0 1rem; cursor: pointer; }
.sk-check input { position: absolute; opacity: 0; width: 1px; height: 1px; margin: 0; }
.sk-check-box {
  flex: none; width: 1rem; height: 1rem; margin-top: 0.15rem; position: relative;
  border: 1px solid var(--sk-input-border); border-radius: 0.125rem; background: var(--sk-input-bg);
  transition: border-color 0.2s var(--sk-ease), background-color 0.2s var(--sk-ease);
}
.sk-check input:checked + .sk-check-box { background: var(--sk-text); border-color: var(--sk-text); }
.sk-check input:checked + .sk-check-box::after {
  content: ""; position: absolute; inset: 0; background: var(--sk-bg);
  clip-path: polygon(20% 50%, 42% 72%, 80% 30%, 72% 22%, 42% 56%, 28% 42%);
}
.sk-check input:focus-visible + .sk-check-box { outline: 2px solid var(--sk-accent); outline-offset: 2px; }
.sk-check-text { font-size: var(--sk-size-label); line-height: 1.5em; color: var(--sk-muted); }
.sk-error {
  margin: 0 0 1rem; padding: 0.75rem 1rem;
  border: 1px solid var(--sk-error); border-radius: var(--sk-radius-input);
  color: var(--sk-error); font-size: var(--sk-size-label); line-height: 1.5em;
}
.sk-success { color: var(--sk-text); }

/* ---- motion ---- */
@keyframes sk-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
.sk-step { animation: sk-in 0.45s var(--sk-ease) both; }
@media (prefers-reduced-motion: reduce) {
  .sk-step { animation: none; }
  .sk *, .sk *::before, .sk *::after { transition-duration: 0.01ms !important; }
}

@media (max-width: 560px) {
  .sk-field-row { grid-template-columns: 1fr; gap: 0; }
  .sk-actions > .sk-btn { flex: 1 1 auto; }
}
`;
