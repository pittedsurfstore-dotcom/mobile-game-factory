# Contributing

Working notes for anyone touching this repo. The [README](./README.md) covers the high-level architecture; this file covers the dev loop.

## Prerequisites

- **Node 20+** (Node 22 is what local dev was built on; CI runs 20)
- **Corepack** (bundled with Node ≥ 16) handles pnpm via the `packageManager` field in the root `package.json`. You do not need to globally install pnpm.

Verify:

```bash
node -v          # ≥ 20
which corepack   # /usr/local/bin/corepack or similar
```

If pnpm is not on your PATH, prefix any pnpm command with `corepack`:

```bash
corepack pnpm install
corepack pnpm mobile
```

Or globally enable the shim once: `corepack enable pnpm` (may require sudo on macOS, depending on Node install).

## First-time setup

```bash
git clone git@github.com:pittedsurfstore-dotcom/mobile-game-factory.git
cd mobile-game-factory
corepack pnpm install   # also runs the Husky hook installer via `prepare`
```

That single install:

- Pulls ~1000 packages into a hoisted `node_modules` (see `.npmrc`)
- Activates the pre-commit hook (`.husky/pre-commit`)
- Generates `pnpm-lock.yaml` if missing
- Wires the workspace links between `apps/`, `packages/`, and `games/`

## Common commands

```bash
corepack pnpm mobile          # expo start (then i / a / w)
corepack pnpm typecheck       # tsc --noEmit, whole monorepo via apps/mobile/tsconfig.json
corepack pnpm lint            # eslint 9 flat config
corepack pnpm test            # jest, 13 projects, 148 tests
corepack pnpm format          # prettier --write .
corepack pnpm format:check    # prettier --check . (used by CI)
```

Filter a single package:

```bash
corepack pnpm --filter @mgf/block-puzzle test
corepack pnpm --filter @mgf/game-core typecheck
```

Full Metro bundle (catches runtime-import errors that typecheck cannot):

```bash
cd apps/mobile
corepack pnpm exec expo export --platform ios --output-dir /tmp/mgf-bundle
```

## Project layout

```
apps/
  mobile/                 Expo app: launcher + game host + Settings
packages/
  game-core/              useGameLoop, mulberry32, KV store, useHighScore, types
  ui/                     Screen, Button, Hud, theme
  analytics/              Analytics interface + noop impl
  monetization/           Ads + IAP interfaces + noop impls + NOADS_ENTITLEMENT
games/
  <name>/                 Each game is a workspace package exporting a GameModule
```

The mobile app's [`src/games.ts`](./apps/mobile/src/games.ts) is the registry — every game gets one line.

## How to add a 10th game

1. Copy the skeleton from any existing game:
   ```bash
   cp -R games/ludo games/my-game
   ```
2. Update `games/my-game/package.json` — change `name` to `@mgf/my-game`, update the dependency list if needed.
3. Replace `games/my-game/src/index.tsx` with your `Game` component and `meta`. Default-export a `GameModule`.
4. Add a `GameId` literal to [`packages/game-core/src/types.ts`](./packages/game-core/src/types.ts).
5. Wire it into [`apps/mobile/src/games.ts`](./apps/mobile/src/games.ts).
6. Add it to the `dependencies` map in [`apps/mobile/package.json`](./apps/mobile/package.json).
7. `corepack pnpm install` to refresh the workspace links.

If you have pure game logic worth testing (most games do), follow the **extract-pure-logic pattern** below.

## Extract-pure-logic pattern

Every game in this repo splits its pure functions out of the React component into a sibling `logic.ts`. The component imports from `./logic`. This lets us unit-test the logic without React, the DOM, or any native APIs.

To do this for a new game:

1. Create `games/<name>/src/logic.ts` with the pure functions and any tunable constants.
2. Update `games/<name>/src/index.tsx` to import from `./logic`.
3. Add `games/<name>/jest.config.js`:
   ```js
   module.exports = {
     displayName: '@mgf/<name>',
     preset: 'ts-jest',
     testEnvironment: 'node',
     testMatch: ['<rootDir>/src/**/*.test.ts?(x)'],
     transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: { jsx: 'react-jsx' } }] },
   };
   ```
4. Add `"test": "jest"` and `"typecheck": "tsc --noEmit"` to the package's `scripts`.
5. Add `"exclude": ["**/*.test.ts", "**/*.test.tsx"]` to the package's `tsconfig.json` so per-package typecheck does not pull in test-only globals.
6. Write `games/<name>/src/logic.test.ts`.

The root `jest.config.js` auto-discovers `games/*/jest.config.js` and `packages/*/jest.config.js`, so no further wiring is needed.

## Service interfaces

Three integrations live behind small interfaces in `@mgf/analytics` and `@mgf/monetization`. Each ships a noop impl by default and a real-SDK adapter under `apps/mobile/src/` that activates only when an env var is set:

| Service    | Env activator                 | Adapter file                           | Native? |
| ---------- | ----------------------------- | -------------------------------------- | ------- |
| PostHog    | `EXPO_PUBLIC_POSTHOG_KEY`     | `apps/mobile/src/analytics-posthog.ts` | no      |
| AdMob      | `EXPO_PUBLIC_ADMOB_ENABLED=1` | `apps/mobile/src/ads-admob.ts`         | yes¹    |
| RevenueCat | `EXPO_PUBLIC_REVENUECAT_KEY`  | `apps/mobile/src/iap-revenuecat.ts`    | yes¹    |

