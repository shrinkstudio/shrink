/**
 * Webflow form submissions to Airtable (Shrink OS).
 *
 * Webflow site webhook (trigger: form_submission) POSTs here. Routed by form name:
 * - Enquiry: upsert Company + Contact, create a Deal at Stage "Lead".
 * - Resource: upsert Contact, note which guide they took.
 * - Either form with the resources opt-in ticked: also upsert the Mailing list.
 *
 * The Readiness Quiz code component POSTs here directly (JSON, `form: "quiz"`, CORS):
 * upsert Contact (+ Company from a work email), score and answers into the Contact notes;
 * states "ready" and "close" also create a Deal at Stage "Lead" (Ben replies personally);
 * "not yet" leaves the Contact at Nurture with a Recheck date 90 days out.
 *
 * The Project Calculator code component POSTs `form: "calculator"` the same way: upsert
 * Contact (+ Company), and always a Deal at Stage "Lead" carrying the range, what moved
 * it and the answers (someone who leaves an email after seeing a price is a lead).
 *
 * The AI Search Check code component POSTs `form: "scan"` when someone asks for the
 * emailed report: we re-run the scan ourselves (api/scan.ts), upsert Contact + Company,
 * add a Scan request, then (after replying) ask ChatGPT, Claude and Perplexity three
 * questions about them and email the report. No Deal: that comes when they reply or book.
 *
 * Every new lead also pings Slack (see the slack section at the end).
 *
 * Env (Vercel): AIRTABLE_TOKEN, WEBFLOW_WEBHOOK_SECRET (optional, verifies the signature),
 * SLACK_LEADS_WEBHOOK (optional, Slack incoming webhook), ANTHROPIC_API_KEY, OPENAI_API_KEY,
 * PERPLEXITY_API_KEY (each optional: a missing key leaves that model out of the report),
 * OPENAI_MODEL / PERPLEXITY_MODEL (optional overrides), SCAN_ENDPOINT (optional).
 */

declare const process: { env: Record<string, string | undefined> };

/* ids */
const SITE_ID = '6a8daa3ae6b8009a3d00e586';
const BASE = 'appx76yahrfuTcbiD';
const T = {
  companies: 'tblutaeT4swsXdjrZ',
  contacts: 'tblXiE8Absty3l4HW',
  deals: 'tbl5TAoijwcEctsso',
  mailing: 'tblCy7RBJ1r86aWvo',
  scans: 'tbl6u4rEWZfje5INW',
};

/* Need chip → Deals.Service */
const SERVICES: [RegExp, string][] = [
  [/discovery/i, 'Discovery'],
  [/development/i, 'Development'],
  [/optimi[sz]ation/i, 'Optimisation retainer'],
];

/* quiz engagement id → Deals.Service */
const QUIZ_SERVICES: Record<string, string> = {
  'seed-website': 'Development',
  'clarity-sprint': 'Discovery',
  discovery: 'Discovery',
  audit: 'Optimisation retainer',
};

/* calculator project type → Deals.Service */
const CALCULATOR_SERVICES: Record<string, string> = {
  'new-site': 'Development',
  rebuild: 'Development',
  'web-app': 'Development',
  retainer: 'Optimisation retainer',
};

/* Deals currency field */
const DEAL_VALUE = 'Value (GBP)';

/* browsers allowed to post the quiz and calculator */
const ORIGIN_RE = /^https:\/\/((www\.)?shrink\.studio|[a-z0-9-]+\.webflow\.io)$/;

/* personal inboxes: no Company from these */
const FREE_MAIL = new Set([
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'hotmail.com',
  'hotmail.co.uk',
  'live.com',
  'live.co.uk',
  'msn.com',
  'yahoo.com',
  'yahoo.co.uk',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'proton.me',
  'protonmail.com',
  'gmx.com',
  'mail.com',
  'zoho.com',
  'yandex.com',
  'btinternet.com',
  'sky.com',
]);

/* Contacts.Next action, least to most urgent */
const URGENCY = ['No action', 'Nurture', 'Waiting on reply', 'Meeting booked', 'Needs follow-up'];
const rank = (v?: string) => URGENCY.indexOf(v ?? '');

/* signature max age */
const MAX_AGE_MS = 5 * 60 * 1000;

type Data = Record<string, string | undefined>;

type Submission = {
  name: string;
  siteId: string;
  data: Data;
  submittedAt?: string;
  id?: string;
  pageUrl?: string;
};

type AirtableRecord = { id: string; fields: Record<string, unknown> };

type QuizPayload = {
  form: 'quiz';
  id?: string;
  /** honeypot: a hidden field people never fill */
  hp?: string;
  /** ms from seeing the result to sending the form */
  elapsed?: number;
  pageUrl?: string;
  shareUrl?: string;
  contact?: { name?: string; email?: string; company?: string; resources?: boolean };
  result?: {
    state?: string;
    readiness?: number;
    urgency?: number;
    readinessNote?: string;
    urgencyNote?: string;
    headline?: string;
    diagnosis?: string;
    jtbdLabel?: string;
    jtbd?: string[];
    engagementId?: string;
    engagement?: string;
    engagementBlurb?: string;
    engagementPrice?: string;
    engagementHref?: string;
    engagementLink?: string;
    value?: number;
  };
  answers?: { question?: string; answer?: string }[];
};

type CalculatorPayload = {
  form: 'calculator';
  id?: string;
  /** honeypot: a hidden field people never fill */
  hp?: string;
  /** ms from seeing the result to sending the form */
  elapsed?: number;
  pageUrl?: string;
  contact?: { name?: string; email?: string; company?: string; resources?: boolean };
  shareUrl?: string;
  estimate?: {
    kind?: 'range' | 'recurring' | 'call';
    low?: number;
    high?: number;
    total?: number;
    sprint?: number;
    monthly?: number;
    label?: string;
    reason?: string;
    from?: number;
    type?: string;
    /** custom features: outside the figure, priced on a call */
    custom?: boolean;
    /** "About 10 to 12 weeks", and a note when their launch date is tighter */
    timeline?: string;
    timelineNote?: string;
  };
  drivers?: { label?: string; choice?: string; low?: number; high?: number }[];
  nextStep?: { kind?: string; label?: string; package?: string };
  answers?: { question?: string; answer?: string }[];
};

type ScanPayload = {
  form: 'scan';
  id?: string;
  /** honeypot: a hidden field people never fill */
  hp?: string;
  /** ms from seeing the result to sending the form */
  elapsed?: number;
  pageUrl?: string;
  site?: string;
  contact?: { name?: string; email?: string; competitor?: string; resources?: boolean };
};

export function OPTIONS(request: Request): Response {
  return new Response(null, { status: 204, headers: cors(request) });
}

export async function POST(request: Request): Promise<Response> {
  const raw = await request.text();

  // quiz: browser POST from the code component, guarded by origin (no Webflow signature)
  const quiz = parseQuiz(raw);
  if (quiz) {
    const headers = cors(request);
    if (!headers['Access-Control-Allow-Origin']) return json({ ok: false, error: 'origin' }, 403);
    if (tooMany(request)) return json({ ok: false, error: 'slow down' }, 429, headers);
    try {
      const out = await handleQuiz(quiz);
      return json(out, out.ok ? 200 : 400, headers);
    } catch (err) {
      console.error('forms error quiz', quiz.id, err);
      return json({ ok: false, error: 'airtable failed' }, 500, headers);
    }
  }

  // AI search check: the emailed report
  const scanReq = parseScan(raw);
  if (scanReq) {
    const headers = cors(request);
    if (!headers['Access-Control-Allow-Origin']) return json({ ok: false, error: 'origin' }, 403);
    if (tooMany(request)) return json({ ok: false, error: 'slow down' }, 429, headers);
    try {
      const out = await handleScan(scanReq, request);
      return json(out, out.ok ? 200 : 400, headers);
    } catch (err) {
      console.error('forms error scan', scanReq.id, err);
      return json({ ok: false, error: 'airtable failed' }, 500, headers);
    }
  }

  // calculator or quiz share link reopened: note it on their Deal
  const reopen = parseReopen(raw);
  if (reopen) {
    const headers = cors(request);
    if (!headers['Access-Control-Allow-Origin']) return json({ ok: false, error: 'origin' }, 403);
    if (tooMany(request)) return json({ ok: false, error: 'slow down' }, 429, headers);
    try {
      return json(await handleReopen(reopen), 200, headers);
    } catch (err) {
      console.error('forms error reopen', err);
      return json({ ok: false }, 500, headers);
    }
  }

  // calculator: same browser path as the quiz
  const calc = parseCalculator(raw);
  if (calc) {
    const headers = cors(request);
    if (!headers['Access-Control-Allow-Origin']) return json({ ok: false, error: 'origin' }, 403);
    if (tooMany(request)) return json({ ok: false, error: 'slow down' }, 429, headers);
    try {
      const out = await handleCalculator(calc);
      return json(out, out.ok ? 200 : 400, headers);
    } catch (err) {
      console.error('forms error calculator', calc.id, err);
      return json({ ok: false, error: 'airtable failed' }, 500, headers);
    }
  }

  if (!(await verify(request, raw))) return json({ ok: false, error: 'bad signature' }, 401);

  let submission: Submission;
  try {
    const body = JSON.parse(raw);
    submission = body.payload ?? body;
  } catch {
    return json({ ok: false, error: 'bad json' }, 400);
  }

  if (submission.siteId !== SITE_ID) return json({ ok: false, error: 'wrong site' }, 403);

  try {
    const form = (submission.name || '').toLowerCase();
    if (form === 'enquiry') return json(await handleEnquiry(submission));
    if (form === 'resource') return json(await handleResource(submission));
    return json({ ok: true, skipped: submission.name });
  } catch (err) {
    console.error('forms error', submission.name, submission.id, err);
    // 500 so Webflow retries
    return json({ ok: false, error: 'airtable failed' }, 500);
  }
}

