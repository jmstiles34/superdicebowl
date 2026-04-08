# Game Mechanics

Super Dice Bowl models a football game on a 20-cell field (`ballIndex` 0..20). The
cells represent the 20 five-yard chunks of the field, plus sentinel values for the
endzones and goal lines.

## The field (ballIndex coordinate system)

The field is indexed 0..20 with half-steps used for PAT/2pt placement:

```
 Away endzone                                      Home endzone
      │                                                  │
      ▼                                                  ▼
     -1   0    1    2  ...  9   10   11  ...  18   19   20   21
     AWAY      AWAY  5                             HOME       HOME
    TD/Goal   G/L          midfield                G/L       TD/Goal
```

- **Home** advances with `add()` (increasing index → right).
- **Away** advances with `subtract()` (decreasing index → left).
- `isTouchback(i)` = `i < 1 || i > 19`.
- `indexToYards(i)` = `i * 5` (`YARD_INTERVAL`).
- `yardsToEndzone(pos, i)`: `100 - i*5` for Home, `i*5` for Away.

Named placements in [`constants.ts`](../src/lib/constants/constants.ts):

| Constant | Home | Away | Meaning |
| --- | --- | --- | --- |
| `BALL_ENDZONE` | 21 | -1 | Post-TD cosmetic position |
| `BALL_EXTRA_POINT` | 17 | 3 | PAT spot |
| `BALL_TWO_POINT` | 19.5 | 0.5 | 2pt conversion spot |
| `BALL_FIELD_GOAL` | 11 | 9 | Midfield FG-range boundary |
| `BALL_KICK_GOOD` | 22 | -2 | Made kick cosmetic |
| `BALL_KICKOFF` | 13 | 7 | Kickoff spot |
| `BALL_ONSIDE_KICK` | 11 | 9 | Ball recovered on onside |
| `BALL_PUNT` | 4 | 16 | Touchback after punt/int |
| `BALL_SAFETY` | -1 | 21 | Safety kickoff spot |
| `BALL_TOUCHBACK` | 5 | 15 | Kickoff touchback spot |

## Dice

Two six-sided dice are rolled; their combined result is encoded as a two-digit
number (`diceId`) in `data.json` (`diceData`). There are 21 distinct combinations
(11, 12, ..., 16, 22, 23, ..., 66). Every entry in `diceData` has:

```ts
interface DiceRoll {
  id: number;                // 11..66
  description: string[];     // flavor text (randomly picked)
  yards: number | number[];  // -10..+100, or an array to randomly pick
  autoFirstDown?: boolean;   // auto-first-down regardless of marker
  isPenalty?: boolean;       // treated as a penalty (doesn't advance down)
  isTurnover?: boolean;      // treated as fumble/INT
}
```

Special rolls:

- `yards === 100` → touchdown (e.g. 11 on offense is a 100-yd TD).
- `isTurnover && id ∈ INTERCEPTION_ROLLS` ([12, 45]) → labelled as Int (otherwise Fumble).
- `isPenalty` → clamped to 1..19 so penalties never cross goal lines, and does not increment the down.
- `yards` as an array → one value is `pickRandom`ed on each roll.

## Offensive play resolution

Implemented in `GameState.doOffensivePlay()` ([game.svelte.ts](../src/lib/state/game.svelte.ts)):

1. Look up `diceRoll` by id.
2. Compute `playYards` (resolving array values).
3. Compute `playIndex = ballPosition(ballIndex, possession, playYards, isPenalty)`.
4. Determine:
   - `isTD` via `isTouchdown(...)` or `yards === 100`.
   - `isFirstDown` via `madeFirstDown(...)` (or `autoFirstDown`).
   - `isTurnoverOnDowns` = 4th down, not converted, not a penalty.
5. Branch:
   - **Turnover:** flip possession, reset down, place ball at `playIndex` (or `BALL_PUNT` on endzone touchback).
   - **Touchdown:** set `action = TOUCHDOWN`, move ball to `BALL_ENDZONE[possession]`, queue `POINT_OPTION`.
   - **Safety:** if the post-play index is on/behind the offense's own goal line, award 2 to opponent, kick from `BALL_SAFETY`.
   - **Normal gain/loss:** advance ball, update `currentDown`, update `yardsToGo`; on a first down, reset down to 1 and move the first-down marker.
