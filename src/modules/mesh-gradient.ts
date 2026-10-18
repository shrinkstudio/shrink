// -----------------------------------------
// MESH GRADIENT — animated Offsets shader with grain (offsets-shader.ts)
// -----------------------------------------
// Markup:
//   div[data-mesh-gradient="#1b1060, #3a24d8, #5b3cf5, #9a8cf0, #e6e4f2"]
//     five colours, darkest first
//     optional: data-mesh-grain (0 to 1, default 0.22)
//               data-mesh-speed (default 0.3, the designed pace)
//
// The element needs a size (eg. absolute, inset 0) and a CSS gradient
// background as the fallback: it stays when WebGL is missing. Reduced motion
// renders one still frame. Inside the mega nav the shader mounts the first
// time the menu opens and only runs while it is open; elsewhere (eg. the
// footer) it mounts near the viewport and pauses when scrolled away.
// data-mesh-mount="hover" mounts only while the closest [data-mesh-hover]
// (eg. an article card) is hovered or focused, and frees it after.
// -----------------------------------------

import { OffsetsMount } from './offsets-shader';

const mounts = new Map<HTMLElement, OffsetsMount>();
const observers: (MutationObserver | IntersectionObserver)[] = [];
const unbinds: Array<() => void> = [];

const num = (el: HTMLElement, name: string, fallback: number) => {
  const value = Number(el.getAttribute(`data-mesh-${name}`));
  return el.hasAttribute(`data-mesh-${name}`) && !Number.isNaN(value) ? value : fallback;
};

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
/* 0.3 was Paper's default; keep it as the attribute's designed pace */
const speedOf = (el: HTMLElement) => (reduced() ? 0 : num(el, 'speed', 0.3) / 0.3);

const mount = (el: HTMLElement) => {
  if (mounts.has(el)) return mounts.get(el);
  const colors = (el.getAttribute('data-mesh-gradient') || '')
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean)
    .slice(0, 10);
  if (colors.length < 2) return;

  try {
    const shader = new OffsetsMount(el, {
      colors,
      grain: num(el, 'grain', 0.22),
      speed: speedOf(el),
    });
    el.setAttribute('data-mesh-ready', '');
    mounts.set(el, shader);
    return shader;
  } catch {
    // no WebGL: the CSS gradient fallback stays
    return;
  }
};

/**
 * Mounts every mesh in the scope. Meshes inside [data-menu-wrap] wait for the
 * menu to open; the rest wait until they near the viewport.
 */
export const initMeshGradient = (scope: ParentNode = document) => {
  const els = [...scope.querySelectorAll<HTMLElement>('[data-mesh-gradient]')];
  if (!els.length) return;

  const onHover = els.filter((el) => el.getAttribute('data-mesh-mount') === 'hover');
  const inMenu = els.filter((el) => el.closest('[data-menu-wrap]') && !onHover.includes(el));
  const onPage = els.filter((el) => !el.closest('[data-menu-wrap]') && !onHover.includes(el));

  // hover meshes (eg. article cards): one WebGL context per hovered card,
  // released after the fade out so a grid of cards never hits the browser cap
  for (const el of onHover) {
    const host = el.closest<HTMLElement>('[data-mesh-hover]') ?? el.parentElement;
    if (!host) continue;
    let release: number | undefined;
    const enter = () => {
      window.clearTimeout(release);
      mount(el)?.setSpeed(speedOf(el));
    };
    const leave = () => {
      release = window.setTimeout(() => {
        mounts.get(el)?.dispose();
        mounts.delete(el);
        el.removeAttribute('data-mesh-ready');
      }, 800);
    };
    host.addEventListener('pointerenter', enter);
    host.addEventListener('pointerleave', leave);
    host.addEventListener('focusin', enter);
    host.addEventListener('focusout', leave);
    unbinds.push(() => {
      window.clearTimeout(release);
      host.removeEventListener('pointerenter', enter);
      host.removeEventListener('pointerleave', leave);
      host.removeEventListener('focusin', enter);
      host.removeEventListener('focusout', leave);
    });
  }

  const menu = inMenu[0]?.closest<HTMLElement>('[data-menu-wrap]');
  if (menu) {
    const sync = () => {
      const open = menu.getAttribute('data-menu-open') === 'true';
      for (const el of inMenu) {
        if (open) mount(el)?.setSpeed(speedOf(el));
        else mounts.get(el)?.setSpeed(0);
      }
    };
    const watcher = new MutationObserver(sync);
    watcher.observe(menu, { attributes: true, attributeFilter: ['data-menu-open'] });
    observers.push(watcher);
  }

  if (onPage.length) {
    // mount on first approach, then only animate while near the viewport
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          if (entry.isIntersecting) mount(el)?.setSpeed(speedOf(el));
          else mounts.get(el)?.setSpeed(0);
        }
      },
      { rootMargin: '200px' }
    );
    onPage.forEach((el) => io.observe(el));
    observers.push(io);
  }
};

export const destroyMeshGradient = () => {
  observers.forEach((o) => o.disconnect());
  observers.length = 0;
  unbinds.forEach((fn) => fn());
  unbinds.length = 0;
  mounts.forEach((shader, el) => {
    shader.dispose();
    el.removeAttribute('data-mesh-ready');
  });
  mounts.clear();
};
