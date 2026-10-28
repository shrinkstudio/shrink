/**
 * Project Calculator: intro -> a short branching question flow -> a price
 * range for the build, what moved the figure (pages, integrations, timing and
 * the rest), where the money goes, and the next step (a call or a brief) with
 * a package pointer where one fits. A lead form posts the estimate to the
 * site's forms handler.
 * Shadow-DOM component; styles are scoped and read the site's MAST variables.
 * Questions, pricing and copy live in model.ts.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { css } from './styles';
import {
  computeDrivers,
  computeEstimate,
  computeNextStep,
  describeAnswers,
  fmtGBP,
  fmtRange,
  visibleQuestions,
  type Answers,
  type Driver,
} from './model';

export interface CalculatorProps {
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
  /** Offer "A web app or product" as a project type. */
  showWebApp?: boolean;
  /** Links the next step points at. Site-relative paths are fine. */
  callLink?: string;
  compoundCallLink?: string;
  briefLink?: string;
  /** Resources opt-in checkbox label. */
  optInLabel?: string;
  /** Where the lead form posts (JSON). Defaults to the site's api/forms handler. */
  submitEndpoint?: string;
  /** Small print under the result. */
  disclaimer?: string;
}

type Phase = 'intro' | 'questions' | 'results';
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

function driverValue(d: Driver): string {
  if (d.low === 0 && d.high === 0) return 'No extra';
  return `+${fmtRange(d.low, d.high)}`;
}

