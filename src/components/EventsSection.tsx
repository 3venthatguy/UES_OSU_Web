import React, { useState } from 'react';
import eventsData from '../data/events.json';
import { EventItem } from '../types';
import { Calendar, Clock, MapPin, Search, Users, ArrowUpRight, Sparkles } from 'lucide-react';
import { RSVPModal } from './RSVPModal';

export const EventsSection: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeRsvpEvent, setActiveRsvpEvent] = useState<EventItem | null>(null);

  const categories = ['All', 'Case Comp', 'Workshop', 'Career', 'Academic'];

  const filteredUpcoming = eventsData.upcoming.filter((ev) => {
    const matchesCat = selectedCategory === 'All' || ev.category === selectedCategory;
    const matchesSearch =
      ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.speaker.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <section id="events" className="py-20 bg-[#FDF8F1] border-t border-[#B03A40]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#B03A40]/20 text-[10px] font-bold text-[#B03A40] uppercase tracking-widest shadow-xs">
              <Calendar className="w-3.5 h-3.5 text-[#F07B41]" /> Society Calendar
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#2D0A0C] tracking-tight">
              Upcoming Events & Workshops
            </h2>
            <p className="text-sm text-[#524B47]">
              Connect with leading economists, corporate recruiters, and fellow student researchers.
            </p>
          </div>

          {/* Search & Category Filter Pills */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#605753]" />
              <input
                type="text"
                placeholder="Search events or speakers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-full bg-white border border-[#B03A40]/20 text-xs text-[#2D0A0C] focus:outline-none focus:border-[#B03A40] w-full sm:w-56"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-[#B03A40] text-white shadow-xs'
                      : 'bg-white text-[#524B47] border border-[#B03A40]/20 hover:border-[#B03A40]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming Events Grid - Bento Card Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredUpcoming.map((event) => {
            const capacityPercent = Math.min(100, Math.round((event.rsvps / event.capacity) * 100));

            return (
              <div
                key={event.id}
                className="bg-white/80 border border-[#B03A40]/20 rounded-3xl p-6 sm:p-8 shadow-xs hover:shadow-md hover:border-[#B03A40] transition-all flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#B03A40] text-white text-[10px] font-bold uppercase tracking-wider">
                      {event.category}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#FDF8F1] border border-[#B03A40]/20 text-[10px] font-bold text-[#F07B41] uppercase tracking-widest">
                      {event.tag}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-[#2D0A0C] leading-snug">
                    {event.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#524B47] leading-relaxed line-clamp-2">
                    {event.description}
                  </p>

                  <div className="space-y-1.5 pt-2 text-xs font-medium text-[#524B47]">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[#B03A40]" />
                      <span>{event.displayDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#F07B41]" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#2D0A0C] font-semibold">
                      <Users className="w-3.5 h-3.5 text-[#B03A40]" />
                      <span>Speaker: {event.speaker}</span>
                    </div>
                  </div>
                </div>

                {/* RSVP Capacity & Action Button */}
                <div className="pt-4 border-t border-[#B03A40]/10 flex items-center justify-between gap-4">
                  <div className="space-y-1 w-1/2">
                    <div className="flex justify-between text-[11px] font-semibold text-[#605753]">
                      <span>RSVP Capacity</span>
                      <span>{event.rsvps} / {event.capacity}</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#FDF8F1] border border-[#B03A40]/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#B03A40] rounded-full"
                        style={{ width: `${capacityPercent}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveRsvpEvent(event as EventItem)}
                    className="px-5 py-2.5 rounded-full text-xs font-bold text-white bg-[#B03A40] hover:bg-[#8e202b] shadow-xs transition-all"
                  >
                    RSVP Seat
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Past Events Archive Summary - Bento Container */}
        <div className="bg-white/80 border border-[#B03A40]/20 rounded-3xl p-8 space-y-6 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#F07B41]">Event Archive</span>
              <h3 className="text-lg sm:text-xl font-bold text-[#2D0A0C]">Past Highlights & Recaps</h3>
            </div>
            <span className="text-[10px] font-bold text-[#B03A40] uppercase tracking-widest">Recent Term</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {eventsData.past.map((pe) => (
              <div key={pe.id} className="p-4 rounded-2xl bg-[#FDF8F1] border border-[#B03A40]/10 space-y-2">
                <span className="text-[10px] font-bold uppercase text-[#B03A40] tracking-widest">{pe.date}</span>
                <h4 className="text-xs font-bold text-[#2D0A0C]">{pe.title}</h4>
                <p className="text-[11px] text-[#524B47] leading-relaxed">{pe.recap}</p>
                <div className="text-[10px] font-semibold text-[#F07B41] pt-1">
                  👥 {pe.attendees} Attendees
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RSVP Modal */}
      <RSVPModal
        event={activeRsvpEvent}
        onClose={() => setActiveRsvpEvent(null)}
      />
    </section>
  );
};
