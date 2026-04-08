# Teams

## Built-in teams

Source: [`lib/data/data.json`](../../src/lib/data/data.json), `teamsData` array.

Each built-in team has:

```ts
interface Team {
  id: string;           // UUID
  city: string;         // "Arizona"
  cityKey: string;      // "ARI"
  name: string;         // "Cardinals"
  fieldLogo: string;    // asset key for the on-field logo
  logo: string;         // asset key for the helmet/menu logo
  logoFixed?: boolean;
  logoLeft?: string;    // optional alternate asset when shown on left side
  logoX?, logoY?, logoWidth?, logoHeight?, logoRotation?: number;
  colors: {
    primary, secondary: string;    // oklch(...) strings
    faceMask?, helmet?, stripe?, trim?: string;
  };
  isCustom?: boolean;
}
```

Colors are stored in OKLCH for perceptually uniform tinting. Helpers in
[`utils/common.ts`](../../src/lib/utils/common.ts) (`hexToOklch`, `oklchToHex`,
`lightenColor`) convert when rendering the custom-team designer.

## Custom teams

Logged-in users can design their own teams via `CustomTeam.svelte`. Records
are persisted in the `customTeams` Dexie table keyed by `userId`. When the
user visits any team picker, the built-in pool is concatenated with their
custom teams.

`customTeamRepository.migrateFromLocalStorage(userId)` is called on login /
register. It one-shots any legacy `localStorage` custom teams into Dexie and
clears the old keys. This is a transition from an earlier storage scheme and
is safe to leave in place indefinitely.

## Logos

Logo files live in `static/` (referenced by `fieldLogo` / `logo` asset keys).
[`utils/logoPreloader.ts`](../../src/lib/utils/logoPreloader.ts) eagerly warms
the browser's image cache so team selection feels instant.

## Home/away coloring

`primaryColor(settings, 'home' | 'away')` and `secondaryColor(...)` in
[`utils/game.ts`](../../src/lib/utils/game.ts) resolve the right team's color
from the live `settings` singleton — used heavily by the field, dice, and
scoreboard components.
