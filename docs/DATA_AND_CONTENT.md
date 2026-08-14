# Data & Content

All visible site copy — org info, officers, events, case competition details, resources, FAQs — lives in static JSON under `src/data/`. There is no CMS and no runtime data fetching. **Editing content means editing these files and shipping a new build** (see [GETTING_STARTED.md](./GETTING_STARTED.md)).

Shared TypeScript shapes for this content live in `src/types.ts`. Note: the JSON files are imported directly (`import eventsData from '../data/events.json'`) and TypeScript infers their shape from the JSON itself — **the interfaces in `types.ts` are not actually wired up via `satisfies` or explicit annotation on the imports**, so editing a JSON file in a way that violates `types.ts` will not raise a compile error. `types.ts` is documentation-by-convention, not an enforced contract. Keep it updated by hand when you change a JSON shape, and treat mismatches as a signal to fix the JSON, not evidence the type is wrong.

---

## `siteConfig.json` → `SiteConfig` (types.ts:1-30)

Consumed by: `Navbar.tsx`, `HeroSection.tsx`, `Footer.tsx`.

- `projectSettings`: org display name, brand hex colors (`mainColor`, `secondaryColor`, `backgroundColor`, `textColor`), typography label, contact email, physical location string.
  - ⚠️ **These color fields are not actually consumed anywhere in the codebase.** Every component hardcodes the same hex values directly in Tailwind arbitrary-value classes (`bg-[#B03A40]`, etc.) rather than reading from this config. Treat `projectSettings`'s color fields as a **documentation reference for the palette**, not a live source of truth — changing `mainColor` here will not recolor the site. See [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md).
  - `contactEmail` and `location` ARE live-consumed, by `Footer.tsx`.
- `navigation.centerLinks`: array of `{label, href, id}` — drives both the desktop nav bar and the mobile drawer in `Navbar.tsx`, and the footer's "Quick Links" list. `id` must match one of the six page IDs App.tsx knows about (`hero`, `about`, `case-comp`, `events`, `resources`, `get-involved`) or navigation silently does nothing (no matching page block renders).
- `navigation.specialLink`: the "Get Involved" CTA button config (`{label, href, id, style}`). `style` field (`"contained-secondary"`) is present in data but not actually read by any component — purely descriptive/unused.
- `hero`: `headline_lines` (array — **one entry per rendered line of the H1**, each of which animates in on its own; keep each line short enough to fit the container on one line, since a wrapped line silently turns the two-line headline into three), `subheading`, `object_3d_file` (documentary only — the actual loaded model path is hardcoded in `assets/index.ts`, not read from here), `action` (documentary only, not read), `stats` (array of `{value, label}` — **also currently unused**; `HeroSection.tsx` hardcodes its own "500+ / $10,000" stat pair rather than mapping over `hero.stats`).

**Practical takeaway:** when asked to "update the hero stats" or "change the brand color," check first whether the field you'd naturally edit in `siteConfig.json` is actually wired to a component (per the notes above) or whether you also need to hand-edit the hardcoded value in the relevant `.tsx` file.

---

## `general.json`

Consumed by: `AboutSection.tsx`.

- `mission_statement`, `vision_statement`: plain strings, rendered directly.
- `pillars: Pillar[]` (`types.ts:32-37`): `{id, title, icon, description}`. `icon` must be one of the keys in `AboutSection.tsx`'s local `pillarIcons` map (`BookOpen`, `Trophy`, `TrendingUp`, `FileText`) — adding a 5th pillar with a new icon name requires also adding it to that map in the component. The layout logic treats pillar index `0` and `3` as "wide" cards (`AboutSection.tsx:70`) — adding/removing pillars will change which cards get the wide treatment unless you also adjust that index check.
- `history: HistoryItem[]` (`types.ts:39-42`): `{year, event}`, rendered as a 4-up timeline grid — works with any array length but was visually designed for 4 items (`sm:grid-cols-2 lg:grid-cols-4`).

