import React from 'react';
import { Economic3DModel } from './Economic3DModel';
import { Trophy, Calendar, ArrowRight, TrendingUp, Users, ShieldCheck, Sparkles } from 'lucide-react';
import siteConfig from '../data/siteConfig.json';

interface HeroSectionProps {
  onNavigate: (id: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onNavigate }) => {
  return (
    <section id="hero" className="relative pt-24 sm:pt-28 md:pt-32 pb-16 bg-[#FDF8F1] overflow-hidden">
      {/* Background Decorative Soft Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#B03A400A_1px,transparent_1px),linear-gradient(to_bottom,#B03A400A_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        {/* Top Tag Badge */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-[#B03A40]/20 backdrop-blur-xs shadow-xs text-xs font-bold text-[#B03A40]">
            <Sparkles className="w-3.5 h-3.5 text-[#F07B41]" />
            <span className="uppercase tracking-widest text-[11px]">Undergraduate Economics Society • Fall 2026</span>
          </div>
        </div>

        {/* Core Depth Experience Stack: Background Display Text + Overlay 3D Model */}
        <div className="relative min-h-[500px] sm:min-h-[580px] md:min-h-[620px] flex flex-col items-center justify-center my-2">
          
          {/* Layer 1 (BEHIND 3D OBJECT): Oversized High-Impact Typography */}
          <div className="absolute top-4 sm:top-8 inset-x-0 z-0 text-center pointer-events-none select-none px-2">
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black tracking-tight text-[#B03A40]/10 uppercase font-sans max-w-6xl mx-auto leading-none">
              {siteConfig.hero.text_behind_object}
            </h1>
          </div>

          {/* Layer 2 (IN FRONT): Interactive 3D Economic Model Canvas */}
          <div className="relative z-10 w-full max-w-5xl">
            <Economic3DModel />
          </div>

          {/* Subheading & Action Buttons beneath 3D Scene */}
          <div className="relative z-20 text-center max-w-3xl mx-auto mt-6 px-4">
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
          </div>
        </div>

        {/* Hero Bento Grid Highlights Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-6">
          
          {/* Bento Card 1: Mission & Membership Metrics */}
          <div className="md:col-span-5 border border-[#B03A40]/20 rounded-3xl p-6 sm:p-8 bg-white/80 backdrop-blur-xs flex flex-col justify-between space-y-6 shadow-xs hover:border-[#B03A40]/40 transition-colors">
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
          </div>

          {/* Bento Card 2: Featured Events Preview */}
          <div className="md:col-span-4 border border-[#B03A40]/20 rounded-3xl p-6 sm:p-8 bg-white/80 backdrop-blur-xs flex flex-col justify-between space-y-4 shadow-xs hover:border-[#B03A40]/40 transition-colors">
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
          </div>

          {/* Bento Card 3: High Impact Solid Accent Box */}
          <div className="md:col-span-3 border border-[#B03A40] rounded-3xl p-6 sm:p-8 bg-[#B03A40] text-white flex flex-col justify-between space-y-6 shadow-md">
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
          </div>

        </div>
      </div>
    </section>
  );
};
