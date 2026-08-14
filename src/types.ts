export interface SiteConfig {
  projectSettings: {
    organizationName: string;
    shortName: string;
    mainColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    typography: string;
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
    /** One entry per rendered line of the hero H1. Each animates in on its own. */
    headline_lines: string[];
    subheading: string;
    object_3d_file: string;
    action: string;
    stats: Array<{ value: string; label: string }>;
  };
}

/** Org-wide contact details — the single source of truth is src/data/contact.json. */
export interface ContactInfo {
  email: string;
  location: {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    /** Pre-joined one-line form, for display. */
    full: string;
    mapsUrl: string;
  };
  socials: SocialLink[];
}

export interface SocialLink {
  id: string;
  label: string;
  handle: string;
  /** lucide-react icon name — see SOCIAL_ICONS in src/lib/contact.ts. */
  icon: string;
  url: string;
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
  /** Also the headshot filename slug — see src/lib/profilePhotos.ts. */
  id: string;
  name: string;
  title: string;
  /** Undergrad year, free text — "'26", "Senior", whatever reads best. */
  year: string;
  /** Empty arrays render nothing. */
  majors: string[];
  minors: string[];
  bio: string;
  email: string;
  /** Full URL; empty string hides the button. */
  linkedin: string;
  /** Full URL; empty string hides the button. */
  instagram: string;
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

/** One headline figure on a region card. Pre-formatted for display — see EconomicRegion. */
export interface RegionIndicator {
  label: string;
  value: string;
}

/** A named economy listed inside a region card, largest first. */
export interface RegionEconomy {
  name: string;
  gdp: string;
}

/**
 * A clickable macro-region on the hero Earth.
 *
 * Every figure is stored **pre-formatted as a string** ("$35.0T", "1.9%"), the
 * same way events.json stores `displayDate`. The numbers come from a single IMF
 * release and are never recomputed here, so there is nothing for the component
 * to round, scale or localise — and no way for it to quietly change a published
 * value. An empty `indicators` array renders as "no data reported".
 */
export interface EconomicRegion {
  id: string;
  name: string;
  blurb: string;
  /**
   * Unit vector in the glTF model's local frame, marking where this region's
   * pin stands on the globe.
   *
   * It does three jobs at once, which is why there is only one of them: the pin
   * is planted along it, the hit test measures the cursor against the pin's
   * projection, and selecting the region turns this direction to face the
   * camera. It is each region's GDP-weighted centre, snapped onto mesh terrain
   * so no pin floats over open water — see docs/3D_MODEL_VIEWER.md.
   */
  pin: number[];
  indicators: RegionIndicator[];
  economies: RegionEconomy[];
}

/** Shape of src/data/economicRegions.json. */
export interface EconomicRegionsFile {
  meta: {
    source: string;
    sourceUrl: string;
    vintage: string;
    units: string;
    note: string;
  };
  regions: EconomicRegion[];
}
