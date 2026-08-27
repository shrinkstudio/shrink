import { WEBFLOW_BREAKPOINTS } from '../constants';
import type { DropdownToggle, WebflowBreakpoint, WebflowModule } from '../types';
import { simulateEvent } from './events';

/**
 * @returns The Webflow Site ID of the website.
 * @param page The page to get the site ID from. Defaults to the current page.
 */
export const getSiteId = (page = document): string | null => page.documentElement.getAttribute('data-wf-site');

/**
 * Extracts the publish date of a Webflow site
 * @returns A Date object, if found.
 * @param page The page to get the publish date from. Defaults to the current page.
 */
export const getPublishDate = (page = document): Date | undefined => {
  const publishDatePrefix = 'Last Published:';

  for (const node of page.childNodes) {
    if (node.nodeType === Node.COMMENT_NODE && node.textContent?.includes(publishDatePrefix)) {
      const publishDateValue = node.textContent.trim().split(publishDatePrefix)[1];
      if (publishDateValue) return new Date(publishDateValue);
    }
  }
};

/**
 * Restarts the Webflow JS library.
 *
 * @param modules An array of {@link WebflowModule} to restart. If passed, only those modules will be restarted instead of the whole `Webflow` instance.
 *
 * @returns An awaitable promise that is fulfilled when the library has been correctly reinitialized.
 */
export const restartWebflow = async (modules?: WebflowModule[]): Promise<unknown> => {
  const { Webflow } = window;
  if (!Webflow || !('destroy' in Webflow) || !('ready' in Webflow) || !('require' in Webflow)) return;

  if (modules && !modules.length) return;

  // Global
  if (!modules) {
    Webflow.destroy();
    Webflow.ready();
  }

  // IX2
  if (!modules || modules.includes('ix2')) {
    const ix2 = Webflow.require('ix2');

    if (ix2) {
      const { store, actions } = ix2;
      const { eventState } = store.getState().ixSession;
      const stateEntries = Object.entries(eventState);

      if (!modules) ix2.destroy();

      ix2.init();

      await Promise.all(stateEntries.map((state) => store.dispatch(actions.eventStateChanged(...state))));
    }
  }

  // Commerce
  if (!modules || modules.includes('commerce')) {
    const commerce = Webflow.require('commerce');
    const siteId = getSiteId();

    if (commerce && siteId) {
      commerce.destroy();
      commerce.init({ siteId, apiUrl: 'https://render.webflow.com' });
    }
  }

  // Lightbox
  if (modules?.includes('lightbox')) Webflow.require('lightbox')?.ready();

  // Slider
  if (modules?.includes('slider')) {
    const slider = Webflow.require('slider');

    if (slider) {
      slider.redraw();
      slider.ready();
    }
  }

  // Tabs
  if (modules?.includes('tabs')) Webflow.require('tabs')?.redraw();

  return new Promise((resolve) => Webflow.push(() => resolve(undefined)));
};

/**
 * Checks the current breakpoint based on the window media.
 *
 * @returns A {@link WebflowBreakpoint} string.
 */
export const getCurrentBreakpoint = (): WebflowBreakpoint => {
  for (const [breakpoint, mediaQuery] of WEBFLOW_BREAKPOINTS) {
    if (window.matchMedia(mediaQuery).matches) {
      return breakpoint;
    }
  }

  return 'main';
};

/**
 * Closes a Webflow dropdown.
 * @param dropdownToggle A {@link DropdownToggle} element.
 * @param focusToggle Defaults to `true`.
 */
export const closeDropdown = (dropdownToggle: DropdownToggle, focusToggle = true) => {
  if (focusToggle) dropdownToggle.focus();

  simulateEvent(dropdownToggle, 'w-close');
};
