// -----------------------------------------
// MEGA NAV — one dropdown panel that morphs between menus
// -----------------------------------------
// Ported from the shared mega-nav.js (Osmo cloneable; Steamhaus, nxzen,
// ss-master). New here: the container morphs width as well as height, so a
// wide Services panel and a narrow Resources panel share one box.
//
// Markup (classes and CSS live in Webflow):
//   [data-menu-wrap]                         ← root; gets data-menu-open
//     [data-menu-logo]                       ← hidden while a phone panel is open
//     [data-nav-list]                        ← links; the full-screen menu on phones
//       [data-nav-list-item]                 ← staggered in on phones
//         button[data-dropdown-toggle="services"]
//     [data-burger-toggle] > [data-burger-line="top|mid|bot"]
//     [data-mobile-back]                     ← Back, shown while a phone panel is open
//     [data-dropdown-wrapper]
//       [data-dropdown-container]            ← morphs width + height
//         [data-nav-content="services"]      ← one per toggle; gets data-panel-state
//           [data-menu-fade]                 ← staggered in
//     [data-menu-backdrop]
//
// State written: data-menu-open on the root, aria-expanded on toggles and the
// burger, data-panel-state="active" on the open panel. No classes.
// -----------------------------------------

import { canHover, type GsapTimeline } from '../utils/gsap';

const PHONE = 991;
const HOVER_ENTER = 120;
const HOVER_LEAVE = 150;

/* durations */
const DUR = {
  morph: 0.4,
  contentIn: 0.3,
  contentOut: 0.2,
  stagger: 0.25,
  backdropIn: 0.3,
  backdropOut: 0.2,
  open: 0.35,
  close: 0.25,
};

let cleanup: (() => void) | null = null;

