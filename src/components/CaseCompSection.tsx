import React, { useState, useEffect } from 'react';
import { Trophy, Clock, Award, FileText, Download, Calendar, Users, Building, Landmark, Globe, ArrowRight, Sparkles } from 'lucide-react';
import caseCompData from '../data/caseComp.json';
import { RegistrationModal } from './RegistrationModal';

export const CaseCompSection: React.FC = () => {
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);

  // Live Countdown Timer State
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const targetDate = new Date(caseCompData.registrationDeadline).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const sponsorIcons: Record<string, React.ReactNode> = {
    Building: <Building className="w-5 h-5 text-[#B03A40]" />,
    BarChart3: <Trophy className="w-5 h-5 text-[#F07B41]" />,
    Landmark: <Landmark className="w-5 h-5 text-[#B03A40]" />,
    Globe: <Globe className="w-5 h-5 text-[#842329]" />
  };

  return (
    <section id="case-comp" className="py-20 bg-white/50 border-t border-[#B03A40]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white border border-[#B03A40]/20 text-[10px] font-bold text-[#B03A40] uppercase tracking-widest shadow-xs">
            <Trophy className="w-3.5 h-3.5 text-[#F07B41]" /> Flagship Event
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#2D0A0C] tracking-tight">
            2026 National Economics Case Competition
          </h2>
          <p className="text-base sm:text-lg text-[#524B47] leading-relaxed">
            {caseCompData.theme}
          </p>
        </div>

        {/* Live Countdown Banner - Bento Styled */}
        <div className="bg-white/80 border border-[#B03A40]/20 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
          <div className="space-y-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-[10px] font-bold uppercase tracking-widest text-[#F07B41]">
              <Clock className="w-4 h-4 text-[#F07B41]" /> Registration Deadline Countdown
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-[#2D0A0C]">
              Closes October 25, 2026 at 11:59 PM EST
            </h3>
          </div>

          {/* Timer Clock */}
          <div className="flex items-center gap-3">
            {[
              { label: 'Days', val: timeLeft.days },
              { label: 'Hours', val: timeLeft.hours },
              { label: 'Mins', val: timeLeft.minutes },
              { label: 'Secs', val: timeLeft.seconds }
            ].map((unit, idx) => (
              <div key={idx} className="bg-[#FDF8F1] border border-[#B03A40]/20 rounded-2xl px-3.5 py-2.5 text-center min-w-[64px]">
                <div className="text-2xl font-black text-[#B03A40] leading-none">
                  {String(unit.val).padStart(2, '0')}
                </div>
                <div className="text-[10px] font-bold text-[#605753] uppercase mt-1 tracking-wider">
                  {unit.label}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setIsRegModalOpen(true)}
            className="px-7 py-3.5 rounded-full text-xs font-bold text-white bg-[#B03A40] hover:bg-[#8e202b] shadow-md shadow-[#B03A40]/20 transition-all whitespace-nowrap"
          >
            Register Team Now
          </button>
        </div>

        {/* Prize Pool Breakdown Grid ($10,000 Total) */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#F07B41]">Award Distribution</span>
              <h3 className="text-2xl font-black text-[#2D0A0C]">
                {caseCompData.prizePoolTotal} Total Cash Prize Pool
              </h3>
            </div>
            <span className="text-xs text-[#605753] font-medium">
              Plus corporate interviews & executive judge networking
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {caseCompData.prizes.map((prize, idx) => (
              <div
                key={idx}
                className={`rounded-3xl p-6 border transition-all duration-300 flex flex-col justify-between ${
                  idx === 0
                    ? 'bg-gradient-to-b from-[#B03A40] to-[#842329] text-white border-[#B03A40] shadow-xl scale-102'
                    : 'bg-white/80 border-[#B03A40]/20 text-[#2D0A0C] hover:border-[#B03A40]'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${idx === 0 ? 'text-[#FFD3B5]' : 'text-[#F07B41]'}`}>
                      {prize.place}
                    </span>
                    <Award className={`w-5 h-5 ${idx === 0 ? 'text-[#F07B41]' : 'text-[#B03A40]'}`} />
                  </div>
                  <div className={`text-3xl font-black tracking-tight ${idx === 0 ? 'text-white' : 'text-[#B03A40]'}`}>
                    {prize.amount}
                  </div>
                  <p className={`text-xs leading-relaxed ${idx === 0 ? 'text-white/90' : 'text-[#524B47]'}`}>
                    {prize.perks}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Competition Tracks */}
        <div className="space-y-6">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#F07B41]">Track Focus Areas</span>
          <h3 className="text-2xl font-black text-[#2D0A0C]">
            Competition Tracks & Prompts
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {caseCompData.tracks.map((track) => (
              <div
                key={track.id}
                className="bg-white/80 border border-[#B03A40]/20 rounded-3xl p-6 space-y-3 hover:border-[#B03A40] transition-colors shadow-xs"
              >
                <span className="px-2.5 py-0.5 rounded-full bg-[#FDF8F1] border border-[#B03A40]/20 text-[10px] font-bold text-[#B03A40] uppercase tracking-wider">
                  {track.id}
                </span>
                <h4 className="text-base font-bold text-[#2D0A0C]">
                  {track.name}
                </h4>
                <p className="text-xs text-[#524B47] leading-relaxed">
                  {track.focus}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Sequence - Bento Styled */}
        <div className="bg-white/80 border border-[#B03A40]/20 rounded-3xl p-8 space-y-8 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-[#2D0A0C] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#B03A40]" /> Competition Schedule & Milestones
            </h3>
            <span className="text-[10px] font-bold text-[#B03A40] uppercase tracking-widest">Fall 2026</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 relative">
            {caseCompData.timeline.map((step, idx) => (
              <div key={idx} className="bg-[#FDF8F1] border border-[#B03A40]/10 rounded-2xl p-4 space-y-2 relative">
                <div className="text-xs font-black text-[#B03A40]">
                  {step.date}
                </div>
                <h5 className="text-xs font-bold text-[#2D0A0C] leading-snug">
                  {step.title}
                </h5>
                <p className="text-[11px] text-[#605753] leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Sponsors Banner */}
        <div className="pt-6 border-t border-[#B03A40]/10 space-y-4">
          <div className="text-center">
            <span className="text-[10px] font-bold text-[#F07B41] uppercase tracking-widest">
              Proudly Sponsored & Judged By Industry Leaders
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {caseCompData.sponsors.map((s, idx) => (
              <div
                key={idx}
                className="bg-white/80 border border-[#B03A40]/20 rounded-2xl p-4 flex items-center justify-center gap-3 text-xs font-bold text-[#2D0A0C]"
              >
                {sponsorIcons[s.logo]}
                <span>{s.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Registration Modal Integration */}
      <RegistrationModal
        isOpen={isRegModalOpen}
        onClose={() => setIsRegModalOpen(false)}
      />
    </section>
  );
};
