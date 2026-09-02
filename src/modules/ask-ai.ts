// -----------------------------------------
// ASK AI — footer widget: open an AI assistant with a prefilled prompt about Shrink.
// Buttons are Webflow elements with [data-ask-ai="<platform>"] and a CMS-bound
// [data-ask-ai-prompt]. JS only attaches behaviour; markup + styling stay in Webflow.
// Ported from shrinkstudio/shrink-studio-site/src/ask-ai.js.
//
// Webflow binding (LLM Answers CMS): data-ask-ai <- Data Platform field,
// data-ask-ai-prompt <- Prompt field.
// -----------------------------------------

// Used if a button has no [data-ask-ai-prompt] set.
const FALLBACK_PROMPT =
  "I'm evaluating Shrink Studio (https://shrink.studio) as a potential web design agency partner. Please visit their site and summarise: what they specialise in, what types of companies they work with, how they're different from a traditional web agency, and any strengths or weaknesses I should consider. Keep it concise and neutral.";

interface Tool {
  mode: 'link' | 'copy';
  url: string;
}

const TOOLS: Record<string, Tool> = {
  chatgpt: { mode: 'link', url: 'https://chatgpt.com/?q=' },
  perplexity: { mode: 'link', url: 'https://www.perplexity.ai/search/new?q=' },
  claude: { mode: 'link', url: 'https://claude.ai/new?q=' },
  gemini: { mode: 'link', url: 'https://www.google.com/search?udm=50&aep=11&q=' },
};

let listeners: Array<{ element: Element; type: string; handler: EventListener }> = [];

async function copyText(text: string): Promise<void> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch {
    // Fall through to execCommand path.
  }

  const t = document.createElement('textarea');
  t.value = text;
  t.style.position = 'fixed';
  t.style.opacity = '0';
  t.style.pointerEvents = 'none';
  document.body.appendChild(t);
  t.select();
  try {
    document.execCommand('copy');
  } catch {
    // Best effort.
  }
  document.body.removeChild(t);
}

function getPrompt(el: Element): string {
  // Button first, then walk up in case the attribute sits on a wrapper
  // (some CMS bindings expose attributes higher in the tree).
  let node: Node | null = el;
  while (node && node !== document.body) {
    if (node instanceof Element) {
      const v = node.getAttribute('data-ask-ai-prompt');
      if (v && v.trim()) return v.trim();
    }
    node = node.parentNode;
  }
  return FALLBACK_PROMPT;
}

function handleClick(e: Event): void {
  const trigger = e.currentTarget as Element;
  const tool = TOOLS[trigger.getAttribute('data-ask-ai') ?? ''];
  if (!tool) return;
  e.preventDefault();

  const prompt = getPrompt(trigger);

  if (tool.mode === 'link') {
    window.open(tool.url + encodeURIComponent(prompt), '_blank', 'noopener');
    return;
  }

  // Copy mode: open the tab synchronously first (so Safari does not block the
  // popup), then write the prompt to clipboard for the user to paste.
  window.open(tool.url, '_blank', 'noopener');
  void copyText(prompt);
}

export function initAskAI(scope: ParentNode = document): void {
  const triggers = scope.querySelectorAll<HTMLElement>('[data-ask-ai]');
  if (!triggers.length) return;

  triggers.forEach((btn) => {
    btn.addEventListener('click', handleClick);
    listeners.push({ element: btn, type: 'click', handler: handleClick });
  });
}

export function destroyAskAI(): void {
  listeners.forEach((item) => {
    item.element.removeEventListener(item.type, item.handler);
  });
  listeners = [];
}
