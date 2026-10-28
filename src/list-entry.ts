// Lazy entry for the Finsweet list: built to dist/list.js and injected by
// index.ts only on pages with `[fs-list-element="list"]` (Resources, Case
// Studies, FAQ). Keeps the list, Vue reactivity and fuzzysort (about two thirds
// of the old single bundle) off every other page; still one footer tag.
import { initFinsweetList } from './list';

// Our own <script> tag, valid only during initial execution. index.ts copies any
// fs-list-* settings from the bundle tag onto it, so the list still reads them.
const script = document.currentScript as HTMLScriptElement | null;

window.Webflow ||= [];
window.Webflow.push(() => {
  void initFinsweetList(script);
});
