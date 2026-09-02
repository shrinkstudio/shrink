/**
 * "Ready to brief a build?" — readiness quiz. Three phases in one component:
 * intro card -> one question at a time -> results (score + gaps + where we'd
 * start). Renders inside a Shadow DOM with its own scoped styles; copy is
 * editable via Webflow props, questions + scoring live in quiz.ts.
 */
import { useMemo, useState } from 'react';
import { css } from './styles';
import { QUESTIONS, scoreQuiz, type Result } from './quiz';

export interface ReadinessQuizProps {
  theme?: 'light' | 'dark';
  eyebrow?: string;
  introHeading?: string;
  introBody?: string;
  bullet1?: string;
  bullet2?: string;
  bullet3?: string;
  startLabel?: string;
  backLabel?: string;
  gapsLabel?: string;
  recoLabel?: string;
  ctaLabel?: string;
  ctaLink?: { href: string; target?: string; preload?: string };
  restartLabel?: string;
}

type Phase = 'intro' | 'quiz' | 'results';

export function ReadinessQuiz({
  theme = 'light',
  eyebrow = 'Readiness quiz',
  introHeading = 'Ready to brief a build?',
  introBody = "Seven quick questions. You'll get a readiness score, the gaps worth closing, and where we'd start.",
  bullet1 = 'About two minutes',
  bullet2 = 'No email to start',
  bullet3 = 'Honest read, not a sales pitch',
  startLabel = 'Start the quiz',
  backLabel = 'Back',
  gapsLabel = 'Gaps worth closing',
  recoLabel = "Where we'd start",
  ctaLabel = 'Book a call',
  ctaLink,
  restartLabel = 'Retake the quiz',
}: ReadinessQuizProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Array<number | null>>(
    () => QUESTIONS.map(() => null),
  );

  const result = useMemo<Result | null>(
    () => (phase === 'results' ? scoreQuiz(answers) : null),
    [phase, answers],
  );

  const bullets = [bullet1, bullet2, bullet3].filter(Boolean);

  function choose(optionIndex: number) {
    setAnswers((prev) => {
      const next = prev.slice();
      next[step] = optionIndex;
      return next;
    });
  }

  function next() {
    if (step < QUESTIONS.length - 1) setStep(step + 1);
    else setPhase('results');
  }

  function back() {
    if (step > 0) setStep(step - 1);
    else setPhase('intro');
  }

  function restart() {
    setAnswers(QUESTIONS.map(() => null));
    setStep(0);
    setPhase('intro');
  }

  const q = QUESTIONS[step];
  const answered = answers[step] != null;
  const isLast = step === QUESTIONS.length - 1;

  return (
    <>
      <style>{css}</style>
      <div className={`rq theme-${theme}`}>
        <div className="rq__card">
          {phase === 'intro' && (
            <>
              {eyebrow && <p className="rq__eyebrow">{eyebrow}</p>}
              <h3 className="rq__title">{introHeading}</h3>
              {introBody && <p className="rq__body">{introBody}</p>}
              {bullets.length > 0 && (
                <ul className="rq__points">
                  {bullets.map((b, i) => (
                    <li className="rq__point" key={i}>
                      {b}
                    </li>
                  ))}
                </ul>
              )}
              <div className="rq__cta-wrap">
                <button
                  type="button"
                  className="rq__btn rq__btn--primary"
                  onClick={() => {
                    setPhase('quiz');
                    setStep(0);
                  }}
                >
                  {startLabel}
                </button>
              </div>
            </>
          )}

          {phase === 'quiz' && (
            <>
              <div className="rq__progress">
                <div className="rq__dots">
                  {QUESTIONS.map((_, i) => (
                    <span
                      key={i}
                      className={
                        'rq__dot' +
                        (i < step ? ' is-done' : '') +
                        (i === step ? ' is-active' : '')
                      }
                    />
                  ))}
                </div>
                <span className="rq__count">
                  {step + 1} / {QUESTIONS.length}
                </span>
              </div>

              <p className="rq__q-label">{q.dimension}</p>
              <h3 className="rq__question">{q.question}</h3>

              <div className="rq__options" role="radiogroup" aria-label={q.question}>
                {q.options.map((opt, i) => {
                  const selected = answers[step] === i;
                  return (
                    <button
                      type="button"
                      key={i}
                      role="radio"
                      aria-checked={selected}
                      className={'rq__option' + (selected ? ' is-selected' : '')}
                      onClick={() => choose(i)}
                    >
                      <span className="rq__option-mark" />
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              <div className="rq__nav">
                <button type="button" className="rq__btn rq__btn--ghost" onClick={back}>
                  {backLabel}
                </button>
                <button
                  type="button"
                  className="rq__btn rq__btn--primary"
                  onClick={next}
                  disabled={!answered}
                >
                  {isLast ? 'See my result' : 'Next'}
                </button>
              </div>
            </>
          )}

          {phase === 'results' && result && (
            <>
              {eyebrow && <p className="rq__eyebrow">{result.bandLabel}</p>}
              <div className="rq__score">
                <span className="rq__score-num">{result.score}</span>
                <span className="rq__score-max">/ {result.max}</span>
              </div>
              <div className="rq__meter">
                <div
                  className="rq__meter-fill"
                  style={{ width: `${result.percent}%` }}
                />
              </div>
              <p className="rq__result-blurb">{result.bandBlurb}</p>

              {result.gaps.length > 0 && (
                <>
                  <p className="rq__section-label">{gapsLabel}</p>
                  <ul className="rq__gaps">
                    {result.gaps.map((g, i) => (
                      <li className="rq__gap" key={i}>
                        {g}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <p className="rq__section-label">{recoLabel}</p>
              <p className="rq__reco">{result.recommendation}</p>

              <div className="rq__result-actions">
                {ctaLabel && ctaLink?.href && (
                  <a
                    className="rq__btn rq__btn--primary"
                    href={ctaLink.href}
                    target={ctaLink.target}
                  >
                    {ctaLabel}
                  </a>
                )}
                <button type="button" className="rq__btn rq__btn--ghost" onClick={restart}>
                  {restartLabel}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
