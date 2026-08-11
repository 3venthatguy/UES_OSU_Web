import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { AboutSection } from './components/AboutSection';
import { CaseCompSection } from './components/CaseCompSection';
import { EventsSection } from './components/EventsSection';
import { ResourcesSection } from './components/ResourcesSection';
import { GetInvolvedSection } from './components/GetInvolvedSection';
import { Footer } from './components/Footer';
import { SplashScreen } from './components/SplashScreen';
import { Reveal, RevealButton, RevealGate } from './components/Reveal';
import { pageVariants, PAGE_TRANSITION_MAX_MS } from './lib/motion';
import { useSmoothScroll, scrollToTop } from './lib/smoothScroll';
import siteConfig from './data/siteConfig.json';
import { ArrowRight, ChevronRight, Home, Users, Trophy, Calendar, BookOpen, UserPlus } from 'lucide-react';

/**
 * Slide direction is derived from this order, so it can never drift from what
 * the navbar shows. Deduped because `centerLinks` leads with the Home tab, which
 * points at the same page as the logo.
 */
const PAGE_ORDER = [
  ...new Set([
    'hero',
    ...siteConfig.navigation.centerLinks.map((link) => link.id),
    siteConfig.navigation.specialLink.id,
  ]),
];

/** Breadcrumb label + section component for every page except the hero hub. */
const PAGES: Record<string, { label: string; Section: React.FC }> = {
  about: { label: 'About Leadership', Section: AboutSection },
  'case-comp': { label: 'Case Competition', Section: CaseCompSection },
  events: { label: 'Events & Workshops', Section: EventsSection },
  resources: { label: 'Resources & Simulator', Section: ResourcesSection },
  'get-involved': { label: 'Get Involved', Section: GetInvolvedSection },
};

/** Hub cards on the home page. The Get Involved card is styled separately below. */
const HUB_CARDS = [
  {
    id: 'about',
    Icon: Users,
    iconClass: 'bg-[#B03A40]/10 text-[#B03A40]',
    title: 'About Leadership',
    body: 'Meet executive board officers, faculty advisors, and society alumni mentors.',
  },
  {
    id: 'case-comp',
    Icon: Trophy,
    iconClass: 'bg-[#F07B41]/10 text-[#F07B41]',
    title: 'Case Competition',
    body: '$10,000 national case competition portal, prompt details, and team registration.',
  },
  {
    id: 'events',
    Icon: Calendar,
    iconClass: 'bg-[#B03A40]/10 text-[#B03A40]',
    title: 'Events & Masterclasses',
    body: 'Recruitment panels, econometrics masterclasses, and RSVP calendar access.',
  },
  {
    id: 'resources',
    Icon: BookOpen,
    iconClass: 'bg-[#F07B41]/10 text-[#F07B41]',
    title: 'Macro Simulator & Hub',
    body: 'Interactive IS-LM policy simulator, academic journals, and study guide archives.',
  },
];

function readHash(): string {
  const hash = window.location.hash.replace('#', '');
  return PAGE_ORDER.includes(hash) ? hash : 'hero';
}

/**
 * Every load lands on the hub, whatever section the URL points at. The hash is
 * still written on navigation so in-session back/forward works, so a reload can
 * arrive carrying one — strip it rather than deep-linking into it.
 */
function useAlwaysStartAtHome() {
  useEffect(() => {
    if (!window.location.hash) return;
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }, []);
}

