# UES OSU Web — Engineering Documentation

This folder is the reference documentation for the Undergraduate Economics Society (UES) website codebase. It is written for coworkers and AI coding agents who need to work in this repo without re-deriving context from scratch.

**Read this first, then jump to the file that matches your task.**

## What this project is

A single-page marketing/portal site for a university Undergraduate Economics Society chapter. It presents the org's mission, leadership, a flagship case competition, an events calendar, a resources/policy-simulator hub, and a membership funnel — all rendered client-side from static JSON, with an interactive Three.js 3D model as the visual centerpiece of the hero section.

**There is no backend.** All "submissions" (membership application, case comp registration, event RSVP, newsletter signup) are simulated in React state only — nothing is persisted or sent anywhere. See [KNOWN_ISSUES_AND_TECH_DEBT.md](./KNOWN_ISSUES_AND_TECH_DEBT.md) before assuming otherwise.

The project was scaffolded from a **Google AI Studio** template (see `metadata.json`, `.env.example`, and the HMR comments in `vite.config.ts`) — several artifacts in the repo (an unused `@google/genai` dependency, an unused `express` dependency, a `clean` script referencing a `server.js` that doesn't exist) are leftovers from that template rather than active parts of the app.

## Index

| Doc | Read this for |
|---|---|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Tech stack, high-level system shape, rendering model, how a request becomes pixels |
| [GETTING_STARTED.md](./GETTING_STARTED.md) | Installing, running, building, environment variables |
| [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) | Annotated file/folder tree |
| [COMPONENTS.md](./COMPONENTS.md) | Per-component reference: props, internal state, behavior, gotchas |
| [DATA_AND_CONTENT.md](./DATA_AND_CONTENT.md) | JSON content files, their schemas (`types.ts`), and how to safely edit site content |
| [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) | Color palette, typography, the "bento grid" layout pattern, Tailwind v4 conventions |
| [3D_MODEL_VIEWER.md](./3D_MODEL_VIEWER.md) | Deep dive on the Three.js hero model (`EarthModel.tsx`) |
| [STATE_AND_FORMS.md](./STATE_AND_FORMS.md) | Client-side state patterns, the four "fake" forms, routing state |
| [KNOWN_ISSUES_AND_TECH_DEBT.md](./KNOWN_ISSUES_AND_TECH_DEBT.md) | What's broken, missing, unused, or risky — read before estimating any task |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Conventions for adding pages/components/content, PR workflow |

## Quick facts

- **Framework:** React 19 (function components + hooks only, no class components)
- **Bundler/dev server:** Vite 6
- **Styling:** Tailwind CSS v4 (via `@tailwindcss/vite`), no `tailwind.config.js` — v4 is CSS-first
- **3D:** three.js r185 + `GLTFLoader`, hand-rolled (no `@react-three/fiber`)
- **Language:** TypeScript, `strict`-adjacent config, `tsc --noEmit` is the lint step
- **Routing:** Hand-rolled single-state router in `App.tsx` (`useState` + `location.hash`), not `react-router`
- **Content:** Static JSON files under `src/data/`, imported directly as ES modules
- **Package manager:** Both `package-lock.json` and `bun.lock` are committed — see tech-debt doc
- **Deployment target:** Google AI Studio / Cloud Run (per `metadata.json`), but it's a static Vite build and can be hosted anywhere that serves static files
