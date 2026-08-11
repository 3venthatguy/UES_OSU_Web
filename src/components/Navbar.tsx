import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { UESLogo } from './UESLogo';
import { Menu, X, ArrowUpRight, Sparkles } from 'lucide-react';
import siteConfig from '../data/siteConfig.json';

interface NavbarProps {
  activeSection: string;
  onNavigate: (id: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeSection, onNavigate }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const reduce = useReducedMotion() ?? false;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (id: string) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#FDF8F1]/90 backdrop-blur-md shadow-xs border-b border-[#B03A40]/15 py-3'
          : 'bg-[#FDF8F1] py-4 sm:py-5'
      }`}
    >
      {/*
        The logo and the CTA sit on equal `flex-1` rails so the nav pill lands on
        the container's centre line regardless of how wide either of them is.
        `justify-between` only centred it when the two happened to match, which
        they never did.
      */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-4">
        {/* Left rail: UES Logo */}
        <div className="flex-1 min-w-0 flex justify-start">
          <button
            onClick={() => handleNavClick('hero')}
            className="focus:outline-none focus:ring-2 focus:ring-[#B03A40] rounded-xl p-1 transition-opacity hover:opacity-90"
          >
            <UESLogo size="md" />
          </button>
        </div>

        {/* Center: Navigation Links floating bento pill */}
        <nav className="hidden lg:flex shrink-0 items-center gap-1 bg-white/80 backdrop-blur-md border border-[#B03A40]/20 rounded-full px-3 py-1.5 shadow-xs">
          {siteConfig.navigation.centerLinks.map((link) => {
            const isActive = activeSection === link.id;
            return (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`px-3.5 xl:px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-[#B03A40] text-white shadow-xs'
                    : 'text-[#524B47] hover:text-[#2D0A0C] hover:bg-[#FDF8F1]'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Right rail: CTA on desktop, hamburger below it */}
        <div className="flex-1 min-w-0 flex justify-end items-center gap-2">
          <button
            onClick={() => handleNavClick(siteConfig.navigation.specialLink.id)}
            className="group relative hidden lg:inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold text-white bg-[#F07B41] hover:bg-[#E06C38] active:scale-95 shadow-xs transition-all duration-200"
          >
            <span className="uppercase tracking-wider whitespace-nowrap">{siteConfig.navigation.specialLink.label}</span>
            <Sparkles className="w-3.5 h-3.5 transition-transform group-hover:rotate-12" />
          </button>

          <button
            onClick={() => handleNavClick(siteConfig.navigation.specialLink.id)}
            className="lg:hidden px-3.5 py-1.5 rounded-full text-xs font-bold text-white bg-[#F07B41] shadow-sm whitespace-nowrap"
          >
            Join
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-[#1C1817] hover:bg-[#FFFDF9] border border-[#EADBCE] focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="lg:hidden bg-[#FDF8F1] border-b border-[#EADBCE] px-6 shadow-xl overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex flex-col gap-2 py-6">
            {siteConfig.navigation.centerLinks.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`w-full text-left px-4 py-3 rounded-2xl text-base font-semibold transition-all ${
                    isActive
                      ? 'bg-[#B03A40] text-white'
                      : 'text-[#1C1817] hover:bg-[#FFFDF9]'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
            <button
              onClick={() => handleNavClick(siteConfig.navigation.specialLink.id)}
              className="w-full mt-2 text-center px-4 py-3 rounded-2xl text-base font-bold text-white bg-[#F07B41] shadow-md flex items-center justify-center gap-2"
            >
              <span>{siteConfig.navigation.specialLink.label}</span>
              <ArrowUpRight className="w-5 h-5" />
            </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
