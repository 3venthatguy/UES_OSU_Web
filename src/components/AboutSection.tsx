import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { BookOpen, Trophy, TrendingUp, FileText, Mail, Linkedin, Instagram, ArrowUpRight, CheckCircle2, Award, Users, X } from 'lucide-react';
import generalData from '../data/general.json';
import officersData from '../data/officers.json';
import { getProfilePhoto, getInitials } from '../lib/profilePhotos';
import { useScrollLock } from '../lib/useScrollLock';
import { Reveal, RevealItem } from './Reveal';
import { Officer } from '../types';

/**
 * Officer headshot, resolved from the officer's id (see lib/profilePhotos.ts).
 *
 * `layoutId` sits on the wrapper rather than the <img> so the shared-element
 * morph between card and expanded panel behaves identically whether we have a
 * photo or are falling back to initials.
 */
const OfficerAvatar: React.FC<{
  officer: Officer;
  layoutId: string;
  className: string;
}> = ({ officer, layoutId, className }) => {
  const photo = getProfilePhoto(officer.id);

  return (
    <motion.div
      layoutId={layoutId}
      className={`${className} shrink-0 overflow-hidden bg-[#FDF8F1] flex items-center justify-center`}
    >
      {photo ? (
        <img src={photo} alt={officer.name} className="w-full h-full object-cover" />
      ) : (
        <span aria-hidden="true" className="font-black text-[#B03A40]">
          {getInitials(officer.name)}
        </span>
      )}
    </motion.div>
  );
};

