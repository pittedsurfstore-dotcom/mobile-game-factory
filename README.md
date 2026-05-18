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

Workspace-wide checks:

```bash
pnpm typecheck   # tsc -p apps/mobile/tsconfig.json (covers all packages + games)
pnpm lint        # eslint 9 flat config
pnpm test        # jest, all package test suites
```

## Tests

Jest is configured at the monorepo root with a multi-project config that picks up `packages/*/jest.config.js`. Currently `@mgf/game-core` has 17 tests across 4 suites covering `mulberry32`, `randInt`, `pick`, the in-memory `KVStore`, `useGameLoop` (fake timers), and `useHighScore` (mock store). All four checks — `typecheck`, `lint`, `test`, and `expo-doctor` — run on every push and PR via `.github/workflows/ci.yml`.

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

## Service interfaces

### Analytics (PostHog wired in, opt-in via env)

`apps/mobile/src/analytics-posthog.ts` adapts the `posthog-react-native` SDK to the `@mgf/analytics` interface. `App.tsx` activates it only when `EXPO_PUBLIC_POSTHOG_KEY` is present; otherwise the noop impl stays (events log to console in dev).

To enable, export your PostHog **public project key** before starting Expo (the `EXPO_PUBLIC_` prefix means it ships in the client bundle — that's intentional for analytics keys; never use a secret key here):

```bash
export EXPO_PUBLIC_POSTHOG_KEY=phc_xxx
export EXPO_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com   # optional; defaults to US cloud
corepack pnpm mobile
```

### Ads — AdMob (wired in, opt-in via env)

`apps/mobile/src/ads-admob.ts` adapts `react-native-google-mobile-ads` to the `@mgf/monetization` `Ads` interface. `App.tsx` activates it only when `EXPO_PUBLIC_ADMOB_ENABLED=1`; otherwise the noop impl stays. The SDK is imported via `require()` inside a lazy factory so Expo Go can still load the JS bundle when AdMob is off.

**AdMob requires a development build** (`expo prebuild` + `eas build` or `npx expo run:ios` / `run:android`) — it ships native code and will not work in Expo Go. The `app.json` plugin entry is configured with Google's official AdMob test App IDs (safe to ship in dev — they never bill real money).

To enable in a dev build:

```bash
export EXPO_PUBLIC_ADMOB_ENABLED=1
# Optional: real ad unit IDs (defaults to Google's test unit IDs)
export EXPO_PUBLIC_ADMOB_REWARDED=ca-app-pub-XXX/YYY
export EXPO_PUBLIC_ADMOB_INTERSTITIAL=ca-app-pub-XXX/ZZZ
npx expo run:ios   # or run:android
```

Games can request an ad anywhere via the interface:

```ts
import { ads } from '@mgf/monetization';
const { rewarded } = await ads().show('rewarded');
if (rewarded) doubleScore();
```

Before shipping to production, swap the test App IDs in `app.json` for your real ones.

### IAP (still stubbed)

Swap in RevenueCat (or StoreKit / Play Billing direct) once you have products defined:

```ts
import { setIAP } from '@mgf/monetization';
setIAP(new RevenueCatIAP(/* … */));
```

The noop impls log in dev so you can see events firing before committing to a vendor.

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