/* ---------- handlers ---------- */

async function handleEnquiry(s: Submission) {
  const d = normalise(s.data);
  const email = d.email?.trim().toLowerCase();
  if (!email) return { ok: false, error: 'no email' };

  // Webflow retries: skip if this submission already made a deal
  if (s.id) {
    const dupe = await find(T.deals, `FIND("${esc(s.id)}", {Notes})`);
    if (dupe) return { ok: true, duplicate: dupe.id };
  }

  const website = cleanUrl(d.website);
  const companyName = website ? domainName(website) : '';
  const company = website ? await upsertCompany(companyName, website) : null;

  const contact = await upsertContact({
    name: d.name,
    email,
    company: company?.id,
    nextAction: 'Needs follow-up',
    note: `${date(s)} Website enquiry${d.resources ? ', opted in to resources' : ''}`,
  });

  const service = SERVICES.find(([re]) => re.test(d.need || ''))?.[1];

  const notes = [
    d.about || '(no message)',
    '',
    `Need: ${d.need || 'not given'}`,
    `Budget: ${d.budget || 'not given'}`,
    `Website: ${website || 'not given'}`,
    `Resources opt-in: ${d.resources ? 'yes' : 'no'}`,
    `Source: ${sourceLine(d) || 'not tagged'}`,
    `Contact: ${d.name || ''} <${email}>`,
    ...(s.pageUrl ? [`Page: ${s.pageUrl}`] : []),
    `Webflow submission ${s.id || ''}, ${s.submittedAt || ''}`,
  ].join('\n');

  const [deal] = await create(T.deals, [
    {
      Name: `${companyName || d.name || email}, website enquiry`,
      'Lead name': d.name || '',
      Stage: 'Lead',
      ...(service ? { Service: service } : {}),
      ...(company ? { Company: [company.id] } : {}),
      Notes: notes,
      'Next step': 'Reply to enquiry',
      'Next step date': today(),
    },
  ]);

  const mailing = d.resources
    ? await upsertMailing(s, { name: d.name, email, contact: contact.id, source: 'Enquiry' })
    : null;

  await notify(
    'New enquiry',
    [
      `${d.name || 'No name'} (${email})${website ? `, ${website}` : ''}`,
      `Need: ${d.need || 'not given'} · Budget: ${d.budget || 'not given'}`,
      d.about && `"${clip(d.about)}"`,
      s.pageUrl && `From ${s.pageUrl}`,
      sourceLine(d) && `Source: ${sourceLine(d)}`,
    ],
    recordUrl(T.deals, deal.id)
  );

  return {
    ok: true,
    deal: deal.id,
    contact: contact.id,
    company: company?.id,
    mailing: mailing?.id,
  };
}

async function handleResource(s: Submission) {
  const d = normalise(s.data);
  const email = d.email?.trim().toLowerCase();
  if (!email) return { ok: false, error: 'no email' };

  const guide = d.guide || 'a guide';

  // work email → Company, so the Sales agent can match downloads to funded leads
  const domain = email.split('@')[1] || '';
  const company =
    domain && !FREE_MAIL.has(domain) ? await upsertCompany(domain, `https://${domain}`) : null;

  const contact = await upsertContact({
    name: d.name,
    email,
    company: company?.id,
    nextAction: 'Nurture',
    note: `${date(s)} Took "${guide}"${d.resources ? ', opted in to resources' : ''}${sourceLine(d) ? `, via ${sourceLine(d)}` : ''}`,
  });

  const mailing = d.resources
    ? await upsertMailing(s, { name: d.name, email, contact: contact.id, source: 'Guide', guide })
    : null;

  await notify(
    'Guide download',
    [
      `${d.name || 'No name'} (${email})`,
      `Took "${guide}"${d.resources ? ', opted in to resources' : ''}`,
      sourceLine(d) && `Source: ${sourceLine(d)}`,
    ],
    recordUrl(T.contacts, contact.id)
  );

  return { ok: true, contact: contact.id, company: company?.id, mailing: mailing?.id };
}

async function handleQuiz(q: QuizPayload) {
  // bots: filled the hidden field, or sent the form faster than anyone can type. Say ok, store nothing
  if (q.hp) return { ok: true };
  if (typeof q.elapsed === 'number' && q.elapsed < 2500) return { ok: true };
  const c = q.contact || {};
  const email = c.email?.trim().toLowerCase() || '';
  const name = c.name?.trim().slice(0, 200) || '';
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { ok: false, error: 'name and email' };

  const r = q.result || {};
  const state = ['ready', 'close', 'not_yet'].includes(r.state || '') ? r.state! : 'not_yet';
  // ready and close get a Deal and a personal reply from Ben; not yet is Nurture with a 90-day recheck
  const ready = state === 'ready' || state === 'close';
  const engagement = r.engagement?.slice(0, 100) || 'not given';
  const id = q.id?.slice(0, 64);

  // browser retries: skip if this submission already landed
  if (id) {
    const dupe = await find(T.contacts, `FIND("Quiz ${esc(id)}", {Notes})`);
    if (dupe) return { ok: true, duplicate: dupe.id };
  }

  const domain = email.split('@')[1] || '';
  const companyName = c.company?.trim().slice(0, 200) || domain;
  const company =
    domain && !FREE_MAIL.has(domain) ? await upsertCompany(companyName, `https://${domain}`) : null;

  const answers = (q.answers || [])
    .slice(0, 20)
    .map((a) => `- ${a.question?.slice(0, 200) || '?'}: ${a.answer?.slice(0, 300) || '(skipped)'}`);

  const score = `readiness ${num(r.readiness)}/9, urgency ${num(r.urgency)}/6`;
  const summary = [
    `${today()} Readiness quiz: ${state.replace('_', ' ')}, ${score}, we'd start with ${engagement}${c.resources ? ', opted in to resources' : ''}`,
    ...answers,
    ...(c.company ? [`- Company given: ${c.company.slice(0, 200)}`] : []),
    `- Quiz ${id || ''}`,
  ].join('\n');

  const contact = await upsertContact({
    name,
    email,
    company: company?.id,
    nextAction: ready ? 'Needs follow-up' : 'Nurture',
    note: summary,
  });

  if (!ready) {
    const recheck = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    await patch(T.contacts, contact.id, { 'Recheck date': recheck }).catch((err) => console.error('recheck date', err));
  }

  const share = /^https:\/\/(www\.)?shrink\.studio\//.test(q.shareUrl || '') ? q.shareUrl!.slice(0, 1500) : '';
  let deal: AirtableRecord | undefined;
  let open: AirtableRecord | null = null;
  if (ready) {
    const service = QUIZ_SERVICES[r.engagementId || ''];
    const value = amt(r.value);
    const dealNotes = [
      `Readiness quiz: ${state.replace('_', ' ')}, ${score}`,
      `Where we'd start: ${engagement}${r.engagementPrice ? ` (${r.engagementPrice.slice(0, 40)})` : ''}`,
      ...(share ? [`Their result: ${share}`] : []),
      '',
      ...answers,
      '',
      `Contact: ${name} <${email}>`,
      ...(q.pageUrl ? [`Page: ${q.pageUrl.slice(0, 300)}`] : []),
      `Quiz ${id || ''}`,
    ].join('\n');
    const dealFields = {
      ...(service ? { Service: service } : {}),
      ...(value > 0 ? { [DEAL_VALUE]: value } : {}),
      'Next step': 'Reply to quiz lead',
      'Next step date': today(),
    };
    // repeat visitors: update their open quiz Deal instead of adding another
    open = await find(T.deals, `AND(FIND("<${esc(email)}>", {Notes}), FIND(", readiness quiz", {Name}), {Stage} = "Lead")`);
    deal = open
      ? await patch(T.deals, open.id, {
          ...dealFields,
          'Next step': 'Reply to quiz lead (took it again)',
          Notes: `${today()}: took the quiz again\n${dealNotes}\n\n---\n${String(open.fields.Notes || '')}`.slice(0, 90000),
        })
      : (
          await create(T.deals, [
            {
              Name: `${companyName}, readiness quiz`,
              'Lead name': name,
              Stage: 'Lead',
              ...(company ? { Company: [company.id] } : {}),
              ...dealFields,
              Notes: dealNotes,
            },
          ])
        )[0];
  }

  const mailing = c.resources
    ? await upsertMailing(
        { name: 'Quiz', siteId: SITE_ID, data: {}, pageUrl: q.pageUrl },
        { name, email, contact: contact.id, source: 'Quiz' }
      )
    : null;

  // everyone gets their result; only ready and close have a Deal to track it on
  const held = await holdEmail(open);
  // the old quiz component (before 28 Oct) sends no result copy, so there is nothing to email
  const emailed = !r.headline
    ? 'not sent: older quiz version'
    : held || (await sendResultsEmail(email, quizEmail(q), `quiz-${id || email}`, 'quiz', deal?.id || 'none'));
  if (deal) {
    await patch(T.deals, deal.id, {
      'Results email': emailed.startsWith('sent') ? 'Sent' : emailed.startsWith('held') ? 'Held' : 'Not sent',
      ...(emailed.startsWith('sent') ? { 'Results sent at': new Date().toISOString() } : {}),
      'Follow-up due': workingDaysFrom(3),
    }).catch((err) => console.error('results email fields', err));
  }

  await notify(
    `Readiness quiz: ${state.replace('_', ' ')}`,
    [
      `${name} (${email})${c.company ? `, ${c.company.slice(0, 120)}` : ''}`,
      `${score}, we'd start with ${engagement}`,
      `Results email: ${emailed}`,
      ready ? (open ? 'Deal updated (took it again), reply today' : 'Deal created, reply today') : 'Contact set to Nurture, recheck in 90 days',
    ],
    recordUrl(deal ? T.deals : T.contacts, deal?.id ?? contact.id)
  );

  return {
    ok: true,
    state,
    contact: contact.id,
    company: company?.id,
    deal: deal?.id,
    mailing: mailing?.id,
    emailed,
  };
}

