import React, { useEffect } from 'react';
import {
  AnimatePresence,
  motion,
  useDragControls,
  useReducedMotion,
  type Variants,
} from 'motion/react';
import { ExternalLink, X } from 'lucide-react';
import type { EconomicRegion, EconomicRegionsFile } from '../types';
import { EASE_OUT } from '../lib/motion';

/**
 * The region details that open out of the hero Earth when a pin is clicked.
 *
 * Two layouts of the same content, chosen by breakpoint alone:
 *
 *  - Under xl, one card — a bottom sheet on a phone, a panel docked to the
 *    bottom-left corner of the globe box on a tablet or small laptop.
 *  - From xl up, two cards that expand out of the centre of the globe to either
 *    side of it: the description on the left, every figure on the right.
 *
 * Both are mounted and switched with `hidden` / `xl:hidden`, matching how the
 * navbar swaps its desktop row for its drawer. There are no JS width queries
 * anywhere in this app and this is not the place to introduce the first one.
 *
 * Everything is positioned `absolute` inside EarthModel's own wrapper rather
 * than `fixed` to the viewport, for two reasons. The globe has to stay visible
 * alongside it, which anchoring to the canvas gives for free at every
 * breakpoint; and `position: fixed` is a trap in this app — Framer leaves
 * `transform: translate(0px)` on settled elements, and any non-`none` transform
 * makes that element the containing block for fixed descendants, so a fixed
 * card would be positioned against the animating page wrapper instead of the
 * window. `Reveal` and `App.tsx` both strip the settled transform to work
 * around it; staying absolute means never meeting the problem.
 *
 * It is deliberately not a modal: no scroll lock, no backdrop, no focus trap.
 * The page behind it stays live, because reading a region card is not a task
 * you have to finish before doing anything else.
 */

/**
 * Phone: a bottom sheet across the globe card, capped at 55% of its height.
 * Not taller — the globe is centred in a 520px canvas there, so anything much
 * over half covers the planet completely and the card stops reading as
 * "details about the thing above it". At 55% the northern half of the Earth
 * stays in frame and the card scrolls internally for the rest.
 *
 * md to xl: docked to the bottom-left corner of the same card instead, where it
 * clears the globe entirely. From xl the split cards below take over.
 */
const SHEET_CLASS = `absolute inset-x-0 bottom-0 z-20 max-h-[55%] overflow-y-auto select-text
  bg-[#FFFDF9] border-t border-[#EADBCE] rounded-t-3xl shadow-2xl
  md:inset-x-auto md:left-5 md:bottom-5 md:w-[400px] md:max-h-[86%]
  md:border md:rounded-3xl xl:hidden`;

/**
 * A flanking card, sized to the gutter it sits in.
 *
 * The globe box is `max-w-5xl xl:max-w-7xl`, so from xl up it is a constant
 * 1216px wide with the model drawn ~550px across the middle of it — about
 * 333px of clear space per side. 288px of card at a 16px inset leaves ~29px
 * for the aircraft and cloud puffs that orbit past the sphere's silhouette.
 *
 * Opaque, not the translucent `bg-white/80` of the bento cards: this sits over
 * a moving 3D canvas, and small type over a rotating planet is unreadable.
 */
const SPLIT_CARD_CLASS = `pointer-events-auto relative w-[288px] max-h-full overflow-y-auto select-text
  bg-[#FFFDF9] border border-[#EADBCE] rounded-3xl shadow-2xl px-6 py-5`;

/**
 * Half the globe box, from the outer inset to the exact centre.
 *
 * This is what makes the cards expand out of the middle of the planet without
 * measuring anything. A percentage `x` in Motion is a percentage of the
 * element's *own* width, so translating a track by 100% of itself lands its
 * inner edge precisely on the container's centre line at any width — and with
 * the transform origin on that same inner edge, scaling down collapses the card
 * to a sliver sitting on the globe. The card is a plain child pinned to that
 * edge, so it inherits the move for free.
 *
 * `pointer-events-none` on the track and `auto` on the card: the track covers a
 * whole half of the canvas, and without this it would eat every drag aimed at
 * that side of the globe.
 */
const TRACK_BASE = 'absolute inset-y-0 py-5 flex items-center pointer-events-none';

interface RegionSheetProps {
  /** null closes everything. */
  region: EconomicRegion | null;
  meta: EconomicRegionsFile['meta'];
  onClose: () => void;
}

interface RegionContentProps {
  region: EconomicRegion;
  meta: EconomicRegionsFile['meta'];
  onClose: () => void;
}

