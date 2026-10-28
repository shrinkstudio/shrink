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
 * state "ready" also creates a Deal at Stage "Lead", otherwise the Contact is Nurture.
 *
 * The Project Calculator code component POSTs `form: "calculator"` the same way: upsert
 * Contact (+ Company), and always a Deal at Stage "Lead" carrying the range, what moved
 * it and the answers (someone who leaves an email after seeing a price is a lead).
 *
 * Every new lead also pings Slack (see the slack section at the end).
 *
 * Env (Vercel): AIRTABLE_TOKEN, WEBFLOW_WEBHOOK_SECRET (optional, verifies the signature),
 * SLACK_LEADS_WEBHOOK (optional, Slack incoming webhook).
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
  pageUrl?: string;
  contact?: { name?: string; email?: string; company?: string; resources?: boolean };
  result?: {
    state?: string;
    readiness?: number;
    urgency?: number;
    engagementId?: string;
    engagement?: string;
  };
  answers?: { question?: string; answer?: string }[];
};

type CalculatorPayload = {
  form: 'calculator';
  id?: string;
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
  };
  drivers?: { label?: string; choice?: string; low?: number; high?: number }[];
  nextStep?: { kind?: string; label?: string; package?: string };
  answers?: { question?: string; answer?: string }[];
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
    try {
      const out = await handleQuiz(quiz);
      return json(out, out.ok ? 200 : 400, headers);
    } catch (err) {
      console.error('forms error quiz', quiz.id, err);
      return json({ ok: false, error: 'airtable failed' }, 500, headers);
    }
  }

  // calculator: same browser path as the quiz
  const calc = parseCalculator(raw);
  if (calc) {
    const headers = cors(request);
    if (!headers['Access-Control-Allow-Origin']) return json({ ok: false, error: 'origin' }, 403);
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
  const c = q.contact || {};
  const email = c.email?.trim().toLowerCase() || '';
  const name = c.name?.trim().slice(0, 200) || '';
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { ok: false, error: 'name and email' };

  const r = q.result || {};
  const state = ['ready', 'close', 'not_yet'].includes(r.state || '') ? r.state! : 'not_yet';
  const ready = state === 'ready';
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

  let deal: AirtableRecord | undefined;
  if (ready) {
    const service = QUIZ_SERVICES[r.engagementId || ''];
    [deal] = await create(T.deals, [
      {
        Name: `${companyName}, readiness quiz`,
        'Lead name': name,
        Stage: 'Lead',
        ...(service ? { Service: service } : {}),
        ...(company ? { Company: [company.id] } : {}),
        Notes: [
          `Readiness quiz: ready, ${score}`,
          `Where we'd start: ${engagement}`,
          '',
          ...answers,
          '',
          `Contact: ${name} <${email}>`,
          ...(q.pageUrl ? [`Page: ${q.pageUrl.slice(0, 300)}`] : []),
          `Quiz ${id || ''}`,
        ].join('\n'),
        'Next step': 'Reply to quiz lead',
        'Next step date': today(),
      },
    ]);
  }

  const mailing = c.resources
    ? await upsertMailing(
        { name: 'Quiz', siteId: SITE_ID, data: {}, pageUrl: q.pageUrl },
        { name, email, contact: contact.id, source: 'Quiz' }
      )
    : null;

  await notify(
    `Readiness quiz: ${state.replace('_', ' ')}`,
    [
      `${name} (${email})${c.company ? `, ${c.company.slice(0, 120)}` : ''}`,
      `${score}, we'd start with ${engagement}`,
      ready ? 'Deal created, reply today' : 'Contact set to Nurture',
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
  };
}

async function handleCalculator(q: CalculatorPayload) {
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
        : `${gbp(e.low)} to ${gbp(e.high)}${amt(e.sprint) ? `, plus a Clarity Sprint ${gbp(e.sprint)}` : ''}`;
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
  const [deal] = await create(T.deals, [
    {
      Name: `${companyName}, project calculator`,
      'Lead name': name,
      Stage: 'Lead',
      ...(service ? { Service: service } : {}),
      ...(company ? { Company: [company.id] } : {}),
      ...(value > 0 ? { [DEAL_VALUE]: value } : {}),
      Notes: [
        `Project calculator: ${figure}`,
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
      ].join('\n'),
      'Next step': 'Reply to calculator lead',
      'Next step date': today(),
    },
  ]);

  const mailing = c.resources
    ? await upsertMailing(
        { name: 'Calculator', siteId: SITE_ID, data: {}, pageUrl: q.pageUrl },
        { name, email, contact: contact.id, source: 'Calculator' }
      )
    : null;

  const emailed = await sendResultsEmail(email, calculatorEmail(q), `calculator-${id || email}`, 'calculator');

  await notify(
    `Project calculator: ${figure}`,
    [
      `${name} (${email})${c.company ? `, ${c.company.slice(0, 120)}` : ''}`,
      `Next step: ${next}${pkg ? ` (${pkg})` : ''}`,
      `Results email: ${emailed}`,
      'Deal created, reply today',
    ],
    recordUrl(T.deals, deal.id)
  );

  return { ok: true, contact: contact.id, company: company?.id, deal: deal.id, mailing: mailing?.id, emailed };
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
    source: 'Enquiry' | 'Guide' | 'Quiz' | 'Calculator';
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

export function calculatorEmail(q: CalculatorPayload): CalculatorEmail {
  const c = q.contact || {};
  const e = q.estimate || {};
  const first = (c.name || '').trim().split(/\s+/)[0]?.slice(0, 40) || 'there';
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
  const note =
    "I'm happy to go through it with you, answer any questions and help you work out the right scope for where you are now. Or just reply to this email. It comes to me.";

  const rows: RowIn[] = kind === 'range' ? (q.drivers || []).slice(0, 14) : [];
  const total = amt(e.total) || rows.reduce((s, r) => s + amt(r.low), 0);
  const campaign = kind === 'recurring' ? 'calculator-retainer' : 'calculator';
  const cta = withUtm(SITE + href, campaign);
  const share = q.shareUrl && /^https:\/\/(www\.)?shrink\.studio\//.test(q.shareUrl) ? withUtm(q.shareUrl, campaign) : '';
  const sprint = amt(e.sprint);
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/London' });

  const t = (size: number, weight: number, color: string, lh = 1.5, extra = '') =>
    `font-family:${FONT};font-size:${size}px;line-height:${lh};font-weight:${weight};color:${color};margin:0;${extra}`;
  const gap = (px: number) => `<tr><td style="height:${px}px;line-height:${px}px;font-size:0">&nbsp;</td></tr>`;

  const rowHtml = rows
    .map((r, i) => {
      const amount = i === 0 ? gbp(r.low) : `+${gbp(r.low)}`;
      return `<tr>
  <td class="sk-lbl" style="border-top:1px solid ${C.line};padding:12px 16px 12px 0;width:150px;vertical-align:top;${t(14, 400, C.muted)}">${h(r.label)}</td>
  <td style="border-top:1px solid ${C.line};padding:12px 16px 12px 0;vertical-align:top;${t(14, 500, C.ink)}">${h(r.choice)}</td>
  <td style="border-top:1px solid ${C.line};padding:12px 0;vertical-align:top;text-align:right;white-space:nowrap;${t(16, 600, C.ink)}">${amount}</td>
</tr>`;
    })
    .join('');
  const totalHtml = rows.length
    ? `<tr>
  <td style="border-top:1px solid ${C.line};padding:12px 16px 0 0;vertical-align:top;${t(16, 600, C.ink)}">Total</td>
  <td style="border-top:1px solid ${C.line};padding:12px 16px 0 0;vertical-align:top;${t(14, 500, C.ink)}">Shown as a range until we agree the scope</td>
  <td style="border-top:1px solid ${C.line};padding:12px 0 0;vertical-align:top;text-align:right;white-space:nowrap;${t(16, 600, C.ink)}">${gbp(total)}</td>
</tr>`
    : '';

  const html = `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>${h(subject)}</title>
<style>@media (max-width:520px){.sk-outer{padding:16px 8px !important}.sk-pad{padding:24px !important}.sk-h{font-size:26px !important}.sk-h5{font-size:20px !important}.sk-body{font-size:16px !important}.sk-lbl{width:96px !important;padding-right:12px !important}}</style>
</head>
<body style="margin:0;padding:0;background:${C.smoke}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${h(figure)}. ${kind === 'range' ? 'How it adds up, and what happens next.' : 'And what happens next.'}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.smoke}">
<tr><td class="sk-outer" align="center" style="padding:40px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${C.white};border-radius:12px">
<tr><td class="sk-pad" style="padding:40px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td><a href="${withUtm(SITE + '/', campaign)}" style="display:inline-block"><img src="${ASSETS}/mascot-2x.png" width="39" height="30" alt="Shrink" style="display:block;border:0"></a></td>
    <td align="right"><span style="display:inline-block;background:${C.smoke};border-radius:4px;padding:4px 8px;${t(14, 500, C.ink)}">${tag}</span></td>
  </tr></table>
</td></tr>
${gap(48)}
<tr><td>
  <p class="sk-h" style="${t(32, 500, C.muted, 1.3, 'letter-spacing:-0.3px')}">${h(top)}</p>
  <p class="sk-h" style="${t(32, 500, C.ink, 1.3, 'letter-spacing:-0.3px')}">${h(figure)}</p>
  <p class="sk-body" style="${t(18, 500, C.muted, 1.5, 'margin-top:24px')}">${body}</p>
</td></tr>
${
  rows.length
    ? `${gap(48)}
<tr><td>
  <p style="${t(14, 500, C.grey, 1.5, 'margin-bottom:16px')}">How it adds up</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rowHtml}${totalHtml}</table>
  ${sprint ? `<p style="${t(14, 500, C.muted, 1.5, 'margin-top:16px')}">You said the brief is still open, so we'd suggest a Clarity Sprint first (${gbp(sprint)}). It's priced separately, and it means the build starts from a brief your whole team has agreed.</p>` : ''}
</td></tr>`
    : ''
}
${gap(48)}
<tr><td>
  <p class="sk-h5" style="${t(24, 500, C.muted, 1.3, 'letter-spacing:-0.2px')}">What happens next</p>
  <p class="sk-h5" style="${t(24, 500, C.ink, 1.3, 'letter-spacing:-0.2px')}">${nextLine}</p>
  <p class="sk-body" style="${t(18, 500, C.muted, 1.5, 'margin-top:24px')}">${note}</p>
</td></tr>
${gap(24)}
<tr><td style="background:${C.smoke};border-radius:4px;padding:16px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td style="vertical-align:top">
      <p style="${t(18, 500, C.ink, 1.3)}">Ben Hammond</p>
      <p style="${t(18, 500, C.light, 1.3)}">Founder</p>
      <p style="margin:48px 0 0"><a href="${cta}" style="display:inline-block;background:${C.ink};border-radius:4px;padding:10px 16px;text-decoration:none;${t(14, 500, C.white)}">${button}</a></p>
    </td>
    <td width="100" style="vertical-align:bottom;text-align:right"><img src="${ASSETS}/ben-2x.jpg" width="100" height="100" alt="Ben Hammond" style="display:block;border:0;border-radius:2px"></td>
  </tr></table>
</td></tr>
${
  share
    ? `${gap(24)}
<tr><td>
  <p style="${t(14, 500, C.ink)}"><a href="${h(share)}" style="color:${C.ink};text-decoration:underline">Reopen your estimate to change any of your answers &rarr;</a></p>
  <p style="${t(14, 500, C.grey, 1.5, 'margin-top:12px')}">To share this with your team, just forward this email. The link above opens your answers, so they'll see the same estimate.</p>
</td></tr>`
    : ''
}
${gap(48)}
<tr><td style="border-top:1px solid ${C.line};padding-top:16px">
  <p style="${t(14, 500, C.grey)}">You asked for this estimate on shrink.studio on ${date}. We'll only send you guides and updates if you ticked the box to get them.</p>
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
    top,
    figure,
    '',
    body.replace(/&[a-z]+;/g, ''),
    ...(rows.length
      ? ['', 'How it adds up:', ...rows.map((r, i) => `- ${r.label}: ${r.choice} (${i === 0 ? gbp(r.low) : `+${gbp(r.low)}`})`), `- Total: ${gbp(total)}`]
      : []),
    ...(sprint ? ['', `We'd suggest a Clarity Sprint first (${gbp(sprint)}), outside this figure.`] : []),
    '',
    `What happens next: ${nextLine}`,
    note,
    `${button}: ${cta}`,
    ...(share ? ['', `Reopen your estimate: ${share}`] : []),
    '',
    'Ben Hammond, Founder, Shrink Studio',
    `You asked for this estimate on shrink.studio on ${date}.`,
  ].join('\n');

  return { subject, html, text };
}

/** Sends through Resend. Returns the email id, or why it wasn't sent. */
async function sendResultsEmail(to: string, mail: CalculatorEmail, key: string, tool: string): Promise<string> {
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
        tags: [{ name: 'tool', value: tool }],
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
