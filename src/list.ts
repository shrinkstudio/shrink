// Finsweet Attributes "list" (filter / sort / load / etc.), vendored into this
// repo under packages/list + packages/utils (Apache-2.0, see
// packages/FINSWEET-LICENSE.md). We own it and serve it from our own jsDelivr
// bundle instead of Finsweet's CDN.
//
// Usage in Webflow (no fs-list CDN script needed):
//   <script defer src="https://cdn.jsdelivr.net/gh/shrinkstudio/shrink@master/dist/list.js"></script>
// then the standard fs-list-* attributes (fs-list-element="list" / "filters",
// fs-list-field, fs-list-value, fs-list-element="clear", fs-list-filteringclass).
import { init as initList } from '@finsweet/attributes-list';
import {
  attachExternalStylesheets,
  fetchPage,
  type FinsweetAttributeKey,
  LIST_ATTRIBUTE,
} from '@finsweet/attributes-utils';

import { initButtonFilters } from './modules/button-filters';

// The solution packages read global config off `window.FinsweetAttributes`, which
// on Finsweet's CDN is set up by their loader package (not vendored — it only
// exists to lazy-load solutions from their CDN, which is exactly what we're
// replacing). We stand up the minimal shape the list package actually reads:
// `.scripts` is scanned for site-wide `fs-list-*` settings, so we point it at
// our own script tag — settings can live there instead of on every element.
const script = document.currentScript as HTMLScriptElement | null;

window.FinsweetAttributes ||= {
  push: () => undefined,
  load: () => undefined,
  version: 'vendored',
  modules: {},
  process: new Set<FinsweetAttributeKey>(),
  scripts: script ? [script] : [],
  utils: { fetchPage, attachExternalStylesheets },
};

// Must come before initList(): it injects the hidden filters form that
// Finsweet looks for when deciding whether to init filtering at all.
const buttonFilters = initButtonFilters();

const listPromise = Promise.resolve(initList());

// Repaint the pills once the list is up, so state restored from the URL query
// (which Finsweet writes straight to the radios) is reflected on the buttons.
void listPromise.then(() => buttonFilters?.sync());

// Expose the running instances so other modules in this bundle (and the console)
// can reach them, mirroring what Finsweet's loader would have registered.
window.FinsweetAttributes.modules[LIST_ATTRIBUTE] = {
  version: 'vendored',
  loading: listPromise,
  restart: async () => {
    (await listPromise)?.destroy?.();
    return initList();
  },
  destroy: () => {
    buttonFilters?.destroy();
    void listPromise.then((current) => current?.destroy?.());
  },
};
