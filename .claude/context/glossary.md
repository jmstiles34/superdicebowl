# Glossary

Terms that mean something specific inside this codebase.

| Term | Meaning |
| --- | --- |
| **ballIndex** | The position of the ball on a 0..20 integer grid (plus half-steps and sentinels). `indexToYards(i) = i * 5`. See [docs/game-mechanics.md](../../docs/game-mechanics.md). |
| **firstDownIndex** | The `ballIndex` the offense must reach/cross for a first down. `-1` means "goal to go". |
| **possession** | `'Home'` or `'Away'` — the string literals `TEAM.HOME` / `TEAM.AWAY`. |
| **action** | The current `GAME_ACTION` string. Drives what the dice does and what modals appear. |
| **diceId** | Two-digit integer encoding a dice pair (e.g. `35`, `66`). Keys into `diceData[]`. |
| **sumDigits(n)** | Utility that sums the two digits of a `diceId` to get a plain dice total (2..12). Used for kicks and conversions. |
| **playLog** | `Play[]` — the authoritative record of what happened this game. Scores are computed from this, not stored separately. |
| **Play** | A single play entry (`{ team, diceRoll, action, description, points, yards, penaltyYards, isFirstdown }`). |
| **GameStateSnapshot** | Plain-object serialization of the active game — the "over the wire" shape. |
| **activeGameId** | The Dexie `GameRecord.id` currently linked to the live game, if any. `null` means unsaved. |
| **sequenceId** | Monotonic counter used to cancel stale animation chains. See `runChain` / `delay` in `game.svelte.ts`. |
| **CancelledError** | Internal marker thrown inside `delay()` when `sequenceId` is stale. `runChain` swallows it. |
| **isAutoPlay** | True when the current possession should be played by the AI — always in Simulation, or in Solo when the AI side has the ball. |
| **instant game** | A fast-forward simulation of an entire game with no UI, implemented purely in `utils/instantGame.ts`. Used for every non-user matchup in a season week. |
| **pending_team_select** | `remote_games.status` while the challenger waits for the opponent to pick their team. Becomes `in_progress` on accept. |
| **current_turn** | `'home' \| 'away'` on `remote_games`; whose turn it is to roll/decide. Derived from the snapshot via `deriveTurn`. |
| **lazy forfeit** | Forfeit check that runs on game load when 7+ days have elapsed without a turn. There is no server cron. |
| **online account** | Optional Supabase identity paired with the local account. Creds are stored on the local `UserRecord` for silent re-login. |
| **isSeasonGame** | Flag on `season` state indicating the current `/game` instance is part of a season so it should update standings on completion. |
| **preferences vs settings** | Preferences are per-user persistent (`volume`, `speed`, `theme`, default win score). Settings are per-game (teams, mode, current win score). Both live on `SettingsState`. |