---

## `officers.json`

Consumed by: `AboutSection.tsx`.

- `members: Officer[]` (`types.ts:44-61`): `{id, name, title, year, majors, minors, bio, email, linkedin, instagram, committee}`. There is no `photo` field — see below.
- `year` is free text for the undergrad year — `"'26"`, `"Senior"`, whatever reads best. It renders in the card's top-right corner and under the title in the expanded panel.
- `majors` and `minors` are arrays, rendered in the panel as comma-joined `Majors: …` / `Minors: …` lines. The card shows the joined majors as its subtitle and omits minors.
- **`id` is the headshot slug.** Photos live in `src/assets/profiles/` and are matched by filename: `"id": "devarth-patel"` renders `src/assets/profiles/devarth-patel.webp`. To add an officer, drop `<id>.webp` (`.jpg`/`.png`/`.avif` also work) into that folder and use the filename as the id — no URL to paste and no code to edit. Resolution happens in `src/lib/profilePhotos.ts` via `import.meta.glob`; an id with no matching file falls back to an initials tile rather than a broken image.
- Every optional field renders only when non-empty, so incomplete entries degrade cleanly: empty `majors`/`minors` arrays and an empty `year` drop their line entirely, and an empty `email`/`linkedin`/`instagram` hides that button.
- Several entries still carry `"TODO — …"` placeholders for `title`, `year`, `majors`, and `bio`. **Replace before this is treated as production-accurate.**
- `committee` values render as a pill on the card and in the expanded panel. The committee filter pills were removed from `AboutSection`, so this set is now free-form.

---

## `events.json`

Consumed by: `EventsSection.tsx`.

- `upcoming: EventItem[]` (`types.ts:56-69`): `{id, title, date, displayDate, location, category, featured, tag, description, speaker, rsvps, capacity}`.
  - `category` must be one of `'Case Comp' | 'Workshop' | 'Career' | 'Academic' | 'Social'` per `types.ts`, but the UI filter pills in `EventsSection.tsx` only offer `All/Case Comp/Workshop/Career/Academic` — a `'Social'` event would render in "All" but have no dedicated filter. See [COMPONENTS.md](./COMPONENTS.md).
  - `date` is an ISO datetime string but is **not currently used for sorting or countdown logic** in `EventsSection.tsx` — only `displayDate` (a pre-formatted human string) is rendered. If you add a new event, keep `date` and `displayDate` consistent even though only one is visibly rendered, since other code (or future sorting logic) may rely on `date`.
  - `featured: boolean` is present in the data but **not read anywhere in `EventsSection.tsx`** — currently has no visual effect.
  - `rsvps` / `capacity` drive the visual capacity progress bar; there's no validation that `rsvps <= capacity` (a value like `rsvps: 400, capacity: 300` would render a 100%-clamped bar with no error).
- `past: PastEventItem[]` (`types.ts:71-78`): `{id, title, date, category, recap, attendees}`. Simpler, read-only archive shape, distinct from `EventItem`.

**Reminder:** `HeroSection.tsx`'s "Upcoming Spotlight" preview cards are hardcoded and do **not** read from this file — see [COMPONENTS.md](./COMPONENTS.md).

---

## `caseComp.json`

Consumed by: `CaseCompSection.tsx`, `RegistrationModal.tsx`.

