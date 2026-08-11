/**
 * Org contact details, typed.
 *
 * Every address, email, and social URL on the site comes from
 * `src/data/contact.json` through this module — components should never inline
 * one. Updating the org's Instagram handle or moving offices is a one-line edit
 * to that JSON, and every surface follows.
 */
import type { LucideIcon } from 'lucide-react';
import { Facebook, Instagram, Linkedin } from 'lucide-react';
import contactData from '../data/contact.json';
import type { ContactInfo, SocialLink } from '../types';

export const contact: ContactInfo = contactData;

/** `mailto:` href for the org inbox. */
export const contactMailto = `mailto:${contact.email}`;

/**
 * lucide-react components for the `icon` names used in contact.json. Keyed
 * rather than looked up dynamically so the bundler can tree-shake, and so an
 * unknown name fails at the call site instead of rendering nothing.
 */
const SOCIAL_ICONS: Record<string, LucideIcon> = {
  Instagram,
  Linkedin,
  Facebook,
};

export function getSocialIcon(social: SocialLink): LucideIcon | undefined {
  return SOCIAL_ICONS[social.icon];
}

/** Socials in display order, dropping any entry without a mapped icon. */
export const socials: SocialLink[] = contact.socials.filter((s) => s.icon in SOCIAL_ICONS);
