# Season Mode

Source:
[`state/season.svelte.ts`](../../src/lib/state/season.svelte.ts),
[`utils/schedule.ts`](../../src/lib/utils/schedule.ts),
[`db/repositories/seasonRepository.ts`](../../src/lib/db/repositories/seasonRepository.ts),
[`routes/season/`](../../src/routes/season/).

Season mode puts the user's chosen team into a round-robin schedule against a
pool of opponents, tracks standings, and auto-simulates every non-user matchup.

## Data model

`SeasonRecord` (Dexie):

```ts
{
  id, userId,
  status: 'in_progress' | 'completed',
  userTeamId: string,
  teams: Team[],                  // the full league for this season
  schedule: SeasonWeek[],         // generated at season creation
  standings: StandingsEntry[],    // recomputed after every game
  currentWeek, totalWeeks, winScore,
  createdAt, updatedAt
}
```

```ts
SeasonWeek   = { weekNumber, matchups: SeasonMatchup[] }
SeasonMatchup = {
  homeTeamId, awayTeamId,
  status: 'pending' | 'in_progress' | 'completed',
  homeScore, awayScore,
  isUserGame: boolean,
  gameRecordId?: number    // link to `games` table if user game
}
```

## Schedule generation (circle method)

[`generateSchedule(teams, totalWeeks, userTeamId)`](../../src/lib/utils/schedule.ts)
implements the classic round-robin circle method:

1. Fix team 0 in place, rotate `teams[1..n-1]` each round.
2. One full cycle produces `n - 1` rounds of `n / 2` pairings.
3. If `totalWeeks > n - 1`, cycles are repeated; on odd cycle indices the home
   and away teams are swapped for balance.
4. A post-pass ensures the user's team alternates home/away week-to-week so
   the user never gets back-to-back home games.

## State

`SeasonState` exposes:

- **Derived getters:** `currentWeekData`, `sortedStandings` (sorted by wins,
  then point differential, with `gamesBack` computed), `isWeekComplete`,
  `isSeasonComplete`.
- **Mutators:** `markMatchupInProgress`, `setMatchupGameRecordId`,
  `recordGameResult(weekNumber, matchupIndex, homeScore, awayScore)`,
  `recalcStandings`, `advanceWeek`.
- **Persistence helpers:** `loadSeason(record)`, `snapshotSeason()`, `resetSeason()`.

`recalcStandings` rebuilds from scratch over the full schedule on every call —
cheap and safer than incremental updates.

## User vs non-user games

- **User game:** the user navigates into the matchup and plays the full game
  via the normal `/game` route. The route links the `GameRecord.id` back to
  the matchup via `season.setMatchupGameRecordId`.
- **Non-user game:** the week simulation runs the pure
  [`instantGame.ts`](../../src/lib/utils/instantGame.ts) engine synchronously
  for every other matchup and calls `season.recordGameResult` with the final
  scores. No rendering, no I/O.

## Week advance flow

1. User finishes their matchup → `recordGameResult` + `updateSeason` persist.
2. If `isWeekComplete` and user has played, the remaining matchups are
   simulated, each recorded via `recordGameResult`.
3. `advanceWeek()` increments `currentWeek`, or sets `status = 'completed'`
   when the final week is done.
4. `updateSeason(snapshotSeason())` writes the merged partial back to Dexie.
