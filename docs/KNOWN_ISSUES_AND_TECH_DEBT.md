# Known Issues & Technical Debt

Read this before scoping any task — several of these change what "fixing a bug" even means (e.g. the forms are *supposed* to not submit anywhere, that's not a bug to silently "fix" without being asked).

## Architectural / scale

- **No backend of any kind.** Every form in the app (membership application, case comp registration, event RSVP, newsletter) is UI-only and discards its data on submit. If the business need is "actually collect these submissions," that's a net-new feature (API endpoint or third-party form service + email/DB integration), not a bug fix. See [STATE_AND_FORMS.md](./STATE_AND_FORMS.md).
- **No tests.** No test runner is configured (no Vitest/Jest/Playwright/Cypress in `package.json`), no test files exist anywhere in the repo. The only automated check is `npm run lint` (`tsc --noEmit`).
  - `EarthModel.tsx` carries two **dev-only test seams** — `window.__globeTilt()` and `window.__pinScreen()` — behind `import.meta.env.DEV`, so Vite drops them from the production bundle. They exist because the globe's two hardest-to-see invariants (how far the pole is off its axis, and where the pins are on screen) are genuinely unobservable from outside: a screenshot can't tell a tilt from a yaw, and the pin heads merge optically into one red blob. If a test runner is ever added, these are what it should drive; they are documented in [3D_MODEL_VIEWER.md](./3D_MODEL_VIEWER.md). Don't reach for them from application code.
- **No CI configuration.** No `.github/workflows/`, no other CI config found in the repo.
- **No error boundaries.** A thrown error in any component (e.g. a malformed JSON entry causing a `.map()` over `undefined`) will produce React's default white-screen crash with no user-facing fallback.
- **No loading or error states anywhere.** Because there's no real async data fetching yet, this hasn't mattered — but it means there's no established pattern to copy if/when real network calls are introduced.

## Dependency hygiene

- **Two lockfiles are committed:** `package-lock.json` (npm) and `bun.lock` (Bun). Whichever one is stale relative to `package.json` can silently drift, and different contributors using different package managers will fight over which lockfile is "real." **Recommendation:** pick one package manager, delete the other's lockfile, and document the choice (e.g. add an `.npmrc`/note in the root README, or a `packageManager` field in `package.json`).
- **Unused dependencies** from the Google AI Studio scaffold this project was generated from:
  - `@google/genai` — not imported anywhere in `src/`.
  - `express`, `@types/express` — not imported anywhere; no server file exists.
  - `dotenv` — not imported anywhere (Vite handles `.env` loading natively; this would only matter for a Node/Express server, which doesn't exist).
  - `esbuild`, `tsx` (devDependencies) — not invoked by any `package.json` script; Vite bundles esbuild internally already.
  - `npm run clean` references `rm -rf dist server.js` — `server.js` has never existed in this repo's committed history.
  - **Recommendation:** remove these next time `package.json` is touched for an unrelated reason, after confirming with whoever owns deploy/CI that nothing external depends on them.
- **Transforms and `position: fixed`** — Framer leaves `transform: translate(0px)` behind when an animation settles, and any non-`none` transform makes that element the containing block for `position: fixed` descendants (pinning the navbar to the page, centring modals on the document). `Reveal`/`RevealItem` and the page wrapper in `App.tsx` all strip the inline transform in `onAnimationComplete` for this reason. Anything new that animates a transform above a modal must do the same.

## Content/UI sync risks (see [DATA_AND_CONTENT.md](./DATA_AND_CONTENT.md) and [COMPONENTS.md](./COMPONENTS.md) for full detail)

Several places pair a JSON data file with a **hardcoded list in the consuming component** that must be kept in sync by hand, with no validation if they drift:

- `AboutSection.tsx`'s committee filter pills vs. `officers.json`'s `committee` values.
- `EventsSection.tsx`'s category filter pills vs. `events.json`'s `category` values (currently missing a `'Social'` pill even though it's a valid type per `types.ts`).
- `GetInvolvedSection.tsx`'s FAQ category filter pills vs. `faqs.json`'s `category` values.
- `AboutSection.tsx`'s `pillarIcons` map vs. `general.json`'s pillar `icon` string values.
- `CaseCompSection.tsx`'s `sponsorIcons` map vs. `caseComp.json`'s sponsor `logo` string values (and the existing `"BarChart3"` entry resolves to a `Trophy` icon — likely a copy-paste mistake worth a quick fix or a design confirmation).
- `HeroSection.tsx`'s "Upcoming Spotlight" cards are hardcoded JSX, entirely disconnected from `events.json` — editing events does not update the homepage preview.
- `siteConfig.json`'s `hero.stats` array is defined but unused; `HeroSection.tsx` hardcodes its own two stat values instead of mapping over it.
- `siteConfig.json`'s `projectSettings` color fields are defined but unused; every component hardcodes the same hex values independently rather than reading from this config (see [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)).
- `resources.json`'s `simulatorDefaults` block is defined but unused; `ResourcesSection.tsx` hardcodes different default slider values.

**General pattern:** this app has several "JSON fields that look wired up but aren't." When investigating "why doesn't changing X in the JSON do anything," check this list before assuming a rendering bug.

## Accessibility gaps

- Modals (`RegistrationModal`, `RSVPModal`, the officer bio modal in `AboutSection`) have no focus trapping, no `Escape`-to-close, no scroll-lock on the body, and no `role="dialog"`/`aria-modal="true"`/`aria-labelledby` attributes.
- No visible `:focus-visible` ring customization beyond the browser default in most interactive elements (a couple of nav buttons do set `focus:ring-2`, most don't).
- No `alt` text issues found on the images checked, but officer/event photos are hotlinked from Unsplash with `referrerPolicy="no-referrer"` — if Unsplash changes/removes these URLs, images will silently 404 with no fallback/placeholder image.
- The 3D model canvas still has no keyboard equivalent for **drag-to-orbit** — but every region is now reachable without a pointer via a `sr-only` list of real `<button>`s that select it and turn it to face the camera. `RegionSheet` also has `Escape`-to-close and `aria-label`s, which the older modals lack; treat it as the pattern to follow rather than them.

## Specific component-level bugs/gaps

(Full context for each is in [COMPONENTS.md](./COMPONENTS.md) and [3D_MODEL_VIEWER.md](./3D_MODEL_VIEWER.md).)

- ~~**3D model hotspot raycasting is non-functional against the model itself**~~ — **moot.** Hotspots, the fabricated economic-indicator overlay and all raycasting were removed with the hero rewrite; the Earth is now a bare canvas.
- **`CaseCompSection.tsx`'s countdown timer** doesn't handle the deadline having already passed — it just freezes at `00:00:00:00` rather than showing a "Registration Closed" state.
- **`EventsSection.tsx`** has no validation that `rsvps <= capacity`; an overbooked event would render a bar clamped at 100% with no visual "full" indicator or waitlist messaging.
- **Placeholder social links** in `Footer.tsx` point to bare root domains (`linkedin.com`, `twitter.com`, `github.com`), not the org's real profiles.
- ~~**Unused model assets are still shipping**~~ — **fixed.** `public/assets/model/` (~29.3 MiB `.glb` + stray PNG), `public/assets/model-obj/` and the redundant `earth-cartoon/textures/` export copy have all been deleted. `public/assets/` is now 4.1 MiB and every file in it is loaded.
- **The hero blocks the splash on a 4.27 MiB download.** Swapping the procedural globe for an authored `.glb` put a real network asset back on the critical path, so first paint of the site proper is gated on it. The splash's slow-connection copy, stall-creep and escape hatches exist for this and are genuinely reachable now. If this becomes a problem, Draco/meshopt compression on the `.glb` is the obvious first move — the model is currently uncompressed.
- **No font is actually loaded** despite `siteConfig.json` declaring `Inter` as the typography — the site renders in the browser's default sans-serif stack. See [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md).
- **`RegistrationModal`'s track-name display logic** (`name.split(':')[0]` / `[1]`) assumes every track name contains exactly one colon — a track name without a colon renders an empty subtitle rather than erroring, but it's a silent formatting assumption worth knowing about if track names are ever restructured.

## SEO / metadata

- `index.html`'s `<title>` is the generic AI-Studio-generated `"My Google AI Studio App"` — not the org's actual name. This is a real, easy fix worth doing early (also affects browser tab title and any social link-preview scraping, along with the total absence of meta description/Open Graph tags).
- No `robots.txt`, no `sitemap.xml`, no Open Graph/Twitter Card meta tags, no `favicon` reference found in `index.html`.

## Priority framing for future work

If asked to "clean up the codebase" without more specific direction, the highest-value low-risk fixes in rough priority order are:
1. Fix `index.html`'s `<title>` + add basic meta tags/favicon.
2. Resolve the two-lockfile situation.
3. Remove unused dependencies (`@google/genai`, `express`, `dotenv`, `esbuild`, `tsx`, `@types/express`) after confirming with the repo owner.
4. Wire `siteConfig.json`'s hero stats and the "Upcoming Spotlight" cards to actual data, or remove the unused JSON fields to stop the drift risk.
5. Add basic modal accessibility (`Escape` to close, focus trap, `aria-modal`).
6. Load the actually-declared `Inter` font.
7. Add a minimal test setup (Vitest is the natural fit given Vite is already the build tool) before any further feature work, so future changes have a safety net.
