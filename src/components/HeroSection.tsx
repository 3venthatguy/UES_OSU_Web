import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { EarthModel } from './EarthModel';
import { Trophy, Calendar, ArrowRight } from 'lucide-react';
import siteConfig from '../data/siteConfig.json';
import { Reveal, RevealItem, RevealGate, useSettleTransform } from './Reveal';
import {
  heroGlobe,
  heroHeadlineLine,
  heroIntro,
  heroTail,
  HERO_INTRO_MAX_MS,
} from '../lib/motion';

/**
 * Landing hero, and the launch sequence that introduces it.
 *
 * The splash is an overlay rather than a gate (see the header comment in
 * SplashScreen.tsx), so this section is fully mounted and painted — model
 * downloaded, globe already spinning — before the curtain ever lifts. Left
 * alone, that means the hero is simply *there* the instant the orange panel
 * clips away, which is the one thing an arrival animation is supposed to avoid.
 *
 * So the top block holds itself back until `RevealGate` opens, then plays once:
 * badge, the two headline lines rising out of their masks a beat apart, the
 * globe growing up off its bottom edge, and finally the subheading and buttons.
 * The globe's beat is by far the longest and deliberately overruns the others —
 * it is still expanding after the text has landed, which is what makes the five
 * elements read as one movement instead of a queue. Timings live in
 * src/lib/motion.ts.
 */

const HEADLINE_LINES = siteConfig.hero.headline_lines;

/**
 * Whether the sequence has already run in this session.
 *
 * Module-level rather than component state, because the whole point is to
 * survive a *remount*: picking any other tab unmounts HeroSection (App's
 * `<AnimatePresence mode="wait">` swaps the page out entirely), so without this
 * the globe would re-grow from nothing every single time the user clicked Home.
 */
let introPlayed = false;

