import React, { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { EventItem } from '../types';
import { useScrollLock } from '../lib/useScrollLock';
import { Calendar, CheckCircle2, Clock, MapPin, User, Mail, Download, ExternalLink, X } from 'lucide-react';

interface RSVPModalProps {
  event: EventItem | null;
  onClose: () => void;
}

/**
 * Mounted only while an event is selected, so its form state starts fresh every
 * time — RSVPing for one event no longer leaves the confirmation screen showing
 * when the next one opens.
 */
const RSVPModalContent: React.FC<{ event: EventItem; onClose: () => void }> = ({ event, onClose }) => {
  const [formData, setFormData] = useState({ name: '', email: '', major: 'Economics' });
  const [confirmed, setConfirmed] = useState(false);
  const reduce = useReducedMotion() ?? false;

  useScrollLock(true);

  const handleRSVP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;
    setConfirmed(true);
  };

  // Generate Google Calendar URL
  const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}`;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduce ? 0 : 0.2 }}
    >
      <motion.div
        className="bg-[#FFFDF9] border border-[#EADBCE] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative space-y-6"
        initial={reduce ? undefined : { opacity: 0, y: 16, scale: 0.97 }}
        animate={reduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
        exit={reduce ? undefined : { opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: reduce ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#524B47] hover:bg-[#FDF8F1]"
        >
          <X className="w-5 h-5" />
        </button>

        {!confirmed ? (
          <form onSubmit={handleRSVP} className="space-y-5">
            <div className="space-y-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#B03A40] text-white text-[10px] font-bold uppercase">
                {event.category}
              </span>
              <h3 className="text-xl font-bold text-[#1C1817] leading-snug">
                RSVP for {event.title}
              </h3>
              <div className="space-y-1 text-xs text-[#524B47]">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#B03A40]" />
                  <span>{event.displayDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#F07B41]" />
                  <span>{event.location}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-[#EADBCE]">
              <div>
                <label className="block text-xs font-bold text-[#1C1817] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jane Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FDF8F1] border border-[#EADBCE] text-xs text-[#1C1817] focus:outline-none focus:border-[#B03A40]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C1817] mb-1">
                  Student Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="j.doe@university.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FDF8F1] border border-[#EADBCE] text-xs text-[#1C1817] focus:outline-none focus:border-[#B03A40]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl text-xs font-bold text-white bg-[#B03A40] hover:bg-[#8e202b] shadow-md transition-all"
            >
              Confirm Seat RSVP
            </button>
          </form>
        ) : (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#10B981]/10 text-[#10B981] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-[#1C1817]">You're Confirmed!</h3>
              <p className="text-xs text-[#524B47]">
                A calendar invitation and confirmation receipt has been sent to <span className="font-bold">{formData.email}</span>.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <a
                href={gcalUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-[#4285F4] hover:opacity-90 flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                <span>Add to Google Calendar</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-[#1C1817] bg-[#FDF8F1] border border-[#EADBCE]"
              >
                Close Window
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export const RSVPModal: React.FC<RSVPModalProps> = ({ event, onClose }) => (
  <AnimatePresence>
    {event && <RSVPModalContent event={event} onClose={onClose} />}
  </AnimatePresence>
);
