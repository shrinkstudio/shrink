/**
 * "Ready to brief a build?" readiness quiz. Intro -> 7 questions (single and
 * one multi-select) -> results: two-axis score, what the next site needs,
 * where we'd start (with its price, linked to the package or service page), a
 * lead form that posts to the site's forms handler (which emails the result), and
 * a share link that reopens the answers and carries the lead id.
 * Shadow-DOM component; styles are scoped and read the site's MAST variables.
 * Scoring, questions and result copy live in quiz.ts.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { css } from './styles';
import {
  QUESTIONS,
  QUESTION_COUNT,
  READINESS_MAX,
  URGENCY_MAX,
  buildShareUrl,
  computeResult,
  decodeAnswers,
  describeAnswers,
  type Answers,
  type QuizResult,
} from './quiz';

export interface ReadinessQuizProps {
  theme?: 'light' | 'dark';
  /** "none" sits inside the page's own Card; "card" draws the site Card itself. */
  frame?: 'none' | 'card';
  eyebrow?: string;
  introHeading?: string;
  introBody?: string;
  bullet1?: string;
  bullet2?: string;
  bullet3?: string;
  startLabel?: string;
  backLabel?: string;
  restartLabel?: string;
  /** Where the lead form posts (JSON). Defaults to the site's api/forms handler. */
  submitEndpoint?: string;
  /** Page the share link opens. Empty = the page the quiz is on. */
  shareBaseUrl?: string;
  /** Resources opt-in checkbox label. */
  optInLabel?: string;
}

