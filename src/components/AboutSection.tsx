import React, { useState } from 'react';
import { BookOpen, Trophy, TrendingUp, FileText, Mail, Linkedin, ArrowUpRight, CheckCircle2, Award, Users } from 'lucide-react';
import generalData from '../data/general.json';
import officersData from '../data/officers.json';
import { Officer } from '../types';

export const AboutSection: React.FC = () => {
  const [selectedCommittee, setSelectedCommittee] = useState<string>('All');
  const [activeOfficerModal, setActiveOfficerModal] = useState<Officer | null>(null);

  const committees = ['All', 'Executive Board', 'Case Comp Committee', 'Academic Affairs', 'Corporate Relations', 'Research & Journal'];

  const filteredOfficers = selectedCommittee === 'All'
    ? officersData.members
    : officersData.members.filter(m => m.committee === selectedCommittee);

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
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-block px-3.5 py-1 rounded-full bg-white/80 border border-[#B03A40]/20 text-[10px] font-bold text-[#B03A40] uppercase tracking-widest shadow-xs">
            About The Society
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#2D0A0C] tracking-tight">
            Bridging Theory, Data, & Real-World Economics
          </h2>
          <p className="text-base sm:text-lg text-[#524B47] leading-relaxed">
            {generalData.mission_statement}
          </p>
        </div>

        {/* Vision Statement Callout Banner - Bento Styled */}
        <div className="bg-gradient-to-r from-[#B03A40] to-[#842329] rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden border border-[#B03A40]">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[10px] font-bold tracking-widest uppercase text-[#FFD3B5]">
              <Award className="w-4 h-4 text-[#F07B41]" /> Strategic Vision
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold leading-snug">
              "{generalData.vision_statement}"
            </h3>
          </div>
        </div>

        {/* 4 Core Organizational Pillars - Bento Grid Layout */}
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-2">
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#F07B41]">Our Foundation</span>
              <h3 className="text-2xl sm:text-3xl font-black text-[#2D0A0C]">
                Core Academic & Professional Pillars
              </h3>
            </div>
            <p className="text-xs text-[#605753] max-w-sm">
              Four structured development tracks for undergraduate success across economics, research, and corporate roles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {generalData.pillars.map((pillar, idx) => {
              // Asymmetric Bento Grid spanning logic
              const isWide = idx === 0 || idx === 3;
              const spanClass = isWide ? 'md:col-span-7' : 'md:col-span-5';

              return (
                <div
                  key={pillar.id}
                  className={`${spanClass} bg-white/80 border border-[#B03A40]/20 rounded-3xl p-6 sm:p-8 shadow-xs hover:shadow-md hover:border-[#B03A40] transition-all duration-300 flex flex-col justify-between space-y-6`}
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
                </div>
              );
            })}
          </div>
        </div>

        {/* History Timeline - Bento Container */}
        <div className="bg-white/80 border border-[#B03A40]/20 rounded-3xl p-8 sm:p-10 space-y-6 shadow-xs">
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
        </div>

        {/* Executive Board & Officer Directory */}
        <div className="space-y-8 pt-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#F07B41]">Leadership Directory</span>
              <h3 className="text-2xl sm:text-3xl font-black text-[#2D0A0C] mt-1">
                Meet Executive Board & Officers
              </h3>
            </div>

            {/* Committee Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {committees.map((comm) => (
                <button
                  key={comm}
                  onClick={() => setSelectedCommittee(comm)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    selectedCommittee === comm
                      ? 'bg-[#B03A40] text-white shadow-xs'
                      : 'bg-white text-[#524B47] border border-[#B03A40]/20 hover:border-[#B03A40]'
                  }`}
                >
                  {comm}
                </button>
              ))}
            </div>
          </div>

          {/* Officer Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOfficers.map((officer) => (
              <div
                key={officer.id}
                onClick={() => setActiveOfficerModal(officer as Officer)}
                className="group bg-white/80 border border-[#B03A40]/20 rounded-3xl p-5 shadow-xs hover:shadow-md hover:border-[#B03A40] transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={officer.photo}
                      alt={officer.name}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-2xl object-cover border border-[#B03A40]/20 group-hover:scale-105 transition-transform"
                    />
                    <div>
                      <h4 className="text-base font-bold text-[#2D0A0C] group-hover:text-[#B03A40] transition-colors">
                        {officer.name}
                      </h4>
                      <p className="text-xs font-semibold text-[#B03A40]">
                        {officer.title}
                      </p>
                      <span className="text-[11px] text-[#605753]">
                        {officer.major}
                      </span>
                    </div>
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
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Officer Bio Modal */}
      {activeOfficerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#FFFDF9] border border-[#B03A40]/20 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative space-y-6">
            <button
              onClick={() => setActiveOfficerModal(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-[#524B47] hover:bg-[#FDF8F1] text-sm font-bold"
            >
              ✕
            </button>

            <div className="flex items-center gap-5">
              <img
                src={activeOfficerModal.photo}
                alt={activeOfficerModal.name}
                referrerPolicy="no-referrer"
                className="w-20 h-20 rounded-2xl object-cover border-2 border-[#B03A40]"
              />
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#B03A40] text-white text-[10px] font-bold uppercase tracking-wider">
                  {activeOfficerModal.committee}
                </span>
                <h3 className="text-xl font-bold text-[#2D0A0C] mt-1">
                  {activeOfficerModal.name}
                </h3>
                <p className="text-xs font-semibold text-[#B03A40]">
                  {activeOfficerModal.title}
                </p>
                <p className="text-xs text-[#605753]">
                  {activeOfficerModal.major}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#2D0A0C] uppercase tracking-wider">
                Biography & Experience
              </h4>
              <p className="text-xs sm:text-sm text-[#524B47] leading-relaxed">
                {activeOfficerModal.bio}
              </p>
            </div>

            <div className="pt-4 border-t border-[#B03A40]/10 flex items-center gap-3">
              <a
                href={`mailto:${activeOfficerModal.email}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FDF8F1] border border-[#B03A40]/20 text-xs font-bold text-[#2D0A0C] hover:border-[#B03A40]"
              >
                <Mail className="w-4 h-4 text-[#B03A40]" />
                <span>Contact Officer</span>
              </a>
              <a
                href={activeOfficerModal.linkedin}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B66C2] text-white text-xs font-bold hover:opacity-90"
              >
                <Linkedin className="w-4 h-4" />
                <span>LinkedIn</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
