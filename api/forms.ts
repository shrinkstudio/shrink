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
 * Every new lead also pings Slack (see _notify.ts).
 *
 * Env (Vercel): AIRTABLE_TOKEN, WEBFLOW_WEBHOOK_SECRET (optional, verifies the signature),
 * SLACK_LEADS_WEBHOOK (optional, Slack incoming webhook).
 */

import { clip, notify, recordUrl } from './_notify';

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

/* browsers allowed to post the quiz */
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
    note: `${date(s)} Took "${guide}"${d.resources ? ', opted in to resources' : ''}`,
  });

  const mailing = d.resources
    ? await upsertMailing(s, { name: d.name, email, contact: contact.id, source: 'Guide', guide })
    : null;

  await notify(
    'Guide download',
    [
      `${d.name || 'No name'} (${email})`,
      `Took "${guide}"${d.resources ? ', opted in to resources' : ''}`,
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
    source: 'Enquiry' | 'Guide' | 'Quiz';
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

function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}
