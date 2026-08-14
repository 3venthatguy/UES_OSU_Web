# Component Reference

All components are function components using hooks, written in `.tsx`, and exported as **named exports** (`export const X: React.FC<...>`), except `App.tsx` which uses a `default export function App()`. Follow whichever pattern matches the file you're editing.

None of these components have unit/integration tests. None have Storybook stories. This doc is the closest thing to a spec for each one — keep it in sync when behavior changes.

---

## `App.tsx` (default export)

The root shell. Renders `Navbar` + a conditionally-mounted page section + `Footer`, always visible.

- **State:** `currentPage: string` (one of `'hero' | 'about' | 'case-comp' | 'events' | 'resources' | 'get-involved'`, default `'hero'`).
- **`handleNavigate(pageId)`:** sets `currentPage`, writes `window.location.hash`, and does an instant scroll-to-top (`App.tsx:16-20`).
- **Hash sync effect:** listens for `hashchange` and mirrors the URL hash back into `currentPage`, gated to the fixed page-id allow-list (`App.tsx:23-34`). Unknown hashes are silently ignored (state doesn't change, page doesn't 404 — it just stays on whatever was last valid).
- **Hero page is special:** it's the only "page" that's actually a composite — `HeroSection` plus an inline "Explore Society Portals" bento grid of five nav buttons (`App.tsx:49-160`), not a separate component. If you need to change those cards, edit them directly in `App.tsx`.
- Every non-hero page wraps its section component in an identical breadcrumb bar (`Home > <Section Name>`) that is copy-pasted per page block rather than extracted into a shared component (`App.tsx:167-176`, `184-193`, etc.) — see [KNOWN_ISSUES_AND_TECH_DEBT.md](./KNOWN_ISSUES_AND_TECH_DEBT.md) for the refactor opportunity this represents.

---

## `Navbar.tsx`

Fixed-position header, always mounted regardless of page.

- **Props:** `activeSection: string`, `onNavigate: (id: string) => void`.
- **State:** `isScrolled` (toggles a blurred/shadowed style past `scrollY > 20`), `mobileMenuOpen`.
- Reads nav link labels/hrefs/ids from `siteConfig.json`'s `navigation.centerLinks` and `navigation.specialLink` — **do not hardcode new links here**; add them to the JSON instead (see [DATA_AND_CONTENT.md](./DATA_AND_CONTENT.md)).
- Mobile drawer duplicates the same link list plus a full-width CTA button.
- Uses `UESLogo` for the brand mark, clicking it navigates home.

---

## `UESLogo.tsx`

Presentational-only, no state, no data fetching.

- **Props:** `className?`, `showText?` (default `true`), `size?: 'sm' | 'md' | 'lg' | 'xl'` (default `'md'`), `textColor?` (default `text-[#2D0A0C]`).
- Renders the logo image from `ASSETS.logo.jpeg` plus an optional wordmark. At `size="sm"` the wordmark is suppressed even if `showText` is true (`UESLogo.tsx:36`).
- Used by both `Navbar` and `Footer` (Footer passes `textColor="text-white"` for its dark background).

---

## `HeroSection.tsx`

Landing page hero.

