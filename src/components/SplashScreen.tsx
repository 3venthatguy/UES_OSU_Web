import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ASSETS } from '../assets';
import { useAssetLoad } from '../lib/assetLoading';
import { setScrollLocked } from '../lib/smoothScroll';

/**
 * Full-screen branded loading overlay.
 *
 * The app renders underneath this from the very first frame — the splash is an
 * overlay, not a gate. That way EarthModel mounts immediately and starts fetching
 * its .glb behind the curtain, while nothing is animating.
 *
 * The hero pulls a ~4.1 MiB model, so `ready` is gated on a real download: the
 * percentage below tracks actual bytes, and on a slow connection the stall-creep,
 * the "taking a while" copy and the escape hatches are all genuinely reachable.
 * On a fast connection or a warm cache MIN_HOLD_MS is what sets the length.
 *
 * The panel, logo tile and ring are visual clones of #splash-boot in index.html,
 * which paints before React exists. Their shared CSS (colours, sizes, keyframes)
 * lives in the inline <style> block there so the handoff is seamless and so the
 * boot splash never depends on a network request. Change one, change both.
 */

interface SplashScreenProps {
  /** Fired once the exit animation has finished and the splash can unmount. */
  onFinished: () => void;
}

/** Minimum time the splash stays up, so a warm cache doesn't flash it. */
const MIN_HOLD_MS = 900;
/** Duration of the clip-wipe exit; must match the reveal transition in App.tsx. */
const EXIT_MS = 420;
const EXIT_MS_REDUCED = 200;

/** "This is taking a while" copy swap. */
const SLOW_NOTICE_MS = 6_000;
/** Escape hatch for anyone stuck on a bad connection. */
const SKIP_OFFER_MS = 12_000;
/** Hard ceiling — the model keeps loading and appears in the hero when it lands. */
const AUTO_DISMISS_MS = 25_000;

const SEEN_KEY = 'ues:splash-seen';

/** Creep rate (progress units per second) while the network is stalled. */
const STALL_CREEP_RATE = 0.004;
/** How far ahead of real progress the creep is allowed to run. */
const STALL_CREEP_LEAD = 0.08;
/** No movement for this long counts as stalled. */
const STALL_AFTER_MS = 1_500;

