# State Management

Super Dice Bowl uses **Svelte 5 runes** exclusively. There are no `svelte/store`
writables. Global reactive state is expressed as class instances exported as
singletons from `*.svelte.ts` files.

## The four singletons

| File | Export | Purpose |
| --- | --- | --- |
| [`state/game.svelte.ts`](../src/lib/state/game.svelte.ts) | `game: GameState` | The single active game — play-by-play engine |
| [`state/settings.svelte.ts`](../src/lib/state/settings.svelte.ts) | `settings: SettingsState` | Selected teams, mode, volume, theme, speed, win score |
| [`state/season.svelte.ts`](../src/lib/state/season.svelte.ts) | `season: SeasonState` | Active season schedule, standings, current week |
| [`state/onlineState.svelte.ts`](../src/lib/state/onlineState.svelte.ts) | `onlineState` | Online profile + unread notification count |
| [`auth/authState.svelte.ts`](../src/lib/auth/authState.svelte.ts) | `auth: AuthState` | Current local user + session token |

All are `new`'d at module load. Because ES module singletons are cached, every
import gets the same instance.

## Conventions

1. **`$state` per field, not a single `$state` object.** This preserves
   fine-grained reactivity and lets Svelte track exactly which field changed.

   ```ts
   class GameState {
     action = $state(DEFAULT_GAME.action);
     ballIndex = $state(DEFAULT_GAME.ballIndex);
     // ...
   }
   ```

2. **Arrow functions for methods**, so `this` captures the instance when the
   method is passed as a callback:

   ```ts
   resetGame = () => { /* ... */ };
   ```

3. **`$state.snapshot` to serialize.** `snapshotState()` returns a plain object
   that can be written to Dexie or Supabase. `loadSnapshot(obj)` rehydrates by
   assigning each key back onto the instance.

4. **Defaults live in constants.** `DEFAULT_GAME`, `DEFAULT_PLAY`, `DEFAULT_SETTINGS`,
   `DEFAULT_TEAM` in `constants.ts`. `resetGame()` loops over `DEFAULT_GAME`
   entries and reassigns — so adding a new field only requires updating the
   default + the class field definition.

5. **Dependency injection for I/O.** `GameState` never imports `db/*`. The game
   route injects its save function via `game.setSaveGame(saveGame)` at mount.
   This keeps the state layer portable and unit-testable.

6. **`$derived` at route level** — not on the state classes. Scores, `gameOver`,
   etc., are computed from `game.playLog` inside the routes:

   ```ts
   let awayScore = $derived(getScoreByTeam(TEAM.AWAY, game.playLog));
   let homeScore = $derived(getScoreByTeam(TEAM.HOME, game.playLog));
   let gameOver  = $derived(isGameComplete(awayScore, homeScore, settings.winScore));
   ```

7. **`$effect` for side effects driven by state** — e.g. triggering the
   `EventAnnouncement` overlay on touchdowns or turnovers.

## The sequence-cancellation pattern (`GameState`)

Animations and delays are orchestrated as async chains. Because the user can
exit a game or accept a modal mid-chain, every chain must be cancellable:

```ts
private sequenceId = 0;

continueAfterAction = () => {
  this.sequenceId++;
  const seqId = this.sequenceId;
  this.runChain(async () => {
    await this.delay(1500, seqId);   // throws CancelledError if sequenceId changed
    this.action = GAME_ACTION.PLACE_KICKOFF;
  });
};
```

- `delay(ms, seqId)` calls `sleep` scaled by `settings.speed`, then compares
  `this.sequenceId !== seqId` and throws `CancelledError`.
- `runChain(fn)` swallows `CancelledError` so cancelled chains unwind silently.
- Anything that starts a new decision chain must `++this.sequenceId` first.

## Pause/resume

The state exposes `pause()` / `resume()` for blocking modals. `delay()` awaits
`waitForResume()` before and after sleeping, so chains freeze while a modal is
up and pick up exactly where they left off when dismissed.

## Online state flow

- The local game route owns `saveGame()` and calls `game.setSaveGame(saveGame)`
  on mount.
- The online game route owns `pushLocalState()` and calls
  `game.setSaveGame(pushLocalState)` so the same engine method (`handleDiceRoll`
  etc.) triggers a Supabase push instead of an IndexedDB write.
- Supabase realtime subscription calls back into `game.loadSnapshot(snapshot)`
  when the opponent pushes — no route-level state duplication.

## Do / don't

✅ **Do** use `$state` singletons for truly global state (current game, current user).
✅ **Do** keep pure helpers in `utils/` and import them from state files.
✅ **Do** use `$state.snapshot` when passing state to non-reactive code (persistence, JSON.stringify).
✅ **Do** put derived values (`$derived`) in the component that consumes them.

❌ **Don't** use `svelte/store`. We are all-in on runes.
❌ **Don't** import from `db/*` or `online/*` inside state files. Inject via setters.
❌ **Don't** mutate `playLog` in place — reassign: `this.playLog = [...this.playLog, play]`.
❌ **Don't** add fields to the state class without also adding a default to `DEFAULT_GAME` / snapshot type.
