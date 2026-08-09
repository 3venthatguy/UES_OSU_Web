export interface SiteConfig {
  projectSettings: {
    organizationName: string;
    shortName: string;
    mainColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    typography: string;
    contactEmail: string;
    location: string;
  };
  navigation: {
    headerLogo: string;
    centerLinks: Array<{ label: string; href: string; id: string }>;
    specialLink: {
      label: string;
      href: string;
      id: string;
      style: string;
    };
  };
  hero: {
    text_behind_object: string;
    subheading: string;
    object_3d_file: string;
    action: string;
    stats: Array<{ value: string; label: string }>;
  };
}

export interface Pillar {
  id: string;
  title: string;
  icon: string;
  description: string;
}

export interface HistoryItem {
  year: string;
  event: string;
}

export interface Officer {
  id: string;
  name: string;
  title: string;
  major: string;
  bio: string;
  email: string;
  linkedin: string;
  photo: string;
  committee: string;
}

export interface EventItem {
  id: string;
  title: string;
  date: string;
  displayDate: string;
  location: string;
  category: 'Case Comp' | 'Workshop' | 'Career' | 'Academic' | 'Social';
  featured: boolean;
  tag: string;
  description: string;
  speaker: string;
  rsvps: number;
  capacity: number;
}

export interface PastEventItem {
  id: string;
  title: string;
  date: string;
  category: string;
  recap: string;
  attendees: number;
}

export interface CaseTrack {
  id: string;
  name: string;
  focus: string;
}

export interface PrizeItem {
  place: string;
  amount: string;
  perks: string;
}

export interface TimelineStep {
  date: string;
  title: string;
  desc: string;
}

export interface Sponsor {
  name: string;
  logo: string;
}

export interface ResourceItem {
  id: string;
  title: string;
  category: string;
  author: string;
  downloadUrl: string;
  format: string;
  size: string;
  description: string;
}

export interface FAQItem {
  id: string;
  category: string;
  q: string;
  a: string;
}
