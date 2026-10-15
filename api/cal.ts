/**
 * Cal.com bookings to Airtable (Shrink OS).
 *
 * Cal.com webhook (BOOKING_CREATED, BOOKING_RESCHEDULED, BOOKING_CANCELLED) POSTs here.
 * - Created: upsert Contact + Company, find the person's open Deal or create one,
 *   Stage "Call booked", Next step "Call" on the booking date, answers appended to Notes.
 * - Rescheduled: move the Deal's Next step date (falls back to Created if no Deal matches).
 * - Cancelled: note it, Next step "Rebook call" today, Contact back to Needs follow-up.
 *
 * Env (Vercel): AIRTABLE_TOKEN, CAL_WEBHOOK_SECRET (verifies x-cal-signature-256).
 */

declare const process: { env: Record<string, string | undefined> };

/* ids */
const BASE = 'appx76yahrfuTcbiD';
const T = {
  companies: 'tblutaeT4swsXdjrZ',
  contacts: 'tblXiE8Absty3l4HW',
  deals: 'tbl5TAoijwcEctsso',
};

/* Cal event slug → Deals.Service (intro: unset) */
const SERVICES: [RegExp, string][] = [
  [/discovery/i, 'Discovery'],
  [/development/i, 'Development'],
  [/optimi[sz]ation/i, 'Optimisation retainer'],
];

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

/* Deals.Stage, in order; a booking never pulls a Deal backwards */
const STAGES = ['Lead', 'Contacted', 'Call booked', 'Proposal sent', 'Won', 'Lost'];
const CLOSED = ['Won', 'Lost'];

/* booking dates are London dates */
const TZ = 'Europe/London';

/* booking questions already captured elsewhere */
const SKIP_ANSWERS = new Set(['name', 'email', 'rescheduleReason', 'location', 'guests']);

type Answer = { label?: string; value?: unknown } | string | undefined;

type Booking = {
  type?: string;
  eventTypeSlug?: string;
  title?: string;
  startTime?: string;
  uid?: string;
  rescheduleUid?: string;
  attendees?: { email?: string; name?: string; timeZone?: string }[];
  responses?: Record<string, Answer>;
  cancellationReason?: string;
};

type AirtableRecord = { id: string; fields: Record<string, unknown> };

export async function POST(request: Request): Promise<Response> {
  const raw = await request.text();

  if (!(await verify(request, raw))) return json({ ok: false, error: 'bad signature' }, 401);

  let event: string;
  let b: Booking;
  try {
    const body = JSON.parse(raw);
    event = body.triggerEvent || '';
    b = body.payload ?? {};
  } catch {
    return json({ ok: false, error: 'bad json' }, 400);
  }

  try {
    if (event === 'BOOKING_CREATED') return json(await handleCreated(b));
    if (event === 'BOOKING_RESCHEDULED') return json(await handleRescheduled(b));
    if (event === 'BOOKING_CANCELLED') return json(await handleCancelled(b));
    return json({ ok: true, skipped: event || 'no event' });
  } catch (err) {
    console.error('cal error', event, b.uid, err);
    // 500 so Cal retries
    return json({ ok: false, error: 'airtable failed' }, 500);
  }
}

/* ---------- handlers ---------- */

async function handleCreated(b: Booking) {
  const who = attendee(b);
  if (!who.email) return { ok: false, error: 'no attendee email' };

  // Cal retries: skip if this booking is already on a Deal
  if (b.uid) {
    const dupe = await find(T.deals, `FIND("${esc(b.uid)}", {Notes})`);
    if (dupe) return { ok: true, duplicate: dupe.id };
  }

  const domain = who.email.split('@')[1] || '';
  const company =
    domain && !FREE_MAIL.has(domain) ? await upsertCompany(domain, `https://${domain}`) : null;

  const slug = b.type || b.eventTypeSlug || '';
  const when = bookingDate(b.startTime);

  const contact = await upsertContact({
    name: who.name,
    email: who.email,
    company: company?.id,
    nextAction: 'Meeting booked',
    note: `${today()} Booked "${b.title || slug}" for ${when}`,
  });

  const service = SERVICES.find(([re]) => re.test(slug))?.[1];
  const note = bookingNote(b, who, 'Call booked');
  const deal = await openDeal(who.email, company);

  if (deal) {
    const f = deal.fields;
    const fields: Record<string, unknown> = {
      Notes: append(f.Notes, note),
      'Next step': 'Call',
      'Next step date': when,
    };
    if (STAGES.indexOf(f.Stage as string) < STAGES.indexOf('Call booked'))
      fields.Stage = 'Call booked';
    if (!f['Lead name'] && who.name) fields['Lead name'] = who.name;
    if (!f.Service && service) fields.Service = service;
    if (!(f.Company as string[] | undefined)?.length && company) fields.Company = [company.id];
    await airtable(`${T.deals}/${deal.id}`, 'PATCH', { fields, typecast: false });
    return { ok: true, deal: deal.id, updated: true, contact: contact.id, company: company?.id };
  }

  const [created] = await create(T.deals, [
    {
      Name: `${company ? domain : who.name || who.email}, call booked`,
      'Lead name': who.name || '',
      Stage: 'Call booked',
      ...(service ? { Service: service } : {}),
      ...(company ? { Company: [company.id] } : {}),
      Notes: note,
      'Next step': 'Call',
      'Next step date': when,
    },
  ]);

  return { ok: true, deal: created.id, contact: contact.id, company: company?.id };
}

