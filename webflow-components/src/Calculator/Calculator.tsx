/**
 * Project Calculator: intro -> a short branching question flow -> an estimate
 * for the build, every line that makes it up, and the next step (a call or a
 * brief) with a package pointer where one fits. Web apps and very large sites
 * go straight to a call; retainers show their tier. A lead form posts the
 * estimate to the site's forms handler, and a share link reopens the answers.
 * Shadow-DOM component; styles are scoped and read the site's MAST variables.
 * Questions, pricing and copy live in model.ts.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { css } from './styles';
import {
  computeEstimate,
  computeNextStep,
  decodeAnswers,
  describeAnswers,
  fmtGBP,
  fmtRange,
  optionPrice,
  priceLevers,
  shareUrl,
  visibleQuestions,
  type Answers,
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
  /** Show what each option adds ("+£3,000", "Included") beside it. */
  showOptionPrices?: boolean;
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

type Props = Record<string, string | number | boolean | undefined>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** PostHog when the site has it (consent is handled by the site's own set-up). */
function track(name: string, props: Props = {}) {
  const w = window as unknown as { posthog?: { capture?: (n: string, p?: Props) => void } };
  w.posthog?.capture?.(name, { tool: 'calculator', ...props });
}

export function Calculator({
  theme = 'light',
  frame = 'none',
  eyebrow = 'Project calculator',
  introHeading = 'What would your site cost?',
  introBody = "Answer a few questions to see how much your site might cost.",
  bullet1 = 'About two minutes',
  bullet2 = 'See your price range straight away',
  bullet3 = 'Get the full breakdown by email',
  startLabel = 'Start the calculator',
  backLabel = 'Back',
  restartLabel = 'Start over',
  showWebApp = true,
  showOptionPrices = true,
  callLink = '/calls/intro',
  compoundCallLink = '/calls/compound',
  briefLink = '/contact?service=development',
  optInLabel = 'Send me guides and resources from Shrink',
  submitEndpoint = 'https://shrink-site-api.vercel.app/api/forms',
  disclaimer = 'An estimate from our standard price list, before VAT, to help you plan. Your final price comes in a fixed proposal once we have agreed the scope together.',
}: CalculatorProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [contact, setContact] = useState({ name: '', email: '', company: '', resources: false });
  const [submit, setSubmit] = useState<SubmitState>({ status: 'idle' });
  const [leadId, setLeadId] = useState(newId);
  const [copied, setCopied] = useState(false);
  const [hp, setHp] = useState('');
  // the breakdown and share link: by email, or on screen for anyone opening the emailed link
  const [unlocked, setUnlocked] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  // when the result appeared: a form sent within seconds of it is a bot
  const shownAt = useRef(0);

  // until a type is picked, count the website route so the first step reads 1 / 10, not 1 / 1
  const flow = useMemo(() => visibleQuestions(answers.type ? answers : { ...answers, type: 'new-site' }), [answers]);
  const q = flow[Math.min(step, flow.length - 1)];
  const isLast = step >= flow.length - 1;

  const estimate = useMemo(() => (phase === 'results' ? computeEstimate(answers) : null), [phase, answers]);
  const nextStep = useMemo(
    () => (phase === 'results' ? computeNextStep(answers, estimate, { call: callLink, brief: briefLink, compoundCall: compoundCallLink }) : null),
    [phase, answers, estimate, callLink, briefLink, compoundCallLink],
  );
  const link = useMemo(
    () => (phase === 'results' && typeof window !== 'undefined' ? shareUrl(window.location.origin + window.location.pathname, answers, leadId) : ''),
    [phase, answers, leadId],
  );

  // a shared link (?estimate=) opens straight on the results
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const data = params.get('estimate');
    const shared = data ? decodeAnswers(data) : null;
    if (!shared) return;
    setAnswers(shared);
    const ref = params.get('ref');
    if (ref) setLeadId(ref);
    setUnlocked(true);
    setPhase('results');
    shownAt.current = Date.now();
    track('calculator_reopened', { ref: ref || '' });
    // tell Shrink OS the lead came back to their estimate
    if (ref) {
      fetch(submitEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form: 'calculator-reopen', ref }),
      }).catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // gate seen, for the seen-to-email rate (once per visit to the results)
  const gateSeen = useRef(false);
  useEffect(() => {
    if (phase !== 'results') {
      gateSeen.current = false;
      return;
    }
    if (gateSeen.current || unlocked || !estimate || submit.status === 'sent') return;
    gateSeen.current = true;
    track('calculator_gate_seen', { kind: estimate.kind });
  }, [phase, estimate, unlocked, submit.status]);

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

  function showResults() {
    const est = computeEstimate(answers);
    setPhase('results');
    shownAt.current = Date.now();
    track('calculator_completed', {
      type: String(answers.type || ''),
      kind: est?.kind || '',
      low: est?.kind === 'range' ? est.low : est?.kind === 'recurring' ? est.monthly : 0,
      high: est?.kind === 'range' ? est.high : est?.kind === 'recurring' ? est.monthly : 0,
    });
  }
  function next() {
    // branching can change the flow after this answer
    const updated = visibleQuestions(answers);
    if (step >= updated.length - 1) showResults();
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
    setLeadId(newId());
    setUnlocked(false);
    setStep(0);
    setPhase('intro');
  }
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      track('calculator_link_copied');
    } catch {
      setCopied(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!contact.name.trim() || !EMAIL_RE.test(contact.email)) {
      setSubmit({ status: 'error', message: 'Please add your name and a valid email address.' });
      return;
    }
    setSubmit({ status: 'sending' });
    const est = estimate;
    try {
      const res = await fetch(submitEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form: 'calculator',
          id: leadId,
          hp,
          elapsed: shownAt.current ? Date.now() - shownAt.current : undefined,
          pageUrl: window.location.href,
          shareUrl: link,
          contact,
          estimate: !est
            ? null
            : est.kind === 'range'
              ? {
                  kind: 'range',
                  low: est.low,
                  high: est.high,
                  total: est.total,
                  sprint: est.sprint,
                  type: answers.type,
                  custom: est.custom,
                  timeline: est.timeline.label,
                  timelineNote: est.timeline.note,
                }
              : est.kind === 'recurring'
                ? { kind: 'recurring', monthly: est.monthly, label: est.label, type: answers.type }
                : { kind: 'call', reason: est.reason, from: est.from, type: answers.type },
          drivers: est?.kind === 'range' ? est.lines.map((l) => ({ label: l.label, choice: l.choice, note: l.note, low: l.amount, high: l.amount })) : [],
          levers: est?.kind === 'range' ? priceLevers(answers) : [],
          nextStep: nextStep && { kind: nextStep.kind, label: nextStep.label, package: nextStep.package?.name },
          answers: describeAnswers(answers),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error || 'Submit failed');
      setSubmit({ status: 'sent' });
      track('calculator_email_requested', { kind: est?.kind || '' });
    } catch {
      setSubmit({ status: 'error', message: 'Something went wrong on our side. Please try again, or email hey@shrink.studio.' });
    }
  }

  const options = q && q.id === 'type' && !showWebApp ? q.options.filter((o) => o.id !== 'web-app') : q?.options ?? [];

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
                onClick={() => { setPhase('questions'); setStep(0); track('calculator_started'); }}
              >
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
                    {showOptionPrices && optionPrice(q.id, opt.id, answers) && (
                      <span className="pc-option-price">{optionPrice(q.id, opt.id, answers)}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {q.other && Array.isArray(currentAnswer) && currentAnswer.includes(q.other.when) && (
              <label className="sk-field pc-other">
                <span className="sk-field-label">{q.other.label}</span>
                <input
                  className="sk-input"
                  placeholder={q.other.placeholder}
                  maxLength={200}
                  value={(answers[q.other.key] as string) || ''}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [q.other!.key]: e.target.value }))}
                />
              </label>
            )}

            <div className="sk-actions sk-actions--between">
              <button type="button" className="sk-btn sk-btn--secondary" onClick={back}>{backLabel}</button>
              <button type="button" className="sk-btn" onClick={next} disabled={!answered}>
                {isLast || answers.type === 'web-app' ? 'See my estimate' : 'Next'}
              </button>
            </div>
          </div>
        )}

        {phase === 'results' && estimate && nextStep && (
          <div className="sk-step" key="results">
            {estimate.kind === 'range' && (
              <>
                <p className="sk-eyebrow">Your estimate</p>
                <h3 className="pc-figure">{fmtRange(estimate.low, estimate.high)}</h3>
                <p className="sk-body pc-figure-sub">{estimate.note}</p>
                <div className="pc-timeline">
                  <p className="pc-timeline-head">
                    <span className="pc-timeline-label">Realistic timeline</span>
                    <span className="pc-timeline-value">{estimate.timeline.label}</span>
                  </p>
                  {estimate.timeline.note && <p className="sk-small">{estimate.timeline.note}</p>}
                </div>
              </>
            )}
            {estimate.kind === 'recurring' && (
              <>
                <p className="sk-eyebrow">Your retainer</p>
                <h3 className="pc-figure">
                  {fmtGBP(estimate.monthly)} <span className="pc-figure-unit">a month</span>
                </h3>
                <p className="sk-body pc-figure-sub">{estimate.label}. {estimate.note}</p>
              </>
            )}
            {estimate.kind === 'call' && (
              <>
                <p className="sk-eyebrow">{estimate.reason === 'web-app' ? 'Your product' : 'Your site'}</p>
                <h3 className="pc-figure">{estimate.from ? `From ${fmtGBP(estimate.from)}` : "Let's talk it through"}</h3>
                <p className="sk-body pc-figure-sub">{estimate.note}</p>
              </>
            )}

            {estimate.kind === 'range' && unlocked && (
              <div className="sk-block">
                <p className="sk-label">How it adds up</p>
                <ol className="sk-rows">
                  {estimate.lines.map((l, i) => (
                    <li className="sk-row pc-driver" key={l.id}>
                      <span className="pc-driver-main">
                        <span className="sk-row-marker" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                        <span className="pc-driver-text">
                          <span className="pc-driver-label">{l.label}: {l.choice}</span>
                          <span className="pc-driver-note">{l.note}</span>
                        </span>
                      </span>
                      <span className="sk-row-value pc-driver-value">{l.id === 'base' ? fmtGBP(l.amount) : `+${fmtGBP(l.amount)}`}</span>
                    </li>
                  ))}
                  {estimate.custom && (
                    <li className="sk-row pc-driver">
                      <span className="pc-driver-main">
                        <span className="sk-row-marker" aria-hidden="true">{String(estimate.lines.length + 1).padStart(2, '0')}</span>
                        <span className="pc-driver-text">
                          <span className="pc-driver-label">Custom features: complex forms, calculators or product demos</span>
                          <span className="pc-driver-note">Priced with you on a call, once we've heard what they need to do.</span>
                        </span>
                      </span>
                      <span className="sk-row-value pc-driver-value">On a call</span>
                    </li>
                  )}
                  <li className="sk-row pc-driver">
                    <span className="pc-driver-main">
                      <span className="sk-row-marker" aria-hidden="true" />
                      <span className="pc-driver-text">
                        <span className="pc-driver-label">Total</span>
                        <span className="pc-driver-note">Shown above as a range until we agree the scope.</span>
                      </span>
                    </span>
                    <span className="sk-row-value pc-driver-value">{fmtGBP(estimate.total)}</span>
                  </li>
                </ol>
                {estimate.sprint > 0 && (
                  <p className="sk-small" style={{ marginTop: '1rem' }}>
                    You said the brief is still open, so we'd suggest a Clarity Sprint first ({fmtGBP(estimate.sprint)}). It's priced
                    separately, and it means the build starts from a brief your whole team has agreed.
                  </p>
                )}
              </div>
            )}

            {!unlocked && (
              <>
            {submit.status === 'sent' ? (
              <div className="sk-block" role="status">
                <p className="sk-label">{estimate.kind === 'range' ? 'Your breakdown' : 'Keep this estimate'}</p>
                <p className="sk-small sk-success">Thank you. Your {estimate.kind === 'range' ? 'breakdown' : 'estimate'} is on its way to your inbox, and Ben will be in touch to talk through the next step. If you can't see it in a few minutes, it may be in your spam folder.</p>
              </div>
            ) : (
              <form className="sk-block" onSubmit={handleSubmit} noValidate>
                {estimate.kind === 'range' ? (
                  <>
                    <p className="pc-next-title">See how your {fmtRange(estimate.low, estimate.high)} breaks down</p>
                    <p className="sk-small" style={{ marginBottom: '1rem' }}>
                      Leave your details and we'll email you every line behind your estimate, what would bring the price down and a link to share it with your team.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="sk-label">Keep this estimate</p>
                    <p className="sk-small" style={{ marginBottom: '1rem' }}>
                      Leave your details and we'll email you this estimate, with a link to share it with your team.
                    </p>
                  </>
                )}
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
                {/* honeypot: hidden from people and screen readers, bots fill it */}
                <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
                  <label>
                    Website
                    <input tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} />
                  </label>
                </div>
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
                    {submit.status === 'sending' ? 'Sending' : estimate.kind === 'range' ? 'Email me the breakdown' : 'Email me the estimate'}
                  </button>
                </div>
              </form>
            )}
              </>
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

            {disclaimer && <p className="sk-small" style={{ marginTop: 'var(--sk-gap-main)' }}>{disclaimer}</p>}

            <div className="pc-tools">
              {unlocked && (
                <button type="button" className="pc-textbtn" onClick={copyLink}>
                  {copied ? 'Link copied, ready to share' : 'Copy a link to share this estimate'}
                </button>
              )}
              <button type="button" className="pc-textbtn" onClick={changeAnswers}>Change an answer</button>
              <button type="button" className="pc-textbtn" onClick={restart}>{restartLabel}</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