async function handleCalculator(q: CalculatorPayload) {
  // bots: filled the hidden field, or sent the form faster than anyone can type. Say ok, store nothing
  if (q.hp) return { ok: true };
  if (typeof q.elapsed === 'number' && q.elapsed < 2500) return { ok: true };
  const c = q.contact || {};
  const email = c.email?.trim().toLowerCase() || '';
  const name = c.name?.trim().slice(0, 200) || '';
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { ok: false, error: 'name and email' };

  const e = q.estimate || {};
  const figure =
    e.kind === 'recurring'
      ? `${gbp(e.monthly)} a month (${e.label?.slice(0, 60) || 'retainer'})`
      : e.kind === 'call'
        ? e.reason === 'web-app'
          ? 'web app, no figure, call to scope'
          : `from ${gbp(e.from)}, call to scope`
        : `${gbp(e.low)} to ${gbp(e.high)}${amt(e.sprint) ? `, plus a Clarity Sprint ${gbp(e.sprint)}` : ''}${e.custom ? ', plus custom features (price on a call)' : ''}`;
  const timeline = e.kind === 'range' && e.timeline ? e.timeline.slice(0, 60) : '';
  // deal value: the middle of the range, or the three-month first term of a retainer
  const value =
    e.kind === 'recurring' ? amt(e.monthly) * 3 : e.kind === 'range' ? amt(e.total) || (amt(e.low) + amt(e.high)) / 2 : amt(e.from);
  const share = /^https:\/\/(www\.)?shrink\.studio\//.test(q.shareUrl || '') ? q.shareUrl!.slice(0, 1500) : '';
  const id = q.id?.slice(0, 64);

  // browser retries: skip if this submission already landed
  if (id) {
    const dupe = await find(T.contacts, `FIND("Calculator ${esc(id)}", {Notes})`);
    if (dupe) return { ok: true, duplicate: dupe.id };
  }

  const domain = email.split('@')[1] || '';
  const companyName = c.company?.trim().slice(0, 200) || domain;
  const company =
    domain && !FREE_MAIL.has(domain) ? await upsertCompany(companyName, `https://${domain}`) : null;

  const answers = (q.answers || [])
    .slice(0, 20)
    .map((a) => `- ${a.question?.slice(0, 200) || '?'}: ${a.answer?.slice(0, 300) || '(skipped)'}`);
  const drivers = (q.drivers || [])
    .slice(0, 12)
    .map((d) => `- ${d.label?.slice(0, 60) || '?'}: ${d.choice?.slice(0, 120) || ''} (${d.low === d.high ? gbp(d.low) : `+${gbp(d.low)} to ${gbp(d.high)}`})`);
  const next = q.nextStep?.label?.slice(0, 80) || 'not given';
  const pkg = q.nextStep?.package?.slice(0, 60);

  const contact = await upsertContact({
    name,
    email,
    company: company?.id,
    nextAction: 'Needs follow-up',
    note: [
      `${today()} Project calculator: ${figure}, next step ${next}${pkg ? ` (${pkg})` : ''}${c.resources ? ', opted in to resources' : ''}`,
      ...answers,
      ...(c.company ? [`- Company given: ${c.company.slice(0, 200)}`] : []),
      `- Calculator ${id || ''}`,
    ].join('\n'),
  });

  const service = CALCULATOR_SERVICES[e.type || ''];
  const dealNotes = [
    `Project calculator: ${figure}`,
    ...(timeline ? [`Timeline: ${timeline.toLowerCase()}${e.timelineNote ? ` (they asked for sooner)` : ''}`] : []),
    ...(share ? [`Their estimate: ${share}`] : []),
    `Next step: ${next}${pkg ? ` (${pkg})` : ''}`,
    '',
    'What makes up the figure:',
    ...drivers,
    '',
    ...answers,
    '',
    `Contact: ${name} <${email}>`,
    ...(q.pageUrl ? [`Page: ${q.pageUrl.slice(0, 300)}`] : []),
    `Calculator ${id || ''}`,
  ].join('\n');

  // repeat visitors: update their open calculator Deal instead of adding another
  const open = await find(
    T.deals,
    `AND(FIND("<${esc(email)}>", {Notes}), FIND(", project calculator", {Name}), {Stage} = "Lead")`
  );
  const dealFields = {
    ...(service ? { Service: service } : {}),
    ...(value > 0 ? { [DEAL_VALUE]: value } : {}),
    'Next step': open ? 'Reply to calculator lead (ran it again)' : 'Reply to calculator lead',
    'Next step date': today(),
  };
  const deal = open
    ? await patch(T.deals, open.id, {
        ...dealFields,
        Notes: `${today()}: ran the calculator again\n${dealNotes}\n\n---\n${String(open.fields.Notes || '')}`.slice(0, 90000),
      })
    : (
        await create(T.deals, [
          {
            Name: `${companyName}, project calculator`,
            'Lead name': name,
            Stage: 'Lead',
            ...(company ? { Company: [company.id] } : {}),
            ...dealFields,
            Notes: dealNotes,
          },
        ])
      )[0];

  const mailing = c.resources
    ? await upsertMailing(
        { name: 'Calculator', siteId: SITE_ID, data: {}, pageUrl: q.pageUrl },
        { name, email, contact: contact.id, source: 'Calculator' }
      )
    : null;

  const held = await holdEmail(open);
  const emailed =
    held || (await sendResultsEmail(email, calculatorEmail(q), `calculator-${id || email}`, 'calculator', deal.id));
  await patch(T.deals, deal.id, {
    'Results email': emailed.startsWith('sent') ? 'Sent' : emailed.startsWith('held') ? 'Held' : 'Not sent',
    ...(emailed.startsWith('sent') ? { 'Results sent at': new Date().toISOString() } : {}),
    'Follow-up due': workingDaysFrom(3),
  }).catch((err) => console.error('results email fields', err));

  await notify(
    `Project calculator: ${figure}`,
    [
      `${name} (${email})${c.company ? `, ${c.company.slice(0, 120)}` : ''}`,
      `Next step: ${next}${pkg ? ` (${pkg})` : ''}`,
      `Results email: ${emailed}`,
      open ? 'Deal updated (they ran it again), reply today' : 'Deal created, reply today',
    ],
    recordUrl(T.deals, deal.id)
  );

  return { ok: true, contact: contact.id, company: company?.id, deal: deal.id, mailing: mailing?.id, emailed, updated: !!open };
}

/* the scan result we use here (api/scan.ts returns more) */
type ScanResult = {
  ok: true;
  host: string;
  brand: string;
  description: string;
  score: { site: { got: number; of: number }; agent: { got: number; of: number } };
  summary: { headline: string; body: string };
  top: { title: string; body: string; effort: string }[];
  checks: { id: string; label: string; pass: boolean; detail: string; bonus?: boolean }[];
};

async function handleScan(q: ScanPayload, request: Request) {
  // bots: filled the hidden field, or sent the form faster than anyone can type. Say ok, store nothing
  if (q.hp) return { ok: true };
  if (typeof q.elapsed === 'number' && q.elapsed < 2500) return { ok: true };
  const c = q.contact || {};
  const email = c.email?.trim().toLowerCase() || '';
  const name = c.name?.trim().slice(0, 200) || '';
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { ok: false, error: 'name and email' };
  const cleaned = cleanUrl(q.site?.slice(0, 300));
  const host = cleaned ? domainName(cleaned) : '';
  if (!host || !host.includes('.')) return { ok: false, error: 'site' };
  const competitor = c.competitor?.trim().replace(/\s+/g, ' ').slice(0, 80) || '';
  const id = q.id?.slice(0, 64);

  // browser retries: skip if this request already landed
  if (id) {
    const dupe = await find(T.scans, `FIND("Scan ${esc(id)}", {Notes})`);
    if (dupe) return { ok: true, duplicate: dupe.id };
  }

  // our own scan, so the email never carries text the browser sent
  const result = await runScan(host, request);
  const site = result?.host || host;
  const core = result ? result.checks.filter((x) => !x.bonus) : [];
  const passed = core.filter((x) => x.pass).length;
  // few gaps: a light touch now and a fresh scan in a quarter; more gaps: Ben replies
  const fewGaps = !!result && passed / core.length >= 0.85;
  const scores = result
    ? `site readiness ${result.score.site.got}/${result.score.site.of}, agent readiness ${result.score.agent.got}/${result.score.agent.of}`
    : 'scan failed';
  const gaps = core.filter((x) => !x.pass).map((x) => `- ${x.label}: ${x.detail}`);

  const company = await upsertCompany(result?.brand || site, `https://${site}`);
  const contact = await upsertContact({
    name,
    email,
    company: company.id,
    nextAction: fewGaps ? 'Nurture' : 'Needs follow-up',
    note: `${today()} AI search check: ${site}, ${scores}${competitor ? `, competitor ${competitor}` : ''}${c.resources ? ', opted in to resources' : ''}`,
  });
  if (fewGaps) {
    const recheck = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    await patch(T.contacts, contact.id, { 'Recheck date': recheck }).catch((err) => console.error('recheck date', err));
  }

  const notes = [
    `${today()} ${scores}${result ? `: ${result.summary.headline}` : ''}`,
    ...(gaps.length ? ['', 'To improve:', ...gaps] : []),
    '',
    `Contact: ${name} <${email}>`,
    ...(q.pageUrl ? [`Page: ${q.pageUrl.slice(0, 300)}`] : []),
    `Scan ${id || ''}`,
  ].join('\n');
  const [rec] = await create(T.scans, [
    {
      Name: `${site}, AI search check`,
      'Work email': email,
      'Company website': `https://${site}`,
      ...(competitor ? { 'Main competitor': competitor } : {}),
      Status: 'Scanned',
      Company: [company.id],
      Contact: [contact.id],
      Notes: notes,
    },
  ]);

  const mailing = c.resources
    ? await upsertMailing(
        { name: 'AI search check', siteId: SITE_ID, data: {}, pageUrl: q.pageUrl },
        { name, email, contact: contact.id, source: 'AI search check' }
      )
    : null;

  // the slow part (nine AI answers, then the email) runs after we reply
  const job = finishScan({ rec, result, site, name, email, competitor, fewGaps, scores, id }).catch((err) =>
    console.error('scan report', site, err)
  );
  if (!defer(job)) await job;

  return { ok: true, scan: rec.id, contact: contact.id, company: company.id, mailing: mailing?.id };
}