/** Breadcrumb bar shared by every non-hero page. */
const PageShell: React.FC<{
  label: string;
  onNavigate: (id: string) => void;
  children: React.ReactNode;
}> = ({ label, onNavigate, children }) => (
  <div>
    <div className="bg-white/80 border-b border-[#B03A40]/15 py-8 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs font-bold text-[#605753]">
        <button onClick={() => onNavigate('hero')} className="hover:text-[#B03A40] flex items-center gap-1">
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-[#B03A40]" />
        <span className="text-[#B03A40]">{label}</span>
      </div>
    </div>
    {children}
  </div>
);

const HomePage: React.FC<{ onNavigate: (id: string) => void }> = ({ onNavigate }) => (
  <div className="space-y-12 pb-12">
    <HeroSection onNavigate={onNavigate} />

    {/* Home Hub Bento Grid: Explore Pages */}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <Reveal className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-[10px] font-bold text-[#F07B41] uppercase tracking-widest">
          Explore Society Portals
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-[#2D0A0C]">
          Discover What UES Has To Offer
        </h2>
      </Reveal>

      <Reveal stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {HUB_CARDS.map(({ id, Icon, iconClass, title, body }) => (
          <RevealButton
            key={id}
            onClick={() => onNavigate(id)}
            className="bg-white/80 border border-[#B03A40]/20 rounded-3xl p-6 text-left hover:border-[#B03A40] hover:shadow-xs transition-[border-color,box-shadow] space-y-4 group"
          >
            <div className={`w-10 h-10 rounded-2xl ${iconClass} flex items-center justify-center`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#2D0A0C] group-hover:text-[#B03A40] transition-colors flex items-center justify-between">
                <span>{title}</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-[#524B47] mt-1 leading-relaxed">{body}</p>
            </div>
          </RevealButton>
        ))}

        {/* Hub Card: Get Involved — the wide accent tile */}
        <RevealButton
          onClick={() => onNavigate('get-involved')}
          className="bg-[#B03A40] text-white border border-[#B03A40] rounded-3xl p-6 text-left hover:bg-[#8e202b] transition-colors space-y-4 group sm:col-span-2 lg:col-span-2 shadow-sm"
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
        </RevealButton>
      </Reveal>
    </div>
  </div>
);

export default function App() {
  // Page id and slide direction move together so a render never sees one
  // updated without the other.
  const [{ id: currentPage, direction }, setPage] = useState({
    id: 'hero',
    direction: 0,
  });

  useAlwaysStartAtHome();

  // The splash is an overlay, not a gate — the page (and the 3D scene's 23 MiB of
  // asset loading) renders underneath it from the first frame, so the reveal
  // uncovers a fully painted hero rather than starting the work.
  const [splashDone, setSplashDone] = useState<boolean>(false);

  // False from the moment a tab is picked until the incoming page has finished
  // sliding in. Reveals wait on it so the page slide and the content stagger
  // don't play over each other.
  const [pageEntered, setPageEntered] = useState<boolean>(false);

  const reduce = useReducedMotion() ?? false;
  const variants = useMemo(() => pageVariants(reduce), [reduce]);
  const pageRef = useRef<HTMLDivElement | null>(null);

  useSmoothScroll();

  const goToPage = useCallback((next: string) => {
    setPage((prev) => {
      if (prev.id === next) return prev;
      const forward = PAGE_ORDER.indexOf(next) > PAGE_ORDER.indexOf(prev.id);
      return { id: next, direction: forward ? 1 : -1 };
    });
  }, []);

  const handleNavigate = useCallback(
    (pageId: string) => {
      window.location.hash = pageId;
      goToPage(pageId);
    },
    [goToPage],
  );

  // Sync state with URL hash for deep linking and browser back/forward
  useEffect(() => {
    const syncPageFromHash = () => goToPage(readHash());
    window.addEventListener('hashchange', syncPageFromHash);
    return () => window.removeEventListener('hashchange', syncPageFromHash);
  }, [goToPage]);

  // Close the reveal gate for the incoming page. The timer is a failsafe: if
  // `onAnimationComplete` ever fails to fire, content must not stay invisible.
  useEffect(() => {
    setPageEntered(false);
    const timer = window.setTimeout(() => setPageEntered(true), PAGE_TRANSITION_MAX_MS);
    return () => window.clearTimeout(timer);
  }, [currentPage]);

  const handlePageSettled = useCallback((definition: unknown) => {
    if (definition !== 'center') return;
    // Framer leaves `transform: translateX(0px)` behind, which would make this
    // wrapper the containing block for the modals rendered inside every section.
    // See the note on the outer wrapper below.
    if (pageRef.current) pageRef.current.style.transform = '';
    setPageEntered(true);
  }, []);

  const page = PAGES[currentPage];

  return (
    <>
      {/* Initial Asset Loading Splash */}
      {!splashDone && <SplashScreen onFinished={() => setSplashDone(true)} />}

      {/*
        The settled state applies no translate utility at all. A zeroed one would still
        compute to `translate: 0px 0px` rather than `none`, and any non-none translate
        makes this wrapper the containing block for every `position: fixed` descendant —
        which pins the navbar to the page and centers modals on the document rather than
        on the viewport.
      */}
      <div
        className={`min-h-screen bg-[#FDF8F1] text-[#1C1817] font-sans selection:bg-[#B03A40] selection:text-white flex flex-col justify-between transition-[opacity,translate] duration-[420ms] ease-out ${
          splashDone ? 'opacity-100' : 'opacity-70 translate-y-3.5'
        }`}
        inert={!splashDone}
      >
        {/* Top Fixed Header Navigation */}
        <Navbar activeSection={currentPage} onNavigate={handleNavigate} />

        {/* Main Page Content Area. `overflow-x-clip` absorbs the page slide without
            producing a horizontal scrollbar; unlike `hidden` it does not turn this
            into a scroll container. */}
        <main className="flex-1 pt-16 sm:pt-20 overflow-x-clip">
          <RevealGate.Provider value={splashDone && pageEntered}>
            <AnimatePresence
              mode="wait"
              custom={direction}
              onExitComplete={() => scrollToTop(true)}
            >
              <motion.div
                key={currentPage}
                ref={pageRef}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                onAnimationComplete={handlePageSettled}
              >
                {page ? (
                  <PageShell label={page.label} onNavigate={handleNavigate}>
                    <page.Section />
                  </PageShell>
                ) : (
                  <HomePage onNavigate={handleNavigate} />
                )}
              </motion.div>
            </AnimatePresence>
          </RevealGate.Provider>
        </main>

        {/* Footer */}
        <Footer onNavigate={handleNavigate} />
      </div>
    </>
  );
}
