/**
 * Scoped styles for the Project Calculator (Shadow DOM). Tokens and controls
 * come from src/shared/base.ts (site MAST variables); only the calculator's
 * result pieces live here.
 */
import { controls, tokens } from '../shared/base';

export const css = /* css */ `
${tokens}
${controls}

/* the figure */
.pc-figure { margin: 0.25em 0 0; font-size: var(--sk-size-h3); line-height: 1.2; font-weight: 500; letter-spacing: -0.02em; color: var(--sk-text); font-variant-numeric: tabular-nums; text-wrap: balance; }
.pc-figure-unit { font-size: var(--sk-size-body); color: var(--sk-muted); letter-spacing: 0; font-weight: 500; }
.pc-figure-sub { margin: 0.5em 0 0; }

/* driver rows: label + choice on the left, the amount on the right */
.pc-driver { align-items: flex-start; }
.pc-driver-main { display: flex; gap: 1rem; align-items: flex-start; min-width: 0; }
.pc-driver-text { display: flex; flex-direction: column; gap: 0.15em; min-width: 0; }
.pc-driver-label { color: var(--sk-text); }
.pc-driver-choice { font-size: var(--sk-size-sm); color: var(--sk-muted); line-height: 1.4; }
.pc-driver-note { font-size: var(--sk-size-sm); color: var(--sk-muted); line-height: 1.4; margin-top: 0.15em; }
.pc-driver-value { flex: none; text-align: right; }
.pc-driver-value.is-zero { color: var(--sk-muted); }

/* where it goes */
.pc-details { margin-top: var(--sk-gap-md); }
.pc-details summary {
  cursor: pointer; list-style: none; display: inline-flex; gap: 0.375rem; align-items: baseline;
  font-size: var(--sk-size-sm); color: var(--sk-muted); text-decoration: underline; text-underline-offset: 0.2em;
  text-decoration-color: transparent; transition: text-decoration-color 0.3s var(--sk-ease), color 0.3s var(--sk-ease);
}
.pc-details summary::-webkit-details-marker { display: none; }
.pc-details summary:hover { color: var(--sk-text); text-decoration-color: currentColor; }
.pc-details summary:focus-visible { outline: 2px solid var(--sk-accent); outline-offset: 2px; border-radius: 2px; }
.pc-details[open] summary { margin-bottom: 0.75rem; }

/* next step */
.pc-next-title { margin: 0 0 0.25em; font-size: var(--sk-size-h5); line-height: 1.4; font-weight: 500; letter-spacing: -0.02em; }
.pc-package { margin-top: var(--sk-gap-md); padding-top: var(--sk-gap-md); border-top: 1px solid var(--sk-border); }
.pc-package-head { display: flex; justify-content: space-between; gap: 1rem; align-items: baseline; margin: 0 0 0.25em; }
.pc-package-name { font-size: var(--sk-size-body); font-weight: 500; color: var(--sk-text); }
.pc-package-price { font-size: var(--sk-size-sm); color: var(--sk-muted); white-space: nowrap; font-variant-numeric: tabular-nums; }
.pc-package-link { margin-top: 0.5rem; }

@media (max-width: 560px) {
  .pc-driver { flex-direction: column; gap: 0.25rem; }
  .pc-driver-value { text-align: left; padding-left: 2.25rem; }
}
`;
