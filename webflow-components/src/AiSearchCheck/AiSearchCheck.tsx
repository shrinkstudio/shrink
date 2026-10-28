/**
 * AI Search Check: someone types their website, we read it the way AI tools do
 * (api/scan.ts) and show two scores, the three changes that would help most and
 * every check, free and on screen. Leaving an email gets the report, with what
 * ChatGPT, Claude and Perplexity say about them (api/forms.ts, form "scan").
 *
 * Mode "tool" is the whole check (/tools/ai-search-check; ?site= runs it straight
 * away). Mode "launcher" is just the field, for the home page CTA card: it opens
 * the tool page with the site filled in. Shadow-DOM component; styles are scoped
 * and read the site's MAST variables.
 */
import { useEffect, useRef, useState } from 'react';
import { css } from './styles';
import { CHECKS, GROUPS, isResult, normaliseSite, previewQuestions, shareUrl, type ScanResult } from './model';

export interface AiSearchCheckProps {
  /** "tool" runs the check here; "launcher" sends the site on to the tool page. */
  mode?: 'tool' | 'launcher';
  theme?: 'light' | 'dark';
  /** "none" sits inside the page's own Card; "card" draws the site Card itself. */
  frame?: 'none' | 'card';
  /** Optional intro above the field (the tool page carries its own heading). */
  eyebrow?: string;
  introHeading?: string;
  introBody?: string;
  fieldLabel?: string;
  placeholder?: string;
  buttonLabel?: string;
  note?: string;
  /** Show the "What we check" list under the field (tool mode). */
  showWhatWeCheck?: boolean;
  /** Where the launcher sends people. */
  toolLink?: string;
  callLink?: string;
  optInLabel?: string;
  scanEndpoint?: string;
  submitEndpoint?: string;
  disclaimer?: string;
}