const EYEBROW_CLASS = 'text-[10px] uppercase tracking-widest font-bold text-[#F07B41]';

const CloseButton: React.FC<{ onClose: () => void; className?: string }> = ({
  onClose,
  className = 'absolute top-3 right-4',
}) => (
  <button
    onClick={onClose}
    aria-label="Close region details"
    className={`${className} p-2 rounded-full text-[#524B47] hover:bg-[#FDF8F1] transition-colors`}
  >
    <X className="w-5 h-5" />
  </button>
);

const RegionTitle: React.FC<{ region: EconomicRegion; titleId: string }> = ({ region, titleId }) => (
  <>
    <span className={EYEBROW_CLASS}>Regional Economy</span>
    <h3 id={titleId} className="text-2xl font-black text-[#2D0A0C] leading-tight pr-8">
      {region.name}
    </h3>
  </>
);

const RegionBlurb: React.FC<{ region: EconomicRegion }> = ({ region }) => (
  <p className="text-xs text-[#524B47] leading-relaxed">{region.blurb}</p>
);

/**
 * Every figure for a region: the headline indicators, the largest economies,
 * and where the numbers came from.
 *
 * A fragment rather than a wrapper so the caller's own `space-y` still applies
 * between the three blocks — the sheet and the right-hand card space them
 * identically and neither should have to reach inside this.
 */
