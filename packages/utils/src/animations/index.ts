import { createAnimation } from './factory';
import type { AnimationsObject } from './types';

export * from './types';

// Constants
export const easings = ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out'] as const;

/**
 * Contains all animation functions.
 */
export const animations: AnimationsObject = {
  /**
   * Fade
   */
  fade: createAnimation({ keyframes: { opacity: [0, 1] }, initialStyles: { opacity: '0' } }),

  /**
   * Slide Up
   */
  'slide-up': createAnimation({
    keyframes: { y: [100, 0], opacity: [0, 1] },
    initialStyles: { transform: 'translateY(100px)', opacity: '0' },
  }),

  /**
   * Slide Down
   */
  'slide-down': createAnimation({
    keyframes: { y: [-100, 0], opacity: [0, 1] },
    initialStyles: { transform: 'translateY(-100px)', opacity: '0' },
  }),

  /**
   * Slide Right
   */
  'slide-right': createAnimation({
    keyframes: { x: [-100, 0], opacity: [0, 1] },
    initialStyles: { transform: 'translateX(-100px)', opacity: '0' },
  }),

  /**
   * Slide Left
   */
  'slide-left': createAnimation({
    keyframes: { x: [100, 0], opacity: [0, 1] },
    initialStyles: { transform: 'translateX(100px)', opacity: '0' },
  }),

  /**
   * Grow
   */
  grow: createAnimation({
    keyframes: { scale: [0, 1], opacity: [0, 1] },
    initialStyles: { transform: 'scale(0)', opacity: '0' },
  }),

  /**
   * Shrink
   */
  shrink: createAnimation({
    keyframes: { scale: [1.25, 1], opacity: [0, 1] },
    initialStyles: { transform: 'scale(1.25)', opacity: '0' },
  }),

  /**
   * Spin
   */
  spin: createAnimation({
    keyframes: { rotate: [900, 0], opacity: [0, 1] },
    initialStyles: { transform: 'rotate(900deg)', opacity: '0' },
  }),
} as const;
