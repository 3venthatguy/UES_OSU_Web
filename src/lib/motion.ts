import type { Variants } from 'motion/react';

/**
 * Shared motion vocabulary. Timings live here rather than inline so the reveal
 * cadence and the page slide stay in the same rhythm as each other.
 *
 * Every factory takes `reduce` (from `useReducedMotion()`) and collapses to a
 * zero-duration, zero-offset variant when it is set — matching the pattern the
 * officer cards already use in AboutSection.
 */

/** Ease-out-expo. Fast departure, long settle — reads as "arriving", not "sliding". */
export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Seconds between sibling cards in a staggered grid. */
export const REVEAL_STAGGER = 0.06;

/** How far a revealing element starts below its resting position, in px. */
const REVEAL_OFFSET = 28;

/**
 * A block that fades up as one piece.
 *
 * Also used by `<RevealItem>` for the individual cards inside a staggered grid,
 * so a card and a standalone block travel exactly the same distance.
 */
export const revealItem = (reduce: boolean): Variants => ({
  hidden: reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: REVEAL_OFFSET },
  visible: {
    opacity: 1,
    y: 0,
    transition: reduce ? { duration: 0 } : { duration: 0.55, ease: EASE_OUT },
  },
});

/**
 * A grid whose cards arrive one after another. The container itself stays put —
 * it only owns the timing, so the block does not fade *and* its cards fade.
 */
export const revealContainer = (reduce: boolean): Variants => ({
  hidden: {},
  visible: {
    transition: reduce
      ? { duration: 0 }
      : { staggerChildren: REVEAL_STAGGER, delayChildren: 0.05 },
  },
});

/**
 * Page-to-page slide. `custom` carries the direction: +1 when moving to a later
 * tab in nav order, -1 when moving back, and 0 on first paint — where a pure
 * fade keeps the splash hand-off calm. The outgoing page travels the opposite
 * way and a shorter distance, so the pair reads as one movement rather than two.
 */
export const pageVariants = (reduce: boolean): Variants => ({
  enter: (direction: number) => ({
    opacity: 0,
    x: reduce ? 0 : direction * 48,
  }),
  center: {
    opacity: 1,
    x: 0,
    transition: reduce ? { duration: 0 } : { duration: 0.28, ease: EASE_OUT },
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: reduce ? 0 : direction * -32,
    transition: reduce ? { duration: 0 } : { duration: 0.18, ease: 'easeIn' },
  }),
});

/** Longest a page transition can take, in ms — used as a gate-release failsafe. */
export const PAGE_TRANSITION_MAX_MS = 700;
