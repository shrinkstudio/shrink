/**
 * Slack ping for new leads: website forms, the readiness quiz and Cal.com bookings.
 *
 * Env (Vercel): SLACK_LEADS_WEBHOOK, a Slack incoming-webhook URL for the leads channel.
 * Unset: no ping, nothing else changes.
 *
 * Never throws. The Airtable write has already succeeded when this runs, and a Slack
 * failure must not turn the response into a 500 (Webflow and Cal would retry and the
 * duplicate guard would swallow the second ping anyway).
 */

declare const process: { env: Record<string, string | undefined> };

const BASE = 'appx76yahrfuTcbiD';
const TIMEOUT_MS = 3000;

/* Airtable record link for the "Open in Airtable" button */
export const recordUrl = (table: string, id?: string) =>
  id ? `https://airtable.com/${BASE}/${table}/${id}` : undefined;

/* "Tue 27 Oct, 11:00" in London time */
export const londonTime = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const day = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'Europe/London',
  }).format(d);
  const time = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Europe/London',
  }).format(d);
  return `${day}, ${time}`;
};

/* Slack mrkdwn escaping */
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const clip = (s: string | undefined, n = 280) => {
  const t = (s || '').replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};

type Line = string | false | null | undefined;

export async function notify(title: string, lines: Line[], link?: string): Promise<void> {
  const url = process.env.SLACK_LEADS_WEBHOOK;
  if (!url) return;

  const body = lines
    .filter((l): l is string => !!l)
    .map(esc)
    .join('\n');
  const blocks: unknown[] = [
    { type: 'section', text: { type: 'mrkdwn', text: `*${esc(title)}*\n${body}` } },
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
