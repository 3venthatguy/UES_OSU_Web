# Contributing Conventions

This repo has no formal `CONTRIBUTING.md` history, no PR template, and no enforced linting beyond `tsc --noEmit`. The conventions below are inferred from the existing code and are what a new PR should match to look native to this codebase — not externally imposed rules.

## Before you start

1. Read [ARCHITECTURE.md](./ARCHITECTURE.md) and [KNOWN_ISSUES_AND_TECH_DEBT.md](./KNOWN_ISSUES_AND_TECH_DEBT.md) — several things that look like bugs (fake forms, unused JSON fields) are current-state-by-design, not oversights to silently "fix" as a drive-by in an unrelated PR.
2. Run `npm install` and `npm run dev`, confirm the site loads at `localhost:3000` before making changes.

## Code style (inferred, not enforced by tooling)

- **Function components with `React.FC<PropsType>`** for components that take props (e.g. `export const Navbar: React.FC<NavbarProps> = ({...}) => {...}`); plain `export const X: React.FC = () => {...}` for prop-less components. `App.tsx` is the sole exception, using `export default function App()`.
- **Named exports** for every component except `App.tsx`. Match this — don't switch a component to a default export without a reason.
- **Props interfaces** are declared inline above the component, named `<ComponentName>Props` (e.g. `NavbarProps`, `HeroSectionProps`, `RegistrationModalProps`), not in `types.ts` — `types.ts` is reserved for **data/content shapes** (what comes from `src/data/*.json`), not component prop contracts. Keep that separation.
- **Section-heavy comment banners** (`{/* Section Name */}`) mark major structural blocks inside JSX throughout every component — this is the closest thing to internal documentation the codebase has. Keep adding them when you add a new structural block; it's how a reader orients inside a 200+ line render function.
- **State naming**: `activeX`/`selectedX` for filter/selection state, `isXOpen`/`xOpen` for modal visibility booleans, plain `submitted`/`confirmed` for form-success flags. Match these names for new state rather than inventing new conventions (`showModal` vs `isModalOpen` vs `modalOpen` — pick the pattern already used in sibling components).
- **Tailwind utility classes inline, no CSS modules, no styled-components, no `clsx`/`cn` helper** — conditional classes are built with plain template literals and ternaries (e.g. `` `px-4 py-2 ${isActive ? 'bg-[#B03A40] text-white' : 'text-[#524B47]'}` ``). Don't introduce a class-merging utility library for a one-off change; match the existing inline-ternary style.
- **Colors are inlined as hex arbitrary values**, not Tailwind theme names or CSS variables. Copy exact hex values from [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) or a neighboring component rather than approximating a "close enough" shade.
- **Imports**: relative paths (`../data/...`, `./ComponentName`) throughout `src/`. The `@/*` alias exists in config but is unused by convention — don't introduce it in one file only, it'll look inconsistent.

## Adding a new "page" / section

There's no router to register with, but there is a fixed checklist since routing is hand-rolled in `App.tsx`:

1. Add the new component under `src/components/`, following the existing section pattern (`py-20` wrapper, section header eyebrow/heading/description, bento grid content).
2. Add its page ID to the allow-list array in `App.tsx`'s hash-sync effect (`App.tsx:26`) — otherwise deep-linking via URL hash won't work for it even though in-app navigation would.
3. Add a new conditional block in `App.tsx`'s `<main>` following the existing per-page pattern (breadcrumb bar + the section component) — copy an existing block (e.g. the `about` block) as your template.
4. Add a nav entry to `siteConfig.json`'s `navigation.centerLinks` (or as the `specialLink` if it's a primary CTA) so it's reachable from the navbar/footer without further code changes.
5. If the page needs its own JSON content, add a new file under `src/data/`, add its shape to `types.ts`, and import it directly in the new component (matching every existing section's pattern — no shared data-loading hook exists to use instead).

## Adding/editing content (no code page needed)

If the change is purely to copy/data (new officer, new event, new FAQ, etc.), see [DATA_AND_CONTENT.md](./DATA_AND_CONTENT.md)'s content-editing checklist — in particular, **check for a hardcoded filter/lookup list in the consuming component that also needs updating**, since that's the most common way new JSON entries become invisible in the UI without any error being raised.

## Adding a new modal

Follow the pattern documented in [STATE_AND_FORMS.md](./STATE_AND_FORMS.md#modal-pattern). Consider fixing the accessibility gaps (`Escape`-to-close, focus trap, `aria-modal`) in your new modal even though existing ones lack it — don't feel obligated to match that specific gap just because it's the status quo.

## Type-checking

Run `npm run lint` (`tsc --noEmit`) before submitting — it is the only automated gate. There is no ESLint config to satisfy and no test suite to run (see tech-debt doc for the implications of that).

## Commit / PR conventions

The existing git history is minimal (two commits: `Initial commit`, `feat: initialize project structure`), so there's no established Conventional Commits pattern to strictly infer — but `feat:`-prefixed messages suggest a lightweight Conventional Commits style is intended. Reasonable defaults: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:` prefixes; keep messages in the imperative mood.

## Things to flag in review rather than silently fixing

Because several "issues" in this codebase are current-state-by-design pending future scoping (see [KNOWN_ISSUES_AND_TECH_DEBT.md](./KNOWN_ISSUES_AND_TECH_DEBT.md)), if your task touches one of these areas, call it out explicitly in your PR description rather than quietly changing behavior:

- Any of the four forms actually submitting data somewhere (that's a scope expansion, not a bug fix).
- Re-adding anything under `public/assets/` that isn't actually fetched. The old `model/` and `model-obj/` exports have been deleted; the hero `.glb` is self-contained, so a sibling `textures/` folder arriving with a re-download is redundant and shouldn't be committed.
- Removing the unused dependencies (`@google/genai`, `express`, etc.) — low risk, but still worth a one-line callout in case something external depends on them.
- **Any change to a figure in `economicRegions.json`.** Every value there is a published World Bank WDI series reproduced unmodified (the sole exception, share of world GDP, is disclosed in `meta.note`), with its source rendered on the card. Adding, adjusting or "rounding" one by hand reintroduces exactly the problem that got the hero's previous overlay deleted. Say in the PR which release the new numbers came from, and re-check the blurbs — they make comparative claims a data refresh can falsify. Same for the `pin` vectors — those are measured against the `.glb`, not typed in, and this model's geography is not the real world's (it has no European Russia at all). Follow the procedure in [3D_MODEL_VIEWER.md](./3D_MODEL_VIEWER.md#re-measuring-the-pin-positions), including the clearance check and the screenshot.
- Changing which lockfile is canonical (`package-lock.json` vs `bun.lock`) — affects every contributor's local setup.