- `title`, `theme`, `prizePoolTotal`: strings.
- `registrationDeadline`: ISO datetime, drives the live countdown timer in `CaseCompSection.tsx`.
- `tracks: CaseTrack[]` (`types.ts:80-84`): `{id, name, focus}` — `name` is expected in a `"Track X: Subtitle"` format because `RegistrationModal.tsx:121-122` splits on `':'` to render a bolded prefix and a lighter subtitle; a track name without a colon will render its full name as the bold line and an empty subtitle.
- `prizes: PrizeItem[]` (`types.ts:86-90`): `{place, amount, perks}`. The **first array element** is always styled as the highlighted/gradient "1st place" card regardless of what `place` actually says (`CaseCompSection.tsx:120`, `idx === 0` check) — reordering this array changes which card gets the premium treatment, independent of the `place` text.
- `timeline: TimelineStep[]` (`types.ts:92-96`): `{date, title, desc}`, rendered as a 5-up grid (designed for 5 items: `lg:grid-cols-5`).
- `sponsors: Sponsor[]` (`types.ts:98-101`): `{name, logo}`. `logo` is a string key resolved against `CaseCompSection.tsx`'s local `sponsorIcons` map (`Building`, `BarChart3`, `Landmark`, `Globe`) — adding a sponsor with a new `logo` value requires adding a matching icon to that map, and note the existing `"BarChart3"` entry actually renders a `Trophy` icon (likely unintentional — see [COMPONENTS.md](./COMPONENTS.md)).

---

## `resources.json`

Consumed by: `ResourcesSection.tsx`.

- `academicGuides: ResourceItem[]` (`types.ts:103-112`): `{id, title, category, author, downloadUrl, format, size, description}`. All four current entries have `downloadUrl: "#"` — there are no real files backing these; clicking "Download" shows a browser `alert()` instead of downloading (see [COMPONENTS.md](./COMPONENTS.md)). If real downloadable files are added, point `downloadUrl` at real asset paths (e.g. under `public/`) and remove the `e.preventDefault()` + `alert()` interception in `ResourcesSection.tsx:90`.
- `simulatorDefaults`: `{moneySupply, interestRate, taxRate, governmentSpending}` — **documentary only, currently unused.** `ResourcesSection.tsx` hardcodes its own slider defaults (`interestRate: 4.5, moneySupply: 150, taxRate: 22, govtSpending: 180`, `ResourcesSection.tsx:7-10`) which do not match this JSON block's values. If you want the sliders to actually start from `simulatorDefaults`, that's a real (small) implementation gap to fix, not a JSON edit.

---

## `faqs.json`

Consumed by: `GetInvolvedSection.tsx`.

- `items: FAQItem[]` (`types.ts:114-119`): `{id, category, q, a}`.
- `category` values currently in use: `"Membership"`, `"Case Competition"`, `"Resources & Journal"`, `"Get Involved"`. Must stay in sync with the hardcoded filter pills in `GetInvolvedSection.tsx:25`.
- `id` values (`"faq-1"` etc.) matter beyond uniqueness: `GetInvolvedSection.tsx` initializes `activeFaq` state to the literal string `'faq-1'` (`GetInvolvedSection.tsx:21`), so the first FAQ open-by-default only works if an item with `id: "faq-1"` exists. Renaming/removing that specific ID means nothing is expanded on initial render (not a crash, just a UX regression).

---

## `economicRegions.json` → `EconomicRegionsFile`

Consumed by: `EarthModel.tsx` (pin placement) and `RegionSheet.tsx` (everything else).

This file is **not editorial copy like the rest of this directory**. It has three parts with very different rules.

### The regions

The **World Bank's seven official regions**, matching how the World Bank itself publishes data: North America (`NAC`), Latin America & the Caribbean (`LCN`), Sub-Saharan Africa (`SSF`), Middle East & North Africa (`MEA`), Europe & Central Asia (`ECS`), South Asia (`SAS`), East Asia & Pacific (`EAS`). There is no `antarctica` entry: it existed only to swallow ice-sheet clicks back when the land was clickable, and with pins as the only target there is nothing to swallow.

Two membership facts that surprise people, both correct and both reflected in the data:

- **Mexico is in Latin America, not North America.** The World Bank's `NAC` is only the United States, Canada and Bermuda.
- **Afghanistan and Pakistan are in the Middle East region, not South Asia.** The World Bank redrew this around 2024–25; the region's official name is now *"Middle East, North Africa, Afghanistan & Pakistan"*, and **no aggregate for the old definition remains** — `MEA`, `MNA` and `TMN` all include them. The card keeps the short title "Middle East & North Africa" and says so in its blurb; South Asia is correspondingly down to six economies.

