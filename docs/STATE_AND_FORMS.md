# State Management & Forms

## No global state

There is no Redux/Zustand/Jotai/React Context store anywhere in this codebase. State management is 100% local `useState`/`useRef`/`useEffect` per component. The only piece of state that could be called "global" (shared across the app shell) is `App.tsx`'s `currentPage`, which is passed down explicitly as props (`activeSection`/`onNavigate`) to `Navbar` and `Footer` — plain prop drilling, one level deep, no context needed at this scale.

**If a future task needs cross-section shared state** (e.g. persisting a logged-in user, a cart, a real form-submission queue), there is no existing pattern to extend — you'd be introducing the first shared state mechanism in the app. Consider whether `useState` lifted into `App.tsx` + props is still sufficient before reaching for Context or a state library, given the app's current size.

## Routing state

Covered in depth in [ARCHITECTURE.md](./ARCHITECTURE.md#rendering-model-single-page-tab-switcher-not-real-routing). Short version: `App.tsx`'s `currentPage` string + a `hashchange` listener, no router library.

## The four "fake" forms

**None of these forms send data anywhere — no `fetch`, no `XMLHttpRequest`, no form `action` attribute, no backend endpoint exists in this repo.** Every "submit" handler follows the same shape:

```tsx
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (/* required fields check */) return;
  // optionally: confetti(...)
  setSubmitted(true); // flips UI to a static "success" screen
};
```

| Form | Component | Required fields (client-side only, `required` HTML attr + a JS guard) | Side effect on submit |
|---|---|---|---|
| Membership application | `GetInvolvedSection.tsx` | `fullName`, `email`, `agreed` checkbox | `canvas-confetti` burst, static confirmation copy |
| Case comp team registration | `RegistrationModal.tsx` | `teamName`, `leadName`, `leadEmail`, `agreedToRules` checkbox | `canvas-confetti` burst, fabricates a fake reference ID (`UES-2026-XXXXXX`, purely `Math.random()`, not from any backend) |
| Event RSVP | `RSVPModal.tsx` | `name`, `email` | No confetti; shows a real, working "Add to Google Calendar" deep link built from the event's own data |
| Newsletter signup | `Footer.tsx` | non-empty email | Static "Subscribed!" message |

**Consequences to be aware of:**

- Refreshing the page or renavigating away and back resets all form state — nothing survives even in `localStorage`/`sessionStorage`.
- Validation is minimal (HTML5 `required` + `type="email"` pattern matching + a couple of manual empty-string/false checks) — there is no format validation beyond the browser's native email input checking, no duplicate-submission prevention, no rate limiting, no server-side validation (because there's no server).
- If a real backend is ever integrated, every one of these four `handleSubmit` functions is the exact point to replace `setSubmitted(true)` with an actual async request (with loading/error states added, which don't currently exist anywhere in the app — there is no loading spinner or error-message UI pattern established yet to copy from).

## Modal pattern

Three modals exist (`RegistrationModal`, `RSVPModal`, officer bio modal inline in `AboutSection`), and they share a consistent but **not extracted into a shared component** pattern:

- Rendered conditionally based on either a boolean (`RegistrationModal`'s `isOpen`) or a nullable data object (`RSVPModal`'s `event`, `AboutSection`'s `activeOfficerModal`) being non-null.
- Fixed full-screen backdrop: a `motion.div` with `fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs`, fading in/out inside the modal's own `AnimatePresence`. The card inside fades and lifts.
- Modal bodies mount only while open, so form state resets on every open, and each calls `useScrollLock(true)` (`src/lib/useScrollLock.ts`) to freeze the page behind them.
- Content card: `bg-[#FFFDF9] border ... rounded-3xl p-6 sm:p-8 ... shadow-2xl relative`.
- Close via an `X` icon button in the top-right corner, absolutely positioned.
- **No focus trapping, no `Escape`-to-close, no scroll-lock on the underlying page, no ARIA `role="dialog"`/`aria-modal` attributes.** These are real accessibility gaps — see [KNOWN_ISSUES_AND_TECH_DEBT.md](./KNOWN_ISSUES_AND_TECH_DEBT.md). If you're adding a new modal, matching the existing visual pattern is fine, but consider fixing these gaps rather than propagating them further, or at minimum flag it in your PR.

## Derived/computed state (not stored in `useState`)

Some components compute values on every render rather than storing them in state — worth knowing so you don't "fix" a missing `useState` that was actually intentional:

- `EventsSection.tsx`: `filteredUpcoming` (category + search filter) is recomputed inline on every render from `eventsData.upcoming`, not memoized. Fine at this data size (4 events); would need `useMemo` if the dataset grew significantly.
- `ResourcesSection.tsx`: the entire policy simulator's outputs (`gdpGrowth`, `inflationRate`, `unemployment`, `statusBadge`) are pure functions of the four slider `useState` values, recomputed on every render (`ResourcesSection.tsx:14-29`) — again, fine given the trivial computation cost.
- `CaseCompSection.tsx`: the only value that's genuinely `useState` + `useEffect`-driven (rather than purely derived) is the countdown `timeLeft`, because it needs a `setInterval` ticking independently of any prop/state change.
