/**
 * Scoped styles for the Readiness Quiz. Ships inside the component (Shadow DOM).
 * Tokens, type, buttons, options, rows and form controls come from
 * src/shared/base.ts, which reads the site's MAST variables from the host page.
 * Only the quiz-specific pieces live here.
 */
import { controls, tokens } from '../shared/base';

export const css = /* css */ `
${tokens}
${controls}

/* Results: two-score panel */
.rq-meter { height: 4px; border-radius: 2px; background: var(--sk-border); overflow: hidden; margin: var(--sk-gap-md) 0; }
.rq-meter-fill { height: 100%; background: var(--sk-blue); border-radius: 2px; width: 0; transition: width 0.8s var(--sk-ease); }

.rq-scores { display: grid; grid-template-columns: 1fr 1fr; gap: var(--sk-gap-md) var(--sk-gap-main); }
.rq-score { margin: 0; display: flex; align-items: baseline; gap: 0.15em; }
.rq-score-num { font-size: var(--sk-size-h3); line-height: 1.2; font-weight: 500; letter-spacing: -0.02em; color: var(--sk-text); font-variant-numeric: tabular-nums; }
.rq-score-max { font-size: var(--sk-size-body); color: var(--sk-muted); }
.rq-score-note { margin: 0.25rem 0 0; }

/* Results: recommendation */
.rq-reco-head { display: flex; justify-content: space-between; gap: 1rem; align-items: baseline; margin: 0 0 0.25em; }
.rq-reco-title { font-size: var(--sk-size-h5); line-height: 1.4; font-weight: 500; letter-spacing: -0.02em; }
.rq-reco-price { font-size: var(--sk-size-sm); color: var(--sk-muted); white-space: nowrap; font-variant-numeric: tabular-nums; }
.rq-reco-link { margin-top: 0.75rem; }

/* quiet tools at the foot of the results: share, change, start over */
.rq-tools { display: flex; flex-wrap: wrap; gap: var(--sk-gap-sm) var(--sk-gap-md); margin-top: var(--sk-gap-main); padding-top: var(--sk-gap-md); border-top: 1px solid var(--sk-border); }
.rq-textbtn {
  appearance: none; background: none; border: 0; padding: 0; margin: 0; cursor: pointer;
  font: inherit; font-size: var(--sk-size-sm); line-height: 1.5; color: var(--sk-text);
  text-decoration: underline; text-underline-offset: 0.2em; text-decoration-color: var(--sk-border);
  transition: text-decoration-color 0.3s var(--sk-ease);
}
.rq-textbtn:hover { text-decoration-color: currentColor; }
.rq-textbtn:focus-visible { outline: 2px solid var(--sk-accent); outline-offset: 2px; border-radius: 2px; }

@media (max-width: 560px) {
  .rq-scores { grid-template-columns: 1fr; }
}
`;
