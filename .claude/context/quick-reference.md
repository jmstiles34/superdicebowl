# Quick reference (for AI agents)

A cheat-sheet of file locations, symbols, and patterns that come up repeatedly.
For prose explanations, see [../../docs/](../../docs/).

## "Where is X?"

| You want | File |
| --- | --- |
| The game engine (local) | [src/lib/state/game.svelte.ts](../../src/lib/state/game.svelte.ts) |
| Pure football math | [src/lib/utils/game.ts](../../src/lib/utils/game.ts) |
| Fast-forward sim for non-user games | [src/lib/utils/instantGame.ts](../../src/lib/utils/instantGame.ts) |
| Dice outcomes (source of truth) | [src/lib/data/data.json](../../src/lib/data/data.json) → `diceData[]` |
| Team data (32 built-ins) | [src/lib/data/data.json](../../src/lib/data/data.json) → `teamsData[]` |
| All game constants & enums | [src/lib/constants/constants.ts](../../src/lib/constants/constants.ts) |
| Auth constants (PBKDF2, rules, session) | [src/lib/constants/auth.ts](../../src/lib/constants/auth.ts) |
| Dexie schema | [src/lib/db/database.ts](../../src/lib/db/database.ts) |
| Repositories | [src/lib/db/repositories/](../../src/lib/db/repositories/) |
| Supabase client | [src/lib/online/supabaseClient.ts](../../src/lib/online/supabaseClient.ts) |
| Turn derivation for online | [src/lib/online/remoteGameEngine.ts](../../src/lib/online/remoteGameEngine.ts) |
| Challenge CRUD + lazy forfeit | [src/lib/online/remoteGames.ts](../../src/lib/online/remoteGames.ts) |
| Round-robin schedule generator | [src/lib/utils/schedule.ts](../../src/lib/utils/schedule.ts) |
| Local game route | [src/routes/game/+page.svelte](../../src/routes/game/+page.svelte) |
| Online game route | [src/routes/online/game/[id]/+page.svelte](../../src/routes/online/game/%5Bid%5D/+page.svelte) |
| Home / mode select | [src/routes/+page.svelte](../../src/routes/+page.svelte) |

## Singletons

```ts
import { game }        from '$lib/state/game.svelte';
import { settings }    from '$lib/state/settings.svelte';
import { season }      from '$lib/state/season.svelte';
import { onlineState } from '$lib/state/onlineState.svelte';
import { auth }        from '$lib/auth/authState.svelte';
```

All are classes instantiated at module load. Each method is an arrow function
so it can be passed as a callback.

## Persistence pattern

```ts
// In a route:
onMount(() => {
  game.setSaveGame(async () => {
    if (!auth.currentUser?.id) return;
    if (game.activeGameId) {
      await updateGameState(game.activeGameId, game.snapshotState());
    } else {
      const record = await createGame(
        auth.currentUser.id,
        game.snapshotState(),
        settings.snapshotSettings()
      );
      game.activeGameId = record.id!;
    }
  });
});
```

The state file never imports `db/*`. The route injects the callback.

## Sequence cancellation

```ts
this.sequenceId++;                // invalidate in-flight chains
const seqId = this.sequenceId;
this.runChain(async () => {
  await this.delay(1500, seqId);  // throws CancelledError if seqId stale
  this.action = GAME_ACTION.PLACE_KICKOFF;
});
```

Always capture `seqId` locally before awaiting.

## Game actions you'll see

From `GAME_ACTION` in `constants.ts`:

`COIN_TOSS, KICKOFF, KICKOFF_KICK, KICKOFF_RETURN, KICKOFF_ONSIDE, KICKOFF_TOUCHDOWN, PLACE_KICKOFF, OFFENSE, FOURTH_DOWN, FOURTH_DOWN_OPTIONS, PUNT, FIELD_GOAL, FIELD_GOAL_MADE, FIELD_GOAL_MISS, TOUCHDOWN, POINT_OPTION, EXTRA_POINT, EXTRA_POINT_MADE, EXTRA_POINT_MISS, TWO_POINT, TWO_POINT_MADE, TWO_POINT_MISS, SAFETY, TURNOVER, GAME_OVER, EXIT, QUIT`

Roll-requiring actions (`remoteGameEngine.ROLL_ACTIONS`):
`OFFENSE, KICKOFF, PUNT, FIELD_GOAL, EXTRA_POINT, TWO_POINT`.

Modal-decision actions (`remoteGameEngine.MODAL_ACTIONS`):
`FOURTH_DOWN_OPTIONS, POINT_OPTION`.

## Coordinate reminders

- `ballIndex` 0..20, half-steps for PAT/2pt.
- Home = `add`, advances toward 20. Away = `subtract`, advances toward 0.
- `isTouchback(i) = i < 1 || i > 19`.
- `BALL_ENDZONE` = 21 (Home) / -1 (Away).
- 1 index unit = `YARD_INTERVAL` = 5 yards.

## Common verification commands

```bash
npm run check        # svelte-check (types + svelte)
npm run lint         # biome + eslint
npm run test:unit    # vitest
npm run build        # static production build
```
