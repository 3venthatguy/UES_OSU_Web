# Design System

There is no formal design-token file, no `tailwind.config.js` theme extension, and no shared style constants module in code. The palette below was reverse-engineered from consistent hex values repeated across every component, cross-checked against the (unused-by-code) reference values in `siteConfig.json`'s `projectSettings`. **Treat this document as the source of truth for "what the brand colors are" going forward** — if you introduce a new color, add it here and use the exact same hex everywhere rather than eyeballing a similar shade.

## Color palette

| Token (informal name) | Hex | Used for |
|---|---|---|
| Primary / brand red | `#B03A40` | Primary buttons, active nav state, headings accents, borders, links, icons |
| Primary hover (darker red) | `#8e202b` | Hover state for primary red buttons |
| Deep red / gradient end | `#842329` | Gradient endpoints (vision banner, prize card), some icon accents |
| Secondary / accent orange | `#F07B41` | Secondary CTA ("Get Involved" button), badges, "eyebrow" label text, icon accents |
| Orange hover | `#E06C38` | Hover state for orange buttons |
| Light accent / highlight text on dark red | `#FFD3B5` | Small labels on red/gradient backgrounds |
| Background (cream) | `#FDF8F1` | Page background, light section backgrounds |
| Card surface (near-white) | `#FFFDF9` | Modal backgrounds, floating overlay cards |
| Border (tan/cream) | `#EADBCE` | Modal/overlay borders, dividers on cream surfaces |
| Heading text (near-black/maroon-black) | `#1C1817` / `#2D0A0C` | Body base text (`#1C1817`) vs. large headings (`#2D0A0C`) — both dark, used somewhat interchangeably per component |
| Body text (warm gray) | `#524B47` | Paragraph/description text |
| Muted text (lighter warm gray) | `#605753` | Secondary/meta text, timestamps, small labels |
| Footer background (near-black) | `#1C1817` | Footer section only |
| Footer card surface | `#25201E` | Footer's bento sub-cards |
| Footer border | `#3A3331` | Footer dividers |
| Footer muted text | `#A39B97` / `#C2BAB5` / `#8A817D` | Footer body/link/copyright text, in decreasing emphasis |
| Success | `#10B981` (Tailwind `emerald-500`-ish, used as raw hex) | Confirmation states, "Goldilocks Growth" simulator badge |
| Info accent (blue) | `#3B82F6` | Google-blue button in RSVP modal (`#4285F4`) |
| LinkedIn blue | `#0B66C2` | LinkedIn link button in officer bio modal |

**How to use:** every component inlines these as Tailwind arbitrary-value utilities, e.g. `text-[#B03A40]`, `bg-[#FDF8F1]/80`, `border-[#B03A40]/20` (opacity suffix via `/NN`). There's no CSS variable or Tailwind theme color name for any of these — copy the hex exactly from this table (or from a neighboring component) rather than approximating.

### Hero Earth colours

**There is no globe palette in the codebase any more.** The hero Earth is an authored `.glb` (`EarthModel.tsx`), and every colour it shows is baked into the six textures inside that binary. Nothing about its appearance is editable from TypeScript, and there is no `PALETTE` const to tune.

**Its colours are deliberately NOT the site palette.** The model is a bright cartoon illustration, so its saturated blue and green are foreign to the surrounding cream / brick / orange system. It reads as a distinct illustration placed on the page rather than as part of its colour system. Do not reuse those hues elsewhere in the UI, and do not "correct" the rest of the page toward them.

The one place the site palette touches the globe is the **region pins** (`src/lib/regionPins.ts`): `#E23C42` for the body, the card surface `#FFFDF9` for the dot on top of each head. That is a deliberate exception — the pins are UI drawn onto the model, not part of the illustration — and the red is what marks them as *ours* against the model's greens and blues.

`#E23C42` is the **one colour in the app that is not from the table above**: it is the brand red `#B03A40` at the same hue, pushed up in value and saturation. The brand red is tuned for type and borders on a cream page; at pin size, under the model's deliberately soft light rig, it goes muddy. Don't "correct" it back to `#B03A40`, and don't introduce it anywhere in the DOM.

If the Earth ever needs re-grading, the only levers are:

- **The light rig** in `EarthModel.tsx` — ambient, key, cool fill, hemisphere bounce. Keep it soft: the materials are `baseColorTexture`-driven with the shading already painted in, so a hot key light blows out the land texture rather than adding form.
- **Re-exporting the `.glb`** with different textures. That's a DCC-tool change, not a code change.

## Typography

