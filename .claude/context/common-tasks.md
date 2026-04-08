# Common tasks — how to actually do them

Playbooks for the tasks that come up most often. Each one links out to the
files and docs you'll need.

## Add a new dice outcome

1. Edit [`src/lib/data/data.json`](../../src/lib/data/data.json) → `diceData` array.
2. Add an entry matching the `DiceRoll` interface in
   [`src/lib/types.ts`](../../src/lib/types.ts).
3. If the outcome requires new branching logic (e.g., a blocked kick), add
   the flag to `DiceRoll` and handle it in `doOffensivePlay` in
   [`state/game.svelte.ts`](../../src/lib/state/game.svelte.ts) **and** the
   mirrored code path in
   [`utils/instantGame.ts`](../../src/lib/utils/instantGame.ts).
4. Run `npm run check && npm run lint`.

## Add a new field to game state

1. Add the `$state(...)` line to `GameState` in `game.svelte.ts`.
2. Add the default to `DEFAULT_GAME` in `constants.ts`.
3. Add the field to `GameStateSnapshot` in `db/database.ts`.
4. Add the key to `snapshotState()`.
5. `resetGame()` and `loadSnapshot()` iterate by key so no change needed there.
6. If the field should be mirrored online, no extra work — it rides along in
   `GameStateSnapshot` pushed to `remote_games.game_state`.

## Add a new Dexie table

1. Define the record interface in `db/database.ts`.
2. Add a declaration on the `AppDatabase` class: `myTable!: Table<MyRecord, number>;`
3. **Add a new `this.version(N+1).stores({...})` block** carrying forward
   every existing table, plus the new one. **Do not edit prior versions.**
4. Create `db/repositories/myTableRepository.ts` with CRUD wrappers.
5. Import only the repository from routes/state — never the table directly.

## Add a new Supabase call

1. Add the function to the appropriate file in
   [`src/lib/online/`](../../src/lib/online/): `friends.ts`,
   `remoteGames.ts`, or `remoteGameEngine.ts`.
2. Cast untrusted response data narrowly inside a `mapXxx` helper and return
   the typed shape. Never leak `any` out of this layer.
3. Notifications go through `notifications` table inserts with the same
   shape used elsewhere.

## Add a new route

1. Create `src/routes/<name>/+page.svelte`.
2. Import singletons from `$lib/state/*.svelte` — don't instantiate new state.
3. If the route persists data, call repository functions, not `db.*`.
4. If it manipulates the game engine, use `game.setSaveGame(fn)` to inject
   its persistence callback on mount.

## Add a new team or custom team field

- Built-in teams: edit `data.json` `teamsData`. Use OKLCH color strings.
- Extend the `Team` interface in `types.ts` if you're adding a new attribute.
- The field will automatically persist for custom teams because custom team
  records store the entire `Team` object as JSON.

## Add a new setting / preference

1. Add the field to `SettingsState` in `state/settings.svelte.ts`.
2. If it's **per-user persistent**, add it to `UserPreferencesRecord` in
   `db/database.ts`, bump the Dexie version, and update
   `preferencesRepository.ts`.
3. Update `loadPreferences` to copy the new field out.
4. Surface it in `components/modal/Settings.svelte`.

## Debug a stuck animation / wrong state

- First check `game.sequenceId` — a stale chain may have been cancelled
  cleanly but the route is still waiting.
- `game.pause` / `game.resume` gates: ensure every `pause()` has a
  corresponding `resume()` path.
- `runChain` swallows `CancelledError` — other thrown errors will NOT be
  swallowed and will show up as unhandled promise rejections.

## Run verification

```bash
npm run check       # svelte-check (types)
npm run lint        # biome + eslint (full local lint)
npm run lint:ci     # biome only — matches what CI runs
npm run test:run    # vitest single-run — matches what CI runs
```

CI runs `lint:ci + check + test:run + build`. See
[../../docs/testing.md](../../docs/testing.md) for the testing guide and
ESLint backlog note.

If pre-commit fails, fix the cause. Never `--no-verify`.

## Add a test

See [../../docs/testing.md](../../docs/testing.md) for the full layered
testing guide. Short version:

1. Create `foo.test.ts` next to `foo.ts`.
2. Test pure helpers in `lib/utils/` — not `*.svelte.ts` state classes.
3. If exercising the engine, seed `Math.random` with Mulberry32 (copy from
   [`src/lib/utils/instantGame.test.ts`](../../src/lib/utils/instantGame.test.ts)).
4. Prefer `it.each` for table-driven tests.
5. Verify with `npm run test:run && npx biome check --write <file> && npx eslint <file>`.
