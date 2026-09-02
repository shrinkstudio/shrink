/**
 * "Ready to brief a build?" — readiness quiz. Intro card -> 7 questions
 * (single + a multi-select) -> results: two-axis score, what the next site
 * needs, where we'd start, a lead-capture form, and a shareable link.
 * Shadow-DOM component with scoped styles; copy + endpoints editable via props.
 * Scoring, questions and result copy live in quiz.ts.
 */
import { useMemo, useState } from 'react';
import { css } from './styles';
import {
  QUESTIONS,
  QUESTION_COUNT,
  READINESS_MAX,
  URGENCY_MAX,
  buildShareUrl,
  computeResult,
  type Answers,
  type QuizResult,
} from './quiz';

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
  restartLabel?: string;
  /** Where the lead form posts (JSON). Defaults to the tools.shrink.studio route. */
  submitEndpoint?: string;
  /** Base for the shareable result link. Defaults to tools.shrink.studio. */
  shareBaseUrl?: string;
}

type Phase = 'intro' | 'quiz' | 'results';
type SubmitState =
  | { status: 'idle' }
  | { status: 'sending' }
  | { status: 'sent' }
  | { status: 'error'; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  restartLabel = 'Retake the quiz',
  submitEndpoint = 'https://tools.shrink.studio/api/quiz-submit',
  shareBaseUrl = 'https://tools.shrink.studio',
}: ReadinessQuizProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});

  const [contact, setContact] = useState({ name: '', email: '', company: '', notes: '' });
  const [submit, setSubmit] = useState<SubmitState>({ status: 'idle' });
  const [shareCompany, setShareCompany] = useState('');
  const [copied, setCopied] = useState(false);

  const result = useMemo<QuizResult | null>(
    () => (phase === 'results' ? computeResult(answers) : null),
    [phase, answers],
  );

  const bullets = [bullet1, bullet2, bullet3].filter(Boolean);
  const q = QUESTIONS[step];

  const currentAnswer = answers[q?.id];
  const answered = q?.type === 'multi'
    ? Array.isArray(currentAnswer) && currentAnswer.length > 0
    : typeof currentAnswer === 'string';
  const isLast = step === QUESTION_COUNT - 1;

  function chooseSingle(optionId: string) {
    setAnswers((prev) => ({ ...prev, [q.id]: optionId }));
  }

  function toggleMulti(optionId: string) {
    setAnswers((prev) => {
      const arr = Array.isArray(prev[q.id]) ? (prev[q.id] as string[]) : [];
      if (arr.includes(optionId)) {
        return { ...prev, [q.id]: arr.filter((x) => x !== optionId) };
      }
      if (q.maxSelections && arr.length >= q.maxSelections) return prev;
      return { ...prev, [q.id]: [...arr, optionId] };
    });
  }

  function next() {
    if (!isLast) setStep(step + 1);
    else setPhase('results');
  }
  function back() {
    if (step > 0) setStep(step - 1);
    else setPhase('intro');
  }
  function restart() {
    setAnswers({});
    setContact({ name: '', email: '', company: '', notes: '' });
    setSubmit({ status: 'idle' });
    setShareCompany('');
    setStep(0);
    setPhase('intro');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!contact.name.trim() || !EMAIL_RE.test(contact.email)) {
      setSubmit({ status: 'error', message: 'Name and a valid email are required.' });
      return;
    }
    setSubmit({ status: 'sending' });
    try {
      const res = await fetch(submitEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact, answers, result }),
      });
      const data = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };
      if (!res.ok || !data.success) throw new Error(data.error || 'Submit failed');
      setSubmit({ status: 'sent' });
    } catch {
      setSubmit({ status: 'error', message: 'Something went wrong. Please try again.' });
    }
  }

  async function handleShare() {
    const url = buildShareUrl(shareBaseUrl, shareCompany || 'anon', answers);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const meterPct = result
    ? Math.round(((result.scores.readiness + result.scores.urgency) / (READINESS_MAX + URGENCY_MAX)) * 100)
    : 0;

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
                    <li className="rq__point" key={i}>{b}</li>
                  ))}
                </ul>
              )}
              <div className="rq__cta-wrap">
                <button
                  type="button"
                  className="rq__btn rq__btn--primary"
                  onClick={() => { setPhase('quiz'); setStep(0); }}
                >
                  {startLabel}
                </button>
              </div>
            </>
          )}

          {phase === 'quiz' && q && (
            <>
              <div className="rq__progress">
                <div className="rq__dots">
                  {QUESTIONS.map((_, i) => (
                    <span
                      key={i}
                      className={'rq__dot' + (i < step ? ' is-done' : '') + (i === step ? ' is-active' : '')}
                    />
                  ))}
                </div>
                <span className="rq__count">{step + 1} / {QUESTION_COUNT}</span>
              </div>

              <h3 className="rq__question">{q.prompt}</h3>
              {q.helper && <p className="rq__helper">{q.helper}</p>}

              <div className="rq__options" role={q.type === 'single' ? 'radiogroup' : 'group'} aria-label={q.prompt}>
                {q.options.map((opt) => {
                  const selected = q.type === 'multi'
                    ? Array.isArray(currentAnswer) && currentAnswer.includes(opt.id)
                    : currentAnswer === opt.id;
                  const atLimit = q.type === 'multi'
                    && !selected
                    && q.maxSelections != null
                    && Array.isArray(currentAnswer)
                    && currentAnswer.length >= q.maxSelections;
                  return (
                    <button
                      type="button"
                      key={opt.id}
                      role={q.type === 'single' ? 'radio' : 'checkbox'}
                      aria-checked={selected}
                      disabled={atLimit}
                      className={
                        'rq__option'
                        + (selected ? ' is-selected' : '')
                        + (q.type === 'multi' ? ' rq__option--multi' : '')
                        + (atLimit ? ' is-disabled' : '')
                      }
                      onClick={() => (q.type === 'multi' ? toggleMulti(opt.id) : chooseSingle(opt.id))}
                    >
                      <span className="rq__option-mark" />
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              <div className="rq__nav">
                <button type="button" className="rq__btn rq__btn--ghost" onClick={back}>{backLabel}</button>
                <button type="button" className="rq__btn rq__btn--primary" onClick={next} disabled={!answered}>
                  {isLast ? 'See my result' : 'Next'}
                </button>
              </div>
            </>
          )}

          {phase === 'results' && result && (
            <>
              <p className="rq__eyebrow">{result.eyebrow}</p>
              <h3 className="rq__title">{result.headline}</h3>
              <p className="rq__body">{result.diagnosis}</p>

              <div className="rq__meter">
                <div className="rq__meter-fill" style={{ width: `${meterPct}%` }} />
              </div>

              <div className="rq__scores">
                <div className="rq__score-cell">
                  <p className="rq__score-label">Readiness</p>
                  <p className="rq__score">
                    <span className="rq__score-num">{result.scores.readiness}</span>
                    <span className="rq__score-max"> / {READINESS_MAX}</span>
                  </p>
                  <p className="rq__score-note">{result.readinessNote}</p>
                </div>
                <div className="rq__score-cell">
                  <p className="rq__score-label">Urgency</p>
                  <p className="rq__score">
                    <span className="rq__score-num">{result.scores.urgency}</span>
                    <span className="rq__score-max"> / {URGENCY_MAX}</span>
                  </p>
                  <p className="rq__score-note">{result.urgencyNote}</p>
                </div>
              </div>

              {result.jtbd.length > 0 && (
                <div className="rq__block">
                  <p className="rq__section-label">{result.jtbdLabel}</p>
                  <ul className="rq__rows">
                    {result.jtbd.map((label) => (
                      <li className="rq__row" key={label}>{label}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="rq__block">
                <p className="rq__section-label">Where we'd start</p>
                <div className="rq__reco">
                  <p className="rq__reco-title">{result.recommendedEngagement.label}</p>
                  <p className="rq__reco-blurb">{result.recommendedEngagement.blurb}</p>
                </div>
              </div>

              {submit.status === 'sent' ? (
                <div className="rq__block">
                  <p className="rq__section-label">Get the full result</p>
                  <p className="rq__reco-blurb">Thanks. We'll be in touch shortly with the full read.</p>
                </div>
              ) : (
                <form className="rq__block rq__form" onSubmit={handleSubmit}>
                  <p className="rq__section-label">Get the full result</p>
                  <div className="rq__field-row">
                    <label className="rq__field">
                      <span className="rq__field-label">Name</span>
                      <input
                        className="rq__input"
                        value={contact.name}
                        onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))}
                      />
                    </label>
                    <label className="rq__field">
                      <span className="rq__field-label">Work email</span>
                      <input
                        className="rq__input"
                        type="email"
                        value={contact.email}
                        onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                      />
                    </label>
                  </div>
                  <label className="rq__field">
                    <span className="rq__field-label">Company</span>
                    <input
                      className="rq__input"
                      value={contact.company}
                      onChange={(e) => setContact((c) => ({ ...c, company: e.target.value }))}
                    />
                  </label>
                  {submit.status === 'error' && <p className="rq__error">{submit.message}</p>}
                  <div className="rq__cta-wrap">
                    <button type="submit" className="rq__btn rq__btn--primary" disabled={submit.status === 'sending'}>
                      {submit.status === 'sending' ? 'Sending…' : result.recommendedEngagement.cta}
                    </button>
                  </div>
                </form>
              )}

              <div className="rq__block rq__share">
                <p className="rq__section-label">Share</p>
                <p className="rq__reco-blurb">Add your company name and we'll make you a shareable link.</p>
                <div className="rq__share-row">
                  <input
                    className="rq__input"
                    placeholder="Company name"
                    value={shareCompany}
                    onChange={(e) => setShareCompany(e.target.value)}
                  />
                  <button
                    type="button"
                    className="rq__btn rq__btn--primary"
                    onClick={handleShare}
                    disabled={!shareCompany.trim()}
                  >
                    {copied ? 'Copied' : 'Copy link'}
                  </button>
                </div>
              </div>

              <div className="rq__result-actions">
                <button type="button" className="rq__btn rq__btn--ghost" onClick={restart}>{restartLabel}</button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
