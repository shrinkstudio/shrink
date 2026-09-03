// Finsweet Attributes "list" (filter / sort / load / etc.), vendored into this
// repo under packages/list + packages/utils (Apache-2.0, see
// packages/FINSWEET-LICENSE.md). We own it and serve it from our own jsDelivr
// bundle instead of Finsweet's CDN.
//
// Part of the single site bundle (dist/index.js). index.ts calls initFinsweetList()
// only on pages that actually have a list, so the setup below never runs where
// there is nothing to filter. Uses the standard fs-list-* attributes
// (fs-list-element="list" / "filters", fs-list-field, fs-list-value,
// fs-list-element="clear", fs-list-filteringclass).
import { init as initList } from '@finsweet/attributes-list';
import {
  attachExternalStylesheets,
  fetchPage,
  type FinsweetAttributeKey,
  LIST_ATTRIBUTE,
} from '@finsweet/attributes-utils';

import { initButtonFilters } from './modules/button-filters';

/**
 * Stands up the vendored Finsweet list + our button-filter adapter.
 *
 * @param script The bundle's own <script> tag, captured at load time in index.ts.
 *   `document.currentScript` is only valid during initial execution, so it can't
 *   be read from inside the deferred Webflow.push callback — it's passed in.
 *   The list package scans `FinsweetAttributes.scripts` for site-wide fs-list-*
 *   settings, so pointing it at our tag lets settings live there.
 */
export function initFinsweetList(script: HTMLScriptElement | null): Promise<unknown> {
  // The solution packages read global config off `window.FinsweetAttributes`,
  // which on Finsweet's CDN is set up by their loader (not vendored — it only
  // lazy-loads solutions from their CDN, which is what we're replacing). Stand
  // up the minimal shape the list package actually reads.
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

  // Expose the running instances so other modules in this bundle (and the
  // console) can reach them, mirroring what Finsweet's loader would register.
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

  return listPromise;
}
