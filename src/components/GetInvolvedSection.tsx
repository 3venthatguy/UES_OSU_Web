import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Send, CheckCircle2, ChevronDown, ChevronUp, Search, HelpCircle, Mail, User, ShieldCheck } from 'lucide-react';
import faqsData from '../data/faqs.json';
import { Reveal, RevealItem } from './Reveal';

export const GetInvolvedSection: React.FC = () => {
  // Application Form State
  const [appForm, setAppForm] = useState({
    fullName: '',
    email: '',
    gradYear: '2027',
    major: 'Economics',
    committee: 'Academic Affairs',
    statement: '',
    agreed: false
  });

  const [submitted, setSubmitted] = useState(false);

  // FAQ Accordion State
  const [activeFaq, setActiveFaq] = useState<string | null>('faq-1');
  const [faqSearch, setFaqSearch] = useState<string>('');
  const [selectedFaqCat, setSelectedFaqCat] = useState<string>('All');

  const faqCategories = ['All', 'Membership', 'Case Competition', 'Resources & Journal', 'Get Involved'];

  const filteredFaqs = faqsData.items.filter((item) => {
    const matchesCat = selectedFaqCat === 'All' || item.category === selectedFaqCat;
    const matchesSearch =
      item.q.toLowerCase().includes(faqSearch.toLowerCase()) ||
      item.a.toLowerCase().includes(faqSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleAppSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appForm.fullName || !appForm.email || !appForm.agreed) return;

    confetti({
      particleCount: 100,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#F07B41', '#B03A40', '#842329']
    });

    setSubmitted(true);
  };

  return (
    <section id="get-involved" className="py-20 bg-[#FDF8F1] border-t border-[#B03A40]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Section Header */}
        <Reveal className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white border border-[#B03A40]/20 text-[10px] font-bold text-[#F07B41] uppercase tracking-widest shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#B03A40]" /> Join The Community
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#2D0A0C] tracking-tight">
            Get Involved with UES
          </h2>
          <p className="text-base sm:text-lg text-[#524B47] leading-relaxed">
            Become an active member or apply for committee leadership roles to shape the undergraduate economics experience.
          </p>
        </Reveal>

        {/* Membership Application Form & Info Box - Bento Layout */}
        <Reveal stagger className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Info Panel - Bento Card */}
          <RevealItem className="lg:col-span-5 bg-white/80 border border-[#B03A40]/20 rounded-3xl p-8 space-y-6 shadow-xs">
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#F07B41]">
                Why Join UES?
              </span>
              <h3 className="text-2xl font-black text-[#2D0A0C]">
                Elevate Your Academic & Professional Path
              </h3>
            </div>

            <ul className="space-y-4 text-xs sm:text-sm text-[#524B47]">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#B03A40] shrink-0 mt-0.5" />
                <span><strong className="text-[#2D0A0C]">Exclusive Mentorship:</strong> Direct pairing with alumni at Goldman Sachs, Cornerstone, and Fed Board.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#F07B41] shrink-0 mt-0.5" />
                <span><strong className="text-[#2D0A0C]">Case Comp Priority:</strong> First access to dataset releases, mock presentation prep, and travel stipends.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#B03A40] shrink-0 mt-0.5" />
                <span><strong className="text-[#2D0A0C]">Research Publishing:</strong> Submit original econometrics papers to our double-blind reviewed journal.</span>
              </li>
            </ul>

            <div className="pt-4 border-t border-[#B03A40]/10 bg-[#FDF8F1] p-4 rounded-2xl border border-[#B03A40]/10 text-xs text-[#605753] space-y-1">
              <div className="font-bold text-[#2D0A0C]">Zero Membership Fees</div>
              <p>General society membership is 100% free for all university students.</p>
            </div>
          </RevealItem>

          {/* Right Application Form - Bento Card */}
          <RevealItem className="lg:col-span-7 bg-white/80 border border-[#B03A40]/20 rounded-3xl p-6 sm:p-8 shadow-xs">
            {!submitted ? (
              <form onSubmit={handleAppSubmit} className="space-y-6">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-[#2D0A0C]">
                    Student Membership & Committee Form
                  </h3>
                  <p className="text-xs text-[#605753]">
                    Fill in your details below to activate your general membership and express committee interest.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#2D0A0C] mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex Rivera"
                      value={appForm.fullName}
                      onChange={(e) => setAppForm({ ...appForm, fullName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FDF8F1] border border-[#B03A40]/20 text-xs text-[#2D0A0C] focus:outline-none focus:border-[#B03A40]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#2D0A0C] mb-1">
                      University Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="a.rivera@university.edu"
                      value={appForm.email}
                      onChange={(e) => setAppForm({ ...appForm, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FDF8F1] border border-[#B03A40]/20 text-xs text-[#2D0A0C] focus:outline-none focus:border-[#B03A40]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#2D0A0C] mb-1">
                      Primary Major / Field *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Economics & Applied Math"
                      value={appForm.major}
                      onChange={(e) => setAppForm({ ...appForm, major: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FDF8F1] border border-[#B03A40]/20 text-xs text-[#2D0A0C] focus:outline-none focus:border-[#B03A40]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#2D0A0C] mb-1">
                      Expected Graduation Year *
                    </label>
                    <select
                      value={appForm.gradYear}
                      onChange={(e) => setAppForm({ ...appForm, gradYear: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FDF8F1] border border-[#B03A40]/20 text-xs text-[#2D0A0C] focus:outline-none focus:border-[#B03A40]"
                    >
                      <option value="2026">2026</option>
                      <option value="2027">2027</option>
                      <option value="2028">2028</option>
                      <option value="2029">2029</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D0A0C] mb-1">
                    Preferred Committee Track Interest
                  </label>
                  <select
                    value={appForm.committee}
                    onChange={(e) => setAppForm({ ...appForm, committee: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FDF8F1] border border-[#B03A40]/20 text-xs text-[#2D0A0C] focus:outline-none focus:border-[#B03A40]"
                  >
                    <option value="Academic Affairs">Academic Affairs (Tutoring & Workshops)</option>
                    <option value="Case Comp Operations">Case Competition Operations</option>
                    <option value="Corporate Relations">Corporate Relations & Career Night</option>
                    <option value="Research & Publications">Research Journal Editorial Team</option>
                    <option value="Marketing & Community">Marketing & Media Strategy</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D0A0C] mb-1">
                    Brief Statement of Interest (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Tell us what you hope to gain or contribute to UES..."
                    value={appForm.statement}
                    onChange={(e) => setAppForm({ ...appForm, statement: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FDF8F1] border border-[#B03A40]/20 text-xs text-[#2D0A0C] focus:outline-none focus:border-[#B03A40]"
                  />
                </div>

                <label className="flex items-center gap-2 text-xs text-[#524B47] cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={appForm.agreed}
                    onChange={(e) => setAppForm({ ...appForm, agreed: e.target.checked })}
                    className="rounded border-[#B03A40]/20 text-[#B03A40] focus:ring-[#B03A40]"
                  />
                  <span>I agree to receive UES event announcements and newsletter updates.</span>
                </label>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl text-xs font-bold text-white bg-[#F07B41] hover:bg-[#E06C38] shadow-md shadow-[#F07B41]/20 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Membership Application</span>
                </button>
              </form>
            ) : (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#10B981]/10 text-[#10B981] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-[#2D0A0C]">Application Received!</h3>
                <p className="text-xs sm:text-sm text-[#524B47] max-w-sm mx-auto">
                  Welcome to UES, <span className="font-bold text-[#2D0A0C]">{appForm.fullName}</span>! Check <span className="font-bold">{appForm.email}</span> for your welcome packet and committee onboarding dates.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-6 py-2 rounded-full text-xs font-bold text-[#2D0A0C] bg-[#FDF8F1] border border-[#B03A40]/20"
                >
                  Submit Another Application
                </button>
              </div>
            )}
          </RevealItem>
        </Reveal>

        {/* Searchable FAQ Section */}
        <div className="space-y-8 pt-8">
          <Reveal className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#F07B41]">Frequently Asked Questions</span>
              <h3 className="text-2xl sm:text-3xl font-black text-[#2D0A0C] mt-1">
                Have Questions? We Have Answers.
              </h3>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {faqCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedFaqCat(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    selectedFaqCat === cat
                      ? 'bg-[#B03A40] text-white shadow-xs'
                      : 'bg-white text-[#524B47] border border-[#B03A40]/20 hover:border-[#B03A40]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </Reveal>

          {/* Accordions */}
          <Reveal stagger className="space-y-3 max-w-4xl mx-auto">
            {filteredFaqs.map((faq) => {
              const isOpen = activeFaq === faq.id;

              return (
                <RevealItem
                  key={faq.id}
                  className="bg-white/80 border border-[#B03A40]/20 rounded-2xl overflow-hidden shadow-xs transition-colors"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : faq.id)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 font-bold text-sm text-[#2D0A0C] hover:text-[#B03A40]"
                  >
                    <span className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-[#F07B41] shrink-0" />
                      {faq.q}
                    </span>
                    {isOpen ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-[#524B47] leading-relaxed border-t border-[#B03A40]/10">
                      {faq.a}
                    </div>
                  )}
                </RevealItem>
              );
            })}
          </Reveal>
        </div>
      </div>
    </section>
  );
};
