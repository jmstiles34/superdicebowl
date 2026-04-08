# Architecture

## Tech stack

- **Framework:** SvelteKit 2 with **Svelte 5 runes** (`$state`, `$derived`, `$effect`, `$state.snapshot`)
- **Adapter:** `@sveltejs/adapter-static` — builds a fully static site (no SSR at runtime)
- **Language:** TypeScript, strict
- **Build:** Vite
- **Local storage:** [Dexie](https://dexie.org) over IndexedDB (`superdicebowl` database)
- **Online (optional):** [Supabase](https://supabase.com) — Postgres + auth + realtime
- **Audio:** howler.js
- **Effects:** `@fireworks-js/svelte`, `culori` for OKLCH color math
- **Lint/format:** Biome + ESLint + svelte-check
- **Tests:** Vitest
- **Hooks:** Husky + lint-staged (Biome on staged files, full lint on pre-commit)

## Offline-first, online-optional

1. The app is built as a static bundle and can run with no network.
2. All user data lives in IndexedDB: accounts, sessions, games, custom teams, seasons, preferences.
3. An online account is a **separate, optional** Supabase identity that is paired with the local account. When a user signs up online, their Supabase credentials are stored on the local `UserRecord` so future local logins can silently re-sign into Supabase. Nothing online is required for solo, head-to-head, or season play.
4. Online is only consulted for friends lists, challenges, async remote games, and notifications.

## Folder map

```
src/
├── app.html, app.d.ts, styles.css     # shell, global CSS tokens
├── service-worker.ts                  # asset precache for offline
├── routes/                            # SvelteKit pages
│   ├── +page.svelte                   # home: mode + team select
│   ├── +layout.svelte                 # app chrome
│   ├── game/+page.svelte              # local single-device game
│   ├── online/                        # online friends list + async games
│   │   └── game/[id]/+page.svelte     # remote game screen
│   ├── season/                        # season mode UI
│   ├── games/                         # saved games list
│   ├── teams/                         # custom team management
│   ├── account/, login/, signup/      # local auth flows
│   └── contact/
│
└── lib/
    ├── assets/sfx/                    # MP3 sound effects
    ├── images/                        # SVGs
    ├── data/data.json                 # teamsData[] + diceData[] (single source of truth)
    ├── constants/
    │   ├── constants.ts               # GAME_ACTION, POINTS, BALL_* positions, DEFAULT_*
    │   └── auth.ts                    # password/username rules, session duration, PBKDF2 params
    ├── types.ts                       # shared TS types (Team, Play, DiceRoll, ...)
    │
    ├── state/                         # reactive singletons (Svelte 5 runes)
    │   ├── game.svelte.ts             # THE game engine (local)
    │   ├── season.svelte.ts           # season schedule + standings
    │   ├── settings.svelte.ts         # teams, mode, volume, theme, speed
    │   └── onlineState.svelte.ts      # online profile + unread count
    │
    ├── auth/                          # local account machinery
    │   ├── authState.svelte.ts        # login/register/logout singleton
    │   └── passwordUtils.ts           # PBKDF2 hashing + validators
    │
    ├── db/                            # local persistence
    │   ├── database.ts                # Dexie schema + TS record types
    │   ├── sync.ts                    # (stub) future sync adapter interface
    │   └── repositories/              # thin CRUD per table
    │       ├── userRepository.ts
    │       ├── sessionRepository.ts
    │       ├── gameRepository.ts
    │       ├── customTeamRepository.ts
    │       ├── preferencesRepository.ts
    │       └── seasonRepository.ts
    │
    ├── online/                        # Supabase integration
    │   ├── supabaseClient.ts          # client singleton
    │   ├── onlineAuth.ts              # sign up / sign in / delete account
    │   ├── friends.ts                 # profiles, friendships, notifications
    │   ├── remoteGames.ts             # challenge lifecycle CRUD
    │   └── remoteGameEngine.ts        # turn derivation + realtime subscribe
    │
    ├── utils/                         # pure helpers (mostly stateless)
    │   ├── common.ts                  # add/subtract/gt/lt, color, rng, sleep
    │   ├── game.ts                    # football math (pure — unit-test friendly)
    │   ├── instantGame.ts             # fast-forward simulation for AI games
    │   ├── schedule.ts                # round-robin season generator
    │   ├── events.ts, sound.ts, fireworks.ts, logoPreloader.ts
    │
    └── components/
        ├── Dice.svelte, Field.svelte, Scores.svelte, Endzone.svelte
        ├── TeamSelect.svelte, EventAnnouncement.svelte, Modal.svelte, CustomHelmet.svelte
        ├── auth/  LoginForm, RegisterForm, PasswordRules
        ├── modal/ CoinToss, FourthDown, PointOption, Settings, GameSummary, ConfirmExit, ModalPortal, TrapFocus, CustomTeam
        └── season/ MatchupCard, Standings
```

## Runtime layering

```
           ┌────────────────────────────┐
           │  SvelteKit routes (pages)  │
           └────────────┬───────────────┘
                        │ import
           ┌────────────▼───────────────┐
           │  Reactive state singletons │  src/lib/state/*.svelte.ts
           │   game │ season │ settings │
           └────┬────────┬────────┬─────┘
                │        │        │
     ┌──────────▼─┐  ┌───▼────┐  ┌▼──────────────┐
     │ utils/game │  │ db/... │  │ online/...    │
     │ (pure fns) │  │ Dexie  │  │ Supabase      │
     └────────────┘  └────────┘  └───────────────┘
```

**Rules of the layering:**

- Routes are thin: they wire state → components, and trigger persistence.
- `src/lib/state/*.svelte.ts` holds reactive state. Only these files use runes at module level.
- `src/lib/utils/game.ts` is **pure** — no runes, no I/O. Everything here is unit-testable.
- `src/lib/db/repositories/*` is the **only** place that imports Dexie tables. Routes and state call repositories, never the `db` object directly.
- `src/lib/online/*` is the **only** place that imports `supabaseClient`.
- `constants.ts` holds every magic value. Prefer adding a constant over inlining.

## The game engine (local)

[`src/lib/state/game.svelte.ts`](../src/lib/state/game.svelte.ts) exports a single `game` instance of `GameState`. It owns:

- All reactive fields (`$state`) describing the current play: `action`, `ballIndex`, `currentDown`, `firstDownIndex`, `possession`, `yardsToGo`, `lastPlay`, `playLog`, etc.
- A **sequence-cancellation pattern**: every async animation chain captures `seqId = ++sequenceId`; if another action fires, old chains throw `CancelledError` and unwind silently. This is what lets the user exit a game mid-animation without stale updates bleeding through.
- A **pause/resume** pair that blocks the animation chain via a deferred promise (`_resumeResolve`). Used when a blocking modal opens.
- A `setSaveGame(fn)` hook so the route can inject its persistence callback without the state file importing Dexie.
- `snapshotState()` / `loadSnapshot()` to serialize to `GameStateSnapshot` (matches `GameRecord.gameState` in the DB).
- Action handlers: `doKickoff`, `doOffensivePlay`, `doTwoPointPlay`, `kickFieldGoal`, `kickExtraPoint`, `savePunt`, `handleSoloDecision` (AI chooses for auto-play teams), etc.

Pure helpers in [`utils/game.ts`](../src/lib/utils/game.ts) drive the math — first-down detection, touchback, yards-to-endzone, fourth-down AI, etc. — so the state file stays a thin orchestrator.

## The game engine (online)

Remote games use the **same** `game` state singleton + `GameStateSnapshot`, but:

- The route in [`src/routes/online/game/[id]/+page.svelte`](../src/routes/online/game/%5Bid%5D/+page.svelte) subscribes to `remote_games` row changes via Supabase realtime.
- After each local roll/decision, the route calls `pushGameState(gameId, snapshot, currentTurn)` from [`remoteGameEngine.ts`](../src/lib/online/remoteGameEngine.ts).
- `deriveTurn(snapshot)` computes whose turn it is from `(action, possession)` — accounting for kickoffs where the *non*-possessing team rolls.
- Only the player whose turn it is can roll; the other client replays the opponent's dice via `diceEl.showOpponentRoll(d1, d2)`.
- Forfeit is **lazy**: `checkAndApplyForfeit` runs when a game is opened and marks the game completed if 7+ days have passed without a move.

## Build & run

```bash
npm install
npm run dev         # Vite dev server
npm run check       # svelte-check
npm run lint        # Biome + ESLint
npm run format      # Biome --write
npm run test:unit   # Vitest
npm run build       # static build -> build/
```

A pre-commit husky hook runs `npm run lint` and Biome autofix over staged files.
