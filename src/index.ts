// Shrink Studio — site bundle entry point.
//
// This bundle is the behaviour layer only: Webflow owns classes and CSS, this
// owns behaviour/GSAP. Add modules per section as the build progresses and
// initialise them inside the Webflow.push callback below.
//
// GSAP + Flip are expected as globals from the CDN (see utils/gsap.ts).
import { initFinsweetList } from './list';
import { initAskAI } from './modules/ask-ai';
import { initCurrentTime } from './modules/current-time';
import { initHoverList } from './modules/hover-list';
import { initTeamHover } from './modules/team-hover';
import { initToc } from './modules/toc';

// Capture our own <script> tag now: document.currentScript is only valid during
// initial execution, not inside the deferred Webflow.push callback. The list
// setup reads it for site-wide fs-list-* settings.
const currentScript = document.currentScript as HTMLScriptElement | null;

window.Webflow ||= [];
window.Webflow.push(() => {
  initHoverList();
  initTeamHover();
  initAskAI();
  initCurrentTime();
  initToc();

  // The vendored Finsweet list is ~100KB of the bundle; only stand it up on
  // pages that actually have a list to filter.
  if (document.querySelector('[fs-list-element="list"]')) {
    initFinsweetList(currentScript);
  }
});