export function Calculator({
  theme = 'light',
  frame = 'none',
  eyebrow = 'Project calculator',
  introHeading = 'What would your site cost?',
  introBody = 'A few plain questions, priced against the same rate card we scope real builds with. You get a range, what moved it, and the next step.',
  bullet1 = 'About two minutes',
  bullet2 = 'No email to see the figure',
  bullet3 = 'A range, with the levers that move it',
  startLabel = 'Start the calculator',
  backLabel = 'Back',
  restartLabel = 'Start over',
  showWebApp = true,
  callLink = '/calls/intro',
  compoundCallLink = '/calls/compound',
  briefLink = '/contact?service=development',
  optInLabel = 'Send me guides and resources from Shrink',
  submitEndpoint = 'https://shrink-site-api.vercel.app/api/forms',
  disclaimer = 'An indicative range from our standard rate card, excluding VAT. The price is fixed once the scope is agreed.',
}: CalculatorProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [contact, setContact] = useState({ name: '', email: '', company: '', resources: false });
  const [submit, setSubmit] = useState<SubmitState>({ status: 'idle' });
  const rootRef = useRef<HTMLDivElement>(null);

  const flow = useMemo(() => visibleQuestions(answers), [answers]);
  const q = flow[Math.min(step, flow.length - 1)];
  const isLast = step >= flow.length - 1;

  const estimate = useMemo(() => (phase === 'results' ? computeEstimate(answers) : null), [phase, answers]);
  const drivers = useMemo(() => (phase === 'results' ? computeDrivers(answers) : []), [phase, answers]);
  const nextStep = useMemo(
    () => (phase === 'results' ? computeNextStep(answers, estimate, { call: callLink, brief: briefLink, compoundCall: compoundCallLink }) : null),
    [phase, answers, estimate, callLink, briefLink, compoundCallLink],
  );

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

  const bullets = [bullet1, bullet2, bullet3].filter(Boolean);
  const currentAnswer = q ? answers[q.id] : undefined;
  const answered = !q
    ? false
    : q.type === 'multi'
      ? q.optional || (Array.isArray(currentAnswer) && currentAnswer.length > 0)
      : typeof currentAnswer === 'string';

  function choose(optionId: string) {
    if (!q) return;
    setAnswers((prev) => {
      if (q.type === 'single') return { ...prev, [q.id]: optionId };
      const arr = Array.isArray(prev[q.id]) ? (prev[q.id] as string[]) : [];
      return { ...prev, [q.id]: arr.includes(optionId) ? arr.filter((x) => x !== optionId) : [...arr, optionId] };
    });
  }

  function next() {
    // branching can change the flow after this answer
    const updated = visibleQuestions(answers);
    if (step >= updated.length - 1) setPhase('results');
    else setStep(step + 1);
  }
  function back() {
    if (step > 0) setStep(step - 1);
    else setPhase('intro');
  }
  function changeAnswers() {
    setStep(Math.max(0, visibleQuestions(answers).length - 1));
    setPhase('questions');
  }
  function restart() {
    setAnswers({});
    setContact({ name: '', email: '', company: '', resources: false });
    setSubmit({ status: 'idle' });
    setStep(0);
    setPhase('intro');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!contact.name.trim() || !EMAIL_RE.test(contact.email)) {
      setSubmit({ status: 'error', message: 'Add your name and a valid email address.' });
      return;
    }
    setSubmit({ status: 'sending' });
    try {
      const res = await fetch(submitEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form: 'calculator',
          id: newId(),
          pageUrl: window.location.href,
          contact,
          estimate: estimate && (estimate.kind === 'range'
            ? { kind: 'range', low: estimate.low, high: estimate.high, type: answers.type }
            : { kind: 'recurring', monthly: estimate.monthly, label: estimate.label, type: answers.type }),
          drivers: drivers.map((d) => ({ label: d.label, choice: d.choice, low: d.low, high: d.high })),
          nextStep: nextStep && { kind: nextStep.kind, label: nextStep.label, package: nextStep.package?.name },
          answers: describeAnswers(answers),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error || 'Submit failed');
      setSubmit({ status: 'sent' });
    } catch {
      setSubmit({ status: 'error', message: 'Something went wrong. Please try again, or email hey@shrink.studio.' });
    }
  }

  const options = q && q.id === 'type' && !showWebApp ? q.options.filter((o) => o.id !== 'web-app') : q?.options ?? [];

  return (
    <>
      <style>{css}</style>
      <div className={`sk theme-${theme} frame-${frame}`} ref={rootRef}>
        {phase === 'intro' && (
          <div className="sk-step" key="intro">
            {eyebrow && <p className="sk-eyebrow">{eyebrow}</p>}
            <h3 className="sk-title">{introHeading}</h3>
            {introBody && <p className="sk-body">{introBody}</p>}
            {bullets.length > 0 && (
              <ul className="sk-points">
                {bullets.map((b, i) => (
                  <li className="sk-point" key={i}>{b}</li>
                ))}
              </ul>
            )}
            <div className="sk-actions">
              <button type="button" className="sk-btn" onClick={() => { setPhase('questions'); setStep(0); }}>
                {startLabel}
              </button>
            </div>
          </div>
        )}

        {phase === 'questions' && q && (
          <div className="sk-step" key={q.id}>
            <div className="sk-progress" aria-hidden="true">
              <div className="sk-dots">
                {flow.map((_, i) => (
                  <span key={i} className={'sk-dot' + (i < step ? ' is-done' : '') + (i === step ? ' is-active' : '')} />
                ))}
              </div>
              <span className="sk-count">{step + 1} / {flow.length}</span>
            </div>
            <p style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
              Question {step + 1} of {flow.length}
            </p>

            <h3 className="sk-title">{q.prompt}</h3>
            {q.helper && <p className="sk-body">{q.helper}</p>}

            <div className="sk-options" role={q.type === 'single' ? 'radiogroup' : 'group'} aria-label={q.prompt}>
              {options.map((opt) => {
                const selected = q.type === 'multi'
                  ? Array.isArray(currentAnswer) && currentAnswer.includes(opt.id)
                  : currentAnswer === opt.id;
                return (
                  <button
                    type="button"
                    key={opt.id}
                    role={q.type === 'single' ? 'radio' : 'checkbox'}
                    aria-checked={selected}
                    className={'sk-option' + (selected ? ' is-selected' : '') + (q.type === 'multi' ? ' sk-option--multi' : '')}
                    onClick={() => choose(opt.id)}
                  >
                    <span className="sk-option-mark" aria-hidden="true" />
                    <span className="sk-option-text">
                      <span>{opt.label}</span>
                      {opt.hint && <span className="sk-option-hint">{opt.hint}</span>}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="sk-actions sk-actions--between">
              <button type="button" className="sk-btn sk-btn--secondary" onClick={back}>{backLabel}</button>
              <button type="button" className="sk-btn" onClick={next} disabled={!answered}>
                {isLast ? 'See my range' : 'Next'}
              </button>
            </div>
          </div>
        )}

        {phase === 'results' && estimate && nextStep && (
          <div className="sk-step" key="results">
            <p className="sk-eyebrow">{estimate.kind === 'range' ? 'Your range' : 'Your retainer'}</p>
            {estimate.kind === 'range' ? (
              <>
                <h3 className="pc-figure">{fmtRange(estimate.low, estimate.high)}</h3>
                <p className="sk-body pc-figure-sub">
                  {estimate.note || 'For the build as you described it, before VAT. The scope is fixed first, then the price.'}
                </p>
              </>
            ) : (
              <>
                <h3 className="pc-figure">
                  {fmtGBP(estimate.monthly)} <span className="pc-figure-unit">a month</span>
                </h3>
                <p className="sk-body pc-figure-sub">{estimate.label}. {estimate.note}</p>
              </>
            )}

            {drivers.length > 0 && (
              <div className="sk-block">
                <p className="sk-label">What moved the figure</p>
                <ol className="sk-rows">
                  {drivers.map((d, i) => {
                    const zero = d.low === 0 && d.high === 0;
                    return (
                      <li className="sk-row pc-driver" key={d.id}>
                        <span className="pc-driver-main">
                          <span className="sk-row-marker" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                          <span className="pc-driver-text">
                            <span className="pc-driver-label">{d.label}: {d.choice}</span>
                            <span className="pc-driver-note">{d.note}</span>
                          </span>
                        </span>
                        <span className={'sk-row-value pc-driver-value' + (zero ? ' is-zero' : '')}>{driverValue(d)}</span>
                      </li>
                    );
                  })}
                </ol>
                {estimate.kind === 'range' && (
                  <details className="pc-details">
                    <summary>Where the money goes <span aria-hidden="true">&darr;</span></summary>
                    <ul className="sk-rows">
                      {estimate.lines.map((l) => (
                        <li className="sk-row" key={l.area}>
                          <span>{l.area}</span>
                          <span className="sk-row-value">{fmtRange(l.min, l.max)}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            )}

            <div className="sk-block">
              <p className="sk-label">The next step</p>
              <div className="sk-panel">
                <p className="pc-next-title">{nextStep.title}</p>
                <p className="sk-small">{nextStep.body}</p>
                <div className="sk-actions" style={{ marginTop: '1rem' }}>
                  <a className="sk-btn" href={nextStep.href}>{nextStep.label}</a>
                </div>
                {nextStep.package && (
                  <div className="pc-package">
                    <p className="pc-package-head">
                      <span className="pc-package-name">{nextStep.package.name}</span>
                      <span className="pc-package-price">{nextStep.package.price}</span>
                    </p>
                    <p className="sk-small">{nextStep.package.body}</p>
                    <p className="sk-small pc-package-link">
                      <a className="sk-link" href={nextStep.package.href}>
                        See the {nextStep.package.name} <span aria-hidden="true">&rarr;</span>
                      </a>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {submit.status === 'sent' ? (
              <div className="sk-block" role="status">
                <p className="sk-label">Keep this estimate</p>
                <p className="sk-small sk-success">Thanks. The estimate is on its way to your inbox.</p>
              </div>
            ) : (
              <form className="sk-block" onSubmit={handleSubmit} noValidate>
                <p className="sk-label">Keep this estimate</p>
                <p className="sk-small" style={{ marginBottom: '1rem' }}>We'll email you the range and the breakdown, so you can share it with your team.</p>
                <div className="sk-field-row">
                  <label className="sk-field">
                    <span className="sk-field-label">Name</span>
                    <input className="sk-input" autoComplete="name" value={contact.name} onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))} />
                  </label>
                  <label className="sk-field">
                    <span className="sk-field-label">Work email</span>
                    <input className="sk-input" type="email" autoComplete="email" inputMode="email" value={contact.email} onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))} />
                  </label>
                </div>
                <label className="sk-field">
                  <span className="sk-field-label">Company</span>
                  <input className="sk-input" autoComplete="organization" value={contact.company} onChange={(e) => setContact((c) => ({ ...c, company: e.target.value }))} />
                </label>
                {optInLabel && (
                  <label className="sk-check">
                    <input type="checkbox" checked={contact.resources} onChange={(e) => setContact((c) => ({ ...c, resources: e.target.checked }))} />
                    <span className="sk-check-box" aria-hidden="true" />
                    <span className="sk-check-text">{optInLabel}</span>
                  </label>
                )}
                {submit.status === 'error' && <p className="sk-error" role="alert">{submit.message}</p>}
                <div className="sk-actions" style={{ marginTop: 0 }}>
                  <button type="submit" className="sk-btn" disabled={submit.status === 'sending'}>
                    {submit.status === 'sending' ? 'Sending' : 'Email me the estimate'}
                  </button>
                </div>
              </form>
            )}

            <div className="sk-actions">
              <button type="button" className="sk-btn sk-btn--secondary" onClick={changeAnswers}>Change an answer</button>
              <button type="button" className="sk-btn sk-btn--secondary" onClick={restart}>{restartLabel}</button>
            </div>

            {disclaimer && <p className="sk-small" style={{ marginTop: 'var(--sk-gap-md)' }}>{disclaimer}</p>}
          </div>
        )}
      </div>
    </>
  );
}
