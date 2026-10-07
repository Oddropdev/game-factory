# W1 — Factory Foundation Contract

Status: **LOCK CANDIDATE FROM W0 ITERATION 03**

## Mission

Build the smallest real foundation that can support W2 Runner Proof without pre-building the factory abstractions that W2–W4 are supposed to discover.

## Allowed production structure

```text
src/
  app/
    createGame.ts
    gameConfig.ts

  core/
    random/
      SeededRng.ts

  platform/
    PlatformBridge.ts
    WebPlatform.ts

  runtime/
    ResponsiveRuntime.ts
    LifecycleRuntime.ts

  assets/
    assetManifest.ts

  scenes/
    BootScene.ts
    FoundationScene.ts

  testing/
    TestBridge.ts
```

Additional files require a concrete W1 gate need, not future speculation.

## Test/tool structure

```text
tests/
  unit/
    seededRng.test.ts

  e2e/
    foundation.spec.ts

tools/
  check-artifact.mjs
```

## Required scripts

W1 should expose stable commands equivalent to:

```text
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:e2e
npm run check:artifact
npm run verify
```

`verify` must run the accepted local/CI gate in one command.

## FoundationScene acceptance behavior

The scene should contain only simple generated/placeholder geometry and text.

It must make these automated checks possible:

- scene booted;
- deterministic seed visible through TestBridge;
- pointer/touch changes a known state value;
- canvas remains valid after resize/orientation profile change;
- lifecycle transitions are observable;
- scene restart returns expected state.

It is **not** a game prototype.

## TestBridge policy

Tests need observability, but the test API must not become a hidden gameplay API.

Expose only coarse state such as:

```ts
type FoundationTestState = {
  scene: string;
  ready: boolean;
  paused: boolean;
  seed: string;
  pointerEvents: number;
  restartCount: number;
};
```

The exact shape may change during W1, but tests should assert public test state rather than reaching deep into arbitrary Phaser objects.

## PlatformBridge policy

W1 interface stays intentionally tiny.

Conceptual capability set:

```text
init
ready
pause
resume
```

Do not add save/load, ads, rewards, analytics, score submission or purchase APIs until a real adapter requires them.

## Responsive policy

Use Phaser ScaleManager as the source of truth.

Do not write browser-specific viewport workarounds unless a failing Playwright/device case demonstrates that Phaser's scale behavior is insufficient.

## Lifecycle policy

Use Phaser global lifecycle/visibility events as the first source of truth.

Platform-specific pause/resume should route through the thin runtime/platform boundary.

Avoid duplicate document-level listeners unless required by a verified platform quirk.

## Determinism policy

Any randomness introduced in foundation/game rules must be injectable or seedable.

W1 proves deterministic RNG independently of Phaser rendering.

W2+ should be able to replay gameplay logic with a known seed.

## CI gate

Required:

1. typecheck PASS;
2. lint PASS;
3. unit tests PASS;
4. production build PASS;
5. artifact check PASS;
6. production-build Playwright smoke PASS.

Browser profiles:

- 390×844;
- 844×390;
- 1280×720.

Runtime failures include:

- no canvas;
- zero-sized canvas;
- FoundationScene not ready;
- page exception;
- unexpected console error;
- failed required asset;
- pointer smoke not reflected in test state;
- resize corrupts state/canvas;
- lifecycle transition missing;
- deterministic restart mismatch.

## W1 artifact budget

Because W1 contains no production art:

- total production artifact < **2 MiB**;
- no unexpected external runtime asset URLs;
- emit machine-readable + Markdown artifact size evidence.

Startup timing should be measured, but not yet hard-gated on shared CI runners.

## Security

Do not execute arbitrary third-party Skeleton Hunt repositories in normal Game Factory CI.

Only our code and selected dependency packages execute.

Any future external-repo runtime experiment must use an isolated environment with:

- no repository secrets;
- no write token;
- no persistent credentials;
- no access to production services.

## Exit criteria

W1 passes only when the production build, not just the dev server, satisfies the full browser smoke suite.

Expected marker:

`W1_FACTORY_FOUNDATION_PASS`

After W1 PASS, W2 may introduce the first real gameplay family.
