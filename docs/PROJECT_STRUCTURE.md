# Project Structure

```
UES_OSU_Web/
├── .env.example              # Template for GEMINI_API_KEY / APP_URL (both currently unused by app code)
├── .gitignore
├── bun.lock                  # Bun lockfile (see tech-debt: two lockfiles committed)
├── package-lock.json         # npm lockfile
├── package.json              # scripts + dependencies (see ARCHITECTURE.md)
├── index.html                # Vite entry HTML — single <div id="root"> + <script src="/src/main.tsx">
├── metadata.json              # Google AI Studio app manifest (name, description, capabilities) — not read by app code
├── tsconfig.json              # TS compiler config, @/* path alias, noEmit (tsc used only for type-checking)
├── vite.config.ts             # Vite config: react + tailwindcss plugins, @/* alias, AI-Studio HMR toggle
│
├── assets/
│   └── .aistudio/.gitignore   # AI Studio internal scaffold folder (ignores everything inside itself)
│
├── public/                    # Static files copied as-is into the build output, served from site root
│   └── assets/
│       ├── logo/logo.jpeg              # UES logo image, referenced as /assets/logo/logo.jpeg
│       └── earth-cartoon/
│           └── earth-cartoon.glb       # 4.27 MiB hero Earth. Self-contained (all 6 textures embedded); the only 3D asset, loaded by EarthModel.tsx
│
└── src/
    ├── main.tsx               # ReactDOM root, wraps <App/> in <StrictMode>
    ├── App.tsx                # Root component: fixed Navbar + Footer shell, hand-rolled page switcher (see ARCHITECTURE.md), hash-based deep linking
    ├── index.css               # Single line: @import "tailwindcss"; (no custom global CSS)
    ├── types.ts                 # All shared TypeScript interfaces for JSON content shapes (SiteConfig, Officer, EventItem, etc.)
    │
    ├── assets/
    │   ├── index.ts             # `ASSETS` registry: central map of image/model URLs (local /assets/... paths + a few hardcoded Unsplash URLs used as event photo placeholders)
    │   └── profiles/            # Officer headshots, one per officer, named `<officer id>.webp` — bundled+hashed by Vite, matched by slug (see lib/profilePhotos.ts)
    │
    ├── lib/
    │   ├── assetLoading.ts       # Ready/progress store the splash screen subscribes to; markModelReady() is the signal it blocks on, reportModelBytes() drives its percentage
    │   ├── regionPins.ts        # Builds the seven map pins on the globe and drives their hover/select lift
    │   └── profilePhotos.ts      # import.meta.glob over assets/profiles/ → slug→URL map; `getProfilePhoto(id)` + initials fallback
    │
    ├── components/
    │   ├── Navbar.tsx            # Fixed top nav: logo, center links, "Get Involved" CTA, mobile hamburger drawer
    │   ├── UESLogo.tsx            # Reusable logo mark (image + wordmark), used in Navbar and Footer
    │   ├── HeroSection.tsx        # Landing hero: giant background typography + EarthModel + stat bento cards
    │   ├── EarthModel.tsx         # Standalone Three.js scene: loads the cartoon Earth .glb, plays its baked clips, auto-spin on a sprung tilted axis + drag-to-rotate, hover a pin to lift it and click to open RegionSheet
    │   ├── RegionSheet.tsx        # Bottom sheet / docked card showing one region's IMF economic indicators; opened by EarthModel
    │   ├── AboutSection.tsx       # Mission/vision, 4 "pillars," history timeline, officer directory + filter + bio modal
    │   ├── CaseCompSection.tsx    # Case competition page: live countdown timer, prize grid, tracks, timeline, sponsors; opens RegistrationModal
    │   ├── RegistrationModal.tsx  # Case comp team registration form (client-only, generates a fake confirmation ref ID)
    │   ├── EventsSection.tsx      # Events calendar: search + category filter, upcoming event cards with RSVP capacity bar, past-events archive; opens RSVPModal
    │   ├── RSVPModal.tsx          # Per-event RSVP form (client-only) + "Add to Google Calendar" link generator
    │   ├── ResourcesSection.tsx   # Download-guide cards + a live client-side IS-LM/AD-AS macroeconomic policy simulator (sliders → derived formulas → SVG chart)
    │   ├── GetInvolvedSection.tsx # Membership application form (client-only, fires canvas-confetti on submit) + searchable FAQ accordion
    │   └── Footer.tsx             # Site footer: brand blurb, quick links, newsletter signup (client-only), social links (placeholder hrefs)
    │
    └── data/                      # All site content as static JSON, imported directly by the components that use them
        ├── siteConfig.json        # Org name/colors/typography metadata, nav link config, hero copy + stats
        ├── general.json           # Mission/vision statements, 4 pillars, history timeline — consumed by AboutSection
        ├── officers.json          # Officer directory (6 entries) — consumed by AboutSection
        ├── events.json            # Upcoming + past events — consumed by EventsSection
        ├── caseComp.json          # Case competition theme, tracks, prizes, timeline, sponsors — consumed by CaseCompSection + RegistrationModal
        ├── resources.json         # Downloadable guide metadata + simulator default values — consumed by ResourcesSection
        ├── faqs.json              # FAQ Q&A entries — consumed by GetInvolvedSection
        └── economicRegions.json   # The World Bank's 7 regions: display-ready WDI indicators, largest economies, and each region's `pin` vector on the globe mesh — consumed by EarthModel/RegionSheet
```

## Notable structural facts

- **No `pages/` directory, no router library.** All six "pages" are conditional blocks inside `App.tsx`, and their implementation components live flat in `src/components/`.
- **No `hooks/`, `context/`, `utils/`, or `services/` directories.** Nearly all logic lives inline inside the component that needs it; `src/lib/` holds the exceptions (hero ready signal, officer photo resolution, scroll/motion helpers). If you add a shared hook, `src/hooks/` would be the natural new location.
- **`src/data/` is editorial JSON only.** Nothing about the hero Earth is configurable from there — its geometry, textures and animations are all baked into the `.glb`.
- **No test directory, no test files, no test runner configured.** See tech-debt doc.
- **`src/assets/index.ts`** is the single source of truth for asset URLs (local paths + placeholder Unsplash photo URLs) — always add new image/model references here rather than inlining raw URLs in components, to keep with existing convention. The one deliberate exception is officer headshots: those are matched by filename slug through `src/lib/profilePhotos.ts` so adding a photo needs no registry edit.
- **`public/assets/` holds exactly two files, and both are loaded.** The old `model/` (a ~29.3 MiB `base_basic_shaded.glb` plus a stray PNG) and `model-obj/` (a full `.obj` + loose PBR textures) directories were dead weight and have been deleted along with the procedural globe that replaced them. Keep it that way: the `earth-cartoon.glb` is self-contained, so any sibling `textures/` folder that arrives with a re-download is redundant and should not be committed.
