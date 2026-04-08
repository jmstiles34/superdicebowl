# Testing

Super Dice Bowl uses **Vitest** for unit tests. The suite is organized in
layers — the lower layers are the highest-value target, and each layer up
adds more infrastructure for a narrower slice of coverage.

## Running tests

```bash
npm run test:unit    # watch mode (for development)
npm run test:run     # single run (used by CI and pre-push)
```

Test files live next to the code they test (`foo.ts` → `foo.test.ts`). The
glob in [vite.config.ts](../vite.config.ts) is `src/**/*.{test,spec}.{js,ts}`.

## Layering

The philosophy is **test pure code first, skip what runes would require, and
use property/invariant tests for the game engine.**

| Layer | What it covers | Status |
| --- | --- | --- |
| 1. Pure utils | [`lib/utils/common.ts`](../src/lib/utils/common.ts), [`lib/utils/game.ts`](../src/lib/utils/game.ts), [`lib/utils/schedule.ts`](../src/lib/utils/schedule.ts) | ✅ |
| 2. Engine invariants | [`lib/utils/instantGame.ts`](../src/lib/utils/instantGame.ts) property tests | ✅ |
| 3. Data integrity | [`lib/data/data.json`](../src/lib/data/data.json) (diceData + teamsData) | ✅ |
| 4. Online turn logic | [`lib/online/remoteGameEngine.ts`](../src/lib/online/remoteGameEngine.ts) pure exports | ✅ |
| 5. Auth / repositories | Dexie tables via `fake-indexeddb` | ⏳ deferred |
| 6. Supabase API helpers | Network-shaped; covered by online E2E later | ⏳ deferred |
| 7. Components | `@testing-library/svelte`; low ROI for this app | ⏳ deferred |

Layers 1–4 give broad coverage of every pure function that drives gameplay.
Anything in `lib/state/*.svelte.ts` is intentionally uncovered — those classes
are thin delegators to the pure helpers, and testing runes directly requires
a browser rune harness that isn't worth the setup cost. **If you find yourself
wanting to test branch logic inside a `*.svelte.ts` state class, extract the
branch into `lib/utils/game.ts` first** and test the pure function.

## What we test (and what we don't)

### ✅ Test these

- Pure helpers in [`lib/utils/`](../src/lib/utils/) — every function
- Pure helpers in [`lib/auth/passwordUtils.ts`](../src/lib/auth/passwordUtils.ts)
- Pure helpers in [`lib/online/remoteGameEngine.ts`](../src/lib/online/remoteGameEngine.ts) (`isActionableState`, `deriveTurn`)
- Data file integrity — `diceData` and `teamsData` shape invariants
- Game engine invariants via seeded runs of `simulateInstantGame`

### ❌ Don't test these

- `*.svelte.ts` state classes directly (needs rune harness)
- `*.svelte` components (needs DOM + rune harness; defer to E2E)
- `lib/db/repositories/*` without `fake-indexeddb` set up
- `lib/online/{friends,remoteGames,onlineAuth}.ts` — these are mostly thin
  Supabase SQL wrappers; unit tests devolve into "did you pass the same args
  to the mock?". Add an E2E suite instead.

## Conventions

### File layout

```
src/lib/utils/game.ts
src/lib/utils/game.test.ts    ← co-located
```

### Imports

Use the `$lib/...` alias for anything outside the test's own directory:

```ts
import { DEFAULT_GAME, GAME_ACTION, TEAM } from '$lib/constants/constants';
import type { Play } from '$lib/types';
```

### Fixtures & factories

Inline small factories at the top of the file rather than setting up a shared
fixtures folder:

```ts
function play(overrides: Partial<Play> = {}): Play {
  return {
    team: TEAM.HOME,
    diceRoll: 0,
    action: GAME_ACTION.OFFENSE,
    description: '',
    points: 0,
    yards: 0,
    penaltyYards: 0,
    isFirstdown: false,
    ...overrides
  };
}
```

This keeps the test's intent visible and avoids long-range coupling between
files. Promote a factory to a shared helper only when it's used in 3+ files.

### Parameterized tests

Prefer `it.each` for table-driven tests — it's clearer than a hand-rolled
`for` loop and produces one test result per row:

```ts
it.each([4, 6, 8])('produces a valid round-robin for %d teams', (n) => {
  // ...
});
```

### Deterministic randomness

