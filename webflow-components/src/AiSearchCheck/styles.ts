/**
 * Scoped styles for the AI Search Check (Shadow DOM). Tokens and controls come
 * from src/shared/base.ts (site MAST variables); only the check's own pieces live here.
 */
import { controls, tokens } from '../shared/base';

export const css = /* css */ `
${tokens}
${controls}

/* the website field and its button, one row */
.ac-form { display: flex; gap: var(--sk-gap-sm); align-items: stretch; }
.ac-form .sk-input { flex: 1 1 auto; min-width: 0; }
.ac-form .sk-btn { flex: none; }
.ac-note { margin-top: 0.75rem; }

/* intro: what we check */
.ac-what { margin-top: var(--sk-gap-main); }
.ac-what-row { align-items: flex-start; }
.ac-what-text { display: flex; flex-direction: column; gap: 0.15em; min-width: 0; }
.ac-what-where { flex: none; color: var(--sk-muted); font-size: var(--sk-size-sm); }

/* checking */
.ac-track { height: 4px; border-radius: 2px; background: var(--sk-border); overflow: hidden; margin-top: var(--sk-gap-md); }
.ac-fill { height: 100%; background: var(--sk-text); border-radius: 2px; transition: width 0.35s var(--sk-ease); }
.ac-count { margin-top: 0.75rem; }
.ac-group { margin-top: var(--sk-gap-md); }
.ac-check { display: flex; align-items: center; gap: 0.75rem; padding: 0.625rem 0; border-top: 1px solid var(--sk-border); font-size: var(--sk-size-sm); line-height: 1.5; color: var(--sk-text); }
.ac-check.is-waiting { color: var(--sk-muted); }
.ac-check-label { flex: 1 1 auto; min-width: 0; }
.ac-check-state { flex: none; color: var(--sk-muted); }
.ac-dot { flex: none; width: 8px; height: 8px; border-radius: 50%; background: var(--sk-border); }
.ac-dot.is-done { background: var(--sk-text); }
.ac-dot.is-checking { background: transparent; box-shadow: inset 0 0 0 1.5px var(--sk-text); animation: ac-pulse 1s var(--sk-ease) infinite alternate; }
@keyframes ac-pulse { from { opacity: 1; } to { opacity: 0.35; } }

/* results: scores */
.ac-scores { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: var(--sk-gap-main); }
.ac-score { display: flex; flex-direction: column; gap: 0.75rem; border: 1px solid var(--sk-border); border-radius: var(--sk-radius-card); padding: var(--sk-card-padding); background: var(--sk-bg); }
.ac-score .sk-label { margin: 0; }
.ac-score-num { margin: 0; font-size: var(--sk-size-h3); line-height: 1.1; font-weight: 500; letter-spacing: -0.02em; color: var(--sk-text); font-variant-numeric: tabular-nums; }
.ac-seg { display: flex; gap: 4px; }
.ac-seg span { flex: 1; height: 4px; border-radius: 2px; background: var(--sk-border); }
.ac-seg span.is-pass { background: var(--sk-text); }

/* results: the changes, and every check */
.ac-fix { align-items: flex-start; }
.ac-fix-main { display: flex; gap: 1rem; align-items: flex-start; min-width: 0; }
.ac-fix-text { display: flex; flex-direction: column; gap: 0.15em; min-width: 0; }
.ac-fix-title { color: var(--sk-text); }
.ac-fix-body { font-size: var(--sk-size-sm); color: var(--sk-muted); line-height: 1.4; }
.ac-fix-effort { flex: none; text-align: right; }
.ac-all { margin-top: 1rem; }
.ac-mark { flex: none; width: 1.25rem; color: var(--sk-muted); }
.ac-mark.is-pass { color: var(--sk-success); }
.ac-all-row { align-items: flex-start; }
.ac-all-text { display: flex; flex-direction: column; gap: 0.1em; min-width: 0; }
.ac-all-detail { font-size: var(--sk-size-sm); color: var(--sk-muted); line-height: 1.4; }

/* the questions we'll ask, before they ask */
.ac-questions { margin: 0 0 var(--sk-gap-md); padding: 0.25rem var(--sk-card-padding); background: var(--sk-surface); border-radius: var(--sk-radius-card); list-style: none; }
.ac-question { display: flex; justify-content: space-between; gap: 1rem; padding: 0.875rem 0; border-top: 1px solid var(--sk-border); font-size: var(--sk-size-body); line-height: 1.5; color: var(--sk-text); }
.ac-question:first-child { border-top: 0; }
.ac-question-where { flex: none; color: var(--sk-muted); font-size: var(--sk-size-sm); }

.ac-next-title { margin: 0 0 0.25em; font-size: var(--sk-size-h5); line-height: 1.4; font-weight: 500; letter-spacing: -0.02em; }

/* quiet tools at the foot of the results */
.ac-tools { display: flex; flex-wrap: wrap; gap: var(--sk-gap-sm) var(--sk-gap-md); margin-top: var(--sk-gap-md); padding-top: var(--sk-gap-md); border-top: 1px solid var(--sk-border); }
.ac-textbtn {
  appearance: none; background: none; border: 0; padding: 0; margin: 0; cursor: pointer;
  font: inherit; font-size: var(--sk-size-sm); line-height: 1.5; color: var(--sk-text);
  text-decoration: underline; text-underline-offset: 0.2em; text-decoration-color: var(--sk-border);
  transition: text-decoration-color 0.3s var(--sk-ease);
}
.ac-textbtn:hover { text-decoration-color: currentColor; }
.ac-textbtn:focus-visible { outline: 2px solid var(--sk-accent); outline-offset: 2px; border-radius: 2px; }

@media (prefers-reduced-motion: reduce) {
  .ac-dot.is-checking { animation: none; }
}

@media (max-width: 560px) {
  .ac-form { flex-direction: column; }
  .ac-form .sk-btn { width: 100%; }
  .ac-scores { grid-template-columns: 1fr; }
  .ac-fix { flex-direction: column; gap: 0.25rem; }
  .ac-fix-effort { text-align: left; padding-left: 2.25rem; }
  .ac-what-row { flex-wrap: wrap; }
}
`;
