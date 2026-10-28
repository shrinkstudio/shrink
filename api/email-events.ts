/**
 * Resend webhook → Airtable Shrink OS, for the automatic results emails.
 *
 * Every results email carries a `deal` tag with its Deal record id (api/forms.ts).
 * Events update that Deal's "Results email" status and "Last clicked":
 * - email.delivered: Sent → Delivered
 * - email.clicked: Clicked, Last clicked = now
 * - email.bounced / email.complained: status, plus a Slack ping so Ben knows
 * Opens are left out on purpose: Apple Mail opens every email itself, so they
 * say little.
 *
 * Signed by Resend (Svix): RESEND_WEBHOOK_SECRET is the endpoint's signing secret.
 * Stays self-contained (no relative imports): Vercel runs api/ files unbundled.
 *
 * Env (Vercel): AIRTABLE_TOKEN, RESEND_WEBHOOK_SECRET, SLACK_LEADS_WEBHOOK (optional).
 */

declare const process: { env: Record<string, string | undefined> };

const BASE = 'appx76yahrfuTcbiD';
const DEALS = 'tbl5TAoijwcEctsso';
const MAX_AGE_S = 5 * 60;

/* status only climbs: a late "delivered" never undoes "clicked" */
const RANK: Record<string, number> = { Sent: 1, Delivered: 2, Clicked: 3, Bounced: 4, Complained: 5 };

type ResendEvent = {
  type?: string;
  created_at?: string;
  data?: {
    to?: string[];
    subject?: string;
    tags?: Record<string, string> | { name?: string; value?: string }[];
    click?: { link?: string; timestamp?: string };
    bounce?: { message?: string; type?: string };
  };
};

export async function POST(request: Request): Promise<Response> {
  const raw = await request.text();
  if (!(await verify(request, raw))) return json({ ok: false, error: 'bad signature' }, 401);

  let ev: ResendEvent;
  try {
    ev = JSON.parse(raw);
  } catch {
    return json({ ok: false, error: 'bad json' }, 400);
  }

  const deal = tag(ev, 'deal');
  if (!deal || !/^rec[A-Za-z0-9]{14}$/.test(deal)) return json({ ok: true, skipped: 'no deal tag' });

  const status =
    ev.type === 'email.delivered'
      ? 'Delivered'
      : ev.type === 'email.clicked'
        ? 'Clicked'
        : ev.type === 'email.bounced'
          ? 'Bounced'
          : ev.type === 'email.complained'
            ? 'Complained'
            : '';
  if (!status) return json({ ok: true, skipped: ev.type });

  try {
    const current = await airtable(`${DEALS}/${deal}`, 'GET');
    const was = String(current.fields?.['Results email'] || '');
    const fields: Record<string, unknown> = {};
    if ((RANK[status] || 0) > (RANK[was] || 0)) fields['Results email'] = status;
    if (status === 'Clicked') fields['Last clicked'] = ev.data?.click?.timestamp || ev.created_at || new Date().toISOString();
    if (Object.keys(fields).length) await airtable(`${DEALS}/${deal}`, 'PATCH', { fields });

    if (status === 'Bounced' || status === 'Complained') {
      const who = String(current.fields?.['Lead name'] || current.fields?.Name || 'A lead');
      const to = ev.data?.to?.[0] || '';
      await notify(
        status === 'Bounced' ? 'Results email bounced' : 'Results email marked as spam',
        [
          `${who}${to ? ` (${to})` : ''}`,
          status === 'Bounced'
            ? `The address may be wrong: ${ev.data?.bounce?.message || ev.data?.bounce?.type || 'no reason given'}`
            : 'They marked it as spam. Leave them off any follow-up.',
        ],
        `https://airtable.com/${BASE}/${DEALS}/${deal}`
      );
    }
    return json({ ok: true, deal, status });
  } catch (err) {
    console.error('email event', ev.type, deal, err);
    // 500 so Resend retries
    return json({ ok: false, error: 'airtable failed' }, 500);
  }
}

function tag(ev: ResendEvent, name: string): string {
  const t = ev.data?.tags;
  if (Array.isArray(t)) return String(t.find((x) => x?.name === name)?.value || '');
  return t && typeof t === 'object' ? String(t[name] || '') : '';
}

/* Svix signature: base64 HMAC-SHA256 of "id.timestamp.body" with the decoded whsec_ secret */
async function verify(request: Request, raw: string): Promise<boolean> {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return false;
  const id = request.headers.get('svix-id') || '';
  const ts = request.headers.get('svix-timestamp') || '';
  const sigs = (request.headers.get('svix-signature') || '').split(' ');
  if (!id || !ts || !sigs.length) return false;
  if (Math.abs(Date.now() / 1000 - Number(ts)) > MAX_AGE_S) return false;

  const keyBytes = Uint8Array.from(atob(secret.replace(/^whsec_/, '')), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${id}.${ts}.${raw}`));
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)));
  return sigs.some((s) => timingSafeEqual(s.split(',')[1] || '', expected));
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
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

/* Slack ping (SLACK_LEADS_WEBHOOK), same shape as api/forms.ts. Never throws. */
const mrkdwn = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function notify(title: string, lines: string[], link: string): Promise<void> {
  const url = process.env.SLACK_LEADS_WEBHOOK;
  if (!url) return;
  const blocks = [
    { type: 'section', text: { type: 'mrkdwn', text: `*${mrkdwn(title)}*\n${lines.map(mrkdwn).join('\n')}` } },
    { type: 'actions', elements: [{ type: 'button', text: { type: 'plain_text', text: 'Open in Airtable' }, url: link }] },
  ];
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: `${title}: ${lines[0] || ''}`, blocks }),
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) console.error('slack notify', res.status, await res.text());
  } catch (err) {
    console.error('slack notify failed', err);
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}
