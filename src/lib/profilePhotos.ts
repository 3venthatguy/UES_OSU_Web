/**
 * Officer headshot registry, keyed by slug.
 *
 * An officer's `id` in `src/data/officers.json` *is* their photo's filename —
 * `"id": "devarth-patel"` resolves to `src/assets/profiles/devarth-patel.webp`.
 * Adding an officer therefore means dropping a file in that folder and using its
 * name as the id; no URL to paste and no edit to this module.
 *
 * The photos live under `src/` rather than `public/` so Vite fingerprints them.
 * That matters on replacement: swapping in a new headshot under the same name
 * yields a new hashed URL, where a fixed `/assets/profiles/x.webp` path would
 * keep serving whatever browsers had already cached.
 */

// Eager so every headshot is resolved at build time — the About grid renders all
// of them at once, so there is nothing to gain from deferring. Extensions beyond
// .webp are matched too, so a future .jpg or .avif drop-in still lands.
const modules = import.meta.glob('../assets/profiles/*.{webp,jpg,jpeg,png,avif}', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const photosBySlug: Record<string, string> = Object.fromEntries(
  Object.entries(modules).map(([path, url]) => [
    path.split('/').pop()!.replace(/\.[^.]+$/, ''),
    url,
  ]),
);

/**
 * Bundled URL for an officer's headshot, or `undefined` when no file matches the
 * id. Callers should fall back to `getInitials` rather than render a broken
 * image — a misnamed or missing file should degrade visibly, not silently.
 */
export function getProfilePhoto(id: string): string | undefined {
  return photosBySlug[id];
}

/** Every slug with a photo on disk. Useful for spotting unmatched ids. */
export const profilePhotoSlugs: string[] = Object.keys(photosBySlug);

/** "Devarth Patel" → "DP". Falls back to one letter for single-word names. */
export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';

  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : '';
  return (first + last).toUpperCase();
}
