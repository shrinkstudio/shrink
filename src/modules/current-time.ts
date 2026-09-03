// -----------------------------------------
// CURRENT TIME — live local clock for a location
// -----------------------------------------
// Ticks a real-time clock every second for each [data-current-time] element.
// The attribute value is an IANA timezone (e.g. "Europe/Amsterdam"); omit it to
// fall back to DEFAULT_TIMEZONE.
//
// Markup (CSS/layout built in Webflow):
//   [data-current-time="Europe/Amsterdam"]
//     [data-current-time-hours]      ← "09"
//     [data-current-time-minutes]    ← "41"
//     [data-current-time-seconds]    ← "07"
//     [data-current-time-timezone]   ← "CEST"
//
// Any child is optional: only the ones present are written. One shared interval
// drives every clock on the page and re-scans the document each tick, so clocks
// added by a page transition start ticking without a re-init.
// -----------------------------------------

const DEFAULT_TIMEZONE = 'Europe/Amsterdam';

// timezone -> formatter, so we build each Intl formatter once, not every tick.
const formatters = new Map<string, Intl.DateTimeFormat>();

let intervalId: ReturnType<typeof setInterval> | null = null;

const getFormatter = (timezone: string): Intl.DateTimeFormat => {
  let formatter = formatters.get(timezone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat([], {
      timeZone: timezone,
      timeZoneName: 'short',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    formatters.set(timezone, formatter);
  }
  return formatter;
};

const setPart = (parent: Element, selector: string, value: string | undefined) => {
  if (value === undefined) return;
  const node = parent.querySelector(selector);
  if (node) node.textContent = value;
};

const tick = () => {
  const now = new Date();

  for (const element of document.querySelectorAll<HTMLElement>('[data-current-time]')) {
    const timezone = element.getAttribute('data-current-time') || DEFAULT_TIMEZONE;

    let parts: Intl.DateTimeFormatPart[];
    try {
      parts = getFormatter(timezone).formatToParts(now);
    } catch {
      // Invalid timezone string — skip this element rather than throwing.
      continue;
    }

    const value = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((part) => part.type === type)?.value;

    setPart(element, '[data-current-time-hours]', value('hour'));
    setPart(element, '[data-current-time-minutes]', value('minute'));
    setPart(element, '[data-current-time-seconds]', value('second'));
    setPart(element, '[data-current-time-timezone]', value('timeZoneName'));
  }
};

/**
 * Starts the clock. Paints once immediately, then ticks every second.
 * Safe to call repeatedly — the interval is only started once.
 *
 * @param scope Unused; the shared interval always scans the whole document so
 *   clocks added later still update. Kept for a consistent module signature.
 */
export const initCurrentTime = (_scope: ParentNode = document) => {
  if (!document.querySelector('[data-current-time]')) return;
  tick();
  if (intervalId === null) intervalId = setInterval(tick, 1000);
};

/**
 * Stops the clock, so the module can be re-initialised on a page transition
 * without stacking duplicate intervals.
 */
export const destroyCurrentTime = () => {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
};