async function finishScan(x: {
  rec: AirtableRecord;
  result: ScanResult | null;
  site: string;
  name: string;
  email: string;
  competitor: string;
  fewGaps: boolean;
  scores: string;
  id?: string;
}) {
  const asked = x.result ? await recognise(x.result, x.competitor) : [];
  const held = await holdScanEmail(x.email, x.rec.id);
  const emailed = !x.result
    ? 'not sent: the scan failed'
    : held || (await sendResultsEmail(x.email, scanEmail(x.result, asked, x.name, x.competitor), `scan-${x.id || x.email}`, 'ai-search-check', 'none'));

  const tally = MODELS.map((m) => {
    const got = asked.flatMap((a) => a.answers).filter((a) => a.model === m);
    const live = got.filter((a) => a.status !== 'Unavailable');
    return live.length ? `${m} ${live.filter((a) => a.status !== 'Not yet').length}/${live.length}` : '';
  }).filter(Boolean);
  const answerNotes = asked.flatMap((a) => [`Q: ${a.question}`, ...a.answers.map((r) => `- ${r.model}: ${r.status}${r.excerpt ? `, "${clip(r.excerpt, 160)}"` : ''}`)]);

  await patch(T.scans, x.rec.id, {
    ...(emailed.startsWith('sent') ? { Status: 'Sent' } : {}),
    Notes: `${String(x.rec.fields.Notes || '')}\n\nAI answers${tally.length ? ` (${tally.join(', ')})` : ': no model keys set'}\n${answerNotes.join('\n')}\n\nReport email: ${emailed}`.slice(0, 90000),
  }).catch((err) => console.error('scan notes', err));

  await notify(
    `AI search check: ${x.site}`,
    [
      `${x.name} (${x.email})${x.competitor ? `, competitor ${x.competitor}` : ''}`,
      `${x.scores}${x.result ? `: ${x.result.summary.headline}` : ''}`,
      tally.length ? `Mentioned by AI tools: ${tally.join(', ')}` : 'AI answers: no model keys set',
      `Report email: ${emailed}`,
      x.fewGaps ? 'Contact set to Nurture, recheck in 90 days' : 'Reply within a working day',
    ],
    recordUrl(T.scans, x.rec.id)
  );
}

/** api/scan.ts, called server to server. Null when it can't scan the site. */
async function runScan(host: string, request: Request): Promise<ScanResult | null> {
  const url = process.env.SCAN_ENDPOINT || new URL('/api/scan', request.url).toString();
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ site: host }),
      signal: AbortSignal.timeout(40000),
    });
    const data = (await res.json().catch(() => null)) as ScanResult | null;
    return res.ok && data?.ok ? data : null;
  } catch (err) {
    console.error('scan fetch', host, err);
    return null;
  }
}

/** Keeps a job running after the response (Vercel's waitUntil). False when there's no request context, eg. locally. */
function defer(job: Promise<unknown>): boolean {
  const ctx = (globalThis as Record<symbol, { get?: () => { waitUntil?: (p: Promise<unknown>) => void } } | undefined>)[
    Symbol.for('@vercel/request-context')
  ]?.get?.();
  if (!ctx?.waitUntil) return false;
  ctx.waitUntil(job);
  return true;
}

/** Someone opened a calculator or quiz share link that carries a lead id ("Calculator <id>" or "Quiz <id>"). */
async function handleReopen(ref: string) {
  const deal = await find(T.deals, `FIND("${esc(ref)}", {Notes})`);
  if (!deal) return { ok: true };
  const last = Date.parse(String(deal.fields['Reopened at'] || ''));
  await patch(T.deals, deal.id, { 'Reopened at': new Date().toISOString() });
  // one ping an hour is plenty
  if (!last || Date.now() - last > 60 * 60 * 1000) {
    await notify(
      ref.startsWith('Quiz') ? 'Result reopened' : 'Estimate reopened',
      [`${String(deal.fields['Lead name'] || deal.fields.Name || 'A lead')} opened their ${ref.startsWith('Quiz') ? 'quiz result' : 'calculator estimate'} again`],
      recordUrl(T.deals, deal.id)
    );
  }
  return { ok: true };
}

/* utm_* hidden inputs (track.ts) → "linkedin / ben-post / aeo-adfin" */
function sourceLine(d: Data) {
  const parts = ['utm_source', 'utm_medium', 'utm_content']
    .map((k) => d[k]?.slice(0, 80))
    .filter(Boolean);
  if (!parts.length) return '';
  return `${parts.join(' / ')}${d.utm_campaign ? ` (campaign ${d.utm_campaign.slice(0, 80)})` : ''}`;
}

/* ---------- airtable ---------- */

async function upsertCompany(name: string, website: string) {
  const domain = domainName(website);
  // match on a host boundary so box.com doesn't match dropbox.com
  const d = esc(domain);
  const existing = await find(
    T.companies,
    `OR(FIND("//${d}", LOWER({Website})), FIND(".${d}", LOWER({Website})))`
  );
  if (existing) return existing;
  const [rec] = await create(T.companies, [{ Name: name, Website: website, Source: 'Inbound' }]);
  return rec;
}

async function upsertContact(c: {
  name?: string;
  email: string;
  company?: string;
  nextAction: string;
  note: string;
}) {
  const existing = await find(T.contacts, `LOWER({Email}) = "${esc(c.email)}"`);

  if (existing) {
    const prev = (existing.fields.Notes as string) || '';
    const fields: Record<string, unknown> = {
      Notes: prev ? `${prev}\n${c.note}` : c.note,
    };
    // only ever raise urgency: a guide download mustn't bury a live enquiry
    const current = existing.fields['Next action'] as string | undefined;
    if (rank(c.nextAction) > rank(current)) fields['Next action'] = c.nextAction;
    const companies = (existing.fields.Company as string[]) || [];
    if (c.company && !companies.includes(c.company)) fields.Company = [...companies, c.company];
    await airtable(`${T.contacts}/${existing.id}`, 'PATCH', { fields, typecast: false });
    return existing;
  }

  const [rec] = await create(T.contacts, [
    {
      Name: c.name || c.email,
      Email: c.email,
      'Next action': c.nextAction,
      Notes: c.note,
      ...(c.company ? { Company: [c.company] } : {}),
    },
  ]);
  return rec;
}

/** One record per email. Keeps the first opt-in as the consent record; a fresh opt-in re-subscribes. */
async function upsertMailing(
  s: Submission,
  m: {
    name?: string;
    email: string;
    contact: string;
    source: 'Enquiry' | 'Guide' | 'Quiz' | 'Calculator' | 'AI search check';
    guide?: string;
  }
) {
  const guideLine = m.guide ? `${date(s)} ${m.guide}` : '';
  const existing = await find(T.mailing, `LOWER({Email}) = "${esc(m.email)}"`);

  if (existing) {
    const f = existing.fields;
    const sources = (f.Source as string[]) || [];
    const contacts = (f.Contact as string[]) || [];
    const guides = (f['Guides taken'] as string) || '';
    const fields: Record<string, unknown> = {
      Source: sources.includes(m.source) ? sources : [...sources, m.source],
      Contact: contacts.includes(m.contact) ? contacts : [...contacts, m.contact],
    };
    if (guideLine) fields['Guides taken'] = guides ? `${guides}\n${guideLine}` : guideLine;
    if (f.Status !== 'Subscribed') {
      fields.Status = 'Subscribed';
      fields['Synced to provider'] = false;
    }
    if (!f.Name && m.name) fields.Name = m.name;
    // typecast adds a new Source choice (eg. Quiz) on first use
    await airtable(`${T.mailing}/${existing.id}`, 'PATCH', { fields, typecast: true });
    return existing;
  }

  const [rec] = await create(
    T.mailing,
    [
      {
        Email: m.email,
        Name: m.name || '',
        Status: 'Subscribed',
        Source: [m.source],
        Contact: [m.contact],
        'Opted in': s.submittedAt || new Date().toISOString(),
        ...(s.pageUrl ? { 'Consent page': s.pageUrl } : {}),
        ...(guideLine ? { 'Guides taken': guideLine } : {}),
      },
    ],
    true
  );
  return rec;
}