export const initMegaNav = (scope: ParentNode = document) => {
  const { gsap } = window;
  const menuWrap = scope.querySelector<HTMLElement>('[data-menu-wrap]');
  if (!gsap || !menuWrap || cleanup) return;

  const q = <T extends Element = HTMLElement>(sel: string) => menuWrap.querySelector<T>(sel);
  const navList = q('[data-nav-list]');
  const dropWrapper = q('[data-dropdown-wrapper]');
  const dropContainer = q('[data-dropdown-container]');
  const backdrop = q('[data-menu-backdrop]');
  const burger = q('[data-burger-toggle]');
  const backBtn = q('[data-mobile-back]');
  const logo = q('[data-menu-logo]');
  const lines = ['top', 'mid', 'bot'].map((l) => q(`[data-burger-line="${l}"]`));
  const [lineTop, lineMid, lineBot] = lines;
  const toggles = [...menuWrap.querySelectorAll<HTMLElement>('[data-dropdown-toggle]')];
  const panels = [...menuWrap.querySelectorAll<HTMLElement>('[data-nav-content]')];
  if (!navList || !dropWrapper || !dropContainer || !toggles.length || !panels.length) return;

  // reduced motion: same states, no travel
  const speed = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0.01 : 1;
  const d = (key: keyof typeof DUR) => DUR[key] * speed;

  const state = {
    isOpen: false,
    closing: false,
    active: null as string | null,
    isMobile: window.innerWidth <= PHONE,
    mobileOpen: false,
    mobilePanel: null as string | null,
    hoverTimer: 0,
    leaveTimer: 0,
    tl: null as GsapTimeline | null,
    mobileTl: null as GsapTimeline | null,
    panelTl: null as GsapTimeline | null,
  };

  const getPanel = (name: string | null) => (name ? q(`[data-nav-content="${name}"]`) : null);
  const getToggle = (name: string | null) => (name ? q(`[data-dropdown-toggle="${name}"]`) : null);
  const getFade = (el: Element) => el.querySelectorAll('[data-menu-fade]');
  const getNavItems = () => navList.querySelectorAll('[data-nav-list-item]');
  const indexOf = (name: string) => toggles.indexOf(getToggle(name) as HTMLElement);
  const stagger = (n: number) => (n <= 1 ? 0 : { amount: d('stagger') });
  const visible = lines.filter(Boolean);

  // link each toggle to its panel for assistive tech
  toggles.forEach((toggle) => {
    const panel = getPanel(toggle.getAttribute('data-dropdown-toggle'));
    if (!panel) return;
    panel.id ||= `mega-nav-${toggle.getAttribute('data-dropdown-toggle')}`;
    toggle.setAttribute('aria-controls', panel.id);
    toggle.setAttribute('aria-expanded', 'false');
  });

  const clearTimers = () => {
    window.clearTimeout(state.hoverTimer);
    window.clearTimeout(state.leaveTimer);
  };

  const killTl = (key: 'tl' | 'mobileTl' | 'panelTl') => {
    state[key]?.kill();
    state[key] = null;
  };

  const killDropdown = () => {
    killTl('tl');
    gsap.killTweensOf([dropContainer, backdrop]);
    panels.forEach((p) => {
      gsap.killTweensOf(p);
      gsap.killTweensOf(getFade(p));
    });
  };

  const killMobile = () => {
    killTl('mobileTl');
    gsap.killTweensOf([navList, ...visible]);
  };

  const killMobilePanel = () => {
    killTl('panelTl');
    gsap.killTweensOf(getNavItems());
    gsap.killTweensOf([backBtn, logo]);
    panels.forEach((p) => {
      gsap.killTweensOf(p);
      gsap.killTweensOf(getFade(p));
    });
  };

  const setActive = (name: string | null) => {
    toggles.forEach((t) =>
      t.setAttribute('aria-expanded', String(t.getAttribute('data-dropdown-toggle') === name))
    );
    panels.forEach((p) => {
      if (p.getAttribute('data-nav-content') === name) p.setAttribute('data-panel-state', 'active');
      else p.removeAttribute('data-panel-state');
    });
  };

  const hide = { visibility: 'hidden', opacity: 0, pointerEvents: 'none' };
  const show = { visibility: 'visible', opacity: 1, pointerEvents: 'auto' };

  const resetDesktop = () => {
    panels.forEach((p) => {
      gsap.set(p, { ...hide, x: 0 });
      gsap.set(getFade(p), { autoAlpha: 0, x: 0, y: 0 });
    });
    gsap.set(dropContainer, { height: 0 });
    if (backdrop) gsap.set(backdrop, { autoAlpha: 0 });
    menuWrap.setAttribute('data-menu-open', 'false');
    setActive(null);
  };

  const setupMobile = () => {
    panels.forEach((p) => {
      gsap.set(p, { autoAlpha: 0, x: 0, visibility: 'visible', pointerEvents: 'none' });
      gsap.set(getFade(p), { xPercent: 20, autoAlpha: 0 });
    });
    gsap.set(getNavItems(), { xPercent: 0, y: 0, autoAlpha: 1 });
    gsap.set(navList, { autoAlpha: 0 });
    if (backBtn) gsap.set(backBtn, { autoAlpha: 0 });
    if (logo) gsap.set(logo, { autoAlpha: 1 });
    gsap.set(dropContainer, { clearProps: 'width,height' });
    gsap.set(dropWrapper, { autoAlpha: 0, pointerEvents: 'none' });
    if (backdrop) gsap.set(backdrop, { autoAlpha: 0 });
  };

  // a panel's natural size, read while it is invisible
  const measure = (name: string) => {
    const el = getPanel(name);
    if (!el) return null;
    const { style } = el;
    const prev = [style.visibility, style.opacity, style.pointerEvents];
    Object.assign(style, { visibility: 'visible', opacity: '0', pointerEvents: 'none' });
    const { width, height } = el.getBoundingClientRect();
    [style.visibility, style.opacity, style.pointerEvents] = prev;
    return height ? { width, height } : null;
  };

  // DESKTOP: first open
  const openDropdown = (name: string) => {
    if (state.closing && state.active === name) {
      reopen(name);
      return;
    }
    if (state.isOpen && state.active === name) return;
    if (state.isOpen && state.active) {
      switchPanel(state.active, name);
      return;
    }
    const size = measure(name);
    const el = getPanel(name);
    if (!size || !el) return;

    killDropdown();
    resetDesktop();
    state.isOpen = true;
    state.active = name;
    menuWrap.setAttribute('data-menu-open', 'true');
    setActive(name);

    // width snaps on first open; only height grows
    gsap.set(dropContainer, { width: size.width, height: 0 });
    const fade = getFade(el);
    const tl = gsap.timeline();
    state.tl = tl;
    if (backdrop)
      tl.to(backdrop, { autoAlpha: 1, duration: d('backdropIn'), ease: 'power2.out' }, 0);
    tl.to(dropContainer, { height: size.height, duration: d('open'), ease: 'power3.out' }, 0);
    tl.set(el, show, 0.05);
    if (fade.length) {
      tl.fromTo(
        fade,
        { autoAlpha: 0, y: 8 },
        {
          autoAlpha: 1,
          y: 0,
          duration: d('contentIn'),
          stagger: stagger(fade.length),
          ease: 'power3.out',
        },
        0.1
      );
    }
  };

  // DESKTOP: pointer came back while the panel was closing; grow it again
  const reopen = (name: string) => {
    const el = getPanel(name);
    const size = measure(name);
    if (!el || !size) return;
    killDropdown();
    state.closing = false;
    menuWrap.setAttribute('data-menu-open', 'true');
    setActive(name);

    const tl = gsap.timeline();
    state.tl = tl;
    if (backdrop)
      tl.to(backdrop, { autoAlpha: 1, duration: d('backdropIn'), ease: 'power2.out' }, 0);
    tl.to(dropContainer, { height: size.height, duration: d('open'), ease: 'power3.out' }, 0);
    tl.set(el, show, 0);
    tl.to(
      getFade(el),
      { autoAlpha: 1, x: 0, y: 0, duration: d('contentIn'), ease: 'power3.out' },
      0
    );
  };

  // DESKTOP: close
  const closeDropdown = () => {
    if (!state.isOpen) return;
    const el = getPanel(state.active);
    const fade = el ? getFade(el) : [];
    killDropdown();
    state.closing = true;

    const tl = gsap.timeline({
      onComplete: () => {
        state.closing = false;
        state.isOpen = false;
        state.active = null;
        state.tl = null;
        resetDesktop();
      },
    });
    state.tl = tl;
    if (fade.length) {
      tl.to(fade, { autoAlpha: 0, y: -4, duration: d('contentOut') * 0.7, ease: 'power2.in' }, 0);
    }
    tl.to(dropContainer, { height: 0, duration: d('close'), ease: 'power2.in' }, 0.05);
    if (backdrop)
      tl.to(backdrop, { autoAlpha: 0, duration: d('backdropOut'), ease: 'power2.out' }, 0);
    if (el) tl.set(el, hide);
  };

  // DESKTOP: switch panel, content slides the way the pointer moved
  const switchPanel = (from: string, to: string) => {
    const dir = indexOf(to) > indexOf(from) ? 1 : -1;
    const fromEl = getPanel(from);
    const toEl = getPanel(to);
    const size = measure(to);
    if (!fromEl || !toEl || !size) return;

    const fromFade = getFade(fromEl);
    const toFade = getFade(toEl);
    killDropdown();
    state.closing = false;

    panels.forEach((p) => {
      gsap.set(p, { ...hide, x: 0 });
      gsap.set(getFade(p), { autoAlpha: 0, x: 0, y: 0 });
    });
    gsap.set(fromEl, show);
    gsap.set(fromFade, { autoAlpha: 1, x: 0, y: 0 });
    if (backdrop) gsap.set(backdrop, { autoAlpha: 1 });

    state.active = to;
    setActive(to);

    const out = d('contentOut');
    const tl = gsap.timeline();
    state.tl = tl;
    if (fromFade.length) {
      tl.to(fromFade, { autoAlpha: 0, x: dir * -30, duration: out, ease: 'power2.in' }, 0);
    }
    tl.set(fromEl, hide, out);
    tl.set(fromFade, { x: 0 }, out);
    tl.to(
      dropContainer,
      { width: size.width, height: size.height, duration: d('morph'), ease: 'power3.out' },
      0.05
    );
    tl.set(toEl, show, out * 0.5);
    if (toFade.length) {
      tl.fromTo(
        toFade,
        { autoAlpha: 0, x: dir * 30 },
        {
          autoAlpha: 1,
          x: 0,
          duration: d('contentIn'),
          stagger: stagger(toFade.length),
          ease: 'power3.out',
        },
        out * 0.6
      );
    }
  };

  // DESKTOP: hover intent
  const onToggleEnter = (e: Event) => {
    if (state.isMobile) return;
    const name = (e.currentTarget as HTMLElement).getAttribute('data-dropdown-toggle');
    if (!name) return;
    clearTimers();
    state.hoverTimer = window.setTimeout(() => openDropdown(name), state.isOpen ? 0 : HOVER_ENTER);
  };

  // one pending close at a time: a stray timer would shut a panel just opened
  const scheduleClose = () => {
    clearTimers();
    state.leaveTimer = window.setTimeout(closeDropdown, HOVER_LEAVE);
  };

  const onLeave = () => {
    if (!state.isMobile) scheduleClose();
  };

  const onWrapperEnter = () => {
    if (!state.isMobile) window.clearTimeout(state.leaveTimer);
  };

  // plain links in the bar close an open panel when hovered
  const plainItems = [...navList.querySelectorAll<HTMLElement>('a')].filter(
    (a) => !a.closest('[data-nav-content]')
  );
  const onPlainEnter = () => {
    if (!state.isMobile && state.isOpen) scheduleClose();
  };

  // DESKTOP: keyboard
  const focusFirstLink = (name: string) => {
    window.setTimeout(() => {
      const link = getPanel(name)?.querySelector<HTMLElement>('a, button');
      if (!link) return;
      gsap.set(link, { visibility: 'visible' });
      link.focus();
    }, 80);
  };

  const onToggleKey = (e: KeyboardEvent) => {
    if (state.isMobile) return;
    const name = (e.currentTarget as HTMLElement).getAttribute('data-dropdown-toggle');
    if (!name) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (state.isOpen && state.active === name) closeDropdown();
      else {
        openDropdown(name);
        focusFirstLink(name);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!state.isOpen || state.active !== name) openDropdown(name);
      focusFirstLink(name);
    } else if (e.key === 'Tab' && !e.shiftKey && state.isOpen && state.active === name) {
      e.preventDefault();
      getPanel(name)?.querySelector<HTMLElement>('a, button')?.focus();
    }
  };

  const onPanelKey = (e: KeyboardEvent) => {
    if (state.isMobile || !state.isOpen) return;
    const el = getPanel(state.active);
    if (!el) return;
    const links = [...el.querySelectorAll<HTMLElement>('a, button')];
    const idx = links.indexOf(document.activeElement as HTMLElement);
    const toggle = getToggle(state.active);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      links[(idx + 1) % links.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (idx <= 0) toggle?.focus();
      else links[idx - 1].focus();
    } else if (e.key === 'Tab' && !e.shiftKey && idx === links.length - 1) {
      // past the last link: on to the next item in the bar
      e.preventDefault();
      const items = [...navList.querySelectorAll<HTMLElement>('a, button')].filter(
        (n) => !n.closest('[data-nav-content]')
      );
      const next = toggle ? items[items.indexOf(toggle) + 1] : null;
      closeDropdown();
      next?.focus();
    } else if (e.key === 'Tab' && e.shiftKey && idx === 0) {
      e.preventDefault();
      toggle?.focus();
    }
  };

  const onEscape = (e: KeyboardEvent) => {
    if (e.key !== 'Escape') return;
    if (state.isMobile) {
      if (state.mobilePanel) closeMobilePanel();
      else if (state.mobileOpen) closeMobileMenu();
      return;
    }
    if (state.isOpen) {
      const toggle = getToggle(state.active);
      closeDropdown();
      toggle?.focus();
    }
  };

  const onDocClick = (e: MouseEvent) => {
    if (state.isMobile || !state.isOpen) return;
    if (!(e.target as Element).closest('[data-menu-wrap]')) closeDropdown();
  };

  // PHONE: burger to a cross
  const animateBurger = (toX: boolean) => {
    const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } });
    if (!lineTop || !lineMid || !lineBot) return tl;
    if (toX) {
      tl.to(lineTop, { y: '0.3125em', duration: 0.15 }, 0);
      tl.to(lineBot, { y: '-0.3125em', duration: 0.15 }, 0);
      tl.to(lineMid, { autoAlpha: 0, duration: 0.1 }, 0.1);
      tl.to(lineTop, { rotation: 45, duration: 0.2 }, 0.15);
      tl.to(lineBot, { rotation: -45, duration: 0.2 }, 0.15);
    } else {
      tl.to([lineTop, lineBot], { rotation: 0, duration: 0.2 }, 0);
      tl.to([lineTop, lineBot], { y: 0, duration: 0.15 }, 0.15);
      tl.to(lineMid, { autoAlpha: 1, duration: 0.1 }, 0.15);
    }
    return tl;
  };

  // PHONE: menu
  const openMobileMenu = () => {
    killMobile();
    state.mobileOpen = true;
    menuWrap.setAttribute('data-menu-open', 'true');
    burger?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';

    const items = getNavItems();
    const tl = gsap.timeline();
    state.mobileTl = tl;
    tl.add(animateBurger(true), 0);
    tl.set(navList, { autoAlpha: 1 }, 0);
    if (items.length) {
      tl.fromTo(
        items,
        { autoAlpha: 0, y: 16 },
        { autoAlpha: 1, y: 0, duration: 0.4 * speed, stagger: 0.05 * speed, ease: 'power3.out' },
        0.1
      );
    }
  };

  const closeMobileMenu = () => {
    const panelEl = getPanel(state.mobilePanel);
    killMobile();
    killMobilePanel();
    menuWrap.setAttribute('data-menu-open', 'false');
    state.mobileOpen = false;
    state.mobilePanel = null;
    setActive(null);
    burger?.setAttribute('aria-expanded', 'false');

    const tl = gsap.timeline({
      onComplete: () => {
        document.body.style.overflow = '';
        state.mobileTl = null;
        setupMobile();
      },
    });
    state.mobileTl = tl;
    tl.add(animateBurger(false), 0);
    if (panelEl) {
      tl.to(panelEl, { autoAlpha: 0, duration: 0.3 * speed, ease: 'power2.inOut' }, 0.05);
      tl.set(dropWrapper, { autoAlpha: 0, pointerEvents: 'none' }, 0.35 * speed);
      if (backBtn) tl.to(backBtn, { autoAlpha: 0, duration: 0.2 * speed, ease: 'power2.in' }, 0.05);
    }
    tl.set(navList, { autoAlpha: 0 }, 0.35 * speed);
  };

  // PHONE: panel slides over the menu, Back replaces the logo
  const openMobilePanel = (name: string) => {
    const el = getPanel(name);
    if (!el) return;
    killMobilePanel();
    state.mobilePanel = name;
    setActive(name);

    const items = getNavItems();
    const fade = getFade(el);
    gsap.set(dropWrapper, { autoAlpha: 1, pointerEvents: 'auto' });

    const tl = gsap.timeline();
    state.panelTl = tl;
    tl.to(
      items,
      {
        xPercent: -10,
        autoAlpha: 0,
        duration: 0.35 * speed,
        stagger: 0.03 * speed,
        ease: 'power2.in',
      },
      0
    );
    if (logo) tl.to(logo, { autoAlpha: 0, duration: 0.2 * speed, ease: 'power2.in' }, 0);
    if (backBtn)
      tl.to(backBtn, { autoAlpha: 1, duration: 0.25 * speed, ease: 'power2.inOut' }, 0.15 * speed);
    tl.set(el, { autoAlpha: 1, x: 0, pointerEvents: 'auto' }, 0.2 * speed);
    if (fade.length) {
      tl.fromTo(
        fade,
        { xPercent: 8, autoAlpha: 0 },
        {
          xPercent: 0,
          autoAlpha: 1,
          duration: 0.3 * speed,
          stagger: stagger(fade.length),
          ease: 'power3.out',
        },
        0.25 * speed
      );
    }
    window.setTimeout(() => backBtn?.querySelector<HTMLElement>('button')?.focus(), 300 * speed);
  };

  const closeMobilePanel = () => {
    const name = state.mobilePanel;
    const el = getPanel(name);
    if (!el) return;
    killMobilePanel();

    const items = getNavItems();
    const tl = gsap.timeline({
      onComplete: () => {
        state.mobilePanel = null;
        state.panelTl = null;
        setActive(null);
        gsap.set(dropWrapper, { autoAlpha: 0, pointerEvents: 'none' });
        getToggle(name)?.focus();
      },
    });
    state.panelTl = tl;
    tl.to(el, { xPercent: 20, autoAlpha: 0, duration: 0.3 * speed, ease: 'power2.in' }, 0);
    tl.set(el, { pointerEvents: 'none', xPercent: 0 }, 0.3 * speed);
    if (backBtn) tl.to(backBtn, { autoAlpha: 0, duration: 0.2 * speed, ease: 'power2.in' }, 0);
    if (logo)
      tl.to(logo, { autoAlpha: 1, duration: 0.25 * speed, ease: 'power2.out' }, 0.15 * speed);
    tl.fromTo(
      items,
      { xPercent: -20, autoAlpha: 0 },
      {
        xPercent: 0,
        autoAlpha: 1,
        duration: 0.35 * speed,
        stagger: 0.03 * speed,
        ease: 'power3.out',
      },
      0.25 * speed
    );
  };

  const onToggleClick = (e: Event) => {
    const name = (e.currentTarget as HTMLElement).getAttribute('data-dropdown-toggle');
    if (!name) return;
    if (state.isMobile) {
      if (!state.mobileOpen) return;
      e.preventDefault();
      openMobilePanel(name);
      return;
    }
    // hover opens it already; without hover (touch laptops, tablets) a click toggles
    e.preventDefault();
    if (state.isOpen && state.active === name) {
      if (!canHover()) closeDropdown();
    } else openDropdown(name);
  };

  const onBurger = () => (state.mobileOpen ? closeMobileMenu() : openMobileMenu());

  // RESIZE: swap between the desktop and phone set-ups
  let resizeTimer = 0;
  let lastWidth = window.innerWidth;
  const onResize = () => {
    if (window.innerWidth === lastWidth) return;
    lastWidth = window.innerWidth;
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      const was = state.isMobile;
      state.isMobile = window.innerWidth <= PHONE;
      if (was && !state.isMobile) {
        killMobile();
        killMobilePanel();
        gsap.set([navList, ...getNavItems(), ...visible], { clearProps: 'all' });
        if (logo) gsap.set(logo, { clearProps: 'all' });
        if (backBtn) gsap.set(backBtn, { autoAlpha: 0 });
        burger?.setAttribute('aria-expanded', 'false');
        state.mobileOpen = false;
        state.mobilePanel = null;
        document.body.style.overflow = '';
        panels.forEach((p) => gsap.set([p, ...getFade(p)], { clearProps: 'all' }));
        gsap.set([dropWrapper, dropContainer], { clearProps: 'all' });
        resetDesktop();
      } else if (!was && state.isMobile) {
        killDropdown();
        clearTimers();
        state.isOpen = false;
        state.active = null;
        menuWrap.setAttribute('data-menu-open', 'false');
        setActive(null);
        setupMobile();
      }
    }, 150);
  };

  // BIND
  const on = (el: EventTarget | null, type: string, fn: (e: never) => void) => {
    if (!el) return () => {};
    el.addEventListener(type, fn as EventListener);
    return () => el.removeEventListener(type, fn as EventListener);
  };

  const offs = [
    ...toggles.flatMap((t) => [
      on(t, 'mouseenter', onToggleEnter),
      on(t, 'mouseleave', onLeave),
      on(t, 'keydown', onToggleKey),
      on(t, 'click', onToggleClick),
    ]),
    ...plainItems.map((a) => on(a, 'mouseenter', onPlainEnter)),
    ...panels.map((p) => on(p, 'keydown', onPanelKey)),
    on(dropWrapper, 'mouseenter', onWrapperEnter),
    on(dropWrapper, 'mouseleave', onLeave),
    on(backdrop, 'click', closeDropdown),
    on(document, 'keydown', onEscape),
    on(document, 'click', onDocClick),
    on(burger, 'click', onBurger),
    on(backBtn, 'click', closeMobilePanel),
    on(window, 'resize', onResize),
  ];

  if (state.isMobile) setupMobile();
  else resetDesktop();
  menuWrap.setAttribute('data-menu-init', '');

  cleanup = () => {
    clearTimers();
    window.clearTimeout(resizeTimer);
    killDropdown();
    killMobile();
    killMobilePanel();
    offs.forEach((off) => off());
    menuWrap.setAttribute('data-menu-open', 'false');
    menuWrap.removeAttribute('data-menu-init');
    document.body.style.overflow = '';
    setActive(null);
    const all = [dropWrapper, dropContainer, backdrop, navList, backBtn, logo, ...visible];
    gsap.set([...all.filter(Boolean), ...getNavItems()], { clearProps: 'all' });
    panels.forEach((p) => gsap.set([p, ...getFade(p)], { clearProps: 'all' }));
  };
};

export const destroyMegaNav = () => {
  cleanup?.();
  cleanup = null;
};
