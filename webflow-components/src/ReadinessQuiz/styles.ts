/**
 * Scoped styles for the Readiness Quiz. Ships inside the component (Shadow DOM).
 * Palette + type mirror the ss-2027 MAST tokens so it reads as part of the site:
 *   blue #4469fc (accent), ink #0a0a0a, smoke #f4f4f5 (card), muted #50565f,
 *   border #eeeeee @ 1.5px, radius 4px, Helvetica Now Display.
 * Helvetica Now Display is loaded by the host page; @font-face is document-global
 * so it resolves inside the shadow root without embedding the (licensed) files.
 */

export const css = /* css */ `
:host { all: initial; display: block; }
* { box-sizing: border-box; }

.rq {
  --accent: #4469fc;
  --ink: #0a0a0a;
  --paper: #ffffff;
  --smoke: #f4f4f5;
  --muted: #50565f;
  --line: #eeeeee;
  --line-strong: #cccccc;
  --radius: 4px;
  --ease: cubic-bezier(0.65, 0.05, 0, 1);
  --font: "Helvetica Now Display", "Helvetica Neue", Helvetica, Arial, sans-serif;

  font-family: var(--font);
  color: var(--ink);
  width: 100%;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

.rq.theme-dark {
  --ink: #ffffff;
  --paper: #0a0a0a;
  --smoke: #171717;
  --muted: #cccccc;
  --line: #444444;
  --line-strong: #50565f;
}

/* Card */
.rq__card {
  background: var(--smoke);
  border: 1.5px solid var(--line);
  border-radius: var(--radius);
  padding: clamp(24px, 4vw, 48px);
  width: 100%;
}

/* Eyebrow */
.rq__eyebrow {
  font-size: 14px;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: var(--muted);
  margin: 0 0 20px;
}

/* Headings + body */
.rq__title {
  font-family: var(--font);
  font-weight: 500;
  font-size: clamp(24px, 3.4vw, 32px);
  line-height: 1.15;
  letter-spacing: -0.02em;
  margin: 0;
  color: var(--ink);
}
.rq__body {
  font-size: 18px;
  line-height: 1.5;
  letter-spacing: -0.01em;
  color: var(--muted);
  margin: 12px 0 0;
  max-width: 46ch;
}

/* Intro bullet list */
.rq__points { list-style: none; margin: 24px 0 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.rq__point { display: flex; gap: 10px; align-items: baseline; font-size: 16px; letter-spacing: -0.01em; color: var(--muted); }
.rq__point::before { content: "\\2192"; color: var(--accent); }

/* Buttons */
.rq__btn {
  display: inline-flex; align-items: center; justify-content: center;
  font-family: var(--font); font-size: 16px; font-weight: 500; letter-spacing: -0.01em;
  padding: 14px 22px; border-radius: var(--radius); border: 1.5px solid transparent;
  cursor: pointer; transition: background .25s var(--ease), color .25s var(--ease), border-color .25s var(--ease), opacity .25s var(--ease);
  text-decoration: none; line-height: 1;
}
.rq__btn--primary { background: var(--ink); color: var(--paper); }
.rq__btn--primary:hover { background: var(--accent); }
.rq__btn--ghost { background: transparent; color: var(--ink); border-color: var(--line-strong); }
.rq__btn--ghost:hover { border-color: var(--ink); }
.rq__btn:disabled { opacity: .4; cursor: not-allowed; }
.rq__cta-wrap { margin-top: 28px; }

/* Progress */
.rq__progress { display: flex; align-items: center; gap: 14px; margin-bottom: 28px; }
.rq__dots { display: flex; gap: 6px; flex: 1; }
.rq__dot { height: 4px; flex: 1; background: var(--line); border-radius: 2px; transition: background .35s var(--ease); }
.rq__dot.is-done, .rq__dot.is-active { background: var(--accent); }
.rq__count { font-size: 14px; color: var(--muted); letter-spacing: -0.01em; white-space: nowrap; }

/* Question */
.rq__q-label { font-size: 14px; color: var(--muted); letter-spacing: -0.01em; margin: 0 0 10px; }
.rq__question { font-size: clamp(20px, 2.6vw, 26px); font-weight: 500; line-height: 1.2; letter-spacing: -0.02em; margin: 0 0 24px; color: var(--ink); }
.rq__options { display: flex; flex-direction: column; gap: 10px; }
.rq__option {
  display: flex; align-items: center; gap: 12px; text-align: left; width: 100%;
  font-family: var(--font); font-size: 16px; letter-spacing: -0.01em; color: var(--ink);
  background: var(--paper); border: 1.5px solid var(--line); border-radius: var(--radius);
  padding: 16px 18px; cursor: pointer;
  transition: border-color .2s var(--ease), background .2s var(--ease);
}
.rq__option:hover { border-color: var(--line-strong); }
.rq__option.is-selected { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 6%, var(--paper)); }
.rq__option-mark {
  width: 18px; height: 18px; border-radius: 50%; border: 1.5px solid var(--line-strong);
  flex: 0 0 auto; position: relative; transition: border-color .2s var(--ease);
}
.rq__option.is-selected .rq__option-mark { border-color: var(--accent); }
.rq__option.is-selected .rq__option-mark::after {
  content: ""; position: absolute; inset: 3px; border-radius: 50%; background: var(--accent);
}

/* Nav row */
.rq__nav { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 28px; }
.rq__nav.is-first { justify-content: flex-end; }

/* Results */
.rq__score { display: flex; align-items: baseline; gap: 10px; margin: 0 0 6px; }
.rq__score-num { font-size: clamp(40px, 7vw, 64px); font-weight: 500; line-height: 1; letter-spacing: -0.03em; color: var(--accent); }
.rq__score-max { font-size: 20px; color: var(--muted); letter-spacing: -0.01em; }
.rq__meter { height: 6px; border-radius: 3px; background: var(--line); overflow: hidden; margin: 18px 0 24px; }
.rq__meter-fill { height: 100%; background: var(--accent); border-radius: 3px; width: 0; transition: width .8s var(--ease); }
.rq__result-blurb { font-size: 18px; line-height: 1.5; letter-spacing: -0.01em; color: var(--muted); margin: 0; max-width: 48ch; }

.rq__section-label { font-size: 14px; font-weight: 500; color: var(--ink); letter-spacing: -0.01em; margin: 32px 0 12px; }
.rq__gaps { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.rq__gap { display: flex; gap: 12px; align-items: baseline; font-size: 16px; line-height: 1.45; letter-spacing: -0.01em; color: var(--muted); border-top: 1.5px solid var(--line); padding-top: 12px; }
.rq__gap::before { content: "\\2192"; color: var(--accent); flex: 0 0 auto; }
.rq__gap:first-child { border-top: none; padding-top: 0; }
.rq__reco { font-size: 16px; line-height: 1.5; letter-spacing: -0.01em; color: var(--ink); margin: 0; }

.rq__result-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 32px; }

@media (max-width: 520px) {
  .rq__result-actions { flex-direction: column; align-items: stretch; }
  .rq__btn { width: 100%; }
}
`;