- **Props:** `onNavigate: (id: string) => void`.
- Composition of `siteConfig.json` copy + `EarthModel` + three "bento" info cards (mission/membership stats, upcoming-events preview with **two hardcoded events** that are NOT pulled from `events.json`, and a resources teaser).
- **Layout:** a two-line display H1 (`hero.headline_lines`) sitting at the very top of the section, with the globe canvas pulled up over it by a negative margin so the planet crosses in front of the second line. The globe is *above* the headline in z-order (`z-10` vs `z-0`); the H1 is `pointer-events-none` so the overlapping strip of text cannot swallow a drag aimed at the canvas. The negative margin first has to spend the canvas's own dead space — `CAMERA_FILL` frames the model to ~82% of the box height, so ~47/54/61px of the top is empty before any overlap starts. **That margin is the knob** for how deep the overlap reads.
- **Launch sequence — the one piece of real state here.** The splash is an overlay, not a gate, so this section is fully painted (model loaded, globe spinning) before the curtain lifts. The top block therefore holds itself hidden until the `RevealGate` context opens (`splashDone && pageEntered` in `App.tsx`), then plays once: each headline line rises out of its own `overflow-hidden` mask a beat apart → globe scales up from `transform-origin: 50% 100%` → subheading and buttons. Timings live in `src/lib/motion.ts` (`heroIntro`, `heroHeadlineLine`, `heroGlobe`, `heroTail`); the globe's beat deliberately overruns all the others.
  - A **module-level** `introPlayed` flag, not state, suppresses a replay — picking another tab unmounts this component (`<AnimatePresence mode="wait">`), so without it the globe would re-grow on every return to Home.
  - The globe wrapper reuses `useSettleTransform` from `Reveal.tsx` to strip the settled inline `scale(1)`. See [KNOWN_ISSUES_AND_TECH_DEBT.md](./KNOWN_ISSUES_AND_TECH_DEBT.md) on transforms and containing blocks — that wrapper is the ancestor of `RegionSheet`.
  - `HERO_INTRO_MAX_MS` is a failsafe timer, mirroring `App.tsx`'s `pageEntered` timeout: if `onAnimationComplete` never fires the hero must not be stranded invisible.
- ⚠️ The "Upcoming Spotlight" mini-cards (`HeroSection.tsx:100-121`, "National Case Comp Kickoff" Oct 18 / "Federal Reserve Policy Panel" Oct 28) are hardcoded JSX, not derived from `events.json`. If `events.json` changes, **these do not update** — a common source of content drift. See tech-debt doc.
- CTA buttons navigate to `case-comp` and `events`.

---

## `EarthModel.tsx`

Self-contained Three.js scene — no props. **State:** `selectedId: string | null` (the open region). Fully documented in [3D_MODEL_VIEWER.md](./3D_MODEL_VIEWER.md); summary:

- **Loads** `public/assets/earth-cartoon/earth-cartoon.glb` (4.27 MiB, self-contained) via `GLTFLoader` and plays its two baked ~30 s clips — orbiting aircraft, spinning propellers, drifting clouds, rigged whale tails — through an `AnimationMixer`.
- Supports auto-rotation about a 16°-tilted axis and **drag-to-rotate in any direction** via **Pointer Events** (so touch works; `touchAction: 'pan-y'` keeps a vertical *swipe* scrolling the page, though a drag that begins horizontally can then move any way).
- **Seven map pins**, one per World Bank region. Hovering pulls a pin out of the globe; clicking it opens `RegionSheet` with that region's economic data. Clicking anywhere else dismisses. The land itself is not a target.
- ⚠️ `spinGroup` holds a **quaternion, not Euler angles**, and auto-spin is post-multiplied about the globe's own pole while drag is pre-multiplied about the screen's axes. Reintroducing `rotation.y`/`rotation.x` brings back the pole clamp that was explicitly removed.
- ⚠️ **The axis is sprung, the yaw is not.** A drag tips the pole up to 28° off the tilt axis and it eases back on release; yaw is unbounded and never rewound. The spring runs in the frame loop, never in `pointermove` (pointer events are not frame-paced), and is suspended while focusing or while a card is open — so **closing a card moves the globe**, carrying the centred region up to 35° away.
- Honours `prefers-reduced-motion: reduce` by holding **both** the yaw and the baked animations still. With no pause button this is the only way out of a permanently spinning globe — don't drop it.
- ⚠️ **Click-vs-drag threshold is load-bearing.** A press selects only if the pointer moved under 6 px in under 400 ms. Remove it and every drag ending over a pin opens a card.
- ⚠️ **Hit testing is screen-space, not a raycast** — each pin head is projected to the canvas and the nearest within 30 px wins (`src/lib/regionPins.ts`). Three things matter: far-side pins must be rejected by a camera-facing test or you can hover one through the planet, overlapping pins tie-break by depth, and the target is the pin's **seated** head (`hitWorld`) — aim at the lifted one and hovering moves the thing you are hovering, which flickers at the limb.
- ⚠️ **Pins are added after `Box3.setFromObject(model)`.** Earlier and they inflate the fit radius, silently shrinking the globe.
- ⚠️ `HOVER_SCALE` (1.3) is not decoration. A pin facing the camera lifts almost along the view axis, where the movement is invisible; the growth is what makes hover read at every orientation.
- ⚠️ `selectedId` must **never** enter the mount effect's dependency array — re-running it re-downloads and rebuilds the whole scene. Two mirror refs (`selectedRef`, `pendingFocusRef`) exist precisely so it doesn't have to.
- ⚠️ **Vendor branding is stripped at load and must stay stripped.** The asset carries the model author's logo on 4 pin-like sign nodes *and* on 2 banners towed behind the aircraft; the banners are identifiable only by their `ox-logo` material, not their names. Removing the nodes also requires filtering the matching animation tracks. See [3D_MODEL_VIEWER.md](./3D_MODEL_VIEWER.md).
- ⚠️ Camera distance is computed per aspect ratio by `fitDistance` and **must be recomputed on resize** — which view half-angle binds flips between desktop and mobile. Don't replace it with a fixed `camera.position.set`.
- ⚠️ Fit radius is half the largest `Box3` dimension, **not** `Box3.getBoundingSphere()` — the latter returns the half-diagonal and frames the planet about a third of the size it should be.

