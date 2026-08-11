import { useEffect } from 'react';
import Lenis from 'lenis';

/**
 * Damped page scrolling.
 *
 * Lenis drives the *real* window scroll position (it calls `window.scrollTo`
 * every frame) rather than transforming a wrapper element. That matters here:
 * a transformed wrapper would become the containing block for every
 * `position: fixed` descendant, which would pin the navbar to the page and
 * centre modals on the document instead of the viewport — the same trap
 * documented in App.tsx. Because the scroll position is genuine, the navbar's
 * `scroll` listener and the reveal IntersectionObserver both keep working
 * untouched.
 *
 * One instance for the whole app, owned by `useSmoothScroll()` in App.
 */

let lenis: Lenis | null = null;
let rafId: number | null = null;

/**
 * Tracked separately from the instance because SplashScreen locks scrolling from
 * a layout effect, which runs before App's passive effect has created Lenis. The
 * flag lets that early lock survive until there is something to apply it to.
 */
let locked = false;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function destroy() {
  if (rafId !== null) cancelAnimationFrame(rafId);
  rafId = null;
  lenis?.destroy();
  lenis = null;
}

/** Mount once, at the app root. */
export function useSmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion()) return;

    lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
      smoothWheel: true,
      // Touch devices already have momentum scrolling; syncing it here makes
      // the page feel laggy rather than smooth.
      syncTouch: false,
      // Off by default, and without it a stopped Lenis swallows wheel events
      // over its own scroll container — so a tall dialog could not be scrolled
      // while the page behind it was locked.
      allowNestedScroll: true,
    });
    if (locked) lenis.stop();

    const loop = (time: number) => {
      lenis?.raf(time);
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    return destroy;
  }, []);
}

/**
 * Jump to the top of the page. Used between tab transitions, where `immediate`
 * is what you want — the slide is already carrying the movement.
 */
export function scrollToTop(immediate = false) {
  if (lenis) {
    lenis.scrollTo(0, { immediate });
    return;
  }
  window.scrollTo({ top: 0, behavior: immediate ? 'instant' : 'smooth' });
}

/**
 * Pair this with any `document.body.style.overflow = 'hidden'` scroll lock.
 * Hiding body overflow alone does not stop Lenis, which would keep writing a
 * scroll position behind the locked page.
 */
export function setScrollLocked(next: boolean) {
  locked = next;
  if (!lenis) return;
  if (next) lenis.stop();
  else lenis.start();
}