interface HeroSectionProps {
  onNavigate: (id: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onNavigate }) => {
  // `splashDone && pageEntered` — the curtain has finished lifting and the page
  // has settled. Exactly the cue the sequence waits on.
  const gateOpen = useContext(RevealGate);
  const reduce = useReducedMotion() ?? false;

  // Read once, so every render in this mount agrees on whether it is replaying.
  const alreadyPlayed = useRef(introPlayed).current;
  const play = alreadyPlayed || gateOpen;

  // Drives the two things that must not apply mid-flight: the globe is inert
  // until it has finished growing, and `will-change` is dropped once it has.
  const [settled, setSettled] = useState(alreadyPlayed);

  const globeRef = useRef<HTMLDivElement>(null);
  const settleGlobe = useSettleTransform(globeRef);

  const handleIntroComplete = useCallback((definition: unknown) => {
    if (definition !== 'visible') return;
    introPlayed = true;
    setSettled(true);
  }, []);

  // Failsafe, mirroring App.tsx's `pageEntered` timer: if onAnimationComplete
  // never fires, the hero must not be left invisible and undraggable.
  useEffect(() => {
    if (!play || settled) return;
    const timer = window.setTimeout(() => {
      introPlayed = true;
      setSettled(true);
    }, HERO_INTRO_MAX_MS);
    return () => window.clearTimeout(timer);
  }, [play, settled]);

  // The section's top padding is deliberately short: with the badge gone the
  // headline is the first thing in the hero, and it should sit close under the
  // navbar rather than floating in the middle of the fold.
  return (
    <section id="hero" className="relative pt-14 sm:pt-16 md:pt-20 pb-16 bg-[#FDF8F1] overflow-hidden">
      {/* Background Decorative Soft Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#B03A400A_1px,transparent_1px),linear-gradient(to_bottom,#B03A400A_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        {/*
          Launch Sequence Container.

          Owns only the opening beat of held breath; each child below carries its
          own delay off that, so the order is stated once in motion.ts rather
          than being an emergent property of the DOM order here. Framer stops
          propagating variants at any child that declares its own `animate`,
          which is why the bento grid's <Reveal> further down is untouched by
          this and keeps its independent scroll behaviour.
        */}
        <motion.div
          initial={alreadyPlayed ? 'visible' : 'hidden'}
          animate={play ? 'visible' : 'hidden'}
          variants={heroIntro(reduce)}
          onAnimationComplete={handleIntroComplete}
        >
          {/* Core Stack: Two-Line Display Headline + 3D Model Overlapping It */}
          <div className="relative flex flex-col items-center">

            {/*
              Display Headline.

              Each line is its own `overflow-hidden` mask with the text sitting
              one full line-height below it at rest, so it rises into view out of
              an edge that is never drawn — the move the reference clip makes,
              and the reason a plain fade would not do.

              Two constraints hold the type here:

               - `leading-[1.05]` is the tightest this can go. The mask clips to
                 the line box, and at a line-height below 1 the caps of a black
                 weight overshoot that box and get shaved off along the top.
               - The size is a clamp, not a breakpoint ladder, because the
                 binding constraint is the *longer line* fitting the container on
                 one line at every width in between — a ladder only pins five of
                 those widths and lets the line wrap between them, which would
                 quietly turn this into a three-line headline. The vw term keeps
                 "Fostering Tomorrow's" whole from ~300px up; 6rem caps it once
                 the container stops growing at max-w-7xl. If the copy is ever
                 lengthened and a line wraps, 6.5vw is the number to lower.

              `pointer-events-none` matters — the globe is drawn over the lower
              part of this heading, and without it the text would swallow drags
              aimed at the overlapping strip of canvas.
            */}
            <h1 className="relative z-0 text-center px-2 max-w-6xl mx-auto pointer-events-none select-none font-sans font-black uppercase tracking-tight leading-[1.05] text-[clamp(1.375rem,6.5vw,6rem)] text-[#B03A40]">
              {HEADLINE_LINES.map((line, index) => (
                <span key={line} className="block overflow-hidden">
                  <motion.span
                    className="block"
                    custom={index}
                    variants={heroHeadlineLine(reduce)}
                  >
                    {line}
                  </motion.span>
                </span>
              ))}
            </h1>

            {/*
              Interactive 3D Earth Canvas.

              Drawn *over* the headline (`z-10` against the h1's `z-0`) and
              pulled up hard enough that the top of the globe crosses the second
              line — the planet passing in front of the wordmark, the way the
              reference clip lets the machine cover the bottom of its own.

              The negative margin has to clear the canvas's own dead space
              before any overlap begins: the box is 520/600/680px tall and the
              camera frames the model to ~82% of that (CAMERA_FILL in
              EarthModel), so roughly 47/54/61px of the top is empty before the
              globe starts. These values spend that and then some. **This is the
              knob** — increase it for more overlap, decrease it for less.

              `transform-origin: 50% 100%` is what makes the grow read as
              expanding up off the bottom edge rather than swelling about the
              centre. Scaling the wrapper costs nothing and needs no cooperation
              from EarthModel: the canvas renders at full resolution and is only
              *displayed* smaller, so it is never resampled above native, and
              `pinAt()` derives its hit targets from getBoundingClientRect(),
              which already accounts for the transform (see EarthModel.tsx:823).
              It is still held inert until settled — a half-grown globe should
              not be grabbable.

              `xl:max-w-7xl` is not a bigger globe. The camera fit is bound by
              the *height* of this box at every desktop aspect (fitDistance
              takes the max of the two terms, and the vertical one wins from
              1024px up), so widening it leaves the model drawn at exactly the
              same ~550px and only grows the transparent gutter either side —
              which is what the two region cards sit in from xl up. Below that
              breakpoint they collapse back to one docked panel and the extra
              width would buy nothing, hence the breakpoint.
            */}
            <motion.div
              ref={globeRef}
              variants={heroGlobe(reduce)}
              onAnimationComplete={settleGlobe}
              style={{
                transformOrigin: '50% 100%',
                willChange: settled ? undefined : 'transform, opacity',
              }}
              className={`relative z-10 w-full max-w-5xl xl:max-w-7xl -mt-16 sm:-mt-20 md:-mt-24 ${
                settled ? '' : 'pointer-events-none'
              }`}
            >
              <EarthModel />
            </motion.div>

            {/* Subheading & Action Buttons beneath 3D Scene */}
            <motion.div
              variants={heroTail(reduce)}
              className="relative z-20 text-center max-w-3xl mx-auto mt-6 px-4"
            >
              <p className="text-base sm:text-lg md:text-xl font-medium text-[#524B47] leading-relaxed mb-8">
                {siteConfig.hero.subheading}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4">
                <button
                  onClick={() => onNavigate('case-comp')}
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-base font-bold text-white bg-[#B03A40] hover:bg-[#8e202b] active:scale-95 shadow-lg shadow-[#B03A40]/25 transition-all duration-200"
                >
                  <Trophy className="w-5 h-5 text-[#F07B41]" />
                  <span>2026 Case Comp ($10k)</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>

                <button
                  onClick={() => onNavigate('events')}
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-base font-bold text-[#1C1817] bg-white hover:bg-[#FFFDF9] border border-[#B03A40]/20 hover:border-[#B03A40] active:scale-95 shadow-xs transition-all duration-200"
                >
                  <Calendar className="w-5 h-5 text-[#B03A40]" />
                  <span>Upcoming Events</span>
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Hero Bento Grid Highlights Row */}
        <Reveal stagger className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-6">

          {/* Bento Card 1: Mission & Membership Metrics */}
          <RevealItem className="md:col-span-5 border border-[#B03A40]/20 rounded-3xl p-6 sm:p-8 bg-white/80 backdrop-blur-xs flex flex-col justify-between space-y-6 shadow-xs hover:border-[#B03A40]/40 transition-colors">
            <div className="space-y-3">
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#F07B41]">Our Mission</span>
              <h3 className="text-2xl font-bold text-[#B03A40] leading-tight">
                Empowering students through rigorous analytical discourse and professional development.
              </h3>
              <p className="text-sm text-[#524B47] leading-relaxed">
                Bridging the gap between theoretical economics and real-world policy & finance for over 500 undergraduate members.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#B03A40]/10">
              <div>
                <div className="text-2xl font-black text-[#B03A40]">500+</div>
                <div className="text-[11px] font-semibold text-[#605753] uppercase tracking-wider">Active Members</div>
              </div>
              <div>
                <div className="text-2xl font-black text-[#F07B41]">$10,000</div>
                <div className="text-[11px] font-semibold text-[#605753] uppercase tracking-wider">Case Comp Pool</div>
              </div>
            </div>
          </RevealItem>

          {/* Bento Card 2: Featured Events Preview */}
          <RevealItem className="md:col-span-4 border border-[#B03A40]/20 rounded-3xl p-6 sm:p-8 bg-white/80 backdrop-blur-xs flex flex-col justify-between space-y-4 shadow-xs hover:border-[#B03A40]/40 transition-colors">
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#F07B41] mb-4 block">
                Upcoming Spotlight
              </span>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-2.5 rounded-2xl bg-[#FDF8F1] border border-[#B03A40]/10">
                  <div className="w-12 h-12 rounded-xl bg-[#B03A40]/10 flex flex-col items-center justify-center text-[#B03A40] font-bold shrink-0">
                    <span className="text-[10px]">OCT</span>
                    <span className="text-base leading-none">18</span>
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#1C1817]">National Case Comp Kickoff</h4>
                    <p className="text-[11px] text-[#605753]">Auditorium A • 6:00 PM</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-2.5 rounded-2xl bg-[#FDF8F1] border border-[#B03A40]/10">
                  <div className="w-12 h-12 rounded-xl bg-[#F07B41]/10 flex flex-col items-center justify-center text-[#F07B41] font-bold shrink-0">
                    <span className="text-[10px]">OCT</span>
                    <span className="text-base leading-none">28</span>
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#1C1817]">Federal Reserve Policy Panel</h4>
                    <p className="text-[11px] text-[#605753]">Economics Hall • 4:30 PM</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('events')}
              className="w-full py-2.5 bg-[#FDF8F1] hover:bg-[#B03A40]/5 border border-[#B03A40]/20 rounded-xl text-xs font-bold text-[#B03A40] transition-colors flex items-center justify-center gap-1.5"
            >
              <span>View Full Calendar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </RevealItem>

          {/* Bento Card 3: High Impact Solid Accent Box */}
          <RevealItem className="md:col-span-3 border border-[#B03A40] rounded-3xl p-6 sm:p-8 bg-[#B03A40] text-white flex flex-col justify-between space-y-6 shadow-md">
            <span className="text-[10px] uppercase tracking-widest font-bold text-[#FFD3B5]">
              Active Resources
            </span>
            <div className="space-y-1">
              <h4 className="text-4xl font-black tracking-tight">24+</h4>
              <p className="text-xs font-medium text-white/80 leading-relaxed">
                Exclusive Datasets, Econometrics Repositories & Exam Guides
              </p>
            </div>
            <button
              onClick={() => onNavigate('resources')}
              className="w-full py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold transition-all text-white"
            >
              Access Resource Archive
            </button>
          </RevealItem>

        </Reveal>
      </div>
    </section>
  );
};