async function handleRescheduled(b: Booking) {
  const deal = (await dealForBooking(b.rescheduleUid)) ?? (await dealForBooking(b.uid));
  if (!deal) return handleCreated(b);
  // Cal retries: this reschedule is already noted
  if (b.uid && String(deal.fields.Notes || '').includes(b.uid))
    return { ok: true, duplicate: deal.id };

  const who = attendee(b);
  const when = bookingDate(b.startTime);
  const fields: Record<string, unknown> = {
    Notes: append(deal.fields.Notes, bookingNote(b, who, 'Call rescheduled')),
    'Next step': 'Call',
    'Next step date': when,
  };
  await airtable(`${T.deals}/${deal.id}`, 'PATCH', { fields, typecast: false });

  if (who.email)
    await upsertContact({
      name: who.name,
      email: who.email,
      nextAction: 'Meeting booked',
      note: `${today()} Rescheduled call to ${when}`,
    });

  return { ok: true, deal: deal.id, rescheduled: when };
}

async function handleCancelled(b: Booking) {
  const deal = await dealForBooking(b.uid);
  const who = attendee(b);

  if (deal) {
    const lines = [`${today()} Call cancelled (Cal ${b.uid})`];
    if (b.cancellationReason) lines.push(`Reason: ${b.cancellationReason}`);
    const fields: Record<string, unknown> = {
      Notes: append(deal.fields.Notes, lines.join('\n')),
      'Next step': 'Rebook call',
      'Next step date': today(),
    };
    await airtable(`${T.deals}/${deal.id}`, 'PATCH', { fields, typecast: false });
  }

  if (who.email)
    await upsertContact({
      name: who.name,
      email: who.email,
      nextAction: 'Needs follow-up',
      note: `${today()} Cancelled call${b.cancellationReason ? `: ${b.cancellationReason}` : ''}`,
    });

  return { ok: true, deal: deal?.id ?? null, cancelled: true };
}

/* ---------- airtable ---------- */

/** Open Deal for this person: one that mentions their email, else one on their Company. */
async function openDeal(email: string, company: AirtableRecord | null) {
  const open = `NOT(OR(${CLOSED.map((s) => `{Stage} = "${s}"`).join(', ')}))`;
  const byEmail = await find(T.deals, `AND(${open}, FIND("${esc(email)}", LOWER({Notes})))`);
  if (byEmail || !company) return byEmail;
  const name = esc((company.fields.Name as string) || '');
  return name ? find(T.deals, `AND(${open}, ARRAYJOIN({Company}) = "${name}")`) : null;
}

async function dealForBooking(uid?: string) {
  return uid ? find(T.deals, `FIND("${esc(uid)}", {Notes})`) : null;
}

async function upsertCompany(name: string, website: string) {
  // match on a host boundary so box.com doesn't match dropbox.com
  const d = esc(name);
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
    const fields: Record<string, unknown> = { Notes: append(existing.fields.Notes, c.note) };
    // only ever raise urgency
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

async function find(table: string, formula: string): Promise<AirtableRecord | null> {
  const qs = new URLSearchParams({ filterByFormula: formula, maxRecords: '1' });
  const res = await airtable(`${table}?${qs}`, 'GET');
  return res.records?.[0] ?? null;
}

async function create(table: string, rows: Record<string, unknown>[]): Promise<AirtableRecord[]> {
  const res = await airtable(table, 'POST', {
    records: rows.map((fields) => ({ fields })),
    typecast: false,
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

/** Cal signs the raw body with HMAC-SHA256 (hex) in x-cal-signature-256. Required. */
async function verify(request: Request, raw: string) {
  const secret = process.env.CAL_WEBHOOK_SECRET;
  if (!secret) return false;
  const sig = request.headers.get('x-cal-signature-256');
  if (!sig) return false;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(raw));
  const hex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return timingSafeEqual(hex, sig.toLowerCase());
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function attendee(b: Booking) {
  const a = b.attendees?.[0] ?? {};
  const email = (a.email || text(b.responses?.email) || '').trim().toLowerCase();
  const name = (a.name || text(b.responses?.name) || '').trim();
  return { email, name, timeZone: a.timeZone };
}

/** Deal Notes block: header with the Cal uid (dedupe + reschedule/cancel lookup), then answers. */
function bookingNote(b: Booking, who: ReturnType<typeof attendee>, heading: string) {
  const lines = [
    `${today()} ${heading}: ${b.title || b.type || 'call'}, ${when(b.startTime)}`,
    `Contact: ${who.name} <${who.email}>${who.timeZone ? ` (${who.timeZone})` : ''}`,
  ];
  for (const [key, ans] of Object.entries(b.responses ?? {})) {
    if (SKIP_ANSWERS.has(key)) continue;
    const value = text(ans);
    if (!value) continue;
    const label = (typeof ans === 'object' && ans?.label) || key;
    lines.push(`${label}: ${value}`);
  }
  lines.push(`Cal booking ${b.uid || ''}`);
  return lines.join('\n');
}

function text(a: Answer): string {
  const v = typeof a === 'object' && a !== null ? a.value : a;
  if (v == null || v === '') return '';
  if (Array.isArray(v)) return v.map(String).join(', ');
  if (typeof v === 'object') return Object.values(v).filter(Boolean).join(', ');
  return String(v).trim();
}

function append(prev: unknown, note: string) {
  const p = ((prev as string) || '').trim();
  return p ? `${p}\n\n${note}` : note;
}

/** YYYY-MM-DD in London, the date Airtable shows. */
function bookingDate(iso?: string) {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleDateString('en-CA', { timeZone: TZ });
}

function when(iso?: string) {
  if (!iso) return 'time not given';
  return new Date(iso).toLocaleString('en-GB', {
    timeZone: TZ,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function esc(v: string) {
  return v.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function today() {
  return bookingDate();
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