### The figures — sourced only, never authored

The hero previously carried an economic overlay whose numbers were invented (`"+4.2% QoQ"`, `"Yield 4.15%"`); it was deleted for that reason. Everything here traces to one release instead:

- `meta.source` / `sourceUrl` / `vintage` are rendered in the card footer as a link. **Never ship a figure that footer cannot account for.**
- Current values are **World Bank World Development Indicators**, series `NY.GDP.MKTP.CD`, `NY.GDP.PCAP.CD`, `NY.GDP.MKTP.KD.ZG`, `FP.CPI.TOTL.ZG`, `SP.POP.TOTL` and `SL.UEM.TOTL.ZS`, taken **unmodified**.
- **One value is computed and it is disclosed in `meta.note`:** share of world GDP, each region's published GDP over the published world total. This is meaningful precisely because the seven regions partition the world — they sum to 99.996 % of it, and their shares to 100.00 %.
- **Vintages can differ, so every rate label carries its own year.** Everything is 2025 except North America's inflation, whose latest WDI print is 2024. Don't quietly relabel it.
- Values are **pre-formatted strings** (`"$33.1T"`, `"2.1%"`), the same way `events.json` stores `displayDate`. This keeps rounding and scaling out of the component, so there is no way for rendering to quietly change a published number.

**To refresh:** `https://api.worldbank.org/v2/country/NAC;LCN;SSF;MEA;ECS;SAS;EAS;WLD/indicator/<SERIES>?format=json&date=2022:2026` returns all eight entities in one call. Regenerate with a script rather than editing by hand, take the newest non-null year per region, and update `meta.vintage` in the same commit. For `economies[]`, authoritative country-to-region membership is `https://api.worldbank.org/v2/country?format=json` — each country carries a `region.id`. **Re-check the blurbs too**: they make comparative claims ("the fastest-growing region", "the highest inflation of any region") that a data refresh can silently falsify.

### `pin` — do not hand-edit

A unit vector in the glTF model's local frame doing three jobs at once: where the region's map pin is planted on the globe, what the screen-space hit test measures the cursor against, and where the camera turns when the region is selected.

Four are the region's **GDP-weighted centre**; three are placed at a named location instead (Latin America at the centre of South America, Middle East & North Africa on Egypt, Europe & Central Asia on Russia). All are snapped onto mesh terrain so no pin floats over water.

They are measured against **the .glb**, not derived from real coordinates — the model is a stylised Earth, rotated about 72° in longitude with local distortion up to ~10°, and it has landmasses the real Earth doesn't and gaps where the real one has land (there is no European Russia on it at all). Moving one moves a pin. If the model is re-exported or a region is added, follow the procedure in [3D_MODEL_VIEWER.md](./3D_MODEL_VIEWER.md#re-measuring-the-pin-positions) rather than nudging numbers by feel.

---

## Content-editing checklist

When adding/editing an entry in any of these files:

1. Match the existing field shape exactly (check `types.ts` for the interface) — there's no schema validation, so a typo'd field name just silently fails to render rather than erroring.
2. Check whether the component that consumes it has a **hardcoded filter/category/icon-lookup list** that also needs updating (committees, event categories, FAQ categories, icon-name maps for pillars/sponsors) — this is the single most common way new content becomes invisible or unreachable in the UI. Cross-reference [COMPONENTS.md](./COMPONENTS.md) for the specific gotcha per component.
3. Run `npm run dev` and visually verify — there is no automated test coverage that would catch a content mismatch.
4. Remember JSON edits require a rebuild to reach production; they are not live-editable post-deploy.
5. `economicRegions.json` is the exception to "just edit the copy" — see its section above before touching either the figures or the `pin` vectors.
