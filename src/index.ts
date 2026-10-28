// Shrink Studio — site bundle entry point.
//
// This bundle is the behaviour layer only: Webflow owns classes and CSS, this
// owns behaviour/GSAP. Add modules per section as the build progresses and
// initialise them inside the Webflow.push callback below.
//
// GSAP + Flip are expected as globals from the CDN (see utils/gsap.ts).
import { initAskAI } from './modules/ask-ai';
import { initConsent } from './modules/consent';
import { initCopyClip } from './modules/copy-clip';
import { initCurrentTime } from './modules/current-time';
import { initFaqSchema } from './modules/faq-schema';
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
// initial execution, not inside the deferred Webflow.push callback.
const currentScript = document.currentScript as HTMLScriptElement | null;

// The vendored Finsweet list ships as dist/list.js next to this file and loads
// only on pages that have a list. Requested now (the DOM is parsed, this script
// is deferred) so it downloads alongside Webflow's own scripts; it initialises
// itself in Webflow.push. Site-wide fs-list-* settings move across from our tag.
if (currentScript?.src && document.querySelector('[fs-list-element="list"]')) {
  const list = document.createElement('script');
  list.src = new URL('list.js', currentScript.src).href;
  for (const { name, value } of Array.from(currentScript.attributes)) {
    if (name.startsWith('fs-list')) list.setAttribute(name, value);
  }
  document.body.append(list);
}

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
  initFaqSchema();
});