// sessionStorage throws in some privacy modes — a missing flag just means the
// splash holds for its usual beat, which is a fine fallback.
const readSeen = (): boolean => {
  try {
    return sessionStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
};

const writeSeen = (): void => {
  try {
    sessionStorage.setItem(SEEN_KEY, '1');
  } catch {
    /* ignore */
  }
};

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinished }) => {
  const { progress, ready, failed } = useAssetLoad();

  const [percent, setPercent] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [slow, setSlow] = useState(false);
  const [offerSkip, setOfferSkip] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [offline, setOffline] = useState(
    () => typeof navigator !== 'undefined' && navigator.onLine === false
  );
  const [reducedMotion, setReducedMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  const mountedAtRef = useRef(Date.now());
  const progressRef = useRef(progress);
  const exitingRef = useRef(false);
  const erroredRef = useRef(false);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    exitingRef.current = exiting;
  }, [exiting]);

  useEffect(() => {
    erroredRef.current = failed || offline;
  }, [failed, offline]);

  const errored = failed || offline;
  const exitDuration = reducedMotion ? EXIT_MS_REDUCED : EXIT_MS;

  /* Boot Splash Handoff --------------------------------------------------- */
  // Layout effect so the static panel is removed in the same commit that paints
  // the React panel — a passive effect would leave a one-frame gap.
  useLayoutEffect(() => {
    document.getElementById('splash-boot')?.remove();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Hiding body overflow does not stop Lenis, which would keep writing a
    // scroll position behind the curtain.
    setScrollLocked(true);
    return () => {
      document.body.style.overflow = previousOverflow;
      setScrollLocked(false);
    };
  }, []);

  /* Environment Listeners ------------------------------------------------- */
  useEffect(() => {
    const goOnline = () => setOffline(false);
    const goOffline = () => setOffline(true);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMotionChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    motionQuery.addEventListener('change', onMotionChange);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      motionQuery.removeEventListener('change', onMotionChange);
    };
  }, []);

  /* Elapsed-Time Messaging ------------------------------------------------ */
  useEffect(() => {
    const slowTimer = window.setTimeout(() => setSlow(true), SLOW_NOTICE_MS);
    const skipTimer = window.setTimeout(() => setOfferSkip(true), SKIP_OFFER_MS);
    return () => {
      window.clearTimeout(slowTimer);
      window.clearTimeout(skipTimer);
    };
  }, []);

  // Auto-dismiss only applies to a slow-but-working load. In the error state the
  // user gets Retry / Continue instead of being dropped onto a broken hero.
  useEffect(() => {
    if (errored) return;
    const timer = window.setTimeout(() => setSkipped(true), AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [errored]);

  /* Displayed Progress ---------------------------------------------------- */
  // Eases toward the real value, and keeps creeping when the network stalls so a
  // 2G visitor sees motion instead of a bar frozen at 3%.
  useEffect(() => {
    let frame = 0;
    let displayed = 0;
    let lastReal = progressRef.current;
    let lastChangeAt = performance.now();
    let previousFrameAt = performance.now();

    const tick = (now: number) => {
      // Once the curtain starts rising the bar is done; stop the loop so it can't
      // walk the number back down mid-exit.
      if (exitingRef.current) {
        setPercent(100);
        return;
      }

      const dt = Math.min((now - previousFrameAt) / 1000, 0.1);
      previousFrameAt = now;

      const real = progressRef.current;
      if (real !== lastReal) {
        lastReal = real;
        lastChangeAt = now;
      }

      // Once a request has actually failed, stop creeping — inching toward 99%
      // next to "couldn't be loaded" reads as though it's about to finish.
      const stalled = !erroredRef.current && now - lastChangeAt > STALL_AFTER_MS && real < 1;
      const target = stalled ? Math.min(real + STALL_CREEP_LEAD, 0.99) : real;
      const ease = (target - displayed) * (1 - Math.exp(-dt * 5));
      const step = stalled ? Math.min(ease, STALL_CREEP_RATE * dt) : ease;

      if (step > 0) {
        displayed = Math.min(displayed + step, target);
        setPercent(Math.round(displayed * 100));
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  /* Exit Orchestration ---------------------------------------------------- */
  useEffect(() => {
    if (exiting) return;
    if (!ready && !skipped) return;

    // Repeat visits in the same tab skip the hold entirely.
    const held = Date.now() - mountedAtRef.current;
    const wait = readSeen() ? 0 : Math.max(0, MIN_HOLD_MS - held);

    const timer = window.setTimeout(() => {
      writeSeen();
      setPercent(100);
      setExiting(true);
    }, wait);
    return () => window.clearTimeout(timer);
  }, [ready, skipped, exiting]);

  useEffect(() => {
    if (!exiting) return;
    const timer = window.setTimeout(onFinished, exitDuration);
    return () => window.clearTimeout(timer);
  }, [exiting, exitDuration, onFinished]);

  /* Status Copy ----------------------------------------------------------- */
  const status = errored
    ? offline
      ? 'You appear to be offline. Check your connection.'
      : "Some assets couldn't be loaded."
    : slow
      ? 'Slow connection — still loading the 3D scene.'
      : 'Loading the experience…';

  /* Exit Styling ---------------------------------------------------------- */
  const panelStyle: React.CSSProperties = reducedMotion
    ? {
        opacity: exiting ? 0 : 1,
        transition: `opacity ${EXIT_MS_REDUCED}ms linear`,
      }
    : {
        // Collapses the panel's bottom edge upward — compositor-only, so it costs
        // nothing and doesn't reflow the page underneath.
        clipPath: exiting ? 'inset(0 0 100% 0)' : 'inset(0 0 0 0)',
        opacity: exiting ? 0 : 1,
        willChange: 'clip-path, opacity',
        transition:
          `clip-path ${EXIT_MS}ms cubic-bezier(0.65, 0, 0.35, 1), ` +
          `opacity ${EXIT_MS}ms cubic-bezier(0.4, 0, 1, 1)`,
      };

  const markStyle: React.CSSProperties = reducedMotion
    ? {}
    : {
        opacity: exiting ? 0 : 1,
        transform: exiting ? 'scale(0.96)' : 'scale(1)',
        transition: 'opacity 180ms ease-out, transform 180ms ease-out',
      };

  return (
    <div className="fixed inset-0 z-[100] bg-[#B03A40]" style={panelStyle} aria-busy={!exiting}>
      {/* Soft Halo Behind The Mark */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,#2D0A0C2E_0%,transparent_55%)]"
        aria-hidden="true"
      />

      {/*
        Logo Mark + Rotating Ring — absolutely centred rather than laid out in the
        column below it, so its position never depends on how much text sits
        underneath. That's what keeps it pixel-identical to #splash-boot across the
        handoff, and stops it shifting when the escape-hatch buttons appear.
      */}
      <div className="absolute inset-0 flex items-center justify-center" style={markStyle}>
        <svg
          className={reducedMotion ? '' : 'ues-splash-ring'}
          width="132"
          height="132"
          viewBox="0 0 132 132"
          aria-hidden="true"
        >
          <circle cx="66" cy="66" r="64.5" fill="none" stroke="#FDF8F1" strokeOpacity="0.25" strokeWidth="3" />
          <circle
            cx="66"
            cy="66"
            r="64.5"
            fill="none"
            stroke="#F07B41"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="101 405"
          />
        </svg>

        <div className="absolute flex h-[88px] w-[88px] items-center justify-center rounded-2xl bg-white shadow-lg">
          <img src={ASSETS.logo.jpeg} alt="" width={56} height={56} className="h-[56px] w-[56px] object-contain" />
        </div>
      </div>

      {/* Status Column — hangs below the centred mark at a fixed offset. */}
      <div className="absolute inset-x-0 top-[calc(50%+98px)] flex flex-col items-center px-6">
      {/* Wordmark */}
      <p className="text-center text-xs font-black uppercase tracking-widest text-[#FDF8F1]">
        Undergraduate Economics Society
      </p>

      {/* Progress Bar + Percentage */}
      <div className="ues-splash-fade mt-6 flex w-[220px] max-w-full flex-col items-center gap-2">
        <div
          className="h-1 w-full overflow-hidden rounded-full bg-[#FDF8F1]/20"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-label="Loading progress"
        >
          <div
            className="h-full rounded-full bg-[#FDF8F1] transition-[width] duration-300 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="text-[11px] font-bold tabular-nums text-[#FDF8F1]/70">{percent}%</span>
      </div>

      {/* Status Line */}
      <p
        className="ues-splash-fade mt-4 max-w-xs text-center text-[11px] font-medium text-[#FDF8F1]/70"
        role="status"
        aria-live="polite"
      >
        {status}
      </p>

      {/* Escape Hatches */}
      {(errored || offerSkip) && !exiting && (
        <div className="ues-splash-fade mt-6 flex items-center gap-3">
          {errored && (
            <button
              onClick={() => window.location.reload()}
              className="rounded-full bg-[#FDF8F1] px-4 py-2 text-xs font-bold text-[#B03A40] transition-colors hover:bg-white"
            >
              Retry
            </button>
          )}
          <button
            onClick={() => setSkipped(true)}
            className="rounded-full border border-[#FDF8F1]/40 px-4 py-2 text-xs font-bold text-[#FDF8F1] transition-colors hover:border-[#FDF8F1] hover:bg-[#FDF8F1]/10"
          >
            Continue anyway
          </button>
        </div>
      )}
      </div>
    </div>
  );
};
