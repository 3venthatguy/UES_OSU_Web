# Architecture

## Tech stack

| Layer | Choice | Notes |
|---|---|---|
| UI framework | React 19.0.1 | `StrictMode` enabled in `src/main.tsx` — expect double-invoked effects in dev |
| Build tool | Vite 6.2.3 | `@vitejs/plugin-react` for Fast Refresh/JSX |
| Styling | Tailwind CSS 4.1.14 | Loaded via `@tailwindcss/vite` plugin, not PostCSS config. `src/index.css` is just `@import "tailwindcss";` — there is no `tailwind.config.js`; all customization is inline utility classes with arbitrary values (e.g. `bg-[#B03A40]`) |
| 3D rendering | three.js 0.185.1 | Raw `three`, manually wired into a React `useEffect` — **not** `@react-three/fiber`. The hero Earth is a 4.27 MiB self-contained `.glb` fetched at runtime via `GLTFLoader`; it is the hero's only network asset and the splash blocks on it |
| Icons | lucide-react 0.546.0 | Tree-shaken icon imports, one import per file |
| Animation | motion 12.23.24 (Framer Motion successor) | Scroll reveals, page transitions, modal/drawer enter-exit, and the officer card→panel `layoutId` morph |
| Smooth scroll | lenis 1.3.26 | Damped wheel scrolling; drives real `window.scrollY`, so it never creates a containing block |
| Confetti | canvas-confetti 1.9.4 | Used for form-submission celebration effects |
| Language | TypeScript ~5.8.2 | `noEmit: true`; type-checking only, Vite/esbuild does the actual transpile |
| Package manager | npm (package-lock.json) and/or bun (bun.lock) both present | Pick one per [KNOWN_ISSUES_AND_TECH_DEBT.md](./KNOWN_ISSUES_AND_TECH_DEBT.md) |

Two dependencies are declared but unused in application code: `@google/genai` and `express` (plus its `@types/express`, `dotenv`, `esbuild`, `tsx` devDependencies). They're artifacts of the Google AI Studio scaffold this project was generated from. See tech-debt doc.

## System shape

This is a **fully client-rendered static site**. There is no server-side rendering, no API layer, and no database.

```
┌─────────────────────────────────────────────────────────────┐
│ Browser                                                      │
│                                                               │
│  index.html → src/main.tsx → <App/>                          │
│                                                               │
│  App.tsx (root)                                               │
│   ├─ Navbar               (always mounted, fixed header)      │
│   ├─ <current page>       (one of 6, chosen by state)         │
│   │    hero → HeroSection + Explore-Portals bento grid        │
│   │    about → AboutSection                                   │
│   │    case-comp → CaseCompSection                             │
│   │    events → EventsSection                                  │
│   │    resources → ResourcesSection                            │
│   │    get-involved → GetInvolvedSection                       │
│   └─ Footer                (always mounted)                    │
│                                                               │
│  Each *Section component:                                     │
│   - imports its own JSON from src/data/*.json                 │
│   - owns its own local UI state (filters, modals, forms)      │
│   - has zero network calls                                    │
└─────────────────────────────────────────────────────────────┘
```

There is no global state manager (no Redux/Zustand/Context store beyond the one piece of routing state in `App.tsx`). Each section is an island: it imports the JSON it needs directly and manages its own `useState`.

## Rendering model: single-page "tab switcher," not real routing

`App.tsx` holds one piece of state, `currentPage: string`, initialized to `'hero'`. Navigating calls `handleNavigate(pageId)`, which:

1. Sets `currentPage` state (triggers a re-render that conditionally mounts a different `<div>` block — see `App.tsx:45-247`)
2. Sets `window.location.hash = pageId` (for shareable/bookmarkable URLs)
3. Scrolls to top instantly

A `hashchange` listener (`App.tsx:23-34`) keeps `currentPage` in sync if the user edits the URL bar or uses browser back/forward, restricted to a fixed allow-list: `['hero', 'about', 'case-comp', 'events', 'resources', 'get-involved']`.

**This is not `react-router`.** There's no route-based code splitting — every section's JS is in the same bundle and all six sections' components exist in the React tree's conditional branches, but only the active one is mounted (others return `false`/nothing, so their internal state resets on navigation — e.g. reopening the Events page always starts with filters cleared).

## Data flow

```
src/data/*.json  →  imported as ES module in the owning component  →  rendered directly
```

There is no data-fetching, no loading states, no caching layer, and no data transformation library. JSON is imported statically (`import eventsData from '../data/events.json'`), so it's bundled at build time — **editing a JSON file requires a rebuild/redeploy to go live**, not a CMS-style runtime update. See [DATA_AND_CONTENT.md](./DATA_AND_CONTENT.md) for the full schema-to-file mapping.

## Styling architecture

Tailwind v4's CSS-first mode means there's no `tailwind.config.js` theme to check for the brand palette — colors are inlined as arbitrary hex values throughout every component (e.g. `text-[#B03A40]`, `bg-[#FDF8F1]`). This is intentional-by-omission rather than a documented design token system; see [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) for the palette reference that exists only informally (in `src/data/siteConfig.json`'s `projectSettings` block) and is not actually consumed by Tailwind at build time — components hardcode the same hex values independently.

## Path aliasing

Both `vite.config.ts` and `tsconfig.json` define `@/*` → project root (`path.resolve(__dirname, '.')`). In practice, no file in `src/` currently uses the `@/` alias — all imports are relative (`../data/...`, `./ComponentName`). Prefer relative imports to match existing style unless there's a strong reason to introduce the alias.

## Build output

`npm run build` runs `vite build`, producing a static `dist/` folder (JS/CSS/HTML + copied `public/` assets) suitable for any static host or CDN. `npm run preview` serves that `dist/` build locally for a final check.
