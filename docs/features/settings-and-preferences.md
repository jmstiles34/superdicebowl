# Settings & Preferences

Two related but distinct concepts:

- **`settings`** — the *per-game* selection: home team, away team, mode,
  win score, user team. Reset to defaults whenever the user returns to the
  home screen. Not persisted.
- **`userPreferences`** — the *per-user* permanent preferences: volume,
  speed, theme, default win score. Persisted in Dexie keyed by `userId`.

Both live on the same `SettingsState` singleton in
[`state/settings.svelte.ts`](../../src/lib/state/settings.svelte.ts) for
ergonomic access, but only the preferences subset is written to
`userPreferences` via
[`preferencesRepository.ts`](../../src/lib/db/repositories/preferencesRepository.ts).

## Fields

| Field | Type | Scope | Default |
| --- | --- | --- | --- |
| `homeTeam` | `Team` | per-game | `DEFAULT_TEAM` |
| `awayTeam` | `Team` | per-game | `DEFAULT_TEAM` |
| `mode` | `'Solo' \| 'Head-to-Head' \| 'Simulation'` | per-game | `'Head-to-Head'` |
| `userTeam` | `'Home' \| 'Away'` | per-game | `'Home'` |
| `winScore` | `number` (1–99) | per-game (seeded from prefs) | `30` |
| `volume` | `0–100` | preference | `75` |
| `speed` | `number` (animation multiplier) | preference | `1` |
| `theme` | `'dark' \| 'light'` | preference | `'dark'` |

## Loading preferences

`auth.initialize()` and `auth.login()` both call
`settings.loadPreferences(prefs)` after a successful session. This copies
`volume`, `speed`, `theme`, `defaultWinScore` onto the settings singleton and
seeds `winScore` from `defaultWinScore`.

## Reset behavior

`settings.resetSettings()` resets only the per-game fields (teams, mode,
userTeam) — preferences are left alone. This is called on the home page
`onMount` so returning from a game shows a clean picker.

## Volume / speed

Every call to `playSound(howl, volume)` in the engine passes `settings.volume`
so live volume changes take effect immediately. Animation delays in the
engine multiply by `settings.speed` (`await sleep(ms * settings.speed)`), so
the user can slow-mo or speed-run through plays from the Settings modal.
