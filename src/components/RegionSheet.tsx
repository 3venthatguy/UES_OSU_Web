import React, { useEffect } from 'react';
import { AnimatePresence, motion, useDragControls, useReducedMotion } from 'motion/react';
import { ExternalLink, X } from 'lucide-react';
import type { EconomicRegion, EconomicRegionsFile } from '../types';
import { EASE_OUT } from '../lib/motion';

/**
 * The card that rises out of the hero Earth when a region is clicked.
 *
 * Positioned `absolute` inside EarthModel's own wrapper rather than `fixed` to
 * the viewport, for two reasons. The globe has to stay visible above it, which
 * anchoring to the canvas gives for free at every breakpoint; and `position:
 * fixed` is a trap in this app — Framer leaves `transform: translate(0px)` on
 * settled elements, and any non-`none` transform makes that element the
 * containing block for fixed descendants, so a fixed sheet would be positioned
 * against the animating page wrapper instead of the window. `Reveal` and
 * `App.tsx` both strip the settled transform to work around it; staying
 * absolute means never meeting the problem.
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
 * Desktop: docked to the bottom-left corner of the same card instead, where it
 * clears the globe entirely.
 */
const SHEET_CLASS = `absolute inset-x-0 bottom-0 z-20 max-h-[55%] overflow-y-auto select-text
  bg-[#FFFDF9] border-t border-[#EADBCE] rounded-t-3xl shadow-2xl
  md:inset-x-auto md:left-5 md:bottom-5 md:w-[400px] md:max-h-[86%]
  md:border md:rounded-3xl`;

interface RegionSheetProps {
  /** null closes the sheet. */
  region: EconomicRegion | null;
  meta: EconomicRegionsFile['meta'];
  onClose: () => void;
}

/**
 * Mounted only while a region is selected, so switching regions remounts and
 * the sheet re-enters rather than silently swapping its text — matching how
 * RSVPModal splits its content out.
 */
const RegionSheetContent: React.FC<{
  region: EconomicRegion;
  meta: EconomicRegionsFile['meta'];
  onClose: () => void;
}> = ({ region, meta, onClose }) => {
  const reduce = useReducedMotion() ?? false;
  // dragListener={false} + manual start: the sheet scrolls internally on a
  // phone, and a whole-surface y-drag would fight that scroll for every touch.
  // Only the grab handle and the header start a dismiss gesture.
  const dragControls = useDragControls();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const hasData = region.indicators.length > 0;

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

        <button
          onClick={onClose}
          aria-label="Close region details"
          className="absolute top-3 right-4 p-2 rounded-full text-[#524B47] hover:bg-[#FDF8F1] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <span className="text-[10px] uppercase tracking-widest font-bold text-[#F07B41]">
          Regional Economy
        </span>
        <h3 id="region-sheet-title" className="text-2xl font-black text-[#2D0A0C] leading-tight pr-8">
          {region.name}
        </h3>
      </div>

      <div className="px-6 pb-6 space-y-5">
        <p className="text-xs text-[#524B47] leading-relaxed">{region.blurb}</p>

        {/* Headline Indicators */}
        {hasData ? (
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
            <span className="text-[10px] uppercase tracking-widest font-bold text-[#F07B41] block pt-3">
              Largest Economies
            </span>
            <ul className="space-y-1.5">
              {region.economies.map((economy) => (
                <li
                  key={economy.name}
                  className="flex items-baseline justify-between gap-3 text-xs"
                >
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
      </div>
    </motion.section>
  );
};

export const RegionSheet: React.FC<RegionSheetProps> = ({ region, meta, onClose }) => (
  <AnimatePresence>
    {region && (
      <RegionSheetContent key={region.id} region={region} meta={meta} onClose={onClose} />
    )}
  </AnimatePresence>
);
