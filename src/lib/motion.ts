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

/* Hero Launch Sequence ------------------------------------------------------ */
/**
 * The hero's one-shot entrance, played once the splash curtain has lifted and
 * the page has settled — see the `RevealGate` consumer in HeroSection.
 *
 * These are deliberately *not* the `revealItem` scroll cadence. A scroll reveal
 * is one element answering the reader; this is four elements arriving in a
 * fixed order, so the children carry explicit delays rather than a
 * `staggerChildren` count, and the beats overlap on purpose:
 *
 *   0.12s  container holds — the beat of empty page after the curtain
 *   0.18s  headline line 1 rises through its mask
 *   0.27s  headline line 2
 *   0.34s  globe starts growing from its bottom edge
 *   0.62s  subheading + buttons
 *   1.44s  globe finishes — a full half-second after everything else
 *
 * The globe's duration is the longest by a wide margin. It is still expanding
 * after the text has landed, and that overlap is what makes the sequence read
 * as one movement instead of a queue.
 */

/** Container. Owns only the opening beat; each child times itself off that. */
export const heroIntro = (reduce: boolean): Variants => ({
  hidden: {},
  visible: {
    transition: reduce ? { duration: 0 } : { delayChildren: 0.12 },
  },
});

/**
 * One headline line, sliding up out of its own `overflow-hidden` mask.
 *
 * `y: '100%'` is a percentage of the line's own height, so it starts exactly one
 * line-height below the mask's bottom edge and is therefore fully invisible at
 * every breakpoint without measuring anything. `custom` carries the line index.
 */
export const heroHeadlineLine = (reduce: boolean): Variants => ({
  hidden: reduce ? { y: '0%' } : { y: '100%' },
  visible: (index: number) => ({
    y: '0%',
    transition: reduce
      ? { duration: 0 }
      : { duration: 0.7, ease: EASE_OUT, delay: 0.06 + index * 0.09 },
  }),
});

/**
 * The 3D globe, growing from small.
 *
 * Paired with `transform-origin: 50% 100%` at the call site — that is what makes
 * it expand upward off its bottom edge rather than swelling about its centre.
 */
export const heroGlobe = (reduce: boolean): Variants => ({
  hidden: reduce ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.55 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: reduce ? { duration: 0 } : { duration: 1.1, ease: EASE_OUT, delay: 0.22 },
  },
});

/** Subheading and action buttons — last in, once the headline has settled. */
export const heroTail = (reduce: boolean): Variants => ({
  hidden: reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: reduce ? { duration: 0 } : { duration: 0.55, ease: EASE_OUT, delay: 0.5 },
  },
});

/**
 * Longest the whole sequence can take, in ms — the failsafe that guarantees the
 * hero can never be stranded invisible if `onAnimationComplete` fails to fire.
 * Must stay above the slowest child (globe: 0.12 + 0.22 + 1.1 = 1.44s).
 */
export const HERO_INTRO_MAX_MS = 1_800;
