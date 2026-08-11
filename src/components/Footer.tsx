import React, { useState } from 'react';
import { UESLogo } from './UESLogo';
import { Mail, MapPin, Send, CheckCircle2, ArrowUpRight } from 'lucide-react';
import siteConfig from '../data/siteConfig.json';
import { contact, contactMailto, getSocialIcon, socials } from '../lib/contact';
import { Reveal, RevealItem } from './Reveal';

interface FooterProps {
  onNavigate: (id: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [newsEmail, setNewsEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsEmail) return;
    setSubscribed(true);
  };

  return (
    <footer className="bg-[#1C1817] text-[#FFFDF9] pt-16 pb-12 border-t border-[#B03A40]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Bento Grid Footer Card Container */}
        <Reveal stagger className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-[#3A3331]">

          {/* Brand Info - Bento Card */}
          <RevealItem className="md:col-span-5 bg-[#25201E] border border-[#3A3331] rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="cursor-pointer" onClick={() => onNavigate('hero')}>
              <UESLogo size="md" textColor="text-white" />
            </div>
            <p className="text-xs sm:text-sm text-[#A39B97] leading-relaxed">
              The Undergraduate Economics Society (UES) empowers students through empirical research, national case competitions, policy roundtable discussions, and corporate career development.
            </p>

            <div className="space-y-2 text-xs text-[#C2BAB5] pt-2 border-t border-[#3A3331]">
              <a href={contactMailto} className="flex items-center gap-2 hover:text-white transition-colors">
                <Mail className="w-4 h-4 text-[#F07B41] shrink-0" />
                <span>{contact.email}</span>
              </a>
              <a
                href={contact.location.mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 hover:text-white transition-colors"
              >
                <MapPin className="w-4 h-4 text-[#B03A40] shrink-0" />
                <span>{contact.location.full}</span>
              </a>
            </div>
          </RevealItem>

          {/* Quick Nav Links - Bento Card */}
          <RevealItem className="md:col-span-3 bg-[#25201E] border border-[#3A3331] rounded-3xl p-6 sm:p-8 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#F07B41]">
                Quick Links
              </span>
              <ul className="space-y-2 text-xs font-semibold text-[#C2BAB5]">
                {siteConfig.navigation.centerLinks.map((link) => (
                  <li key={link.id}>
                    <button
                      onClick={() => onNavigate(link.id)}
                      className="hover:text-white transition-colors flex items-center gap-1"
                    >
                      <span>{link.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => onNavigate('get-involved')}
              className="w-full py-2.5 rounded-xl bg-[#B03A40] text-white text-xs font-bold hover:bg-[#8e202b] transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Get Involved</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#FFD3B5]" />
            </button>
          </RevealItem>

          {/* Newsletter Box - Bento Card */}
          <RevealItem className="md:col-span-4 bg-[#25201E] border border-[#3A3331] rounded-3xl p-6 sm:p-8 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#F07B41]">
                Economics Dispatch
              </span>
              <h4 className="text-base font-bold text-white">
                Weekly Intelligence Digest
              </h4>
              <p className="text-xs text-[#A39B97] leading-relaxed">
                Subscribe for econometrics updates, case comp prompt releases, and recruiter opportunities.
              </p>
            </div>

            {!subscribed ? (
              <form onSubmit={handleNewsSubmit} className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="student@university.edu"
                  value={newsEmail}
                  onChange={(e) => setNewsEmail(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl bg-[#1C1817] border border-[#3A3331] text-xs text-white focus:outline-none focus:border-[#B03A40] w-full"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-[#F07B41] hover:bg-[#E06C38] text-white text-xs font-bold transition-all shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <div className="p-3 rounded-xl bg-[#1C1817] text-xs text-[#10B981] font-semibold flex items-center gap-2 border border-[#10B981]/30">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Subscribed! Check inbox for welcome edition.</span>
              </div>
            )}
          </RevealItem>
        </Reveal>

        {/* Bottom Rights & Socials */}
        <Reveal className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8A817D]">
          <div>
            © {new Date().getFullYear()} Undergraduate Economics Society (UES). All rights reserved.
          </div>

          <div className="flex items-center gap-4">
            {socials.map((social) => {
              const Icon = getSocialIcon(social)!;
              return (
                <a
                  key={social.id}
                  href={social.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`UES on ${social.label}`}
                  title={social.handle}
                  className="hover:text-white transition-colors p-2 bg-[#25201E] rounded-full border border-[#3A3331]"
                >
                  <Icon className="w-4 h-4" />
                </a>
              );
            })}
          </div>
        </Reveal>
      </div>
    </footer>
  );
};