type Phase = 'start' | 'checking' | 'results' | 'error';
type SubmitState = { status: 'idle' } | { status: 'sending' } | { status: 'sent' } | { status: 'error'; message: string };
type Props = Record<string, string | number | boolean | undefined>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOTAL = CHECKS.length;

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** PostHog when the site has it (consent is handled by the site's own set-up). */
function track(name: string, props: Props = {}) {
  const w = window as unknown as { posthog?: { capture?: (n: string, p?: Props) => void } };
  w.posthog?.capture?.(name, { tool: 'ai-search-check', ...props });
}

const reduceMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function AiSearchCheck({
  mode = 'tool',
  theme = 'light',
  frame = 'none',
  eyebrow = '',
  introHeading = '',
  introBody = '',
  fieldLabel = 'Your website',
  placeholder = 'yourcompany.com',
  buttonLabel = 'Check my site',
  note = 'Free, and your scores appear straight away.',
  showWhatWeCheck = true,
  toolLink = '/tools/ai-search-check',
  callLink = '/calls/intro',
  optInLabel = 'Send me guides and resources from Shrink',
  scanEndpoint = 'https://shrink-site-api.vercel.app/api/scan',
  submitEndpoint = 'https://shrink-site-api.vercel.app/api/forms',
  disclaimer = 'Your scores come from a quick look at your homepage and up to four key pages, so treat them as a helpful starting point. AI tools change often, and so do their answers.',
}: AiSearchCheckProps) {
  const [phase, setPhase] = useState<Phase>('start');
  const [site, setSite] = useState('');
  const [host, setHost] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [shown, setShown] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [contact, setContact] = useState({ name: '', email: '', competitor: '', resources: false });
  const [submit, setSubmit] = useState<SubmitState>({ status: 'idle' });
  const [leadId, setLeadId] = useState(newId);
  const [copied, setCopied] = useState(false);
  const [hp, setHp] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const shownAt = useRef(0);
  const run = useRef(0);

  // a shared link (?site=) runs the check straight away
  useEffect(() => {
    if (mode !== 'tool') return;
    const param = new URLSearchParams(window.location.search).get('site');
    const h = param ? normaliseSite(param) : '';
    if (!h) return;
    setSite(h);
    start(h, 'link');
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
  }, [phase]);

  function onSubmitSite(e: React.FormEvent) {
    e.preventDefault();
    const h = normaliseSite(site);
    if (!h) {
      setFieldError('Please enter a website address, such as yourcompany.com.');
      inputRef.current?.focus();
      return;
    }
    setFieldError('');
    if (mode === 'launcher') {
      track('ai_check_launched', { host: h });
      const url = new URL(toolLink, window.location.href);
      url.searchParams.set('site', h);
      window.location.assign(url.toString());
      return;
    }
    start(h, 'form');
  }

  async function start(h: string, from: 'form' | 'link') {
    const id = ++run.current;
    setHost(h);
    setResult(null);
    setError('');
    setShowAll(false);
    setSubmit({ status: 'idle' });
    setLeadId(newId());
    setShown(0);
    setPhase('checking');
    track('ai_check_started', { host: h, from });

    // the list ticks along while the scan runs, and catches up when it lands
    let done = false;
    let count = 0;
    const slow = reduceMotion() ? 0 : 420;
    const tick = () =>
      new Promise<void>((resolve) => {
        const step = () => {
          if (run.current !== id) return resolve();
          if (count >= TOTAL) return resolve();
          if (!done && count >= TOTAL - 2) return setTimeout(step, 200);
          count += 1;
          setShown(count);
          setTimeout(step, done ? (slow ? 70 : 0) : slow);
        };
        step();
      });
    const ticking = tick();

    let data: unknown = null;
    try {
      const res = await fetch(scanEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site: h }),
      });
      data = await res.json().catch(() => null);
    } catch {
      data = null;
    }
    done = true;
    if (run.current !== id) return;

    if (!isResult(data)) {
      const msg = (data as { message?: string } | null)?.message;
      setError(msg || 'Something went wrong on our side. Please try again in a moment.');
      setPhase('error');
      track('ai_check_failed', { host: h, error: (data as { error?: string } | null)?.error || 'network' });
      return;
    }
    await ticking;
    await new Promise((r) => setTimeout(r, slow ? 350 : 0));
    if (run.current !== id) return;
    setResult(data);
    setHost(data.host);
    setPhase('results');
    shownAt.current = Date.now();
    track('ai_check_completed', { host: data.host, site: data.score.site.got, agent: data.score.agent.got });
  }

  function again() {
    run.current += 1;
    setPhase('start');
    setResult(null);
    setError('');
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  const link = result && typeof window !== 'undefined' ? shareUrl(window.location.origin + window.location.pathname, result.host) : '';

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      track('ai_check_link_copied');
    } catch {
      setCopied(false);
    }
  }

  async function handleReport(e: React.FormEvent) {
    e.preventDefault();
    if (!result) return;
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
          form: 'scan',
          id: leadId,
          hp,
          elapsed: shownAt.current ? Date.now() - shownAt.current : undefined,
          pageUrl: window.location.href,
          site: result.host,
          contact,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error || 'Submit failed');
      setSubmit({ status: 'sent' });
      track('ai_check_email_requested', { host: result.host, competitor: !!contact.competitor.trim() });
    } catch {
      setSubmit({ status: 'error', message: 'Something went wrong on our side. Please try again, or email hey@shrink.studio.' });
    }
  }

  const siteForm = (
    <form onSubmit={onSubmitSite} noValidate>
      <label className="sk-field-label" htmlFor="ac-site" style={{ display: 'block' }}>
        {fieldLabel}
      </label>
      <div className="ac-form">
        <input
          id="ac-site"
          ref={inputRef}
          className="sk-input"
          type="text"
          inputMode="url"
          autoComplete="url"
          autoCapitalize="off"
          spellCheck={false}
          placeholder={placeholder}
          value={site}
          aria-invalid={fieldError ? true : undefined}
          aria-describedby={fieldError ? 'ac-site-error' : note ? 'ac-site-note' : undefined}
          onChange={(e) => setSite(e.target.value)}
        />
        <button type="submit" className="sk-btn">{buttonLabel}</button>
      </div>
      {fieldError ? (
        <p className="sk-small ac-note" id="ac-site-error" role="alert" style={{ color: 'var(--sk-error)' }}>{fieldError}</p>
      ) : (
        note && <p className="sk-small ac-note" id="ac-site-note">{note}</p>
      )}
    </form>
  );

  const passed = (group: 'site' | 'agent') => (result ? result.checks.filter((c) => c.group === group) : []);
  const questions = result ? previewQuestions(result.brand, contact.competitor) : [];

  return (
    <>
      {/* raw, so SSR does not entity-escape the CSS (that broke hydration: React #425/#422) */}
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className={`sk theme-${theme} frame-${frame}`} ref={rootRef}>
        {(phase === 'start' || mode === 'launcher') && (
          <div className="sk-step" key="start">
            {eyebrow && <p className="sk-eyebrow">{eyebrow}</p>}
            {introHeading && <h3 className="sk-title">{introHeading}</h3>}
            {introBody && <p className="sk-body" style={{ marginBottom: 'var(--sk-gap-md)' }}>{introBody}</p>}
            {siteForm}
            {mode === 'tool' && showWhatWeCheck && (
              <div className="ac-what">
                <p className="sk-label">What we check</p>
                <ol className="sk-rows">
                  {[
                    ['Site readiness', 'Twelve checks on whether AI tools can reach, read and understand your pages, from robots.txt and llms.txt to schema and page speed.', 'On screen'],
                    ['Agent readiness', 'Five checks on whether an AI agent could use your site for someone, such as finding your pricing or filling in your contact form.', 'On screen'],
                    ['What AI tools say about you', 'We ask ChatGPT, Claude and Perplexity three questions about your company, then email you exactly what each one said.', 'By email'],
                  ].map(([title, body, where], i) => (
                    <li className="sk-row ac-what-row" key={title}>
                      <span className="ac-fix-main">
                        <span className="sk-row-marker" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                        <span className="ac-what-text">
                          <span>{title}</span>
                          <span className="ac-fix-body">{body}</span>
                        </span>
                      </span>
                      <span className="ac-what-where">{where}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}

        {mode === 'tool' && phase === 'checking' && (
          <div className="sk-step" key="checking" aria-busy="true">
            <p className="sk-eyebrow">Checking {host}</p>
            <h3 className="sk-title sk-title--lg">Reading your site the way AI tools do</h3>
            <p className="sk-body">This usually takes about thirty seconds. Your scores will appear right here, so feel free to stay on the page.</p>
            <div className="ac-track" aria-hidden="true">
              <div className="ac-fill" style={{ width: `${(shown / TOTAL) * 100}%` }} />
            </div>
            <p className="sk-small ac-count" role="status">{shown} of {TOTAL} checks</p>
            {GROUPS.map((g) => (
              <div className="ac-group" key={g.id}>
                <p className="sk-label">{g.label}</p>
                <div>
                  {CHECKS.map((c, i) => ({ c, i }))
                    .filter(({ c }) => c.group === g.id)
                    .map(({ c, i }) => {
                      const state = i < shown ? 'done' : i === shown ? 'checking' : 'waiting';
                      return (
                        <div className={`ac-check is-${state}`} key={c.id}>
                          <span className={`ac-dot is-${state}`} aria-hidden="true" />
                          <span className="ac-check-label">{c.label}</span>
                          {state !== 'waiting' && <span className="ac-check-state">{state === 'done' ? 'Done' : 'Checking'}</span>}
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        )}

        {mode === 'tool' && phase === 'error' && (
          <div className="sk-step" key="error">
            <p className="sk-eyebrow">{host}</p>
            <h3 className="sk-title">We couldn't finish this one</h3>
            <p className="sk-body" role="alert">{error}</p>
            <div className="sk-actions">
              <button type="button" className="sk-btn" onClick={() => start(host, 'form')}>Try again</button>
              <button type="button" className="sk-btn sk-btn--secondary" onClick={again}>Check another site</button>
            </div>
          </div>
        )}

        {mode === 'tool' && phase === 'results' && result && (
          <div className="sk-step" key="results">
            <p className="sk-eyebrow">Results for {result.host}</p>
            <h3 className="sk-title sk-title--lg">{result.summary.headline}</h3>
            <p className="sk-body">{result.summary.body}</p>

            <div className="ac-scores">
              {GROUPS.map((g) => {
                const s = result.score[g.id];
                const list = passed(g.id);
                return (
                  <div className="ac-score" key={g.id}>
                    <p className="sk-label">{g.label}</p>
                    <p className="ac-score-num">{s.got} of {s.of}</p>
                    <div className="ac-seg" aria-hidden="true">
                      {list.map((c) => <span key={c.id} className={c.pass ? 'is-pass' : ''} />)}
                    </div>
                    <p className="sk-small">{g.blurb}</p>
                  </div>
                );
              })}
            </div>

            <div className="sk-block">
              <p className="sk-label">
                {result.top.length === 0 ? 'Every check passed' : result.top.length === 1 ? 'The change that would help most' : `${result.top.length === 2 ? 'Two' : 'Three'} changes that would help most`}
              </p>
              {result.top.length > 0 ? (
                <ol className="sk-rows">
                  {result.top.map((f, i) => (
                    <li className="sk-row ac-fix" key={f.id}>
                      <span className="ac-fix-main">
                        <span className="sk-row-marker" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                        <span className="ac-fix-text">
                          <span className="ac-fix-title">{f.title}</span>
                          <span className="ac-fix-body">{f.body}</span>
                        </span>
                      </span>
                      <span className="sk-row-value ac-fix-effort">{f.effort}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="sk-small">Lovely work. AI tools have everything they need to read your site, so what they say about you is the next thing to look at.</p>
              )}
              <p className="sk-small" style={{ marginTop: '1rem' }}>
                <button type="button" className="ac-textbtn" aria-expanded={showAll} onClick={() => setShowAll((v) => !v)}>
                  {showAll ? 'Hide the full list' : `See all ${TOTAL} checks`}
                </button>
              </p>
              {showAll && (
                <div className="ac-all">
                  {GROUPS.map((g) => (
                    <div className="ac-group" key={g.id}>
                      <p className="sk-label">{g.label}</p>
                      <ul className="sk-rows">
                        {passed(g.id).map((c) => (
                          <li className="sk-row ac-all-row" key={c.id}>
                            <span className="ac-fix-main">
                              <span className={`ac-mark${c.pass ? ' is-pass' : ''}`} aria-hidden="true">{c.pass ? '✓' : '○'}</span>
                              <span className="ac-all-text">
                                <span>{c.label}</span>
                                <span className="ac-all-detail">{c.detail}</span>
                              </span>
                            </span>
                            <span className="sk-row-value">{c.pass ? 'Looks good' : c.bonus ? 'Bonus' : 'To do'}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {submit.status === 'sent' ? (
              <div className="sk-block" role="status">
                <p className="sk-label">What AI tools say about you</p>
                <p className="sk-small sk-success">
                  Thank you. We're asking ChatGPT, Claude and Perplexity about {result.brand} now, and your report will be in your inbox in a few minutes. If you can't see it, it may be in your spam folder.
                </p>
              </div>
            ) : (
              <form className="sk-block" onSubmit={handleReport} noValidate>
                <p className="sk-label">What AI tools say about you</p>
                <p className="sk-small" style={{ marginBottom: '1rem' }}>
                  We'll ask ChatGPT, Claude and Perplexity three questions about {result.brand}, then email you exactly what each one said, along with your full report.
                </p>
                <ul className="ac-questions">
                  {questions.map((q) => (
                    <li className="ac-question" key={q}>
                      <span>&ldquo;{q}&rdquo;</span>
                      <span className="ac-question-where">By email</span>
                    </li>
                  ))}
                </ul>
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
                  <span className="sk-field-label">Your main competitor, if you have one in mind</span>
                  <input className="sk-input" autoComplete="off" value={contact.competitor} onChange={(e) => setContact((c) => ({ ...c, competitor: e.target.value }))} />
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
                    {submit.status === 'sending' ? 'Sending' : 'Email me my report'}
                  </button>
                </div>
              </form>
            )}

            <div className="sk-block">
              <div className="sk-panel">
                <p className="sk-label" style={{ marginBottom: '0.5rem' }}>If you'd like a hand</p>
                <p className="ac-next-title">Book a 30-minute call</p>
                <p className="sk-small">We'll go through your results together and show you what we'd change first. Most of these changes are quick, and we're happy to make them for you.</p>
                <div className="sk-actions" style={{ marginTop: '1rem' }}>
                  <a className="sk-btn" href={callLink}>Book a call</a>
                </div>
              </div>
            </div>

            {disclaimer && <p className="sk-small" style={{ marginTop: 'var(--sk-gap-main)' }}>{disclaimer}</p>}

            <div className="ac-tools">
              <button type="button" className="ac-textbtn" onClick={copyLink}>
                {copied ? 'Link copied, ready to share' : 'Copy a link to share your results'}
              </button>
              <button type="button" className="ac-textbtn" onClick={again}>Check another site</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
