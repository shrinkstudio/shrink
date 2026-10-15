/**
 * Cal.com inline booking calendar.
 * Loads Cal's embed.js once per page (shared queue stub, same as Cal's snippet),
 * mounts the inline month view into this component, and keeps a plain link to
 * the event as the fallback while loading or if Cal fails.
 * The event comes from the Link prop, CMS-bound to Calls > Cal Link on /calls/*.
 */
import { useEffect, useRef, useState } from 'react';
import { css } from './styles';

type CalApi = ((...args: unknown[]) => void) & {
  q?: unknown[][];
  ns?: Record<string, CalApi>;
  loaded?: boolean;
};

declare global {
  interface Window {
    Cal?: CalApi;
  }
}

const SCRIPT = 'https://app.cal.com/embed/embed.js';
const ORIGIN = 'https://app.cal.com';

let instances = 0;

export interface CalEmbedProps {
  link?: { href: string; target?: string };
  fallbackText?: string;
  brandColor?: string;
  layout?: 'month_view' | 'week_view' | 'column_view';
}

type State = 'empty' | 'loading' | 'ready' | 'error';

// Cal's loader stub, typed: queues calls until embed.js arrives
function calStub(): CalApi {
  if (window.Cal) return window.Cal;
  const push = (api: CalApi, args: unknown[]) => api.q!.push(args);
  const cal = function (...args: unknown[]) {
    const self = window.Cal!;
    if (!self.loaded) {
      self.ns = {};
      self.q = self.q || [];
      document.head.appendChild(document.createElement('script')).src = SCRIPT;
      self.loaded = true;
    }
    if (args[0] === 'init' && typeof args[1] === 'string') {
      const namespace = args[1];
      const api = (self.ns![namespace] ||= Object.assign((...a: unknown[]) => push(api, a), {
        q: [] as unknown[][],
      }) as CalApi);
      push(api, args);
      push(self, ['initNamespace', namespace]);
      return;
    }
    push(self, args);
  } as CalApi;
  cal.q = [];
  window.Cal = cal;
  return cal;
}

/** https://cal.com/shrinkstudio/30min → shrinkstudio/30min */
export function calLinkFrom(href?: string): string | null {
  if (!href) return null;
  try {
    const url = new URL(href, 'https://cal.com');
    if (!url.hostname.endsWith('cal.com')) return null;
    return url.pathname.replace(/^\/+|\/+$/g, '') || null;
  } catch {
    return null;
  }
}

export function CalEmbed({
  link,
  fallbackText = 'Pick a time on Cal.com',
  brandColor = '#1a1c21',
  layout = 'month_view',
}: CalEmbedProps) {
  const target = useRef<HTMLDivElement>(null);
  const calLink = calLinkFrom(link?.href);
  const [state, setState] = useState<State>(calLink ? 'loading' : 'empty');

  useEffect(() => {
    const el = target.current;
    if (!calLink || !el) return;
    setState('loading');

    const ns = `shrink${++instances}`;
    const Cal = calStub();
    Cal('init', ns, { origin: ORIGIN });
    const api = Cal.ns![ns];
    api('inline', {
      elementOrSelector: el,
      calLink,
      config: { layout, theme: 'light', useSlotsViewOnSmallScreen: 'true' },
    });
    api('ui', {
      theme: 'light',
      layout,
      hideEventTypeDetails: true,
      cssVarsPerTheme: { light: { 'cal-brand': brandColor } },
    });
    api('on', { action: 'linkReady', callback: () => setState('ready') });
    api('on', { action: 'linkFailed', callback: () => setState('error') });

    return () => {
      el.replaceChildren();
    };
  }, [calLink, brandColor, layout]);

  return (
    <div className="cal" data-state={state}>
      <style>{css}</style>
      <div className="cal_target" ref={target} />
      {state === 'empty' ? (
        <p className="cal_note">Set the Cal link (eg. https://cal.com/shrinkstudio/30min).</p>
      ) : (
        state !== 'ready' && (
          <a className="cal_fallback" href={link!.href} target="_blank" rel="noopener">
            {fallbackText} <span aria-hidden="true">↗</span>
          </a>
        )
      )}
    </div>
  );
}
