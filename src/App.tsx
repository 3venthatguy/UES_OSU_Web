import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { AboutSection } from './components/AboutSection';
import { CaseCompSection } from './components/CaseCompSection';
import { EventsSection } from './components/EventsSection';
import { ResourcesSection } from './components/ResourcesSection';
import { GetInvolvedSection } from './components/GetInvolvedSection';
import { Footer } from './components/Footer';
import { ArrowRight, ChevronRight, Home, Users, Trophy, Calendar, BookOpen, UserPlus } from 'lucide-react';

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>('hero');

  // Multi-Page Navigation Handler
  const handleNavigate = (pageId: string) => {
    setCurrentPage(pageId);
    window.location.hash = pageId;
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // Sync state with URL hash for deep linking and browser back/forward
  useEffect(() => {
    const syncPageFromHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (['hero', 'about', 'case-comp', 'events', 'resources', 'get-involved'].includes(hash)) {
        setCurrentPage(hash);
      }
    };

    syncPageFromHash();
    window.addEventListener('hashchange', syncPageFromHash);
    return () => window.removeEventListener('hashchange', syncPageFromHash);
  }, []);

  return (
    <div className="min-h-screen bg-[#FDF8F1] text-[#1C1817] font-sans selection:bg-[#B03A40] selection:text-white flex flex-col justify-between">
      {/* Top Fixed Header Navigation */}
      <Navbar activeSection={currentPage} onNavigate={handleNavigate} />

      {/* Main Page Content Area */}
      <main className="flex-1 pt-16 sm:pt-20">
        
        {/* PAGE 1: HERO / HOME */}
        {currentPage === 'hero' && (
          <div className="space-y-12 pb-12">
            <HeroSection onNavigate={handleNavigate} />

            {/* Home Hub Bento Grid: Explore Pages */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <span className="text-[10px] font-bold text-[#F07B41] uppercase tracking-widest">
                  Explore Society Portals
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-[#2D0A0C]">
                  Discover What UES Has To Offer
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Hub Card: About */}
                <button
                  onClick={() => handleNavigate('about')}
                  className="bg-white/80 border border-[#B03A40]/20 rounded-3xl p-6 text-left hover:border-[#B03A40] hover:shadow-xs transition-all space-y-4 group"
                >
                  <div className="w-10 h-10 rounded-2xl bg-[#B03A40]/10 text-[#B03A40] flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#2D0A0C] group-hover:text-[#B03A40] transition-colors flex items-center justify-between">
                      <span>About Leadership</span>
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    <p className="text-xs text-[#524B47] mt-1 leading-relaxed">
                      Meet executive board officers, faculty advisors, and society alumni mentors.
                    </p>
                  </div>
                </button>

                {/* Hub Card: Case Comp */}
                <button
                  onClick={() => handleNavigate('case-comp')}
                  className="bg-white/80 border border-[#B03A40]/20 rounded-3xl p-6 text-left hover:border-[#B03A40] hover:shadow-xs transition-all space-y-4 group"
                >
                  <div className="w-10 h-10 rounded-2xl bg-[#F07B41]/10 text-[#F07B41] flex items-center justify-center">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#2D0A0C] group-hover:text-[#B03A40] transition-colors flex items-center justify-between">
                      <span>Case Competition</span>
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    <p className="text-xs text-[#524B47] mt-1 leading-relaxed">
                      $10,000 national case competition portal, prompt details, and team registration.
                    </p>
                  </div>
                </button>

                {/* Hub Card: Events */}
                <button
                  onClick={() => handleNavigate('events')}
                  className="bg-white/80 border border-[#B03A40]/20 rounded-3xl p-6 text-left hover:border-[#B03A40] hover:shadow-xs transition-all space-y-4 group"
                >
                  <div className="w-10 h-10 rounded-2xl bg-[#B03A40]/10 text-[#B03A40] flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#2D0A0C] group-hover:text-[#B03A40] transition-colors flex items-center justify-between">
                      <span>Events & Masterclasses</span>
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    <p className="text-xs text-[#524B47] mt-1 leading-relaxed">
                      Recruitment panels, econometrics masterclasses, and RSVP calendar access.
                    </p>
                  </div>
                </button>

                {/* Hub Card: Resources */}
                <button
                  onClick={() => handleNavigate('resources')}
                  className="bg-white/80 border border-[#B03A40]/20 rounded-3xl p-6 text-left hover:border-[#B03A40] hover:shadow-xs transition-all space-y-4 group"
                >
                  <div className="w-10 h-10 rounded-2xl bg-[#F07B41]/10 text-[#F07B41] flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#2D0A0C] group-hover:text-[#B03A40] transition-colors flex items-center justify-between">
                      <span>Macro Simulator & Hub</span>
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    <p className="text-xs text-[#524B47] mt-1 leading-relaxed">
                      Interactive IS-LM policy simulator, academic journals, and study guide archives.
                    </p>
                  </div>
                </button>

                {/* Hub Card: Get Involved */}
                <button
                  onClick={() => handleNavigate('get-involved')}
                  className="bg-[#B03A40] text-white border border-[#B03A40] rounded-3xl p-6 text-left hover:bg-[#8e202b] transition-all space-y-4 group sm:col-span-2 lg:col-span-2 shadow-sm"
                >
                  <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span>Join Student Membership</span>
                        <ArrowRight className="w-4 h-4" />
                      </h3>
                      <p className="text-xs text-white/80 mt-1 leading-relaxed max-w-lg">
                        Zero membership fees. Apply for committee leadership tracks or join general member mentorship pairing.
                      </p>
                    </div>
                  </div>
                </button>

              </div>
            </div>
          </div>
        )}

        {/* PAGE 2: ABOUT */}
        {currentPage === 'about' && (
          <div>
            <div className="bg-white/80 border-b border-[#B03A40]/15 py-8 px-4 sm:px-8">
              <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs font-bold text-[#605753]">
                <button onClick={() => handleNavigate('hero')} className="hover:text-[#B03A40] flex items-center gap-1">
                  <Home className="w-3.5 h-3.5" />
                  <span>Home</span>
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-[#B03A40]" />
                <span className="text-[#B03A40]">About Leadership</span>
              </div>
            </div>
            <AboutSection />
          </div>
        )}

        {/* PAGE 3: CASE COMP */}
        {currentPage === 'case-comp' && (
          <div>
            <div className="bg-white/80 border-b border-[#B03A40]/15 py-8 px-4 sm:px-8">
              <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs font-bold text-[#605753]">
                <button onClick={() => handleNavigate('hero')} className="hover:text-[#B03A40] flex items-center gap-1">
                  <Home className="w-3.5 h-3.5" />
                  <span>Home</span>
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-[#B03A40]" />
                <span className="text-[#B03A40]">Case Competition</span>
              </div>
            </div>
            <CaseCompSection />
          </div>
        )}

        {/* PAGE 4: EVENTS */}
        {currentPage === 'events' && (
          <div>
            <div className="bg-white/80 border-b border-[#B03A40]/15 py-8 px-4 sm:px-8">
              <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs font-bold text-[#605753]">
                <button onClick={() => handleNavigate('hero')} className="hover:text-[#B03A40] flex items-center gap-1">
                  <Home className="w-3.5 h-3.5" />
                  <span>Home</span>
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-[#B03A40]" />
                <span className="text-[#B03A40]">Events & Workshops</span>
              </div>
            </div>
            <EventsSection />
          </div>
        )}

        {/* PAGE 5: RESOURCES */}
        {currentPage === 'resources' && (
          <div>
            <div className="bg-white/80 border-b border-[#B03A40]/15 py-8 px-4 sm:px-8">
              <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs font-bold text-[#605753]">
                <button onClick={() => handleNavigate('hero')} className="hover:text-[#B03A40] flex items-center gap-1">
                  <Home className="w-3.5 h-3.5" />
                  <span>Home</span>
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-[#B03A40]" />
                <span className="text-[#B03A40]">Resources & Simulator</span>
              </div>
            </div>
            <ResourcesSection />
          </div>
        )}

        {/* PAGE 6: GET INVOLVED */}
        {currentPage === 'get-involved' && (
          <div>
            <div className="bg-white/80 border-b border-[#B03A40]/15 py-8 px-4 sm:px-8">
              <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs font-bold text-[#605753]">
                <button onClick={() => handleNavigate('hero')} className="hover:text-[#B03A40] flex items-center gap-1">
                  <Home className="w-3.5 h-3.5" />
                  <span>Home</span>
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-[#B03A40]" />
                <span className="text-[#B03A40]">Get Involved</span>
              </div>
            </div>
            <GetInvolvedSection />
          </div>
        )}

      </main>

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}


