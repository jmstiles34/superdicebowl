# Data Layer (Local IndexedDB)

All local persistence goes through **Dexie** in
[`src/lib/db/database.ts`](../src/lib/db/database.ts). The database is named
`superdicebowl` and currently at schema version **7**.

## Tables

| Table | Record type | Indices | Notes |
| --- | --- | --- | --- |
| `users` | `UserRecord` | `++id, &usernameLower` | Unique username (case-insensitive). Stores `passwordHash` + `salt` + optional Supabase credentials (`onlineEmail`, `onlinePassword`, `onlineAccountId`). |
| `sessions` | `SessionRecord` | `++id, userId, &token` | 30-day local session cookies (token only used as a local key — no cookies are set). |
| `games` | `GameRecord` | `++id, userId` | Saved / in-progress games. Stores full `GameStateSnapshot` + `GameSettingsSnapshot`. |
| `customTeams` | `CustomTeamRecord` | `++id, userId` | User-designed teams. |
| `userPreferences` | `UserPreferencesRecord` | `++id, &userId` | One row per user — volume, speed, theme, default win score. |
| `seasons` | `SeasonRecord` | `++id, userId` | The user's current season (schedule, standings, current week). |

Version history is preserved so Dexie can migrate older installs. **Never edit
an existing `this.version(N).stores(...)` block** — always add a new version.

## Repositories

The `db/repositories/` folder wraps each table. **Routes and state must use
repositories**, never `db.table` directly. This keeps persistence swap-able
and makes migration pathways centralized.

| Repository | Exports |
| --- | --- |
| `userRepository.ts` | `createUser`, `findUserByUsername`, `deleteUser`, (update) |
| `sessionRepository.ts` | `createSession`, `getValidSession`, `deleteSession` |
| `gameRepository.ts` | `createGame`, `updateGameState`, `completeGame`, list/get helpers |
| `customTeamRepository.ts` | CRUD + `migrateFromLocalStorage` (legacy) |
| `preferencesRepository.ts` | `getPreferences`, `updatePreferences`, `deletePreferences` |
| `seasonRepository.ts` | `createSeason`, `updateSeason`, `getActiveSeason`, etc. |

## Password hashing (local)

See [`lib/auth/passwordUtils.ts`](../src/lib/auth/passwordUtils.ts) and
[`constants/auth.ts`](../src/lib/constants/auth.ts):

- PBKDF2 via `crypto.subtle`, `SHA-256`, `100_000` iterations.
- Salt: 16 random bytes (`SALT_LENGTH`).
- Derived key: 32 bytes (`HASH_LENGTH`).
- Passwords stored only as hex-encoded hash + salt. The raw password never
  touches Dexie.

Session duration: `SESSION_DURATION_MS = 30 days`.

## Snapshot types

Two types are shared between state and persistence:

- `GameStateSnapshot` — the mutable game fields (in `database.ts`).
- `GameSettingsSnapshot` — teams, mode, winScore at the time the game started.

`game.snapshotState()` produces the former; `settings.snapshotSettings()` the
latter. When a game is saved, both are stored together in a single `GameRecord`.

## Sync stub (future)

[`db/sync.ts`](../src/lib/db/sync.ts) defines a `SyncAdapter` interface but is
not wired up. Online multiplayer uses a completely different channel
(Supabase `remote_games`), not Dexie Syncable — see
[features/online-multiplayer.md](features/online-multiplayer.md).
