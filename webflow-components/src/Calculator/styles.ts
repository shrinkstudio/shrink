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

/* next step */
.pc-next-title { margin: 0 0 0.25em; font-size: var(--sk-size-h5); line-height: 1.4; font-weight: 500; letter-spacing: -0.02em; }
.pc-package { margin-top: var(--sk-gap-md); padding-top: var(--sk-gap-md); border-top: 1px solid var(--sk-border); }
.pc-package-head { display: flex; justify-content: space-between; gap: 1rem; align-items: baseline; margin: 0 0 0.25em; }
.pc-package-name { font-size: var(--sk-size-body); font-weight: 500; color: var(--sk-text); }
.pc-package-price { font-size: var(--sk-size-sm); color: var(--sk-muted); white-space: nowrap; font-variant-numeric: tabular-nums; }
.pc-package-link { margin-top: 0.5rem; }

/* quiet tools at the foot of the results: share, change, start over */
.pc-tools { display: flex; flex-wrap: wrap; gap: var(--sk-gap-sm) var(--sk-gap-md); margin-top: var(--sk-gap-md); padding-top: var(--sk-gap-md); border-top: 1px solid var(--sk-border); }
.pc-textbtn {
  appearance: none; background: none; border: 0; padding: 0; margin: 0; cursor: pointer;
  font: inherit; font-size: var(--sk-size-sm); line-height: 1.5; color: var(--sk-text);
  text-decoration: underline; text-underline-offset: 0.2em; text-decoration-color: var(--sk-border);
  transition: text-decoration-color 0.3s var(--sk-ease);
}
.pc-textbtn:hover { text-decoration-color: currentColor; }
.pc-textbtn:focus-visible { outline: 2px solid var(--sk-accent); outline-offset: 2px; border-radius: 2px; }

@media (max-width: 560px) {
  .pc-driver { flex-direction: column; gap: 0.25rem; }
  .pc-driver-value { text-align: left; padding-left: 2.25rem; }
}
`;
