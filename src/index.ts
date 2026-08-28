// Shrink Studio — site bundle entry point.
//
// This bundle is the behaviour layer only: Webflow owns classes and CSS, this
// owns behaviour/GSAP. Add modules per section as the build progresses and
// initialise them inside the Webflow.push callback below.
//
// GSAP + Flip are expected as globals from the CDN (see utils/gsap.ts).
import { initHoverList } from './modules/hover-list';
import { initTeamHover } from './modules/team-hover';

window.Webflow ||= [];
window.Webflow.push(() => {
  initHoverList();
  initTeamHover();
});