async function find(table: string, formula: string): Promise<AirtableRecord | null> {
  const qs = new URLSearchParams({ filterByFormula: formula, maxRecords: '1' });
  const res = await airtable(`${table}?${qs}`, 'GET');
  return res.records?.[0] ?? null;
}

async function create(
  table: string,
  rows: Record<string, unknown>[],
  typecast = false
): Promise<AirtableRecord[]> {
  const res = await airtable(table, 'POST', {
    records: rows.map((fields) => ({ fields })),
    typecast,
  });
  return res.records;
}

async function patch(table: string, id: string, fields: Record<string, unknown>): Promise<AirtableRecord> {
  return airtable(`${table}/${id}`, 'PATCH', { fields, typecast: false });
}

async function airtable(path: string, method: string, body?: unknown) {
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) throw new Error('AIRTABLE_TOKEN not set');
  const res = await fetch(`https://api.airtable.com/v0/${BASE}/${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Airtable ${res.status}: ${await res.text()}`);
  return res.json();
}

/* ---------- helpers ---------- */

/** Webflow signs `${timestamp}:${body}` with HMAC-SHA256. Skipped when no secret is set. */
async function verify(request: Request, raw: string) {
  const secret = process.env.WEBFLOW_WEBHOOK_SECRET;
  if (!secret) return true;
  const ts = request.headers.get('x-webflow-timestamp');
  const sig = request.headers.get('x-webflow-signature');
  if (!ts || !sig) return false;
  if (Math.abs(Date.now() - Number(ts)) > MAX_AGE_MS) return false;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(`${ts}:${raw}`));
  const hex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return timingSafeEqual(hex, sig);
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Field names → lowercase keys; checkbox "Yes"/"true"/"on" → "yes". */
function normalise(data: Data = {}) {
  const out: Data = {};
  for (const [k, v] of Object.entries(data))
    out[k.toLowerCase()] = v?.toString().trim() || undefined;
  const opt = (out.resources || '').toLowerCase();
  out.resources = ['yes', 'true', 'on'].includes(opt) ? 'yes' : undefined;
  return out;
}

function cleanUrl(v?: string) {
  if (!v) return '';
  const url = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try {
    const { hostname, origin } = new URL(url);
    // "test", "n/a" etc. aren't domains: no Company for those
    return /^[^.]+(\.[^.]+)+$/.test(hostname) ? origin : '';
  } catch {
    return '';
  }
}

function domainName(url: string) {
  return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
}

