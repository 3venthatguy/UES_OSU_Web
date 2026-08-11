import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';

/**
 * Scroll-reveal trigger.
 *
 * An element reveals once its midpoint rises above 85% of the viewport height —
 * i.e. the reader is roughly halfway into it. Framer's own `whileInView` can't
 * express this: `amount: 0.5` never fires for anything taller than the screen,
 * because such an element can never be 50% visible.
 *
 * One observer is shared by every reveal on the page. Reveals are one-way; an
 * element unregisters the moment it fires, so the observer empties out as the
 * reader works down the page.
 */

/** Fraction of viewport height the element's midpoint must rise above. */
const TRIGGER_RATIO = 0.85;

/**
 * Dense thresholds so the observer keeps re-firing as an element scrolls further
 * in. With only `threshold: 0` we would get a single callback at the moment the
 * element touches the bottom edge — always too early to satisfy the rule above.
 */
const THRESHOLDS = Array.from({ length: 21 }, (_, i) => i / 20);

/**
 * Safety-net re-check. Thresholds are relative to element height, so for a very
 * tall block the gap between two of them can be hundreds of pixels; if the
 * reader stops mid-gap the observer goes quiet. This sweep closes that hole
 * without measuring anything on the scroll hot path.
 */
const SWEEP_MS = 150;

type Reveal = () => void;

const pending = new Map<Element, Reveal>();
let observer: IntersectionObserver | null = null;
let sweepTimer: ReturnType<typeof setTimeout> | null = null;

function viewportHeight(): number {
  return window.innerHeight || document.documentElement.clientHeight;
}

function shouldReveal(rect: DOMRect | DOMRectReadOnly, vh: number): boolean {
  // Midpoint, capped at half a viewport: a block taller than the screen would
  // never get its true centre above the trigger line.
  const anchor = rect.top + Math.min(rect.height, vh) / 2;
  if (anchor <= vh * TRIGGER_RATIO) return true;

  // A block pinned to the bottom of a short page may not have enough scroll
  // left to ever cross the line. Reveal it once it is wholly on screen.
  return rect.top >= 0 && rect.bottom <= vh;
}

function fire(el: Element) {
  const reveal = pending.get(el);
  if (!reveal) return;
  pending.delete(el);
  observer?.unobserve(el);
  reveal();
}

/** Re-measure everything still waiting, then re-arm if any remain. */
function sweep() {
  sweepTimer = null;
  if (pending.size === 0) return;

  const vh = viewportHeight();
  for (const el of [...pending.keys()]) {
    if (shouldReveal(el.getBoundingClientRect(), vh)) fire(el);
  }
  scheduleSweep();
}

function scheduleSweep() {
  if (sweepTimer !== null || pending.size === 0) return;
  sweepTimer = setTimeout(sweep, SWEEP_MS);
}

function getObserver(): IntersectionObserver | null {
  if (typeof IntersectionObserver === 'undefined') return null;
  if (observer) return observer;

  observer = new IntersectionObserver(
    (entries) => {
      const vh = viewportHeight();
      for (const entry of entries) {
        if (shouldReveal(entry.boundingClientRect, vh)) fire(entry.target);
      }
      scheduleSweep();
    },
    { threshold: THRESHOLDS },
  );
  return observer;
}

function observeReveal(el: Element, reveal: Reveal): () => void {
  const io = getObserver();
  if (!io) {
    // No IntersectionObserver (old browser, or a test/SSR environment): show
    // everything rather than leaving the page permanently blank.
    reveal();
    return () => {};
  }

  pending.set(el, reveal);
  io.observe(el);
  scheduleSweep();

  return () => {
    pending.delete(el);
    io.unobserve(el);
  };
}

/**
 * Attach `ref` to the element that should reveal. `revealed` flips to true once
 * and stays there — scrolling back up does not hide anything again.
 */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [revealed, setRevealed] = useState(false);
  const reduce = useReducedMotion() ?? false;

  useEffect(() => {
    if (reduce) {
      setRevealed(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    return observeReveal(el, () => setRevealed(true));
  }, [reduce]);

  return { ref, revealed: revealed || reduce };
}
