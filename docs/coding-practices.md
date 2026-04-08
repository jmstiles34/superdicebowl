# Coding Practices

## TypeScript

- Strict mode. Prefer precise types over `any`.
- Shared types live in [`lib/types.ts`](../src/lib/types.ts). DB record types
  live alongside the Dexie schema in
  [`lib/db/database.ts`](../src/lib/db/database.ts).
- For external data (Supabase responses), cast narrowly inside a `mapXxx`
  function — e.g. `mapRemoteGame` — and return the clean TS type.

## Svelte 5 runes

- `$state`, `$derived`, `$effect`, `$state.snapshot` only — **no `svelte/store`**.
- Class-based state singletons in `*.svelte.ts` files (see
  [state-management.md](state-management.md)).
- Methods on state classes are **arrow functions** (`reset = () => { ... }`)
  so they can be destructured or passed as callbacks without losing `this`.
- Derived values (`$derived`) live in the components that consume them, not
  on the state classes.

## Layering rules (enforced by convention)

| Layer | May import from | Must not import from |
| --- | --- | --- |
| `routes/**` | everything | — |
| `lib/state/**` | `lib/utils/**`, `lib/constants/**`, `lib/types.ts`, `lib/db` **type imports only** | `lib/db` runtime, `lib/online/**` runtime |
| `lib/utils/**` | `lib/constants/**`, `lib/types.ts`, `lib/state` (types) | `lib/db`, `lib/online` |
| `lib/db/repositories/**` | `lib/db/database.ts`, `lib/constants/**` | `lib/state`, `lib/online` |
| `lib/online/**` | `lib/online/supabaseClient`, `lib/constants/**`, `lib/types.ts` | `lib/db`, `lib/state` |

When state needs to persist, the **route** injects a save callback via
`game.setSaveGame(fn)` rather than state importing `db/*`.

## Constants over magic values

All gameplay constants live in
[`lib/constants/constants.ts`](../src/lib/constants/constants.ts) and all auth
constants in [`lib/constants/auth.ts`](../src/lib/constants/auth.ts). When in
doubt, add a new named constant rather than inlining a number or string.

## Pure helpers

Everything in [`lib/utils/game.ts`](../src/lib/utils/game.ts) must stay pure
(no state reads, no I/O). This is what makes the game logic testable and
what lets `instantGame.ts` reuse it for fast-forward simulation.

## File naming

- `*.svelte.ts` — contains runes, must only be imported where runes are valid.
- `*.svelte` — Svelte components.
- Everything else is plain TypeScript.

## Formatting & linting

- **Biome** is the formatter and primary linter (`biome.json`). Tabs, single
  quotes, no trailing commas, 100-char line width.
- **ESLint** + `eslint-plugin-svelte` covers Svelte-specific rules.
- **svelte-check** via `npm run check`.
- **Husky** pre-commit runs `npm run lint`; **lint-staged** auto-fixes staged
  files with `biome check --write`.
- **Never bypass with `--no-verify`.** If a hook fails, fix the underlying
  issue.

## Tests

- **Vitest** for unit tests. Prefer testing pure helpers in `lib/utils/` and
  `lib/auth/passwordUtils.ts`.
- Avoid testing `*.svelte.ts` state classes directly unless the rune harness
  is set up; test the pure helpers they delegate to instead.

## Commits

- Pre-commit hook must pass before committing.
- Write what changed *and* why. Prefer new commits to amends.
- Don't bundle unrelated changes. Keep diffs surgical.

## Avoid

- Adding docstrings, comments, or types to code you didn't touch.
- "Just in case" error handling for branches that can't happen.
- Feature flags or backwards-compat shims when a direct change is cleaner.
- `any` casts outside the single point where external data crosses into the app.
- Mutating `$state` arrays in place. Reassign: `this.playLog = [...this.playLog, play]`.
- Editing an existing Dexie `version(N).stores(...)` block. Always add a new version.
