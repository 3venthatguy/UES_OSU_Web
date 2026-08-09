import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Users, CheckCircle2, AlertCircle, Send, Sparkles, X } from 'lucide-react';
import caseCompData from '../data/caseComp.json';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    teamName: '',
    university: '',
    track: caseCompData.tracks[0].id,
    leadName: '',
    leadEmail: '',
    leadPhone: '',
    member2: '',
    member3: '',
    member4: '',
    agreedToRules: false
  });

  const [submitted, setSubmitted] = useState(false);
  const [refId, setRefId] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.teamName || !formData.leadName || !formData.leadEmail || !formData.agreedToRules) return;

    // Trigger Confetti Celebration
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#B03A40', '#F07B41', '#842329', '#E8A838']
    });

    const generatedRef = 'UES-2026-' + Math.floor(100000 + Math.random() * 900000);
    setRefId(generatedRef);
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-[#FFFDF9] border border-[#EADBCE] rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative my-8 space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#524B47] hover:bg-[#FDF8F1] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full bg-[#FDF8F1] border border-[#EADBCE] text-[11px] font-bold text-[#B03A40] uppercase tracking-wider inline-flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-[#F07B41]" /> Team Registration Portal
              </span>
              <h3 className="text-2xl font-black text-[#1C1817]">
                Register for the 2026 UES Case Competition
              </h3>
              <p className="text-xs sm:text-sm text-[#605753]">
                Teams consist of 2 to 4 undergraduate students. Compete for $10,000 in total prizes.
              </p>
            </div>

            {/* Team & School Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#1C1817] mb-1">
                  Team Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Econometric Vanguard"
                  value={formData.teamName}
                  onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FDF8F1] border border-[#EADBCE] text-sm text-[#1C1817] focus:outline-none focus:border-[#B03A40]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C1817] mb-1">
                  University / College *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stanford University"
                  value={formData.university}
                  onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FDF8F1] border border-[#EADBCE] text-sm text-[#1C1817] focus:outline-none focus:border-[#B03A40]"
                />
              </div>
            </div>

            {/* Track Selection */}
            <div>
              <label className="block text-xs font-bold text-[#1C1817] mb-1.5">
                Select Primary Competition Track *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {caseCompData.tracks.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, track: t.id })}
                    className={`p-3 rounded-2xl border text-left text-xs font-semibold transition-all ${
                      formData.track === t.id
                        ? 'bg-[#B03A40] text-white border-[#B03A40] shadow-sm'
                        : 'bg-[#FDF8F1] text-[#524B47] border-[#EADBCE] hover:border-[#B03A40]'
                    }`}
                  >
                    <div className="font-bold mb-0.5">{t.name.split(':')[0]}</div>
                    <div className="text-[10px] opacity-80 line-clamp-1">{t.name.split(':')[1]}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Team Leader Contact */}
            <div className="space-y-3 pt-2 border-t border-[#EADBCE]">
              <h4 className="text-xs font-bold text-[#1C1817] uppercase tracking-wider">
                Primary Team Leader (Point of Contact)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Full Name *"
                  value={formData.leadName}
                  onChange={(e) => setFormData({ ...formData, leadName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FDF8F1] border border-[#EADBCE] text-xs text-[#1C1817] focus:outline-none focus:border-[#B03A40]"
                />
                <input
                  type="email"
                  required
                  placeholder="University Email Address *"
                  value={formData.leadEmail}
                  onChange={(e) => setFormData({ ...formData, leadEmail: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FDF8F1] border border-[#EADBCE] text-xs text-[#1C1817] focus:outline-none focus:border-[#B03A40]"
                />
              </div>
            </div>

            {/* Additional Members */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#1C1817] uppercase tracking-wider">
                Additional Team Members (Optional up to 3)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Member 2 Name & Major"
                  value={formData.member2}
                  onChange={(e) => setFormData({ ...formData, member2: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#FDF8F1] border border-[#EADBCE] text-xs text-[#1C1817] focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Member 3 Name & Major"
                  value={formData.member3}
                  onChange={(e) => setFormData({ ...formData, member3: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#FDF8F1] border border-[#EADBCE] text-xs text-[#1C1817] focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Member 4 Name & Major"
                  value={formData.member4}
                  onChange={(e) => setFormData({ ...formData, member4: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#FDF8F1] border border-[#EADBCE] text-xs text-[#1C1817] focus:outline-none"
                />
              </div>
            </div>

            {/* Checkbox Agreement */}
            <label className="flex items-start gap-2 text-xs text-[#524B47] cursor-pointer">
              <input
                type="checkbox"
                required
                checked={formData.agreedToRules}
                onChange={(e) => setFormData({ ...formData, agreedToRules: e.target.checked })}
                className="mt-0.5 rounded border-[#EADBCE] text-[#B03A40] focus:ring-[#B03A40]"
              />
              <span>
                I confirm that all team members are enrolled undergraduate students and agree to abide by the UES Honor Code and submission guidelines.
              </span>
            </label>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl text-sm font-bold text-white bg-[#B03A40] hover:bg-[#8e202b] shadow-lg shadow-[#B03A40]/25 transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4 text-[#F07B41]" />
              <span>Complete Team Registration</span>
            </button>
          </form>
        ) : (
          /* Confirmation State */
          <div className="text-center py-8 space-y-5">
            <div className="w-16 h-16 rounded-full bg-[#10B981]/10 text-[#10B981] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-[#B03A40]">
                Registration Confirmed!
              </span>
              <h3 className="text-2xl font-black text-[#1C1817]">
                Welcome to the 2026 Case Comp, {formData.teamName}!
              </h3>
              <p className="text-xs sm:text-sm text-[#524B47] max-w-md mx-auto">
                Your team registration has been recorded. The case prompt kit and dataset links will be sent to <span className="font-bold text-[#1C1817]">{formData.leadEmail}</span> on October 15.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FDF8F1] border border-[#EADBCE] inline-block text-left text-xs font-mono">
              <span className="text-[#605753]">Confirmation Reference:</span>{' '}
              <span className="font-bold text-[#B03A40] text-sm">{refId}</span>
            </div>

            <div>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-[#B03A40]"
              >
                Close & Return to Hub
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