function esc(v: string) {
  return v.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function date(s: Submission) {
  return (s.submittedAt || new Date().toISOString()).slice(0, 10);
}

function cors(request: Request): Record<string, string> {
  const origin = request.headers.get('origin') || '';
  if (!ORIGIN_RE.test(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function parseReopen(raw: string): string | null {
  try {
    const body = JSON.parse(raw);
    const tool = body?.form === 'calculator-reopen' ? 'Calculator' : body?.form === 'quiz-reopen' ? 'Quiz' : '';
    const ref = tool ? String(body.ref || '') : '';
    return /^[\w-]{6,64}$/.test(ref) ? `${tool} ${ref}` : null;
  } catch {
    return null;
  }
}

function parseCalculator(raw: string): CalculatorPayload | null {
  try {
    const body = JSON.parse(raw);
    return body?.form === 'calculator' ? body : null;
  } catch {
    return null;
  }
}

function gbp(v: unknown) {
  return typeof v === 'number' && Number.isFinite(v) ? '£' + Math.round(v).toLocaleString('en-GB') : '£?';
}

function parseScan(raw: string): ScanPayload | null {
  try {
    const body = JSON.parse(raw);
    return body?.form === 'scan' ? body : null;
  } catch {
    return null;
  }
}

function parseQuiz(raw: string): QuizPayload | null {
  try {
    const body = JSON.parse(raw);
    return body?.form === 'quiz' ? body : null;
  } catch {
    return null;
  }
}

function num(v: unknown) {
  return typeof v === 'number' && Number.isFinite(v) ? v : '?';
}

function amt(v: unknown) {
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.min(v, 1e6) : 0;
}

function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

/* ---------- abuse guards ---------- */
// The results email goes to whatever address is typed in, so a few cheap limits
// keep hey@shrink.studio from being used to mail strangers:
// 1. per IP: at most 5 tool submissions in 10 minutes (per warm function instance)
// 2. per address: one results email in 24 hours (their open Deal's Results sent at)
// 3. per day: RESULTS_EMAIL_DAILY_CAP results emails across the site (default 40)
// The lead is always saved; only the email is held, and Slack says why.

const recent = new Map<string, number[]>();

function tooMany(request: Request) {
  const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
  const now = Date.now();
  const hits = (recent.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  hits.push(now);
  recent.set(ip, hits);
  if (recent.size > 5000) recent.clear();
  return hits.length > 5;
}

async function count(table: string, formula: string): Promise<number> {
  const qs = new URLSearchParams({ filterByFormula: formula, pageSize: '100' });
  qs.append('fields[]', 'Name');
  const res = await airtable(`${table}?${qs}`, 'GET');
  return res.records?.length ?? 0;
}

/** A reason to hold the results email, or '' to send it. `open` is their existing Deal, if any. */
async function holdEmail(open: AirtableRecord | null): Promise<string> {
  try {
    const last = Date.parse(String(open?.fields['Results sent at'] || ''));
    if (last && Date.now() - last < 24 * 60 * 60 * 1000) return 'held: this address already had one today';
    const cap = Number(process.env.RESULTS_EMAIL_DAILY_CAP) || 40;
    const today = await count(T.deals, `IS_SAME({Results sent at}, TODAY(), 'day')`);
    if (today >= cap) return `held: daily cap of ${cap} reached`;
    return '';
  } catch (err) {
    console.error('email guard', err);
    return 'held: guard check failed';
  }
}

/** Like holdEmail, for AI search reports: one per address a day, and the same daily cap. */
async function holdScanEmail(email: string, self: string): Promise<string> {
  try {
    const sameAddress = await count(
      T.scans,
      `AND(LOWER({Work email}) = "${esc(email)}", {Status} = "Sent", IS_AFTER(LAST_MODIFIED_TIME(), DATEADD(NOW(), -1, 'days')), RECORD_ID() != "${esc(self)}")`
    );
    if (sameAddress) return 'held: this address already had one today';
    const cap = Number(process.env.RESULTS_EMAIL_DAILY_CAP) || 40;
    const today = await count(T.scans, `AND({Status} = "Sent", IS_SAME(LAST_MODIFIED_TIME(), TODAY(), 'day'))`);
    if (today >= cap) return `held: daily cap of ${cap} reached`;
    return '';
  } catch (err) {
    console.error('scan email guard', err);
    return 'held: guard check failed';
  }
}

/** YYYY-MM-DD, n working days from today (Monday to Friday). */
function workingDaysFrom(n: number) {
  const d = new Date();
  while (n > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    const day = d.getUTCDay();
    if (day !== 0 && day !== 6) n -= 1;
  }
  return d.toISOString().slice(0, 10);
}

/* ---------- results email ---------- */
// The one automatic email: what the visitor asked for. Everything after it is a
// personal email from Ben. Built from the Figma template (Shrink Studio: Master,
// Playground > Updates, "Email: calculator results"). Sent with Resend from
// hey@shrink.studio. RESULTS_EMAIL: "on" sends to everyone, "test" only to the
// addresses in RESULTS_EMAIL_TEST (comma separated), anything else is off.
// Never throws: the lead is already in Airtable.

const SITE = 'https://www.shrink.studio';
const ASSETS = 'https://cdn.jsdelivr.net/gh/shrinkstudio/shrink@master/email';
const FONT = "'Helvetica Now Display','Helvetica Neue',Helvetica,Arial,sans-serif";
const C = {
  ink: '#111111',
  muted: '#50565f',
  grey: '#666666',
  light: '#aaaaaa',
  smoke: '#f4f4f5',
  white: '#ffffff',
  line: '#e8e8e9',
  accent: '#4469fc',
};

type RowIn = { label?: string; choice?: string; low?: number; high?: number };

function h(v: unknown) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function withUtm(url: string, campaign: string) {
  const u = new URL(url, SITE);
  u.searchParams.set('utm_source', 'results-email');
  u.searchParams.set('utm_medium', 'email');
  u.searchParams.set('utm_campaign', campaign);
  return u.toString();
}

type CalculatorEmail = { subject: string; html: string; text: string };

/* text style + spacer helpers for the email tables */
const t = (size: number, weight: number, color: string, lh = 1.5, extra = '') =>
  `font-family:${FONT};font-size:${size}px;line-height:${lh};font-weight:${weight};color:${color};margin:0;${extra}`;
const gap = (px: number) => `<tr><td style="height:${px}px;line-height:${px}px;font-size:0">&nbsp;</td></tr>`;

/* one priced or scored line: muted label, what it is, the figure on the right */
const lineRow = (label: string, choice: string, figure: string, last = false) => `<tr>
  <td class="sk-lbl" style="border-top:1px solid ${C.line};padding:12px 16px ${last ? 0 : 12}px 0;width:150px;vertical-align:top;${last ? t(16, 600, C.ink) : t(14, 400, C.muted)}">${h(label)}</td>
  <td style="border-top:1px solid ${C.line};padding:12px 16px ${last ? 0 : 12}px 0;vertical-align:top;${t(14, 500, C.ink)}">${h(choice)}</td>
  <td style="border-top:1px solid ${C.line};padding:12px 0 ${last ? 0 : 12}px;vertical-align:top;text-align:right;white-space:nowrap;${t(16, 600, C.ink)}">${h(figure)}</td>
</tr>`;

type EmailParts = {
  subject: string;
  preheader: string;
  tag: string;
  top: string;
  figure: string;
  /** already escaped where it carries user input */
  body: string;
  /** the middle of the email: rows and notes, already built */
  sectionHtml: string;
  sectionText: string[];
  nextLine: string;
  note: string;
  button: string;
  cta: string;
  share: string;
  /** the reopen link and the line under it, when the default answers wording doesn't fit */
  shareLabel?: string;
  shareNote?: string;
  /** "estimate" or "result", used in the reopen line and the footer */
  thing: string;
  campaign: string;
};

/** The results email shell, from the Figma template (Playground > Updates). */
function renderEmail(p: EmailParts): CalculatorEmail {
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/London' });
  const html = `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>${h(p.subject)}</title>
<style>@media (max-width:520px){.sk-outer{padding:16px 8px !important}.sk-pad{padding:24px !important}.sk-h{font-size:26px !important}.sk-h5{font-size:20px !important}.sk-body{font-size:16px !important}.sk-lbl{width:96px !important;padding-right:12px !important}.sk-stack{display:block !important;width:100% !important;text-align:left !important}.sk-photo{padding-top:16px !important}.sk-cta{margin-top:24px !important}}</style>
</head>
<body style="margin:0;padding:0;background:${C.smoke}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${h(p.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.smoke}">
<tr><td class="sk-outer" align="center" style="padding:40px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${C.white};border-radius:12px">
<tr><td class="sk-pad" style="padding:40px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td><a href="${withUtm(SITE + '/', p.campaign)}" style="display:inline-block"><img src="${ASSETS}/mascot-pill-3x.png" width="75" height="38" alt="Shrink" style="display:block;border:0"></a></td>
    <td align="right"><span style="display:inline-block;background:${C.smoke};border-radius:4px;padding:4px 8px;${t(14, 500, C.ink)}">${h(p.tag)}</span></td>
  </tr></table>
</td></tr>
${gap(48)}
<tr><td>
  <p class="sk-h" style="${t(32, 500, C.muted, 1.3, 'letter-spacing:-0.3px')}">${h(p.top)}</p>
  <p class="sk-h" style="${t(32, 500, C.ink, 1.3, 'letter-spacing:-0.3px')}">${h(p.figure)}</p>
  <p class="sk-body" style="${t(18, 500, C.muted, 1.5, 'margin-top:24px')}">${p.body}</p>
</td></tr>
${p.sectionHtml}
${gap(48)}
<tr><td>
  <p class="sk-h5" style="${t(24, 500, C.muted, 1.3, 'letter-spacing:-0.2px')}">What happens next</p>
  <p class="sk-h5" style="${t(24, 500, C.ink, 1.3, 'letter-spacing:-0.2px')}">${h(p.nextLine)}</p>
  <p class="sk-body" style="${t(18, 500, C.muted, 1.5, 'margin-top:24px')}">${h(p.note)}</p>
</td></tr>
${gap(24)}
<tr><td style="background:${C.smoke};border-radius:4px;padding:16px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td class="sk-stack" style="vertical-align:top">
      <p style="${t(18, 500, C.ink, 1.3)}">Ben Hammond</p>
      <p style="${t(18, 500, C.light, 1.3)}">Founder</p>
      <p class="sk-cta" style="margin:48px 0 0"><a href="${p.cta}" style="display:inline-block;background:${C.ink};border-radius:4px;padding:10px 16px;text-decoration:none;${t(14, 500, C.white)}">${h(p.button)}</a></p>
    </td>
    <td class="sk-stack sk-photo" width="100" style="vertical-align:bottom;text-align:right"><img src="${ASSETS}/ben-2x.jpg" width="100" height="100" alt="Ben Hammond" style="display:block;border:0;border-radius:2px"></td>
  </tr></table>
</td></tr>
${
  p.share
    ? `${gap(24)}
<tr><td>
  <p style="${t(14, 500, C.ink)}"><a href="${h(p.share)}" style="color:${C.ink};text-decoration:underline">${h(p.shareLabel || `Reopen your ${p.thing} to change any of your answers`)} &rarr;</a></p>
  <p style="${t(14, 500, C.grey, 1.5, 'margin-top:12px')}">${h(p.shareNote || `To share this with your team, just forward this email. The link above opens your answers, so they'll see the same ${p.thing}.`)}</p>
</td></tr>`
    : ''
}
${gap(48)}
<tr><td style="border-top:1px solid ${C.line};padding-top:16px">
  <p style="${t(14, 500, C.grey)}">You asked for this ${p.thing} on shrink.studio on ${date}. We'll only send you guides and updates if you ticked the box to get them.</p>
  <p style="${t(14, 500, C.grey, 1.5, 'margin-top:12px')}">&copy; ${new Date().getFullYear()} Shrink Studio Limited (14735788) &middot; Waverley House, 9 Noel St, London</p>
</td></tr>
</table>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const text = [
    p.top,
    p.figure,
    '',
    p.body.replace(/&[a-z#0-9]+;/g, ''),
    ...p.sectionText,
    '',
    `What happens next: ${p.nextLine}`,
    p.note,
    `${p.button}: ${p.cta}`,
    ...(p.share ? ['', `${p.shareLabel || `Reopen your ${p.thing}`}: ${p.share}`] : []),
    '',
    'Ben Hammond, Founder, Shrink Studio',
    `You asked for this ${p.thing} on shrink.studio on ${date}.`,
  ].join('\n');

  return { subject: p.subject, html, text };
}

const shareLink = (url: string | undefined, campaign: string) =>
  url && /^https:\/\/(www\.)?shrink\.studio\//.test(url) ? withUtm(url, campaign) : '';
const firstName = (name?: string) => (name || '').trim().split(/\s+/)[0]?.slice(0, 40) || 'there';

export function calculatorEmail(q: CalculatorPayload): CalculatorEmail {
  const c = q.contact || {};
  const e = q.estimate || {};
  const first = firstName(c.name);
  const kind = e.kind || 'range';
  const next = q.nextStep || {};
  const compound = /compound/i.test(next.label || '') || /compound/i.test(e.label || '');

  // headline, body and the next step, per kind of result
  let tag = 'Project calculator';
  let top = `Here's your estimate, ${first}.`;
  let figure = `${gbp(e.low)} to ${gbp(e.high)}`;
  let body =
    "Thanks for trying the project calculator. This is an estimate for the site you described, before VAT, using the prices we quote real projects from. Once we've agreed the scope together, we'll send a fixed proposal with your final price.";
  let nextLine = 'A 30-minute call is the easiest way to turn this into a fixed proposal.';
  let button = 'Book a call with Ben';
  let href = '/calls/intro';
  let subject = 'Your website estimate from Shrink';

  if (amt(e.low) && e.low === e.high) figure = gbp(e.low);
  if (kind === 'range' && next.kind === 'brief') {
    nextLine = 'For a site this size, a short written brief is usually enough for us to scope it.';
    button = 'Send Ben a brief';
    href = '/contact?service=development';
  }
  if (kind === 'recurring') {
    tag = 'Retainer';
    top = `Here's your retainer, ${first}.`;
    figure = `${gbp(e.monthly)} a month`;
    body = `That's ${h(e.label || 'the retainer')}, a monthly retainer with a three-month first term. Every retainer starts with a free audit of your site, so we know what to work on from the first month.`;
    nextLine = "A short call is the best place to start, then we'll run the audit.";
    button = compound ? 'Book a Compound call' : 'Book a call with Ben';
    href = compound ? '/calls/compound' : '/calls/intro';
    subject = 'Your retainer estimate from Shrink';
  }
  if (kind === 'call') {
    top = `Thank you, ${first}.`;
    figure = e.reason === 'large' && amt(e.from) ? `From ${gbp(e.from)}` : "Let's talk it through";
    body =
      e.reason === 'web-app'
        ? "It's hard to price a product from a few questions, so I'd rather hear about yours first. Thirty minutes is usually enough for us to agree a scope and a rough range."
        : "For a site this size, we'd want to look at the content and who it's for before we quote. We'll scope it with you on a call, then send a fixed proposal.";
    nextLine = 'A 30-minute call is the best way to agree the scope together.';
    subject = 'Your project with Shrink';
  }

  const rows: RowIn[] = kind === 'range' ? (q.drivers || []).slice(0, 14) : [];
  const total = amt(e.total) || rows.reduce((s, r) => s + amt(r.low), 0);
  const sprint = amt(e.sprint);
  const custom = kind === 'range' && !!e.custom;
  const timeline = kind === 'range' && e.timeline ? e.timeline.slice(0, 60) : '';
  const timelineNote = timeline && e.timelineNote ? e.timelineNote.slice(0, 400) : '';
  const campaign = kind === 'recurring' ? 'calculator-retainer' : 'calculator';
  const amount = (r: RowIn, i: number) => (i === 0 ? gbp(r.low) : `+${gbp(r.low)}`);

  const sectionHtml = rows.length
    ? `${gap(48)}
<tr><td>
  <p style="${t(14, 500, C.grey, 1.5, 'margin-bottom:16px')}">How it adds up</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows
    .map((r, i) => lineRow(r.label || '', r.choice || '', amount(r, i)))
    .join('')}${custom ? lineRow('Custom features', 'Complex forms, calculators or product demos, priced with you on a call', 'On a call') : ''}${lineRow('Total', 'Shown as a range until we agree the scope', gbp(total), true)}</table>
  ${timeline ? `<p style="${t(14, 500, C.muted, 1.5, 'margin-top:16px')}">Realistic timeline: <span style="color:${C.ink}">${h(timeline.toLowerCase())}</span>.${timelineNote ? ` ${h(timelineNote)}` : ''}</p>` : ''}
  ${sprint ? `<p style="${t(14, 500, C.muted, 1.5, 'margin-top:16px')}">You said the brief is still open, so we'd suggest a Clarity Sprint first (${gbp(sprint)}). It's priced separately, and it means the build starts from a brief your whole team has agreed.</p>` : ''}
</td></tr>`
    : '';
  const sectionText = rows.length
    ? [
        '',
        'How it adds up:',
        ...rows.map((r, i) => `- ${r.label}: ${r.choice} (${amount(r, i)})`),
        ...(custom ? ['- Custom features: priced with you on a call'] : []),
        `- Total: ${gbp(total)}`,
        ...(timeline ? ['', `Realistic timeline: ${timeline.toLowerCase()}.${timelineNote ? ` ${timelineNote}` : ''}`] : []),
        ...(sprint ? ['', `We'd suggest a Clarity Sprint first (${gbp(sprint)}), outside this figure.`] : []),
      ]
    : [];

  return renderEmail({
    subject,
    preheader: `${figure}. ${kind === 'range' ? 'How it adds up, and what happens next.' : 'And what happens next.'}`,
    tag,
    top,
    figure,
    body,
    sectionHtml,
    sectionText,
    nextLine,
    note: "I'm happy to go through it with you, answer any questions and help you work out the right scope for where you are now. Or just reply to this email. It comes to me.",
    button,
    cta: withUtm(SITE + href, campaign),
    share: shareLink(q.shareUrl, campaign),
    thing: 'estimate',
    campaign,
  });
}

export function quizEmail(q: QuizPayload): CalculatorEmail {
  const c = q.contact || {};
  const r = q.result || {};
  const first = firstName(c.name);
  const state = r.state || 'not_yet';
  const early = state === 'not_yet';
  const jtbd = (r.jtbd || []).filter((x) => typeof x === 'string').slice(0, 3);
  const reco = r.engagement?.slice(0, 60) || '';
  const recoHref = /^\/[\w/-]*$/.test(r.engagementHref || '') ? r.engagementHref! : '/resources';
  const campaign = 'quiz';

  const sectionHtml = `${gap(48)}
<tr><td>
  <p style="${t(14, 500, C.grey, 1.5, 'margin-bottom:16px')}">Where you are</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${lineRow('Readiness', r.readinessNote || '', `${num(r.readiness)} / 9`)}${lineRow('Urgency', r.urgencyNote || '', `${num(r.urgency)} / 6`)}</table>
</td></tr>
${
  jtbd.length
    ? `${gap(32)}
<tr><td>
  <p style="${t(14, 500, C.grey, 1.5, 'margin-bottom:16px')}">${h(r.jtbdLabel || 'What the next site needs to do')}</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${jtbd
    .map((x, i) => lineRow(String(i + 1).padStart(2, '0'), x, ''))
    .join('')}</table>
</td></tr>`
    : ''
}
${
  reco
    ? `${gap(32)}
<tr><td style="background:${C.smoke};border-radius:4px;padding:16px">
  <p style="${t(14, 500, C.grey, 1.5, 'margin-bottom:8px')}">Where we'd start</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td style="${t(20, 500, C.ink, 1.4)}">${h(reco)}</td>
    <td align="right" style="white-space:nowrap;${t(14, 500, C.muted)}">${h(r.engagementPrice || '')}</td>
  </tr></table>
  <p style="${t(14, 500, C.muted, 1.5, 'margin-top:8px')}">${h(r.engagementBlurb || '')}</p>
  <p style="${t(14, 500, C.ink, 1.5, 'margin-top:12px')}"><a href="${withUtm(SITE + recoHref, campaign)}" style="color:${C.ink};text-decoration:underline">${h(r.engagementLink || 'Find out more')} &rarr;</a></p>
</td></tr>`
    : ''
}`;
  const sectionText = [
    '',
    `Readiness: ${num(r.readiness)} / 9, ${r.readinessNote || ''}`,
    `Urgency: ${num(r.urgency)} / 6, ${r.urgencyNote || ''}`,
    ...(jtbd.length ? ['', `${r.jtbdLabel || 'What the next site needs to do'}:`, ...jtbd.map((x) => `- ${x}`)] : []),
    ...(reco ? ['', `Where we'd start: ${reco}${r.engagementPrice ? ` (${r.engagementPrice})` : ''}`, r.engagementBlurb || ''] : []),
  ];

  return renderEmail({
    subject: 'Your readiness result from Shrink',
    preheader: `${r.headline || 'Your result'} Where you are, and what happens next.`,
    tag: 'Readiness quiz',
    top: `Here's your result, ${first}.`,
    figure: r.headline?.slice(0, 120) || 'Your readiness result',
    body: h(r.diagnosis?.slice(0, 600) || ''),
    sectionHtml,
    sectionText,
    nextLine: early
      ? "When the time is right, we'd love to help. Until then, our resources are a good place to start."
      : 'A 30-minute call is the easiest way to plan your next step together.',
    note: early
      ? "If you'd like to talk anything through in the meantime, just reply to this email. It comes to me."
      : "I'm happy to go through your result with you and help you work out the right first step. Or just reply to this email. It comes to me.",
    button: early ? 'Browse our resources' : 'Book a call with Ben',
    cta: withUtm(SITE + (early ? '/resources' : '/calls/intro'), campaign),
    share: shareLink(q.shareUrl, campaign),
    thing: 'result',
    campaign,
  });
}

export function scanEmail(r: ScanResult, asked: Asked[], name: string, competitor: string): CalculatorEmail {
  const first = firstName(name);
  const campaign = 'ai-search-check';
  const great = /great shape/i.test(r.summary.headline);
  const answered = asked.filter((a) => a.answers.some((x) => x.status !== 'Unavailable'));

  const scoreRows =
    lineRow('Site readiness', 'How easily AI tools can reach, read and understand your pages', `${r.score.site.got} / ${r.score.site.of}`) +
    lineRow('Agent readiness', 'How easily an AI agent could find your pricing or get in touch for someone', `${r.score.agent.got} / ${r.score.agent.of}`);
  const askedHtml = answered
    .map(
      (a) => `${gap(24)}
<tr><td>
  <p style="${t(16, 500, C.ink, 1.4, 'margin-bottom:8px')}">&ldquo;${h(a.question)}&rdquo;</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${a.answers
    .filter((x) => x.status !== 'Unavailable')
    .map((x) => lineRow(x.model, clip(x.excerpt, 220) || 'No answer came back.', x.status))
    .join('')}</table>
</td></tr>`
    )
    .join('');
  const fixes = r.top.slice(0, 3);

  const sectionHtml = `${gap(48)}
<tr><td>
  <p style="${t(14, 500, C.grey, 1.5, 'margin-bottom:16px')}">Your scores</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${scoreRows}</table>
</td></tr>
${
  answered.length
    ? `${gap(32)}
<tr><td><p style="${t(14, 500, C.grey, 1.5)}">What AI tools said when we asked about ${h(r.brand)}</p></td></tr>${askedHtml}`
    : ''
}
${
  fixes.length
    ? `${gap(32)}
<tr><td>
  <p style="${t(14, 500, C.grey, 1.5, 'margin-bottom:16px')}">${fixes.length === 1 ? 'The change that would help most' : `${fixes.length === 2 ? 'Two' : 'Three'} changes that would help most`}</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${fixes
    .map((f, i) => lineRow(String(i + 1).padStart(2, '0'), `${f.title}. ${f.body}`, f.effort))
    .join('')}</table>
</td></tr>`
    : ''
}`;
  const sectionText = [
    '',
    `Site readiness: ${r.score.site.got} / ${r.score.site.of}`,
    `Agent readiness: ${r.score.agent.got} / ${r.score.agent.of}`,
    ...(answered.length
      ? ['', `What AI tools said when we asked about ${r.brand}:`, ...answered.flatMap((a) => [`"${a.question}"`, ...a.answers.filter((x) => x.status !== 'Unavailable').map((x) => `- ${x.model}: ${x.status}. ${clip(x.excerpt, 220)}`)])]
      : []),
    ...(fixes.length ? ['', 'Changes that would help most:', ...fixes.map((f, i) => `${i + 1}. ${f.title} (${f.effort}). ${f.body}`)] : []),
  ];

  return renderEmail({
    subject: `Your AI search report for ${r.host}`,
    preheader: `${r.summary.headline}. Your scores, what AI tools said about you and the changes that would help most.`,
    tag: 'AI search check',
    top: `Here's your AI search report, ${first}.`,
    figure: r.summary.headline,
    body: h(r.summary.body),
    sectionHtml,
    sectionText,
    nextLine: great
      ? "If you'd like a second pair of eyes, we're always happy to talk."
      : 'A 30-minute call is the easiest way to plan the changes together.',
    note: "I'm happy to go through your report with you and show you what we'd change first. Or just reply to this email. It comes to me.",
    button: 'Book a call with Ben',
    cta: withUtm(SITE + '/calls/intro', campaign),
    share: shareLink(`${SITE}/tools/ai-search-check?site=${encodeURIComponent(r.host)}`, campaign),
    shareLabel: 'Run the check again to see your latest scores',
    shareNote: "To share this with your team, just forward this email. The link above runs a fresh check of your site, so it's handy after you've made a change.",
    thing: 'report',
    campaign,
  });
}

/* ---------- what AI tools say (the emailed part of the AI search check) ---------- */
// Three questions to ChatGPT, Claude and Perplexity, each with web search on, so the
// answers look like what a buyer would see. A model without a key is left out.

const MODELS = ['ChatGPT', 'Claude', 'Perplexity'] as const;
type Model = (typeof MODELS)[number];
type Answer = { model: Model; status: 'Cited' | 'Mentioned' | 'Not yet' | 'Unavailable'; excerpt: string };
type Asked = { question: string; answers: Answer[] };
type Reply = { text: string; urls: string[] } | null;
const AI_MS = 60000;

async function recognise(r: ScanResult, competitor: string): Promise<Asked[]> {
  const about = await describe(r);
  const questions = [
    `What is ${r.brand}, and what do they do?`,
    about ? `What are the best ${about.category} for ${about.audience}?` : `Who are the leading companies like ${r.brand}?`,
    competitor ? `${r.brand} or ${competitor}: which should I choose?` : `What are the best alternatives to ${r.brand}?`,
  ];
  const ask: Record<Model, (q: string) => Promise<Reply>> = { ChatGPT: askOpenAI, Claude: askClaude, Perplexity: askPerplexity };
  const keys: Record<Model, string | undefined> = {
    ChatGPT: process.env.OPENAI_API_KEY,
    Claude: process.env.ANTHROPIC_API_KEY,
    Perplexity: process.env.PERPLEXITY_API_KEY,
  };
  const live = MODELS.filter((m) => keys[m]);
  return Promise.all(
    questions.map(async (question) => ({
      question,
      answers: await Promise.all(
        live.map(async (model): Promise<Answer> => {
          const reply = await ask[model](question).catch((err) => {
            console.error('ai answer', model, err);
            return null;
          });
          if (!reply) return { model, status: 'Unavailable', excerpt: '' };
          return { model, ...judge(reply, r) };
        })
      ),
    }))
  );
}

/** Mentioned when the answer names them, Cited when it also links to their site. */
function judge(reply: { text: string; urls: string[] }, r: ScanResult): Omit<Answer, 'model'> {
  const text = plain(reply.text);
  const root = r.host.replace(/^www\./, '');
  const brand = r.brand.toLowerCase();
  const linked = reply.urls.some((u) => {
    try {
      const h = new URL(u).hostname.replace(/^www\./, '');
      return h === root || h.endsWith(`.${root}`);
    } catch {
      return false;
    }
  });
  const named = text.toLowerCase().includes(brand) || text.toLowerCase().includes(root);
  const sentences = text.split(/(?<=[.!?])\s+/);
  const excerpt = (named ? sentences.find((x) => x.toLowerCase().includes(brand) || x.toLowerCase().includes(root)) : sentences[0]) || '';
  return { status: linked && named ? 'Cited' : named ? 'Mentioned' : 'Not yet', excerpt: clip(excerpt, 240) };
}

/* markdown and citation marks out, for excerpts */
function plain(s: string) {
  return s
    .replace(/\s*\[(\d+)\]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_#`>]+/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim();
}

/** What they sell and who to, for the "best X for Y" question. Claude, from the homepage description. */
async function describe(r: ScanResult): Promise<{ category: string; audience: string } | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || !r.description) return null;
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-opus-5-5',
        max_tokens: 2000,
        output_config: {
          effort: 'low',
          format: {
            type: 'json_schema',
            schema: {
              type: 'object',
              properties: {
                category: { type: 'string', description: 'plural, lower case, eg. "payment tools" or "Webflow agencies"' },
                audience: { type: 'string', description: 'who buys it, lower case, eg. "accountancy firms"' },
              },
              required: ['category', 'audience'],
              additionalProperties: false,
            },
          },
        },
        messages: [
          {
            role: 'user',
            content: `A company's website describes it like this:\n\n${r.brand}: ${r.description}\n\nName the category of product or service it sells and who buys it, in a few words each, the way a buyer would phrase a search.`,
          },
        ],
      }),
      signal: AbortSignal.timeout(30000),
    });
    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    const raw = data.content?.find((b) => b.type === 'text')?.text || '';
    const out = JSON.parse(raw) as { category?: string; audience?: string };
    return out.category && out.audience ? { category: out.category.slice(0, 60), audience: out.audience.slice(0, 60) } : null;
  } catch (err) {
    console.error('describe', err);
    return null;
  }
}