¹ Native modules require a development build (`npx expo run:ios` / `run:android`), not Expo Go.

When you add a new service:

1. Extend the interface in the corresponding `packages/*` package.
2. Update the noop impl in the same file.
3. Add a real adapter under `apps/mobile/src/<service>-<vendor>.ts`. Use a lazy `require()` inside a factory function if the SDK is native, so Expo Go can still load the JS bundle without the SDK.
4. Activate it conditionally in `App.tsx` behind a new `EXPO_PUBLIC_*` env var.

The full env-var pattern + dev-build caveats are documented in the README.

## Pre-commit hook

Every commit runs:

1. `lint-staged` — `eslint --fix --max-warnings 0` then `prettier --write` on the staged TS/JS files; `prettier --write` on staged JSON/MD/YAML.
2. `tsc --noEmit -p apps/mobile/tsconfig.json` on the whole monorepo.

If either step fails the commit is rejected and the working tree is reverted to the original state via `git stash`. Adds ~1.5–2 s per commit; worth it.

Emergency bypass:

```bash
git commit --no-verify
```

…but expect CI to catch what the hook would have. The CI gates (Typecheck, Lint, Format, Test, Expo Doctor) all block PRs from merging.

## CI

`.github/workflows/ci.yml` runs five jobs in parallel on every push and PR. They mirror the local checks:

| Job         | Local equivalent                    |
| ----------- | ----------------------------------- |
| Typecheck   | `pnpm typecheck`                    |
| Lint        | `pnpm lint`                         |
| Format      | `pnpm format:check`                 |
| Test        | `pnpm test -- --ci`                 |
| Expo Doctor | `cd apps/mobile && npx expo-doctor` |

All five must be green before merge. Total runtime is roughly 30 s wall-clock since they run in parallel.

### Dependabot auto-merge

`.github/workflows/dependabot-auto-merge.yml` flips Dependabot patch and minor PRs to **auto-merge** as soon as all five CI gates pass. Major bumps stay manual and get a step-summary note prompting human review. Repo-level `allow_auto_merge` is enabled. Ecosystem-locked packages (Expo SDK / React / Jest cluster) have major bumps ignored in [`.github/dependabot.yml`](./.github/dependabot.yml), so most weekly noise auto-clears without you touching it.

## Commit messages

This repo uses conventional commits (`feat`, `fix`, `test`, `chore`, `refactor`, `docs`). Scope is the most-affected package or area:

```
feat(iap): wire RevenueCat behind EXPO_PUBLIC_REVENUECAT_KEY
fix(ci): pass --ci through to jest
test(mahjong): extract logic, add 9 tests
chore(husky): block commits on lint warnings and type errors
```

Co-author the Claude collaborator on AI-assisted commits:

```
Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

## Pull requests

- One concern per PR. If you find yourself bundling unrelated changes, split.
- Include a one-line "what changed" and a one-line "why" in the body.
- The five CI jobs must be green. PRs cannot merge with any job red.
- The pre-commit hook means your local + CI states should agree. If they don't, that's a bug — file an issue.

## EAS preview builds

`.github/workflows/eas-preview.yml` queues an EAS build on every push to `main` and on manual `workflow_dispatch`. The `preview` profile in [`apps/mobile/eas.json`](./apps/mobile/eas.json) produces:

- **iOS Simulator** build (no signing, no Apple Developer account required) — install in any Simulator with `xcrun simctl install`
- **Android APK** (debug-signed) — sideload onto any device

The workflow is **gated on an `EXPO_TOKEN` repo secret** so it doesn't fail before you've set it up. The job skips with an explanatory step summary if the token is missing.

### One-time setup

1. Create an Expo account: <https://expo.dev/signup>
2. From `apps/mobile/`, run `npx eas-cli login` then `npx eas-cli project:init`. This writes the EAS project ID into `app.json` under `extra.eas.projectId`. Commit that change.
3. Generate a non-interactive token: <https://expo.dev/accounts/[you]/settings/access-tokens>. Copy it.
4. On GitHub: **Settings → Secrets and variables → Actions → New repository secret**. Name: `EXPO_TOKEN`. Paste the value.
5. Push any commit to `main` (or click _Run workflow_ on the **EAS Preview Build** action). The job will queue a build on EAS servers (~10–20 min); the link to the build artifact appears in the EAS dashboard.

The job uses `--no-wait`, so the CI run finishes in ~30 s — the build itself runs on Expo's servers and you get notified there.

### Triggering manually

```bash
gh workflow run eas-preview.yml
```

## Common pnpm gotchas

- **Node-linker is `hoisted`**, not pnpm's default `isolated`. Set in [`.npmrc`](./.npmrc). This is what makes Metro happy with React Native's `@babel/runtime` resolution. Don't change it without a Metro bundle test.
- **`pnpm test --ci` does not work** — pnpm intercepts `--ci`. Use `pnpm test -- --ci` (note the bare `--`). CI does this; you should too if you script it.
- **The `pnpm.overrides` block pins `ansi-regex@^5`** so Jest 29's strip-ansi chain stays consistent. If you bump Jest to 30+, you can probably drop the override.
