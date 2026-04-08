# Authentication

There are **two** separate account systems that work together:

1. **Local account** — required for any persistence (saved games, custom teams,
   seasons, preferences). Stored in Dexie.
2. **Online account** — optional Supabase identity, only needed for friends
   and online multiplayer.

## Local accounts

Source: [`lib/auth/authState.svelte.ts`](../../src/lib/auth/authState.svelte.ts),
[`lib/auth/passwordUtils.ts`](../../src/lib/auth/passwordUtils.ts).

### Rules

From [`constants/auth.ts`](../../src/lib/constants/auth.ts):

- **Username:** 3–24 chars, `/^[a-zA-Z0-9_-]+$/`, unique case-insensitively.
- **Password:** 8–128 chars; must include uppercase, lowercase, number.
  (Rules are enumerated in `PASSWORD_RULES` so the `PasswordRules.svelte`
  component can render live feedback.)
- **Session:** 30 days (`SESSION_DURATION_MS`).
- **Hash:** PBKDF2/SHA-256, 100k iterations, 16-byte salt, 32-byte key.

### Lifecycle

| Method | Effect |
| --- | --- |
| `auth.initialize()` | Called on app boot. Restores session from Dexie, loads preferences, migrates legacy `localStorage` custom teams, and attempts silent Supabase sign-in if online creds are stored. |
| `auth.login(username, password)` | Verifies password, creates session, loads prefs, silent online sign-in. |
| `auth.register(username, password)` | Validates, creates user, creates session, loads prefs. |
| `auth.logout()` | Deletes session, signs out of Supabase, clears `currentUser`. |
| `auth.deleteAccount()` | Deletes the online account first (forfeits all in-progress remote games, deletes profile, auth user), then preferences and the local user row. |

### Derived state

```ts
isLoggedIn = $derived(this.currentUser !== null);
```

## Online accounts (optional)

Source: [`lib/online/onlineAuth.ts`](../../src/lib/online/onlineAuth.ts),
[`lib/online/supabaseClient.ts`](../../src/lib/online/supabaseClient.ts).

### Tables (Supabase/Postgres — schema lives in the Supabase project, not this repo)

- `profiles(id uuid PK = auth.users.id, username unique)`
- `friendships(id, requester_id, addressee_id, status)`
- `remote_games(...)` — see [online-multiplayer.md](online-multiplayer.md)
- `notifications(id, user_id, from_user_id, type, game_id, read, data, created_at)`

### Flow

1. The user registers an online account from the signup page. A row is
   inserted in `auth.users` via Supabase Auth and a matching row in `profiles`.
2. Username uniqueness is enforced by the `profiles` table (`.eq('username',
   ...).maybeSingle()` pre-check + DB constraint).
3. The supplied email/password are **also stored on the local `UserRecord`**
   (`onlineEmail`, `onlinePassword`, `onlineAccountId`). This is a deliberate
   convenience: on local login we re-sign-in to Supabase silently with
   `autoSignIn`.
4. `onlineState` holds the current Supabase profile + unread notification count.
5. `deleteOnlineAccount(userId)`:
   - Finds every `remote_games` row where the user is home or away and still
     `in_progress`, calls `forfeit_game(game_id)` RPC, and notifies the
     opponent.
   - Deletes the profile row (cascades to friendships + notifications).
   - Calls the `delete_user` RPC to remove the Supabase auth user.
   - Signs out.

### Trust model

- The local password hash and the Supabase password are independent; changing
  one does not change the other.
- Storing the online password in Dexie in plaintext is an intentional trade-off
  for UX (single sign-in). It is only accessible to a logged-in local user on
  the same device and never leaves the browser.