async function askClaude(question: string): Promise<Reply> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY || '',
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'server-side-fallback-2026-07-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-opus-5-5',
      max_tokens: 4000,
      output_config: { effort: 'low' },
      fallbacks: 'default',
      tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 3 }],
      messages: [{ role: 'user', content: question }],
    }),
    signal: AbortSignal.timeout(AI_MS),
  });
  if (!res.ok) throw new Error(`Claude ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as {
    stop_reason?: string;
    content?: { type: string; text?: string; citations?: { url?: string }[]; content?: { url?: string }[] | object }[];
  };
  if (data.stop_reason === 'refusal') return null;
  const blocks = data.content || [];
  const text = blocks.filter((b) => b.type === 'text').map((b) => b.text || '').join('');
  const urls = [
    ...blocks.flatMap((b) => (b.citations || []).map((c) => c.url || '')),
    ...blocks.filter((b) => b.type === 'web_search_tool_result' && Array.isArray(b.content)).flatMap((b) => (b.content as { url?: string }[]).map((c) => c.url || '')),
  ].filter(Boolean);
  return text ? { text, urls } : null;
}

async function askOpenAI(question: string): Promise<Reply> {
  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-5-mini', input: question, tools: [{ type: 'web_search' }] }),
    signal: AbortSignal.timeout(AI_MS),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as {
    output_text?: string;
    output?: { type: string; content?: { type: string; text?: string; annotations?: { url?: string }[] }[] }[];
  };
  const parts = (data.output || []).filter((o) => o.type === 'message').flatMap((o) => o.content || []).filter((c) => c.type === 'output_text');
  const text = data.output_text || parts.map((p) => p.text || '').join('');
  const urls = parts.flatMap((p) => (p.annotations || []).map((a) => a.url || '')).filter(Boolean);
  return text ? { text, urls } : null;
}

async function askPerplexity(question: string): Promise<Reply> {
  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: process.env.PERPLEXITY_MODEL || 'sonar', messages: [{ role: 'user', content: question }] }),
    signal: AbortSignal.timeout(AI_MS),
  });
  if (!res.ok) throw new Error(`Perplexity ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    citations?: string[];
    search_results?: { url?: string }[];
  };
  const text = data.choices?.[0]?.message?.content || '';
  const urls = [...(data.citations || []), ...(data.search_results || []).map((x) => x.url || '')].filter(Boolean);
  return text ? { text, urls } : null;
}