type Phase = 'intro' | 'quiz' | 'results';
type SubmitState =
  | { status: 'idle' }
  | { status: 'sending' }
  | { status: 'sent' }
  | { status: 'error'; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

type Props = Record<string, string | number | boolean | undefined>;

/** PostHog when the site has it (consent is handled by the site's own set-up). */
function track(name: string, props: Props = {}) {
  const w = window as unknown as { posthog?: { capture?: (n: string, p?: Props) => void } };
  w.posthog?.capture?.(name, { tool: 'quiz', ...props });
}

export function ReadinessQuiz({
  theme = 'light',
  frame = 'none',
  eyebrow = 'Readiness quiz',
  introHeading = 'Ready to brief a build?',
  introBody = "Answer seven questions about your team, your timing and what the site needs to do. You'll see how ready you are, what's worth sorting first and where we'd suggest starting.",
  bullet1 = 'About two minutes',
  bullet2 = 'See your result straight away',
  bullet3 = 'A clear next step, whatever your answers',
  startLabel = 'Start the quiz',
  backLabel = 'Back',
  restartLabel = 'Start over',
  submitEndpoint = 'https://shrink-site-api.vercel.app/api/forms',
  shareBaseUrl = '',
  optInLabel = 'Send me guides and resources from Shrink',
}: ReadinessQuizProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});

  const [contact, setContact] = useState({ name: '', email: '', company: '', resources: false });
  const [submit, setSubmit] = useState<SubmitState>({ status: 'idle' });
  const [leadId, setLeadId] = useState(newId);
  const [copied, setCopied] = useState(false);
  const [hp, setHp] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  // when the result appeared: a form sent within seconds of it is a bot
  const shownAt = useRef(0);

  // shared link (?d=): open straight on the results
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const d = params.get('d');
    const shared = d ? decodeAnswers(d) : null;
    if (!shared) return;
    setAnswers(shared);
    const ref = params.get('ref');
    if (ref) setLeadId(ref);
    setPhase('results');
    shownAt.current = Date.now();
    track('quiz_reopened', { ref: ref || '' });
    // tell Shrink OS the lead came back to their result
    if (ref) {
      fetch(submitEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form: 'quiz-reopen', ref }),
      }).catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep the top of the card in view as the phase changes
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const top = rootRef.current?.getBoundingClientRect().top ?? 0;
    if (top < 0) rootRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [phase, step]);

  const result = useMemo<QuizResult | null>(
    () => (phase === 'results' ? computeResult(answers) : null),
    [phase, answers],
  );

  const link = useMemo(
    () => (phase === 'results' && typeof window !== 'undefined'
      ? buildShareUrl(shareBaseUrl || window.location.origin + window.location.pathname, answers, leadId)
      : ''),
    [phase, answers, leadId, shareBaseUrl],
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
    if (!isLast) {
      setStep(step + 1);
      return;
    }
    const r = computeResult(answers);
    setPhase('results');
    shownAt.current = Date.now();
    track('quiz_completed', { state: r.state, readiness: r.scores.readiness, urgency: r.scores.urgency, engagement: r.recommendedEngagement.id });
  }
  function back() {
    if (step > 0) setStep(step - 1);
    else setPhase('intro');
  }
  function changeAnswers() {
    setStep(QUESTION_COUNT - 1);
    setPhase('quiz');
  }
  function restart() {
    setAnswers({});
    setContact({ name: '', email: '', company: '', resources: false });
    setSubmit({ status: 'idle' });
    setLeadId(newId());
    setCopied(false);
    setStep(0);
    setPhase('intro');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!contact.name.trim() || !EMAIL_RE.test(contact.email)) {
      setSubmit({ status: 'error', message: 'Please add your name and a valid email address.' });
      return;
    }
    setSubmit({ status: 'sending' });
    try {
      const res = await fetch(submitEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form: 'quiz',
          id: leadId,
          hp,
          elapsed: shownAt.current ? Date.now() - shownAt.current : undefined,
          pageUrl: window.location.href,
          shareUrl: link,
          contact,
          result: result && {
            state: result.state,
            readiness: result.scores.readiness,
            urgency: result.scores.urgency,
            readinessNote: result.readinessNote,
            urgencyNote: result.urgencyNote,
            headline: result.headline,
            diagnosis: result.diagnosis,
            jtbdLabel: result.jtbdLabel,
            jtbd: result.jtbd,
            engagementId: result.recommendedEngagement.id,
            engagement: result.recommendedEngagement.label,
            engagementBlurb: result.recommendedEngagement.blurb,
            engagementPrice: result.recommendedEngagement.price,
            engagementHref: result.recommendedEngagement.href,
            engagementLink: result.recommendedEngagement.linkLabel,
            value: result.recommendedEngagement.value,
          },
          answers: describeAnswers(answers),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error || 'Submit failed');
      setSubmit({ status: 'sent' });
      track('quiz_email_requested', { state: result?.state || '' });
    } catch {
      setSubmit({ status: 'error', message: 'Something went wrong on our side. Please try again, or email hey@shrink.studio.' });
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      track('quiz_link_copied');
    } catch {
      setCopied(false);
    }
  }

  const meterPct = result
    ? Math.round(((result.scores.readiness + result.scores.urgency) / (READINESS_MAX + URGENCY_MAX)) * 100)
    : 0;

  return (
    <>
      {/* raw, so SSR does not entity-escape the CSS (that broke hydration: React #425/#422) */}
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className={`sk theme-${theme} frame-${frame}`} ref={rootRef}>
        {phase === 'intro' && (
          <div className="sk-step" key="intro">
            {eyebrow && <p className="sk-eyebrow">{eyebrow}</p>}
            {introHeading && <h3 className="sk-title">{introHeading}</h3>}
            {introBody && <p className="sk-body">{introBody}</p>}
            {bullets.length > 0 && (
              <ul className="sk-points">
                {bullets.map((b, i) => (
                  <li className="sk-point" key={i}>{b}</li>
                ))}
              </ul>
            )}
            <div className="sk-actions">
              <button
                type="button"
                className="sk-btn"
                onClick={() => { setPhase('quiz'); setStep(0); track('quiz_started'); }}
              >
                {startLabel}
              </button>
            </div>
          </div>
        )}

        {phase === 'quiz' && q && (
          <div className="sk-step" key={q.id}>
            <div className="sk-progress" aria-hidden="true">
              <div className="sk-dots">
                {QUESTIONS.map((_, i) => (
                  <span
                    key={i}
                    className={'sk-dot' + (i < step ? ' is-done' : '') + (i === step ? ' is-active' : '')}
                  />
                ))}
              </div>
              <span className="sk-count">{step + 1} / {QUESTION_COUNT}</span>
            </div>
            <p className="sk-visually-hidden" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
              Question {step + 1} of {QUESTION_COUNT}
            </p>

            <h3 className="sk-title">{q.prompt}</h3>
            {q.helper && <p className="sk-body">{q.helper}</p>}

            <div className="sk-options" role={q.type === 'single' ? 'radiogroup' : 'group'} aria-label={q.prompt}>
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
                      'sk-option'
                      + (selected ? ' is-selected' : '')
                      + (q.type === 'multi' ? ' sk-option--multi' : '')
                      + (atLimit ? ' is-disabled' : '')
                    }
                    onClick={() => (q.type === 'multi' ? toggleMulti(opt.id) : chooseSingle(opt.id))}
                  >
                    <span className="sk-option-mark" aria-hidden="true" />
                    <span className="sk-option-text">{opt.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="sk-actions sk-actions--between">
              <button type="button" className="sk-btn sk-btn--secondary" onClick={back}>{backLabel}</button>
              <button type="button" className="sk-btn" onClick={next} disabled={!answered}>
                {isLast ? 'See my result' : 'Next'}
              </button>
            </div>
          </div>
        )}

        {phase === 'results' && result && (
          <div className="sk-step" key="results">
            <p className="sk-eyebrow">{result.eyebrow}</p>
            <h3 className="sk-title">{result.headline}</h3>
            <p className="sk-body">{result.diagnosis}</p>

            <div className="rq-meter" aria-hidden="true">
              <div className="rq-meter-fill" style={{ width: `${meterPct}%` }} />
            </div>

            <div className="sk-panel rq-scores">
              <div>
                <p className="sk-label">Readiness</p>
                <p className="rq-score">
                  <span className="rq-score-num">{result.scores.readiness}</span>
                  <span className="rq-score-max"> / {READINESS_MAX}</span>
                </p>
                <p className="sk-small rq-score-note">{result.readinessNote}</p>
              </div>
              <div>
                <p className="sk-label">Urgency</p>
                <p className="rq-score">
                  <span className="rq-score-num">{result.scores.urgency}</span>
                  <span className="rq-score-max"> / {URGENCY_MAX}</span>
                </p>
                <p className="sk-small rq-score-note">{result.urgencyNote}</p>
              </div>
            </div>

            {result.jtbd.length > 0 && (
              <div className="sk-block">
                <p className="sk-label">{result.jtbdLabel}</p>
                <ol className="sk-rows">
                  {result.jtbd.map((label, i) => (
                    <li className="sk-row" key={label}>
                      <span className="sk-row-main">
                        <span className="sk-row-marker" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                        <span>{label}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <div className="sk-block">
              <p className="sk-label">Where we'd start</p>
              <div className="sk-panel">
                <p className="rq-reco-head">
                  <span className="rq-reco-title">{result.recommendedEngagement.label}</span>
                  {result.recommendedEngagement.price && <span className="rq-reco-price">{result.recommendedEngagement.price}</span>}
                </p>
                <p className="sk-small">{result.recommendedEngagement.blurb}</p>
                {result.recommendedEngagement.href && (
                  <p className="sk-small rq-reco-link">
                    <a className="sk-link" href={result.recommendedEngagement.href}>
                      {result.recommendedEngagement.linkLabel} <span aria-hidden="true">&rarr;</span>
                    </a>
                  </p>
                )}
              </div>
            </div>

            {submit.status === 'sent' ? (
              <div className="sk-block" role="status">
                <p className="sk-label">Keep your result</p>
                <p className="sk-small sk-success">
                  Thank you. Your result is on its way to your inbox{result.state === 'not_yet' ? '.' : ', and Ben will be in touch to talk through the next step.'} If you can't see it in a few minutes, it may be in your spam folder.
                </p>
              </div>
            ) : (
              <form className="sk-block" onSubmit={handleSubmit} noValidate>
                <p className="sk-label">Keep your result</p>
                <p className="sk-small" style={{ marginBottom: '1rem' }}>
                  Leave your details and we'll email you your result, so you can share it with your team.
                </p>
                <div className="sk-field-row">
                  <label className="sk-field">
                    <span className="sk-field-label">Name</span>
                    <input
                      className="sk-input"
                      autoComplete="name"
                      value={contact.name}
                      onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))}
                    />
                  </label>
                  <label className="sk-field">
                    <span className="sk-field-label">Work email</span>
                    <input
                      className="sk-input"
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      value={contact.email}
                      onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                    />
                  </label>
                </div>
                <label className="sk-field">
                  <span className="sk-field-label">Company</span>
                  <input
                    className="sk-input"
                    autoComplete="organization"
                    value={contact.company}
                    onChange={(e) => setContact((c) => ({ ...c, company: e.target.value }))}
                  />
                </label>
                {/* honeypot: hidden from people and screen readers, bots fill it */}
                <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
                  <label>
                    Website
                    <input tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} />
                  </label>
                </div>
                {optInLabel && (
                  <label className="sk-check">
                    <input
                      type="checkbox"
                      checked={contact.resources}
                      onChange={(e) => setContact((c) => ({ ...c, resources: e.target.checked }))}
                    />
                    <span className="sk-check-box" aria-hidden="true" />
                    <span className="sk-check-text">{optInLabel}</span>
                  </label>
                )}
                {submit.status === 'error' && <p className="sk-error" role="alert">{submit.message}</p>}
                <div className="sk-actions" style={{ marginTop: 0 }}>
                  <button type="submit" className="sk-btn" disabled={submit.status === 'sending'}>
                    {submit.status === 'sending' ? 'Sending' : 'Email me my result'}
                  </button>
                </div>
              </form>
            )}

            <div className="rq-tools">
              <button type="button" className="rq-textbtn" onClick={copyLink}>
                {copied ? 'Link copied, ready to share' : 'Copy a link to share your result'}
              </button>
              <button type="button" className="rq-textbtn" onClick={changeAnswers}>Change an answer</button>
              <button type="button" className="rq-textbtn" onClick={restart}>{restartLabel}</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
