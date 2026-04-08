# CLAUDE.md — Project primer for AI agents

> Auto-loaded by Claude Code. Keep this short and load-bearing. For depth, see
> [docs/README.md](docs/README.md).

## What this is

**Super Dice Bowl** — a SvelteKit (Svelte 5 runes) static site that simulates a
dice-based football game. Offline-first via Dexie/IndexedDB. Optional Supabase
layer for async head-to-head multiplayer.

## Before you change code, read the right doc

| If you're touching... | Read first |
| --- | --- |
| Gameplay / scoring / dice | [docs/game-mechanics.md](docs/game-mechanics.md) |
| `*.svelte.ts` state files | [docs/state-management.md](docs/state-management.md) |
| Dexie schema or a repository | [docs/data-layer.md](docs/data-layer.md) |
| Anything under `lib/online/` or `routes/online/` | [docs/features/online-multiplayer.md](docs/features/online-multiplayer.md) |
| Auth, login, sessions | [docs/features/auth.md](docs/features/auth.md) |
| Season schedule / standings | [docs/features/season-mode.md](docs/features/season-mode.md) |
| Big picture | [docs/architecture.md](docs/architecture.md) |
| Conventions / style | [docs/coding-practices.md](docs/coding-practices.md) |

## Non-negotiables

1. **Svelte 5 runes only.** Never introduce `svelte/store`.
2. **State singletons own reactive state; utils are pure; repositories own Dexie; online/ owns Supabase.** See the layering table in [docs/coding-practices.md](docs/coding-practices.md). Never import `lib/db/*` or `lib/online/*` from `lib/state/*` at runtime. State gets persistence injected via `game.setSaveGame(fn)`.
3. **Dexie schema is additive.** Add a new `version(N).stores({...})` — never edit an existing one.
4. **Add constants to [src/lib/constants/constants.ts](src/lib/constants/constants.ts) rather than inlining magic values.**
5. **[src/lib/utils/game.ts](src/lib/utils/game.ts) must stay pure.** No runes, no I/O. It is reused by `instantGame.ts`.
6. **Array state must be reassigned, not mutated in place.** `this.playLog = [...this.playLog, play]`.
7. **Don't touch `*.svelte.ts` fields without also updating [`DEFAULT_GAME`](src/lib/constants/constants.ts) and the snapshot type** in [database.ts](src/lib/db/database.ts). Reset + persistence both iterate these keys.
8. **Don't bypass lint hooks with `--no-verify`.** If precommit fails, fix the cause.

## The game engine in one paragraph

[src/lib/state/game.svelte.ts](src/lib/state/game.svelte.ts) owns all reactive
game fields and runs animation chains guarded by a `sequenceId` cancellation
token (`delay(ms, seqId)` throws `CancelledError` when the id moves on). The
engine is the *same* for local and online play; routes wire it up differently
— local injects a Dexie save callback, online injects a Supabase push callback.
`loadSnapshot` / `snapshotState` move the state across the boundary. Pure math
lives in [src/lib/utils/game.ts](src/lib/utils/game.ts). Dice outcomes live in
[src/lib/data/data.json](src/lib/data/data.json) (`diceData`).

## Build / verify

```bash
npm run check       # svelte-check
npm run lint        # biome + eslint
npm run test:unit   # vitest
npm run build       # static build
```

Always run `npm run check` and `npm run lint` after non-trivial changes.

## Gotchas

- **Kickoffs invert whose turn it is online.** `deriveTurn(snapshot)` in
  [remoteGameEngine.ts](src/lib/online/remoteGameEngine.ts) handles this —
  don't duplicate the logic.
- **Forfeit is lazy**, triggered on game load after 7 idle days.
- **Custom teams migrated from `localStorage` once.** `migrateFromLocalStorage`
  is intentionally still called on login for stragglers.
- **Colors are OKLCH strings**, not hex. Use helpers in `utils/common.ts` when
  converting.
- **The `service-worker.ts` precaches assets**; if you see stale asset bugs in
  dev, that's the suspect.