/** Sends through Resend. Returns the email id, or why it wasn't sent. */
async function sendResultsEmail(to: string, mail: CalculatorEmail, key: string, tool: string, deal: string): Promise<string> {
  const mode = (process.env.RESULTS_EMAIL || 'off').toLowerCase();
  const testers = (process.env.RESULTS_EMAIL_TEST || '').toLowerCase().split(',').map((x) => x.trim()).filter(Boolean);
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return 'not sent: no RESEND_API_KEY';
  if (mode !== 'on' && !(mode === 'test' && testers.includes(to))) return `not sent: RESULTS_EMAIL ${mode}`;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': key.slice(0, 256) },
      body: JSON.stringify({
        from: 'Ben at Shrink <hey@shrink.studio>',
        to: [to],
        reply_to: 'hey@shrink.studio',
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        // the deal tag comes back on Resend events (api/email-events.ts)
        tags: [
          { name: 'tool', value: tool },
          { name: 'deal', value: deal },
        ],
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok) {
      console.error('resend', res.status, data);
      return `not sent: Resend ${res.status} ${data.message || ''}`.trim();
    }
    return `sent ${data.id || ''}`.trim();
  } catch (err) {
    console.error('resend failed', err);
    return 'not sent: Resend unreachable';
  }
}

/* ---------- slack ---------- */
// Slack ping for new leads (SLACK_LEADS_WEBHOOK). Never throws: Airtable has already
// succeeded, and a Slack failure must not turn the response into a 500.
const TIMEOUT_MS = 3000;

/* Airtable record link for the "Open in Airtable" button */
const recordUrl = (table: string, id?: string) =>
  id ? `https://airtable.com/${BASE}/${table}/${id}` : undefined;

/* Slack mrkdwn escaping */
const mrkdwn = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const clip = (s: string | undefined, n = 280) => {
  const t = (s || '').replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};

type Line = string | false | null | undefined;

async function notify(title: string, lines: Line[], link?: string): Promise<void> {
  const url = process.env.SLACK_LEADS_WEBHOOK;
  if (!url) return;

  const body = lines
    .filter((l): l is string => !!l)
    .map(mrkdwn)
    .join('\n');
  const blocks: unknown[] = [
    { type: 'section', text: { type: 'mrkdwn', text: `*${mrkdwn(title)}*\n${body}` } },
  ];
  if (link)
    blocks.push({
      type: 'actions',
      elements: [
        { type: 'button', text: { type: 'plain_text', text: 'Open in Airtable' }, url: link },
      ],
    });

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: `${title}: ${lines.filter(Boolean)[0] || ''}`, blocks }),
      signal: ctrl.signal,
    });
    if (!res.ok) console.error('slack notify', res.status, await res.text());
  } catch (err) {
    console.error('slack notify failed', err);
  } finally {
    clearTimeout(timer);
  }
}
