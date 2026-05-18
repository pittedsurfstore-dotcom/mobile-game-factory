# Mobile Game Factory

Expo + React Native + TypeScript monorepo. One launcher app, nine playable game MVPs, shared infrastructure for analytics / ads / IAP / persistence.

## Layout

```
apps/
  mobile/                 Expo app (launcher + game host)
packages/
  game-core/              Types, game loop, RNG, KV store, high-score hook
  ui/                     Screen, Button, Hud, theme
  analytics/              Analytics interface + noop impl (swap in PostHog/Firebase later)
  monetization/           Ads + IAP interfaces + noop impl (swap in AdMob/RevenueCat later)
games/
  block-puzzle/           Tetris-style row clearing
  mahjong/                Memory-pairs tile match
  match-3/                Swap-adjacent gem matching
  idle-restaurant/        Tap + idle upgrade loop
  hill-climb/             Terrain rider, gas/brake, fuel
  endless-runner/         Tap-to-jump obstacle dodge
  virtual-pet/            Decaying stats, persistent state
  ludo/                   Single-track race with shortcuts/snakes
  pool-lite/              Drag-aim physics with pockets
```

## Run it

> Note: this repo has not had `pnpm install` run yet. Install dependencies first.

```bash
pnpm install
pnpm mobile           # starts Expo (then press i / a / w)
```

Per-game type checking:

```bash
pnpm typecheck
```

## How a game is wired

Each game package exports a default `GameModule`:

```ts
import type { GameModule } from '@mgf/game-core';
export default { meta, Screen } satisfies GameModule;
```

The mobile app's `src/games.ts` imports all nine and the home screen renders them in a grid. The host screen mounts the selected game's `Screen`. No special per-game routing needed.

## Adding a 10th game

1. `mkdir games/new-game/src && cp -R games/block-puzzle/{package.json,tsconfig.json} games/new-game/` (then edit the package name).
2. Write `games/new-game/src/index.tsx` that exports a `GameModule`.
3. Add it to `apps/mobile/package.json` deps and `apps/mobile/src/games.ts`.
4. `pnpm install` to refresh the workspace links.

## Service interfaces (stubbed)

Real SDKs are not wired yet. To switch in providers, call once at app startup:

```ts
import { setAnalytics } from '@mgf/analytics';
import { setAds, setIAP } from '@mgf/monetization';

setAnalytics(new PostHogAnalytics(/* … */));
setAds(new AdMobAds(/* … */));
setIAP(new RevenueCatIAP(/* … */));
```

The noop impls log in dev so you can see events firing before you commit to a vendor.

## Known limitations of the MVPs

- Block Puzzle: no hold/preview, no kick-on-rotate.
- Mahjong: pairs game, not real mahjong solitaire.
- Match-3: no special tiles, no level structure (20-move sessions).
- Hill Climb: button input, not analog; no coin pickups.
- Endless Runner: one-lane only; no double-jump or power-ups.
- Virtual Pet: stats only, no animations.
- Ludo: solo race vs board; no opponents.
- Pool Lite: simplified collisions (no spin), reset clears the table.

Each is playable end-to-end and meets the MVP-before-polish rule from the spec.
