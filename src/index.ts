// Shrink Studio — site bundle entry point.
//
// This bundle is the behaviour layer only: Webflow owns classes and CSS, this
// owns behaviour/GSAP. Add modules per section as the build progresses and
// initialise them inside the Webflow.push callback below.
//
// GSAP + Flip are expected as globals from the CDN (see utils/gsap.ts).
import { initFinsweetList } from './list';
import { initAskAI } from './modules/ask-ai';
import { initConsent } from './modules/consent';
import { initCopyClip } from './modules/copy-clip';
import { initCurrentTime } from './modules/current-time';
import { initFormPrefill } from './modules/form-prefill';
import { initFormValidate } from './modules/form-validate';
import { initHoverList } from './modules/hover-list';
import { initInview } from './modules/inview';
import { initMegaNav } from './modules/mega-nav';
import { initMeshGradient } from './modules/mesh-gradient';
import { initReadTime } from './modules/read-time';
import { initScrollDots } from './modules/scroll-dots';
import { initSegmented } from './modules/segmented';
import { initStageScale } from './modules/stage-scale';
import { initTeamHover } from './modules/team-hover';
import { initTestimonialTabs } from './modules/testimonial-tabs';
import { initTestimonials } from './modules/testimonials';
import { initToc } from './modules/toc';
import { initTrack } from './modules/track';

// Capture our own <script> tag now: document.currentScript is only valid during
// initial execution, not inside the deferred Webflow.push callback. The list
// setup reads it for site-wide fs-list-* settings.
const currentScript = document.currentScript as HTMLScriptElement | null;

window.Webflow ||= [];
window.Webflow.push(() => {
  initConsent();
  initMegaNav();
  initMeshGradient();
  initHoverList();
  initTeamHover();
  initAskAI();
  initCurrentTime();
  initToc();
  initReadTime();
  initStageScale();
  initScrollDots();
  initInview();
  initFormValidate();
  initFormPrefill();
  initCopyClip();
  initTestimonials();
  initSegmented();
  initTestimonialTabs();
  initTrack();

  // The vendored Finsweet list is ~100KB of the bundle; only stand it up on
  // pages that actually have a list to filter.
  if (document.querySelector('[fs-list-element="list"]')) {
    initFinsweetList(currentScript);
  }
});