Any test that exercises `Math.random` must seed it. Use the **Mulberry32**
pattern from [`src/lib/utils/instantGame.test.ts`](../src/lib/utils/instantGame.test.ts):

```ts
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedRandom(seed: number): void {
  vi.spyOn(Math, 'random').mockImplementation(mulberry32(seed));
}

afterEach(() => {
  vi.restoreAllMocks();
});
```

This is an in-file snippet on purpose — a 10-line PRNG is not worth promoting
to a shared helper until a third test file needs it.

### Property/invariant tests

Prefer **invariants over specific values** when testing the engine:

```ts
it.each([1, 2, 7, 42, 123])('terminates with a valid winner for seed %i', (seed) => {
  seedRandom(seed);
  const { homeScore, awayScore } = simulateInstantGame(30);
  expect(homeScore >= 30 || awayScore >= 30).toBe(true);
});
```

Good invariants to assert on engine output:
- Termination (at least one side meets `winScore`)
- Determinism (same seed → same result)
- Score is non-negative integer
- Winner is strictly greater than loser (no ties)
- Monotonic scaling with `winScore`
- Winner doesn't overshoot `winScore` by more than ~2 TDs (sanity envelope)

### Pinning current behavior

When a function has a known quirk or outright bug that isn't safe to fix in
the current PR, **pin the current behavior in a test with a clear comment**
so any future fix is forced to be intentional:

```ts
it('does not filter empty producers (pins current reducer behavior)', () => {
  // joinText only adds a separator when the acc is non-empty, so a leading
  // empty producer contributes nothing but a trailing empty producer leaves
  // a trailing space. Pinned so a refactor of joinText is caught.
  expect(buildTextString([() => '', () => 'hi', () => ''])).toBe('hi ');
});
```

## CI

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs on every push
to `main` and every pull request. It runs:

1. `npm ci --force`
2. `npm run lint:ci` — **Biome only** (see ESLint note below)
3. `npm run check` — svelte-check (types)
4. `npm run test:run` — Vitest single-run mode
5. `npm run build` — production build

Any failure blocks the PR. Fix the cause — **never bypass** with `--no-verify`
or `continue-on-error`.

### Lint scripts

| Script | What it runs | Used by |
| --- | --- | --- |
| `npm run lint` | `biome check .` **+** `eslint .` | Local dev, pre-commit intent |
| `npm run lint:ci` | `biome check .` only | CI workflow |
| `npm run format` | `biome check --write .` | Autofix locally |

### Why CI doesn't run ESLint (yet)

As of this writing the codebase has **~173 preexisting ESLint errors** — mostly
`svelte/no-navigation-without-resolve` on `goto(...)` calls in routes,
`@typescript-eslint/no-non-null-assertion` on Dexie `.get(id)` lookups, and a
handful of unused imports / `any` casts. These all predate the test suite
work and are unrelated to gameplay correctness.

The plan is to address them in a dedicated cleanup PR, then flip CI to run
the full `npm run lint`. Until that lands:

- **Local dev still runs both** via `npm run lint` — please keep your own
  changes ESLint-clean so the backlog doesn't grow.
- **CI enforces Biome** via `npm run lint:ci` so formatting, Biome-rule
  hygiene, and correctness lints are still guarded.
- When adding new files, run `npx eslint <file>` manually before committing
  to make sure your additions don't add to the backlog.

## Adding a test

1. Create `foo.test.ts` next to `foo.ts`.
2. Import what you need using `$lib/...` aliases.
3. Write the smallest invariant or table-driven test that would fail if the
   function regresses.
4. `npm run test:unit` locally in watch mode.
5. Before committing, run `npm run test:run` + `npx biome check --write <file>`
   to auto-format and confirm CI will pass.

## Debugging failing tests

```bash
# Run a single file
npx vitest run src/lib/utils/game.test.ts

# Run tests matching a name
npx vitest run -t 'makeFourthDownChoice'

# Watch + debug a single file
npx vitest src/lib/utils/game.test.ts
```

## When to add fake-indexeddb (Layer 5)

Do this when you need to test a repository end-to-end:

1. `npm i -D fake-indexeddb`
2. Create `vitest.setup.ts` with `import 'fake-indexeddb/auto';`
3. In [vite.config.ts](../vite.config.ts), add `test.setupFiles: ['./vitest.setup.ts']`
4. In each repository test, `beforeEach(async () => { await db.delete(); await db.open(); })`

Repository tests belong in `src/lib/db/repositories/*.test.ts`, not in the
shared test-utils folder.
