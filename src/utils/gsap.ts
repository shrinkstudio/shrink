// Shared typings for the GSAP globals.
//
// GSAP and its plugins are loaded from the CDN in the Webflow site head and
// used as globals rather than bundled — the house pattern across every Shrink
// bundle. These are hand-written minimal types covering only what we call, so
// one module can't silently drift from another's idea of the API.

export interface GsapTimeline {
  fromTo(target: unknown, fromVars: object, toVars: object): GsapTimeline;
  play(): void;
  reverse(): void;
  kill(): void;
}

export interface Gsap {
  timeline(vars: { paused?: boolean; onReverseComplete?: () => void }): GsapTimeline;
  registerPlugin(...plugins: unknown[]): void;
  set(target: unknown, vars: object): void;
  to(target: unknown, vars: object): void;
  quickTo(target: unknown, property: string, vars?: object): (value: number) => void;
  killTweensOf(target: unknown): void;
}

export interface FlipPlugin {
  getState(targets: Element | Element[]): unknown;
  from(state: unknown, vars: { duration?: number; ease?: string }): unknown;
}

declare global {
  interface Window {
    gsap?: Gsap;
    Flip?: FlipPlugin;
  }
}

/** True when the device has a real hover-capable pointer. */
export const canHover = () => window.matchMedia('(hover: hover)').matches;
