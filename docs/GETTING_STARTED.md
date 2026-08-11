# Getting Started

## Prerequisites

- Node.js (a recent LTS; the environment this was scaffolded in used Node 22). No `.nvmrc`/`engines` field is committed, so no version is formally pinned — if you hit install issues, try Node 20 or 22.
- npm (repo ships `package-lock.json`) **or** Bun (repo also ships `bun.lock`) — see the note in [KNOWN_ISSUES_AND_TECH_DEBT.md](./KNOWN_ISSUES_AND_TECH_DEBT.md) about having both.

## Install

```bash
npm install
# or
bun install
```

## Environment variables

Copy `.env.example` to `.env` (git-ignored by the `.env*` / `!.env.example` rule in `.gitignore`):

```bash
cp .env.example .env
```

| Variable | Purpose | Required for local dev? |
|---|---|---|
| `GEMINI_API_KEY` | Documented as being for Gemini API calls, auto-injected by AI Studio in that hosting context. | **No** — nothing in `src/` currently calls the Gemini API (`@google/genai` is an unused dependency). Safe to leave as the placeholder value. |
| `APP_URL` | Documented as the hosted URL for self-referential links/OAuth callbacks, auto-injected by AI Studio's Cloud Run deploy. | **No** — nothing in `src/` reads `APP_URL` or `import.meta.env.APP_URL`. |

In short: **you do not need real values in `.env` to run this project locally.** Both variables are vestiges of the AI Studio scaffold and are currently dead as far as this app's code is concerned. If a future feature wires up Gemini or self-referential URLs, this table should be updated.

## Run the dev server

```bash
npm run dev
```

This runs `vite --port=3000 --host=0.0.0.0`, so it's reachable at `http://localhost:3000` and from other devices on your LAN. HMR is on by default; it's disabled only when the environment variable `DISABLE_HMR=true` is set (an AI-Studio-specific knob — see `vite.config.ts:14-19` — do not set this for normal local development, it also disables file watching entirely).

## Type-check ("lint")

```bash
npm run lint
```

This runs `tsc --noEmit`. **There is no ESLint/Prettier configured** — this is the only automated code-quality gate in the repo. Run it before opening a PR.

## Build for production

```bash
npm run build
```

Runs `vite build`, emitting a static bundle to `dist/`.

## Preview the production build

```bash
npm run preview
```

Serves the `dist/` output locally so you can sanity-check the real build (not the dev server) before shipping.

## Clean

```bash
npm run clean
```

Runs `rm -rf dist server.js`. Note: `server.js` does not exist in this repo — this is a harmless leftover from the AI Studio template (which apparently used to generate a small Express server). Don't be alarmed that it's a no-op for that part.

## Common pitfalls

- **Editing `src/data/*.json` doesn't show up on a live site without a rebuild.** The dev server will hot-reload it locally, but production content changes require `npm run build` + redeploy — there's no CMS/runtime fetch. See [DATA_AND_CONTENT.md](./DATA_AND_CONTENT.md).
- **Forms don't actually submit anywhere.** If you're testing the membership form, RSVP modal, or case comp registration and wondering where the data went — nowhere. It's UI-only. See [STATE_AND_FORMS.md](./STATE_AND_FORMS.md).
- **The 3D model requires WebGL.** `EarthModel.tsx` degrades rather than crashes in environments without WebGL support (e.g. some headless/CI browser contexts): the `WebGLRenderer` construction is guarded, so the hero renders an empty canvas and — importantly — still calls `markModelReady()` so the splash screen lifts. Headless runs need SwiftShader flags (`--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`) to exercise the real path.