---

## `RegionSheet.tsx`

The region details that open out of the hero Earth when a pin is clicked. **Props:** `region: EconomicRegion | null`, `meta`, `onClose`. Content is split into inner components keyed on `region.id`, so switching regions remounts and re-enters rather than silently swapping its text — the same split `RSVPModal` uses.

- **Two layouts of the same content, chosen by breakpoint alone** (`xl:hidden` / `hidden xl:block`, the navbar's pattern — there are no JS width queries in this app):
  - Phone: bottom sheet across the globe card, `max-h-[55%]`, scrolls internally. `md:` to `xl:`: docked to the card's bottom-left corner at 400 px wide.
  - `xl:` and up: **two cards flanking the globe** — description (eyebrow, region name, blurb) on the left, every figure (indicator grid, largest economies, provenance) on the right. They expand out of the centre of the planet and collapse back into it on close. `RegionEyebrowTitle`/`RegionBlurb`/`RegionFigures` are shared by both layouts so the two can never drift apart.
- ⚠️ **The split cards depend on `xl:max-w-7xl` on the globe wrapper in `HeroSection`.** The camera fit is height-bound at every desktop aspect, so that class doesn't enlarge the model — it widens the box to a constant 1216 px around a ~550 px globe, leaving ~333 px of gutter per side. 288 px of card at a 16 px inset clears the orbiting aircraft by ~29 px. Narrow the wrapper and the cards land on the planet.
- The cards ride **tracks** (`left-4 right-1/2` and `left-1/2 right-4`) rather than being positioned directly. A percentage `x` in Motion is a percentage of the element's own width, so `x: '100%'` puts a track's inner edge exactly on the container's centre line at any width, and a `transformOrigin` on that same edge makes `scale: 0.4` collapse the card onto the globe — no measurement, no resize listener. Tracks are `pointer-events-none` (they each cover half the canvas) with the card itself `pointer-events-auto`.
- ⚠️ **Positioned `absolute` inside EarthModel's wrapper, never `fixed`.** Framer leaves `transform: translate(0px)` on settled elements, and any non-`none` transform makes that element the containing block for `position: fixed` descendants — a fixed sheet would be positioned against the animating page wrapper instead of the viewport. `Reveal` and `App.tsx` both strip the settled transform to work around this; staying absolute avoids meeting the problem, and anchors the card to the globe for free.
- **Deliberately not a modal:** no scroll lock, no backdrop, no focus trap. The page behind stays live. It does have `Escape`-to-close and `aria-label`s, which the older modals lack — don't copy their gaps here.
- Swipe-to-dismiss uses `useDragControls` with `dragListener={false}`, started only from the grab handle/header. A whole-surface `drag="y"` would fight the sheet's own scrolling on touch.
- ⚠️ **The source footer is not decoration.** It renders `meta.source`, `vintage` and a link to `sourceUrl`. This hero previously showed invented economic figures; provenance is the whole difference. Don't drop it for layout reasons — it lives in `RegionFigures`, so it follows the numbers into whichever card they end up in.

---

## `AboutSection.tsx`

- **State:** `selectedCommittee` (filter, default `'All'`), `activeOfficerModal: Officer | null` (bio modal).
- Renders mission/vision copy from `general.json`, the 4 "pillars" (icon keyed against a local `pillarIcons` lookup map — see gotcha below), a 4-item history timeline, and a filterable officer grid from `officers.json`.
- **Committee filter list is hardcoded** in the component (`AboutSection.tsx:11`: `['All', 'Executive Board', 'Case Comp Committee', 'Academic Affairs', 'Corporate Relations', 'Research & Journal']`) rather than derived from the officer data — adding an officer with a new committee value requires manually updating this array too, or their card will still render but won't be reachable via the filter pills (only "All" would show them).
- **Icon lookup gotcha:** `pillar.icon` in `general.json` is a string (`"BookOpen"`, `"Trophy"`, etc.) resolved against the `pillarIcons` record (`AboutSection.tsx:17-22`). Adding a pillar with a new icon name in JSON requires adding a matching entry to this map, or nothing renders for that icon (no fallback/placeholder).
- Officer modal shows full bio + mailto link + LinkedIn link, driven by clicking any officer card.

---

## `CaseCompSection.tsx`

- **State:** `isRegModalOpen`, `timeLeft: {days, hours, minutes, seconds}`.
- Live countdown to `caseCompData.registrationDeadline`, recalculated via `setInterval(updateTimer, 1000)`, cleared on unmount (`CaseCompSection.tsx:17-37`). ⚠️ Does not guard against the deadline already having passed — `difference > 0` check means the timer simply freezes at zero rather than showing "Registration Closed" messaging.
- Renders prize tiers, competition tracks, a 5-step timeline, and sponsor logos (icon keyed via local `sponsorIcons` map, same pattern/gotcha as `AboutSection`'s `pillarIcons` — note `caseComp.json` sponsor logo value `"BarChart3"` is actually mapped to a `Trophy` icon, `CaseCompSection.tsx:41`, likely a copy-paste artifact worth a look).
- Renders `RegistrationModal`, controlling its `isOpen`/`onClose`.

---

## `RegistrationModal.tsx`

Case competition team registration form.

- **Props:** `isOpen: boolean`, `onClose: () => void`.
- **State:** full form object (`teamName`, `university`, `track`, `leadName`, `leadEmail`, `leadPhone`, `member2-4`, `agreedToRules`), `submitted`, `refId`.
- On submit: fires `canvas-confetti`, generates a fake reference ID client-side (`'UES-2026-' + random 6-digit number`, `RegistrationModal.tsx:42`), and shows a static "confirmed" screen. **Nothing is sent anywhere** — closing the modal or reopening it resets all state (component fully unmounts via the `if (!isOpen) return null;` early return, `RegistrationModal.tsx:28`).
- Track options are pulled from `caseCompData.tracks`.

---

## `EventsSection.tsx`

- **State:** `selectedCategory` (default `'All'`), `searchQuery`, `activeRsvpEvent: EventItem | null`.
- Category filter list is hardcoded (`['All', 'Case Comp', 'Workshop', 'Career', 'Academic']`) — note this **omits `'Social'`**, which exists as a valid category in `types.ts`'s `EventItem.category` union but has no matching filter pill and no current entries in `events.json`. If a `'Social'` event is ever added to the data, it will render in the "All" view but be unreachable via any specific filter pill.
- Search matches (case-insensitive substring) against `title`, `description`, and `speaker` (`EventsSection.tsx:16-20`).
- Renders a capacity progress bar per event (`rsvps / capacity`, clamped to 100%).
- Past events are rendered from `eventsData.past` in a separate read-only archive block — no interactivity there.
- Renders `RSVPModal` for whichever event's "RSVP Seat" button was clicked.

---

## `RSVPModal.tsx`

Per-event RSVP form.

- **Props:** `event: EventItem | null`, `onClose: () => void`. Renders nothing (`return null`) when `event` is `null` (`RSVPModal.tsx:14`).
- **State:** `formData: {name, email, major}`, `confirmed`.
- On submit, just flips to a "confirmed" screen — no persistence.
- Generates a **real, working** "Add to Google Calendar" deep link (`https://calendar.google.com/calendar/render?action=TEMPLATE&...`) populated from the event's title/description/location (`RSVPModal.tsx:23`) — this is the one piece of genuinely functional external integration in the RSVP flow (everything else in the modal is decorative).

---

## `ResourcesSection.tsx`

Two independent halves:

1. **Static download cards** from `resources.json`'s `academicGuides`. Clicking "Download" is intercepted (`e.preventDefault()`) and replaced with a browser `alert()` (`ResourcesSection.tsx:90`) — there are no real files behind these (`downloadUrl` is literally `"#"` in the JSON for all four entries).
2. **A live macroeconomic policy simulator** — four sliders (interest rate, money supply, tax rate, government spending) feeding hand-written linear formulas (`ResourcesSection.tsx:14-17`) that derive GDP growth, inflation, and unemployment, plus a status badge (`Goldilocks Growth` / `Stagflation Risk` / `Economy Overheating` / `Recessionary Pressure`) and a hand-drawn inline SVG AD/AS supply-demand curve chart that shifts based on the derived values. This is entirely illustrative/pedagogical — the formulas are not sourced from any real economic model, just tuned to feel plausible for a student audience. Don't treat the outputs as economically rigorous; if asked to "fix the math," get explicit requirements on what behavior is desired rather than assuming a bug.

---

## `GetInvolvedSection.tsx`

Two independent halves:

1. **Membership application form.** State is one flat object (`appForm`) with `fullName`, `email`, `gradYear` (select, default `'2027'`), `major`, `committee` (select — **note:** these committee option values, e.g. `"Case Comp Operations"`, do not exactly match the officer `committee` field values used for filtering in `AboutSection.tsx`, e.g. `"Case Comp Committee"` — cosmetic inconsistency, not a functional bug since they're independent fields, but worth aligning if committees are ever unified into one canonical list), `statement`, `agreed`. On submit: `canvas-confetti` + switch to a static confirmation screen. Nothing persisted.
2. **Searchable/filterable FAQ accordion**, driven by `faqs.json`. `activeFaq` defaults to `'faq-1'` (i.e., the first FAQ is open on initial render). Category filter pills are hardcoded (`['All', 'Membership', 'Case Competition', 'Resources & Journal', 'Get Involved']`) and must be kept in sync with whatever `category` values appear in `faqs.json` (same pattern/risk as the committee and events-category filters elsewhere).

---

## `Footer.tsx`

- **Props:** `onNavigate: (id: string) => void`.
- **State:** `newsEmail`, `subscribed` — newsletter signup is client-only, same pattern as every other form in this app (no backend).
- Quick links are pulled from `siteConfig.json`'s `navigation.centerLinks` (kept in sync with the navbar automatically since they share the same source).
- Social icons (LinkedIn/Twitter/GitHub) link to the **bare root domains** (`https://linkedin.com`, `https://twitter.com`, `https://github.com`) — these are placeholders, not the org's actual social profiles. Replace with real URLs before this is considered launch-ready copy.
- Copyright year is computed live via `new Date().getFullYear()`.
