# Online Multiplayer

Asynchronous head-to-head games between friends over Supabase.

Source:
[`online/supabaseClient.ts`](../../src/lib/online/supabaseClient.ts),
[`online/onlineAuth.ts`](../../src/lib/online/onlineAuth.ts),
[`online/friends.ts`](../../src/lib/online/friends.ts),
[`online/remoteGames.ts`](../../src/lib/online/remoteGames.ts),
[`online/remoteGameEngine.ts`](../../src/lib/online/remoteGameEngine.ts),
[`routes/online/`](../../src/routes/online/).

## Design philosophy

- **Asynchronous, not realtime.** A game can span hours or days. When it's
  your turn you get a `your_turn` notification; when it isn't, you see the
  opponent's latest move reflected on the field.
- **Single source of truth = the Supabase row.** Every valid move writes the
  full `GameStateSnapshot` back to `remote_games.game_state`. There is no
  delta protocol. The client uses Supabase realtime to listen for updates.
- **Same engine as local play.** The route constructs the exact same `game`
  singleton used for local games, loads the remote snapshot into it with
  `game.loadSnapshot(snapshot)`, and hooks `game.setSaveGame(pushLocalState)`
  so all normal engine actions trigger a push instead of a Dexie write.

## Supabase tables

- `profiles(id, username)` — public username for each user.
- `friendships(id, requester_id, addressee_id, status)`
- `remote_games` columns used here: `id, home_user_id, away_user_id, home_team,
  away_team, status, current_turn, game_state, win_score, created_at, updated_at`.
- `notifications(id, user_id, from_user_id, type, game_id, read, data, created_at)`.
- RPCs referenced from the client: `forfeit_game(game_id)`, `delete_user()`.

Schema / RLS policies / triggers live in the Supabase project, not this repo.

## Game lifecycle

```
 Challenger                                   Opponent
 ──────────                                   ────────
 createChallenge()
   → INSERT remote_games              status='pending_team_select'
   → INSERT notification(game_invite) ─────────►
                                               acceptChallenge()
                                                 → UPDATE away_team, game_state,
                                                   status='in_progress',
                                                   current_turn
                                                 → INSERT notification(your_turn) ◄─────
 ...roll...  pushGameState()  ────► UPDATE game_state, current_turn
                                    (both clients receive via realtime)
 ...
 finalRoll → markRemoteGameComplete()  sets status='completed'
           → notifyGameOver(both users)
```

### Lazy forfeit

`checkAndApplyForfeit(game)` runs on `getRemoteGame`. If
`status === 'in_progress'` and 7+ days have elapsed since `updatedAt`, the
player whose turn it is forfeits. Two `game_over` notifications are inserted
(winner + loser) with a `result` field set to `'forfeit_win'` / `'forfeit_loss'`.

### Account deletion

`deleteOnlineAccount(userId)` forfeits every in-progress game first (via the
`forfeit_game` RPC) to ensure the opponent is notified, then deletes the
profile (cascades to friendships + notifications), then the auth user.

## `remoteGameEngine.ts`

Keeps the per-move helpers the remote game route needs:

- **`isActionableState(action)`** — true only when the game is waiting on a
  roll (`ROLL_ACTIONS`) or modal decision (`MODAL_ACTIONS`). Intermediate
  animation states (`KICKOFF_KICK`, `TOUCHDOWN`, etc.) are **not** actionable
  and no push should happen in those.
- **`deriveTurn(snapshot)`** — whose turn it is:
  - For `KICKOFF`, possession is the *receiving* team, so the *other* team
    rolls. Inverts.
  - Every other action: the possessing team rolls/decides.
- **`pushGameState(gameId, snapshot, currentTurn)`** — single UPDATE writing
  both `game_state` and `current_turn`.
- **`markRemoteGameComplete(gameId, snapshot)`** — UPDATE with a filter on
  `status = 'in_progress'` and `.select()` so that only one client wins the
  race. Returns `true` on the device that actually flipped it, which is used
  to avoid duplicate `game_over` notifications.
- **`subscribeToGame(gameId, onUpdate)`** — wraps the Supabase realtime channel
  for the game row.
- **`notifyYourTurn` / `notifyGameOver`** — thin wrappers around the
  `notifications` insert.

## Dice replay on the opponent's screen

When an opponent's push arrives, the receiving client calls
`diceEl.showOpponentRoll(d1, d2)` on the `Dice` component to animate the same
roll locally before applying the new snapshot. This keeps the experience
visually consistent on both sides even though only one player is "rolling".

## Notifications

Types (`OnlineNotification.type`):

- `friend_request`, `friend_accepted`
- `game_invite`
- `your_turn`
- `game_over` — `data.result` is `'forfeit_win' | 'forfeit_loss'` for forfeits,
  otherwise unset.

`onlineState` tracks the unread count; `friends.ts` provides read/delete helpers.