6. If the resulting down is 4, transition to `FOURTH_DOWN_OPTIONS`.
7. Append a `Play` entry to `playLog`.

## Kicks

### Kickoff (`doKickoff` → `saveKickoff`)

- `diceId` determines the outcome via `KICKOFF_RETURN_ACTION`:
  - `11` → **Onside kick recovered** by kicker (`KICKOFF_ONSIDE`).
  - `66` → **Kickoff return TD** (`KICKOFF_TOUCHDOWN`).
  - Any **double** (22/33/44/55) → big return via `KICKOFF_RETURN_YARDS` (1–19 index, pickRandom).
  - Everything else → **touchback** to `BALL_TOUCHBACK`.
- `playSound(whizSfx)` for onside, `kickSfx` otherwise.

### Punt (`savePunt`)

- Distance index = `sumDigits(diceId)` (2..12), yards = index × 5.
- If the punt lands outside 1..19, it's a touchback to `BALL_PUNT`.

### Field goal (`kickFieldGoal`)

- `fieldGoalYardsFns[possession](ballIndex)` returns the distance in yards remaining before the endzone.
- `FIELD_GOAL_ROLL[distance]` is the minimum `sumDigits(diceId)` required to make it:

| Distance bucket | Required sum | Approx probability |
| ---: | ---: | ---: |
| 5/10/15 (22/27/32 yd) | 4+ | 90–96% |
| 20 (37 yd) | 5+ | 84% |
| 25 (42 yd) | 6+ | 75% |
| 30 (47 yd) | 7+ | 63% |
| 35 (52 yd) | 8+ | 50% |
| 40 (57 yd) | 8+ | 36% |
| 45 (62 yd) | 9+ | 25% |

- `FIELD_GOAL_YARDS = 17` is added to the distance for display (holder + endzone depth).

### Extra point / two-point (`kickExtraPoint`, `doTwoPointPlay`)

- PAT: `sumDigits(diceId) >= EXTRA_POINT_SUCCESS (4)` → 1 point.
- 2pt: `sumDigits(diceId) >= 8` → 2 points.

## Scoring

| Score | Points (`POINTS.*`) |
| --- | ---: |
| Touchdown | 6 |
| Extra point | 1 |
| Two-point conversion | 2 |
| Field goal | 3 |
| Safety | 2 (credited to opponent) |

`getScoreByTeam(team, playLog)` sums points from a team's own plays **plus** any
Safety credited against the opposing team.

The game ends when either side reaches `settings.winScore` (default 30).
Overtime is not modelled — the first team to hit the threshold wins.

## Downs and first-down marker

- 4 downs, `DOWN[1..4] = 1st..4th`.
- `firstDownIndex` is the ballIndex the offense must reach to earn a first down;
  `-1` means "goal to go" and `yardsToGo` becomes the string `'Goal'`.
- `setFirstDownMarker(ballIndex, pos)` returns the new marker 10 yards downfield
  (or `-1` if inside the opponent 10).
- `madeFirstDown` compares the post-play index to the marker using
  `compareFns[pos]` (`gte` for Home, `lte` for Away).

## Modals / decision points

Two states pause the engine until a decision is made:

- `FOURTH_DOWN_OPTIONS` — Punt / Field Goal / Go for it.
- `POINT_OPTION` — PAT / Two-point attempt.

If the current possession is controlled by the AI (Simulation mode, or Solo mode
where `possession !== settings.userTeam`), `handleSoloDecision()` runs after a
short delay and calls `makeFourthDownChoice` or `makePointChoice` to act
automatically. Otherwise the user sees a modal.

## Game modes (`GAME_MODE`)

- **Solo** — user picks a side; the AI plays the other. `isAutoPlay` is true
  when `possession !== settings.userTeam`.
- **Head-to-Head** — two humans sharing one device. No auto-play.
- **Simulation** — both sides auto-play for a spectator-mode demo.
- **Online** — head-to-head over Supabase, with asynchronous turns. (Not a
  `GAME_MODE` value — driven by route.)

## Instant simulation (`utils/instantGame.ts`)

For non-user season matchups, we skip rendering entirely. `instantGame.ts` is a
pure, synchronous reimplementation of the same engine that loops until a winner
is decided (capped by `MAX_ITERATIONS = 5000` for safety) and returns the final
`Play[]`. It shares the same constants and pure helpers as the reactive engine
so outcomes stay consistent.