const RegionFigures: React.FC<{ region: EconomicRegion; meta: EconomicRegionsFile['meta'] }> = ({
  region,
  meta,
}) => (
  <>
    {/* Headline Indicators */}
    {region.indicators.length > 0 ? (
      <div className="grid grid-cols-2 gap-3">
        {region.indicators.map((indicator) => (
          <div
            key={indicator.label}
            className="rounded-2xl bg-[#FDF8F1] border border-[#B03A40]/10 px-3.5 py-2.5"
          >
            <div className="text-lg font-black text-[#B03A40] leading-none">{indicator.value}</div>
            <div className="mt-1.5 text-[10px] font-semibold text-[#605753] uppercase tracking-wider leading-tight">
              {indicator.label}
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="rounded-2xl bg-[#FDF8F1] border border-[#B03A40]/10 px-4 py-3 text-xs text-[#605753]">
        No economic data is reported for this region.
      </div>
    )}

    {/* Largest Economies */}
    {region.economies.length > 0 && (
      <div className="space-y-2 pt-1 border-t border-[#EADBCE]">
        <span className={`${EYEBROW_CLASS} block pt-3`}>Largest Economies</span>
        <ul className="space-y-1.5">
          {region.economies.map((economy) => (
            <li key={economy.name} className="flex items-baseline justify-between gap-3 text-xs">
              <span className="font-semibold text-[#1C1817]">{economy.name}</span>
              <span className="font-bold text-[#B03A40] tabular-nums">{economy.gdp}</span>
            </li>
          ))}
        </ul>
      </div>
    )}

    {/* Provenance. Not decoration: it is what separates these figures from
        the invented ones this hero used to show. */}
    <div className="pt-3 border-t border-[#EADBCE] space-y-1">
      <a
        href={meta.sourceUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#B03A40] hover:underline"
      >
        <span>{meta.source}</span>
        <ExternalLink className="w-3 h-3" />
      </a>
      <p className="text-[10px] text-[#605753] leading-relaxed">
        {meta.vintage} · {meta.units}
      </p>
    </div>
  </>
);

/**
 * Mounted only while a region is selected, so switching regions remounts and
 * the sheet re-enters rather than silently swapping its text — matching how
 * RSVPModal splits its content out.
 */
const RegionSheetContent: React.FC<RegionContentProps> = ({ region, meta, onClose }) => {
  const reduce = useReducedMotion() ?? false;
  // dragListener={false} + manual start: the sheet scrolls internally on a
  // phone, and a whole-surface y-drag would fight that scroll for every touch.
  // Only the grab handle and the header start a dismiss gesture.
  const dragControls = useDragControls();

  return (
    <motion.section
      role="dialog"
      aria-modal="false"
      aria-labelledby="region-sheet-title"
      className={SHEET_CLASS}
      initial={reduce ? { opacity: 0 } : { y: '100%' }}
      animate={reduce ? { opacity: 1 } : { y: 0 }}
      exit={reduce ? { opacity: 0 } : { y: '100%' }}
      transition={{ duration: reduce ? 0 : 0.34, ease: EASE_OUT }}
      drag={reduce ? false : 'y'}
      dragListener={false}
      dragControls={dragControls}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.45 }}
      onDragEnd={(_, info) => {
        if (info.offset.y > 100 || info.velocity.y > 500) onClose();
      }}
    >
      {/* Grab handle + header — the only surface that starts a dismiss drag */}
      <div
        className="sticky top-0 z-10 bg-[#FFFDF9] px-6 pt-3 pb-4 rounded-t-3xl touch-none"
        onPointerDown={(event) => dragControls.start(event)}
      >
        <div className="w-10 h-1 rounded-full bg-[#EADBCE] mx-auto mb-4 md:hidden" />

        <CloseButton onClose={onClose} />

        <RegionTitle region={region} titleId="region-sheet-title" />
      </div>

      <div className="px-6 pb-6 space-y-5">
        <RegionBlurb region={region} />
        <RegionFigures region={region} meta={meta} />
      </div>
    </motion.section>
  );
};

/**
 * The two cards' shared move: collapsed to a sliver on the globe's centre line,
 * expanded out to the gutter on its own side.
 *
 * `side` only sets which way the track travels and which of its edges the
 * scaling pivots about — the left card pivots on its left edge and the right on
 * its right, so both converge on the same point in the middle of the planet.
 */
const splitCard = (reduce: boolean, side: 'left' | 'right'): Variants => ({
  hidden: reduce
    ? { opacity: 0, transition: { duration: 0 } }
    : {
        opacity: 0,
        scale: 0.4,
        x: side === 'left' ? '100%' : '-100%',
        transition: { duration: 0.28, ease: EASE_OUT },
      },
  visible: reduce
    ? { opacity: 1, transition: { duration: 0 } }
    : {
        opacity: 1,
        scale: 1,
        x: '0%',
        // The right card trails by a frame or two. Perfectly simultaneous reads
        // as one wide thing splitting; slightly offset reads as two cards.
        transition: { duration: 0.4, ease: EASE_OUT, delay: side === 'right' ? 0.04 : 0 },
      },
});

/**
 * xl and up: description left, figures right, globe untouched between them.
 *
 * One dialog, not two — the pair is a single disclosure, and the layer that
 * holds both is what carries the role. It covers the whole canvas so the cards
 * can be pinned to its centre line, hence `pointer-events-none` on it.
 */
const RegionSplitCards: React.FC<RegionContentProps> = ({ region, meta, onClose }) => {
  const reduce = useReducedMotion() ?? false;

  return (
    <motion.div
      role="dialog"
      aria-modal="false"
      aria-labelledby="region-split-title"
      className="hidden xl:block absolute inset-0 z-20 pointer-events-none"
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={{ hidden: {}, visible: {} }}
    >
      <motion.div
        className={`${TRACK_BASE} left-4 right-1/2 justify-start`}
        style={{ transformOrigin: '0% 50%' }}
        variants={splitCard(reduce, 'left')}
      >
        <section className={SPLIT_CARD_CLASS}>
          <CloseButton onClose={onClose} className="absolute top-2 right-3" />
          <RegionTitle region={region} titleId="region-split-title" />
          <div className="mt-4">
            <RegionBlurb region={region} />
          </div>
        </section>
      </motion.div>

      <motion.div
        className={`${TRACK_BASE} left-1/2 right-4 justify-end`}
        style={{ transformOrigin: '100% 50%' }}
        variants={splitCard(reduce, 'right')}
      >
        <section className={SPLIT_CARD_CLASS} aria-label={`${region.name} economic data`}>
          <CloseButton onClose={onClose} className="absolute top-2 right-3" />
          <span className={`${EYEBROW_CLASS} block pr-8`}>Key Indicators</span>
          <div className="mt-4 space-y-5">
            <RegionFigures region={region} meta={meta} />
          </div>
        </section>
      </motion.div>
    </motion.div>
  );
};

export const RegionSheet: React.FC<RegionSheetProps> = ({ region, meta, onClose }) => {
  // Registered once here rather than inside each layout, so the two never race
  // to handle the same keypress.
  useEffect(() => {
    if (!region) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [region, onClose]);

  // Two presences rather than one wrapping both: each has a single motion root
  // to track, and the layout that is display:none at the current width still
  // mounts and unmounts cleanly alongside the visible one.
  return (
    <>
      <AnimatePresence>
        {region && (
          <RegionSheetContent key={region.id} region={region} meta={meta} onClose={onClose} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {region && (
          <RegionSplitCards key={region.id} region={region} meta={meta} onClose={onClose} />
        )}
      </AnimatePresence>
    </>
  );
};
