# W2 — Runner Proof

Status: **W2_RUNNER_PROOF_PASS**

Branch: `w2-runner-proof`

Source of truth entering W2:

- `main@3da4311757703ba7d34627541e7234819f3c5565`
- `W1_FACTORY_FOUNDATION_PASS`
- LittleJS 1.25.0

## Mission result

W2 added the first real gameplay family while keeping accepted W1 shared-foundation modules unchanged.

The runner contains:

- deterministic seeded course generation;
- automatic forward progression;
- bounded horizontal steering;
- three collectible encounters;
- two obstacle encounters;
- two choice gates;
- scoring and hit state;
- deterministic finish;
- deterministic restart;
- generated geometry only.

## Accepted code-bearing evidence

Workflow:

- `W2 Runner Proof`
- run `37680792296`
- head `330514061e89a8e7f842132e96a5a02030d7b1ba`
- result: **PASS**

Regression inside the same verification command:

- TypeScript — PASS
- ESLint — PASS
- unit suite — **9/9 PASS**
- Vite production build — PASS
- W1 Foundation Playwright contract — PASS
- W2 Runner Playwright contract — PASS

## Runner behavior evidence

Pure TypeScript model tests proved:

- identical seed => identical course;
- scripted clean route reaches finish;
- clean route collects all 3 pickups;
- clean route avoids both obstacles;
- both gates are processed;
- beneficial gate choices produce final score **8**;
- reset returns exact deterministic initial state.

Production browser test proved:

- real LittleJS runner boots;
- forward movement advances automatically;
- mouse steering changes target/player state;
- touch steering changes target state;
- pause freezes forward distance;
- resume continues;
- portrait runtime works;
- landscape runtime keeps the player inside the visible camera;
- runner reaches 100% finish;
- both gates and all course events are processed;
- paused restart returns deterministic state;
- no uncaught page errors;
- no unexpected console errors;
- no failed required runtime requests.

## Artifact evidence

W1 budgets remained unchanged.

Measured on accepted code-bearing run:

- total artifact: **127,507 bytes**
- main JS: **126,937 bytes**
- main JS gzip: **47,663 bytes**
- main JS Brotli: **41,366 bytes**
- external runtime references: **0**
- observed Vite production build: **160 ms**

Budget:

- total < 512,000 bytes — PASS
- gzip < 153,600 bytes — PASS

Marker:

`W1_ARTIFACT_BUDGET_PASS`

W2 added a real game loop while main JS gzip increased only modestly from the W1 foundation baseline.

## New Game Core Churn

Automated comparison against accepted W1 main:

- changed files: **12**
- runner-specific production files: **4**
- changed files under `src/core/`: **0**
- changed files under `src/platform/`: **0**
- changed files under `src/runtime/`: **0**
- changed files under `src/testing/`: **0**

Marker:

`W2_NEW_GAME_CORE_CHURN_PASS`

This is the central W2 result: the first real gameplay family did not require rewriting the shared foundation.

## Automated visual evidence

Playwright emitted three screenshots:

- portrait gameplay;
- landscape gameplay;
- finish state.

The first visual inspection found a real issue not caught by the initial numeric smoke assertions: the player was outside the visible vertical range in landscape because W1 camera scaling is width-based.

The fix stayed entirely runner-specific:

- runner render layout now derives visible world height from the accepted viewport snapshot;
- player Y and event spacing adapt to aspect ratio;
- landscape test now gates that the player's render Y remains inside the visible half-height.

No `ViewportRuntime` change was required, preserving zero shared-foundation churn.

## Correction-loop evidence

W2 exposed three useful test/workflow issues:

1. Screenshot code initially imported Node fs/path while the browser-oriented tsconfig did not include Node types. It was replaced with Playwright-native `testInfo.outputPath()` and attachments.
2. The first runner test assumed distance would still be exactly zero after browser boot. A real auto-runner may have advanced several fixed ticks before the test reads state. The assertion now compares future progress against the observed initial baseline.
3. Visual QA exposed landscape vertical clipping even though the canvas itself was technically valid. Aspect-aware runner layout fixed it and a numeric visibility gate now protects it.

These were corrected without human-local execution.

## Architecture audit

W2 did **not** introduce:

- generic mechanics package;
- ECS;
- generic System hierarchy;
- GameSpec;
- LevelSpec;
- save/progression;
- analytics;
- YouTube adapter;
- playable-ad adapter;
- asset-generation pipeline;
- cross-engine renderer abstraction.

W2 game-specific code remains under `src/games/runner/`.

## W3 handoff

Next roadmap slice:

**W3 — Collector / Builder Proof**

W3 should reuse the same accepted foundation and measure New Game Core Churn again.

Do not extract a generalized factory mechanic architecture yet. That remains gated on evidence from W2–W4.

## Final marker

`W2_RUNNER_PROOF_PASS`