export const AboutSection: React.FC = () => {
  const [activeOfficer, setActiveOfficer] = useState<Officer | null>(null);
  const reduceMotion = useReducedMotion();

  // Card that opened the panel, so focus can return to it on close
  const triggerRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const openOfficer = (officer: Officer, trigger: HTMLElement) => {
    triggerRef.current = trigger;
    setActiveOfficer(officer);
  };

  const closeOfficer = useCallback(() => {
    setActiveOfficer(null);
    triggerRef.current?.focus();
  }, []);

  useScrollLock(!!activeOfficer);

  // Escape to close, and move focus into the panel when it opens
  useEffect(() => {
    if (!activeOfficer) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeOfficer();
    };
    window.addEventListener('keydown', onKeyDown);
    closeButtonRef.current?.focus();

    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeOfficer, closeOfficer]);

  const pillarIcons: Record<string, React.ReactNode> = {
    BookOpen: <BookOpen className="w-6 h-6 text-[#B03A40]" />,
    Trophy: <Trophy className="w-6 h-6 text-[#F07B41]" />,
    TrendingUp: <TrendingUp className="w-6 h-6 text-[#B03A40]" />,
    FileText: <FileText className="w-6 h-6 text-[#842329]" />,
  };

  return (
    <section id="about" className="py-20 bg-[#FDF8F1] border-t border-[#B03A40]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Mission & Vision Header */}
        <Reveal className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-block px-3.5 py-1 rounded-full bg-white/80 border border-[#B03A40]/20 text-[10px] font-bold text-[#B03A40] uppercase tracking-widest shadow-xs">
            About The Society
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#2D0A0C] tracking-tight">
            Bridging Theory, Data, & Real-World Economics
          </h2>
          <p className="text-base sm:text-lg text-[#524B47] leading-relaxed">
            {generalData.mission_statement}
          </p>
        </Reveal>

        {/* Vision Statement Callout Banner - Bento Styled */}
        <Reveal className="bg-gradient-to-r from-[#B03A40] to-[#842329] rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden border border-[#B03A40]">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[10px] font-bold tracking-widest uppercase text-[#FFD3B5]">
              <Award className="w-4 h-4 text-[#F07B41]" /> Strategic Vision
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold leading-snug">
              "{generalData.vision_statement}"
            </h3>
          </div>
        </Reveal>

        {/* 4 Core Organizational Pillars - Bento Grid Layout */}
        <div className="space-y-8">
          <Reveal className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-2">
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#F07B41]">Our Foundation</span>
              <h3 className="text-2xl sm:text-3xl font-black text-[#2D0A0C]">
                Core Academic & Professional Pillars
              </h3>
            </div>
            <p className="text-xs text-[#605753] max-w-sm">
              Four structured development tracks for undergraduate success across economics, research, and corporate roles.
            </p>
          </Reveal>

          <Reveal stagger className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {generalData.pillars.map((pillar, idx) => {
              // Asymmetric Bento Grid spanning logic
              const isWide = idx === 0 || idx === 3;
              const spanClass = isWide ? 'md:col-span-7' : 'md:col-span-5';

              return (
                <RevealItem
                  key={pillar.id}
                  className={`${spanClass} bg-white/80 border border-[#B03A40]/20 rounded-3xl p-6 sm:p-8 shadow-xs hover:shadow-md hover:border-[#B03A40] transition-[box-shadow,border-color] duration-300 flex flex-col justify-between space-y-6`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-[#FDF8F1] border border-[#B03A40]/20 flex items-center justify-center shadow-xs">
                        {pillarIcons[pillar.icon]}
                      </div>
                      <span className="text-[10px] uppercase font-bold text-[#F07B41] tracking-widest">Pillar 0{idx + 1}</span>
                    </div>

                    <h4 className="text-xl font-bold text-[#2D0A0C]">
                      {pillar.title}
                    </h4>

                    <p className="text-xs sm:text-sm text-[#524B47] leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>
                </RevealItem>
              );
            })}
          </Reveal>
        </div>

        {/* History Timeline - Bento Container */}
        <Reveal className="bg-white/80 border border-[#B03A40]/20 rounded-3xl p-8 sm:p-10 space-y-6 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#FDF8F1] border border-[#B03A40]/20 text-[#B03A40]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#F07B41]">Historical Track Record</span>
              <h3 className="text-xl font-bold text-[#2D0A0C]">Society Milestones</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t border-[#B03A40]/10">
            {generalData.history.map((hist, i) => (
              <div key={i} className="bg-[#FDF8F1] border border-[#B03A40]/10 rounded-2xl p-4 space-y-2">
                <span className="text-2xl font-black text-[#B03A40]">
                  {hist.year}
                </span>
                <p className="text-xs text-[#524B47] leading-relaxed font-medium">
                  {hist.event}
                </p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Executive Board & Officer Directory */}
        <div className="space-y-8 pt-6">
          <Reveal>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#F07B41]">Leadership Directory</span>
            <h3 className="text-2xl sm:text-3xl font-black text-[#2D0A0C] mt-1">
              Meet Executive Board & Officers
            </h3>
          </Reveal>

          {/*
            The officer cards carry `layoutId` for the card→panel morph. Animating a
            transform on them or on their parent makes Framer's layout projection
            drift, so this grid reveals as one block instead of per-card.
          */}
          <Reveal className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {officersData.members.map((officer) => (
              <motion.div
                key={officer.id}
                layoutId={`officer-card-${officer.id}`}
                role="button"
                tabIndex={0}
                aria-haspopup="dialog"
                onClick={(e) => openOfficer(officer as Officer, e.currentTarget as HTMLElement)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openOfficer(officer as Officer, e.currentTarget as HTMLElement);
                  }
                }}
                animate={{ opacity: activeOfficer?.id === officer.id ? 0 : 1 }}
                whileHover={reduceMotion ? undefined : { y: -6, scale: 1.02 }}
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 30 }}
                className="group bg-white/80 border border-[#B03A40]/20 rounded-3xl p-5 shadow-xs hover:shadow-lg hover:shadow-[#B03A40]/15 hover:border-[#B03A40] transition-[box-shadow,border-color] duration-300 cursor-pointer flex flex-col justify-between focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B03A40]"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-4 min-w-0">
                      <OfficerAvatar
                        officer={officer as Officer}
                        layoutId={`officer-photo-${officer.id}`}
                        className="w-16 h-16 rounded-2xl border border-[#B03A40]/20 group-hover:scale-105 transition-transform"
                      />
                      <div className="min-w-0">
                        <h4 className="text-base font-bold text-[#2D0A0C] group-hover:text-[#B03A40] transition-colors">
                          {officer.name}
                        </h4>
                        <p className="text-xs font-semibold text-[#B03A40]">
                          {officer.title}
                        </p>
                        {officer.majors.length > 0 && (
                          <span className="text-[11px] text-[#605753]">
                            {officer.majors.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>

                    {officer.year && (
                      <span className="shrink-0 text-[10px] uppercase font-bold text-[#F07B41] tracking-widest">
                        {officer.year}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#524B47] line-clamp-2 leading-relaxed">
                    {officer.bio}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#B03A40]/10 flex items-center justify-between text-xs font-medium text-[#B03A40]">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FDF8F1] border border-[#B03A40]/20 text-[10px] font-bold text-[#524B47]">
                    {officer.committee}
                  </span>
                  <span className="inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform font-bold">
                    Profile <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </motion.div>
            ))}
          </Reveal>
        </div>
      </div>

      {/* Officer Bio Panel - expands from the clicked card to screen center */}
      <AnimatePresence>
        {activeOfficer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              onClick={closeOfficer}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.2 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.div
              layoutId={`officer-card-${activeOfficer.id}`}
              role="dialog"
              aria-modal="true"
              aria-labelledby="officer-dialog-name"
              onClick={(e) => e.stopPropagation()}
              transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 32 }}
              data-lenis-prevent
              className="relative bg-[#FFFDF9] border border-[#B03A40]/20 rounded-3xl p-6 sm:p-8 max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl space-y-6"
            >
              <button
                ref={closeButtonRef}
                onClick={closeOfficer}
                aria-label="Close officer profile"
                className="absolute top-4 right-4 p-2 rounded-full text-[#524B47] hover:bg-[#FDF8F1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B03A40]"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-5">
                <OfficerAvatar
                  officer={activeOfficer}
                  layoutId={`officer-photo-${activeOfficer.id}`}
                  className="w-20 h-20 rounded-2xl border-2 border-[#B03A40] text-lg"
                />
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#B03A40] text-white text-[10px] font-bold uppercase tracking-wider">
                    {activeOfficer.committee}
                  </span>
                  <h3 id="officer-dialog-name" className="text-xl font-bold text-[#2D0A0C] mt-1">
                    {activeOfficer.name}
                  </h3>
                  <p className="text-xs font-semibold text-[#B03A40]">
                    {activeOfficer.title}
                  </p>
                  {activeOfficer.year && (
                    <p className="text-xs text-[#605753]">
                      {activeOfficer.year}
                    </p>
                  )}
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.2, delay: reduceMotion ? 0 : 0.12 }}
                className="space-y-6"
              >
                {(activeOfficer.majors.length > 0 || activeOfficer.minors.length > 0) && (
                  <div className="space-y-1">
                    {activeOfficer.majors.length > 0 && (
                      <p className="text-xs sm:text-sm text-[#524B47]">
                        <span className="font-bold text-[#2D0A0C]">Majors:</span>{' '}
                        {activeOfficer.majors.join(', ')}
                      </p>
                    )}
                    {activeOfficer.minors.length > 0 && (
                      <p className="text-xs sm:text-sm text-[#524B47]">
                        <span className="font-bold text-[#2D0A0C]">Minors:</span>{' '}
                        {activeOfficer.minors.join(', ')}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-[#2D0A0C] uppercase tracking-wider">
                    Biography & Experience
                  </h4>
                  <p className="text-xs sm:text-sm text-[#524B47] leading-relaxed">
                    {activeOfficer.bio}
                  </p>
                </div>

                {(activeOfficer.email || activeOfficer.linkedin || activeOfficer.instagram) && (
                  <div className="pt-4 border-t border-[#B03A40]/10 flex flex-wrap items-center gap-3">
                    {activeOfficer.email && (
                      <a
                        href={`mailto:${activeOfficer.email}`}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FDF8F1] border border-[#B03A40]/20 text-xs font-bold text-[#2D0A0C] hover:border-[#B03A40]"
                      >
                        <Mail className="w-4 h-4 text-[#B03A40]" />
                        <span>Contact Officer</span>
                      </a>
                    )}
                    {activeOfficer.linkedin && (
                      <a
                        href={activeOfficer.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B66C2] text-white text-xs font-bold hover:opacity-90"
                      >
                        <Linkedin className="w-4 h-4" />
                        <span>LinkedIn</span>
                      </a>
                    )}
                    {activeOfficer.instagram && (
                      <a
                        href={activeOfficer.instagram}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E1306C] text-white text-xs font-bold hover:opacity-90"
                      >
                        <Instagram className="w-4 h-4" />
                        <span>Instagram</span>
                      </a>
                    )}
                  </div>
                )}
              </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
