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
.rq-reco-title { margin: 0 0 0.25em; font-size: var(--sk-size-h5); line-height: 1.4; font-weight: 500; letter-spacing: -0.02em; }
.rq-reco-link { margin-top: 0.75rem; }

/* Results: share */
.rq-share-row { display: flex; gap: var(--sk-gap-sm); margin-top: 0.75rem; }
.rq-share-row .sk-input { flex: 1; min-width: 0; }

@media (max-width: 560px) {
  .rq-scores { grid-template-columns: 1fr; }
  .rq-share-row { flex-direction: column; }
}
`;
