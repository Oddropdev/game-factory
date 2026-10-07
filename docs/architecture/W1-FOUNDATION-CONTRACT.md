# W1 — Factory Foundation Contract

Status: **LOCKED FROM W0 / ADR-001**

## Mission

Build the smallest real LittleJS foundation that can support W2 Runner Proof without pre-building abstractions that W2–W4 are supposed to discover.

## Baseline

- LittleJS 1.25.0
- TypeScript
- Vite
- Vitest
- Playwright
- standalone web as the first distribution target

## Allowed production structure

```text
src/
  main.ts

  core/
    random/
      SeededRng.ts

  platform/
    PlatformBridge.ts
    WebPlatform.ts

  runtime/
    LifecycleRuntime.ts
    ViewportRuntime.ts

  testing/
    TestBridge.ts
```

Additional files require a concrete W1 gate need, not future speculation.

LittleJS itself owns rendering, canvas creation, input and the main loop. Do not wrap those subsystems unless a verified factory requirement needs a boundary.

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

## Foundation acceptance behavior

The runtime should contain only generated/placeholder geometry and text.

It must make these automated checks possible:

- engine booted;
- deterministic seed visible through TestBridge;
- pointer/touch changes known state;
- canvas remains valid after viewport/orientation changes;
- lifecycle pause/resume is observable;
- restart returns deterministic initial state.

It is **not** a game prototype.

## TestBridge policy

Tests need observability, but the test API must not become a hidden gameplay API.

Expose only coarse state such as:

```ts
type FoundationTestState = {
  ready: boolean;
  paused: boolean;
  seed: string;
  pointerEvents: number;
  restartCount: number;
};
```

Tests must assert public test state rather than reach through arbitrary LittleJS internals.

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

## Viewport policy

Use LittleJS canvas/input behavior as the source of truth.

Only add `ViewportRuntime` logic required by failing browser evidence, such as maintaining the factory's normalized playfield mapping across orientation changes.

Do not create a general responsive framework in W1.

## Lifecycle policy

Use LittleJS pause/runtime primitives first.

Platform-specific lifecycle behavior should route through the thin platform boundary.

Avoid duplicate DOM listeners unless a verified platform quirk requires them.

## Determinism policy

Any randomness introduced into game rules must be injectable or seedable.

W1 keeps a pure deterministic RNG/test path independent of visual rendering.

LittleJS's own deterministic/headless stepping may be used later where time-driven engine behavior itself needs verification.

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
- foundation not ready;
- page exception;
- unexpected console error;
- failed required asset;
- pointer/touch not reflected in test state;
- resize corrupts state/canvas;
- lifecycle transition missing;
- deterministic restart mismatch.

## W1 artifact budget

W0.5 produced a 121,613-byte LittleJS bakeoff artifact with no production art.

W1 therefore uses a much stricter initial budget than the old Phaser-oriented 2 MiB gate:

- total production artifact **< 500 KiB**;
- main JS gzip **< 150 KiB**;
- no unexpected external runtime asset URLs;
- machine-readable + Markdown size evidence.

These are internal W1 budgets, not platform limits.

If a justified foundation feature exceeds a budget, treat it as an explicit gate decision rather than silently increasing the limit.

## Security

Do not execute arbitrary Skeleton Hunt repositories in normal Game Factory CI.

Only our code and selected dependency packages execute.

Any external-repo runtime experiment must use an isolated environment with:

- no repository secrets;
- no write token;
- no persistent credentials;
- no production-service access.

## Explicitly deferred

Do **not** add in W1:

- `mechanics/`;
- universal ECS;
- generic system base classes;
- `GameSpec`;
- `LevelSpec`;
- generic render-engine interface;
- YouTube SDK adapter;
- MRAID/AppLovin adapter;
- save/progression framework;
- editor tooling;
- asset-generation pipeline.

Those abstractions require W2–W4 gameplay evidence.

## Exit criteria

W1 passes only when the production build, not only the dev server, satisfies the full browser smoke suite and artifact budgets.

Expected marker:

`W1_FACTORY_FOUNDATION_PASS`

After W1 PASS, W2 may introduce the first real gameplay family.
