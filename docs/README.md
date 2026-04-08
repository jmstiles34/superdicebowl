# Super Dice Bowl — Documentation

Super Dice Bowl is a SvelteKit (Svelte 5 runes) single-page app that simulates a
dice-based American football game. It runs entirely in the browser as a static
build, stores everything locally in IndexedDB (via Dexie), and optionally layers
Supabase on top for asynchronous head-to-head multiplayer with friends.

## Contents

- [architecture.md](architecture.md) — high-level system layout, tech stack, folder map
- [game-mechanics.md](game-mechanics.md) — dice rolls, scoring, downs, kicks, AI
- [state-management.md](state-management.md) — Svelte 5 runes pattern, state singletons
- [data-layer.md](data-layer.md) — IndexedDB schema, repositories, migrations
- [features/auth.md](features/auth.md) — local PBKDF2 accounts + optional Supabase sign-in
- [features/season-mode.md](features/season-mode.md) — round-robin schedule, standings
- [features/online-multiplayer.md](features/online-multiplayer.md) — challenges, turns, forfeits
- [features/teams.md](features/teams.md) — team data, custom teams, logos, colors
- [features/settings-and-preferences.md](features/settings-and-preferences.md) — per-user prefs, theme, volume, speed
- [coding-practices.md](coding-practices.md) — conventions, linting, testing, commit hygiene

## Quick entry points for developers

| Task | Start here |
| --- | --- |
| Understand the play-by-play game loop | [src/lib/state/game.svelte.ts](../src/lib/state/game.svelte.ts) |
| Understand pure football math | [src/lib/utils/game.ts](../src/lib/utils/game.ts) |
| Add/modify a dice outcome | [src/lib/data/data.json](../src/lib/data/data.json) (`diceData` array) |
| Add a new persisted table | [src/lib/db/database.ts](../src/lib/db/database.ts) + new repository |
| Modify the local game screen | [src/routes/game/+page.svelte](../src/routes/game/+page.svelte) |
| Modify the online game screen | [src/routes/online/game/[id]/+page.svelte](../src/routes/online/game/%5Bid%5D/+page.svelte) |
| Add a constant/magic value | [src/lib/constants/constants.ts](../src/lib/constants/constants.ts) |