- Font: `siteConfig.json` declares `'Inter', sans-serif` as `projectSettings.typography`, but **no font is actually loaded** — there's no `<link>` to Google Fonts in `index.html` and no `@font-face` in `index.css`. The site currently renders in each browser's default sans-serif/system font stack (via Tailwind's `font-sans` utility applied in `App.tsx:37`). If pixel-perfect Inter rendering is required, a font `<link>`/import needs to be added — this is a real gap, not just documentation drift.
- Weight scale in use: `font-medium`, `font-semibold`, `font-bold`, `font-black` — headings lean heavily on `font-black` (e.g. hero H1, section H2s).
- Size scale: mostly Tailwind defaults (`text-xs` through `text-3xl`/`text-4xl`/`text-5xl` for hero-scale type, up to `text-9xl` for the hero's oversized background wordmark).

## Layout pattern: "bento grid"

The dominant layout idiom throughout the site (explicitly named "Bento" in code comments, e.g. `HeroSection.tsx:67`, `App.tsx:49`) is a `grid grid-cols-1 md:grid-cols-12` (or similar) container of independently-bordered, rounded, padded cards (`rounded-3xl`, `border`, `shadow-xs`), each spanning a subset of columns (`md:col-span-5`, `md:col-span-4`, etc.) to create an asymmetric magazine-style mosaic rather than a uniform grid. New sections/cards should follow this pattern for visual consistency:

- Card shell: `bg-white/80 border border-[#B03A40]/20 rounded-3xl p-6 sm:p-8 shadow-xs hover:border-[#B03A40] transition-all`
- "Solid accent" variant card (used sparingly for emphasis, e.g. hero's resources teaser, case comp's 1st place prize): filled `bg-[#B03A40]` with white text instead of the bordered light variant.
- Section wrapper convention: `py-20`, alternating `bg-[#FDF8F1]` and `bg-white/50` between adjacent sections for subtle visual separation, `border-t border-[#B03A40]/10` at the top of each.
- Section header convention: a small uppercase "eyebrow" label in `#F07B41`, then a large `font-black` heading in `#2D0A0C`, then a `#524B47` descriptive paragraph — repeated verbatim across `AboutSection`, `CaseCompSection`, `EventsSection`, `ResourcesSection`, `GetInvolvedSection`.

## Border radius scale

Consistently large/rounded throughout: `rounded-xl`/`rounded-2xl` for buttons/inputs/small cards, `rounded-3xl` for major cards/modals, `rounded-full` for pills/badges/avatars. There is no sharp-cornered (`rounded-none`/`rounded-md`) element anywhere in the UI — keep new elements consistent with this soft, pill-and-bento aesthetic.

## Iconography

`lucide-react` exclusively, imported per-file (no shared icon barrel/wrapper component). Icon color is set via the surrounding text color utility (`text-[#B03A40]` etc.), sized via `w-4 h-4` / `w-5 h-5` conventions matching the surrounding text scale.

## Responsive breakpoints

Standard Tailwind breakpoints (`sm`, `md`, `lg`, `xl`) used throughout, no custom breakpoints defined. Mobile-first: base classes target small screens, `sm:`/`md:`/`lg:` progressively enhance. The Navbar's desktop nav (`hidden md:flex`) and mobile hamburger drawer (`flex md:hidden`) are the clearest example of the pattern.

## Motion

Hover and press states stay on Tailwind's `transition-*`/`duration-*`/`hover:`/`active:scale-95` utilities. Everything with choreography uses `motion`:

- **Scroll reveals** — `<Reveal>` / `<Reveal stagger>` + `<RevealItem>` from `src/components/Reveal.tsx`. A block fades up 28px once its midpoint crosses 85% of viewport height; cards inside a staggered grid follow 60ms apart. Shared variants live in `src/lib/motion.ts`, the trigger in `src/lib/useReveal.ts`.
- **Page transitions** — `AnimatePresence mode="wait"` in `App.tsx`. Direction comes from `siteConfig.navigation` order: a later tab enters from the right, an earlier one from the left.
- **Modals and the mobile drawer** — each owns an internal `AnimatePresence`, so they animate both in and out.
- **The hero's region sheet** — `RegionSheet.tsx` slides up from the bottom of the globe card and is swipe-dismissible via `useDragControls`. It is *not* a modal: no backdrop, no scroll lock, and it is positioned `absolute` inside the globe card rather than `fixed` (see [KNOWN_ISSUES_AND_TECH_DEBT.md](./KNOWN_ISSUES_AND_TECH_DEBT.md) on transforms and containing blocks).

Timings and easing belong in `src/lib/motion.ts`, not inline. Every variant collapses to zero duration and zero offset under `useReducedMotion()`.

Note: `animate-in` / `fade-in` / `slide-in-from-top` were used previously but came from `tailwindcss-animate`, which is **not installed** — they rendered as no-ops and have been removed. Do not reintroduce them.
