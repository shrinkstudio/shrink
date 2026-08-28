// Shrink Studio — site bundle entry point.
//
// This bundle is the behaviour layer only: Webflow owns classes and CSS, this
// owns behaviour/GSAP. Add modules per section as the build progresses and
// initialise them inside the Webflow.push callback below.
//
// GSAP + Flip are expected as globals from the CDN (see hover-list.ts).
import { initHoverList } from './modules/hover-list';

window.Webflow ||= [];
window.Webflow.push(() => {
  initHoverList();
});
