# W3 — Collector / Builder Proof

Status: **W3_COLLECTOR_BUILDER_PROOF_PASS**

Branch: `w3-collector-builder-proof`

Source of truth entering W3:

- `main@cb43a48e32634e174720b81473f3eb2eec4a37a6`
- `W2_RUNNER_PROOF_PASS`
- LittleJS 1.25.0

## Mission result

W3 added a second, materially different gameplay family without changing the accepted shared foundation or the W2 runner implementation.

The collector/builder contains:

- free 2D pointer/touch target movement;
- deterministic seeded resource layout;
- six resource nodes;
- carry capacity of three;
- pickup loop;
- deposit/build zone;
- two required deposit trips;
- three construction stages;
- deterministic completion;
- deterministic restart;
- generated geometry only.

## Accepted code-bearing evidence

Workflow:

- `W3 Collector Builder Proof`
- run `37683519534`
- head `39657629bc84ac893ee6fafa1279bfa7d294e8d6`
- result: **PASS**

The standard verification command proved all accepted families together:

- TypeScript — PASS
- ESLint — PASS
- unit suite — **13/13 PASS**
- W1 Foundation production-browser contract — PASS
- W2 Runner production-browser contract — PASS
- W3 Collector production-browser contract — PASS

## Pure model evidence

CollectorModel tests proved:

- same seed => same six-resource layout;
- all six resources can be collected;
- carry capacity prevents a fourth carried resource;
- deposit empties carried resources;
- two deposit trips deliver all six resources;
- all three construction stages complete;
- deterministic reset restores player, resources, inventory and build state.

## Production browser evidence

The real LittleJS production build proved:

- collector mode boots;
- pause freezes movement;
- mouse targeting collects the first batch;
- carry reaches 3/3;
- mouse deposit advances construction to 3/6;
- landscape resize preserves the interaction model;
- touch targeting collects the second batch;
- touch deposit completes construction at 6/6;
- build stage reaches 3;
- deposit trip count reaches 2;
- all resource nodes are exhausted;
- deterministic restart restores the original seeded layout;
- no page errors;
- no unexpected console errors;
- no failed required runtime requests.

Playwright runtime summary:

- Foundation — PASS
- Collector/Builder — PASS
- Runner — PASS
- **3/3 browser tests PASS**

## Artifact evidence

W1 budgets remained unchanged.

Measured on the accepted code-bearing run:

- total artifact: **132,918 bytes**
- main JS: **132,348 bytes**
- main JS gzip: **48,949 bytes**
- main JS Brotli: **42,609 bytes**
- external runtime references: **0**
- observed Vite production build: **153 ms**

Budget:

- total < 512,000 bytes — PASS
- gzip < 153,600 bytes — PASS

Marker:

`W1_ARTIFACT_BUDGET_PASS`

Compared with W2, adding the complete collector/builder family increased main JS gzip by only about **1.3 KiB**.

## New Game Core Churn

Automated comparison against accepted W2 main:

- changed files: **12**
- collector-specific production files: **4**
- changed files under `src/core/`: **0**
- changed files under `src/platform/`: **0**
- changed files under `src/runtime/`: **0**
- changed files under `src/testing/`: **0**
- changed files under `src/games/runner/`: **0**

Marker:

`W3_NEW_GAME_CORE_CHURN_PASS`

This is stronger evidence than W2 alone: a top-down collection/build loop with 2D movement, inventory capacity and staged construction reused the same factory foundation without forcing either shared-core changes or runner rewrites.

## Automated visual evidence

Playwright emitted:

- portrait collector gameplay;
- landscape collector gameplay;
- completed build state.

Visual inspection confirmed:

- the player, remaining resources, carry indicators and build zone are readable in portrait;
- the full collector interaction remains visible in landscape;
- completed construction and the `BUILT` state are visible without clipping;
- no new shared viewport fix was required.

This remains proof geometry, not visual-polish evidence.

## Correction-loop evidence

CI caught a TypeScript/class-initialization bug before browser execution:

- collector resource state was originally initialized as a class field using the constructor parameter-property `course`;
- with the current TypeScript class-field semantics, the field initializer ran before that parameter property was available;
- resource-state creation was moved into the constructor after `course` assignment.

After the correction, the full 13-test + 3-browser-test suite passed.

The correction stayed entirely inside collector-specific code.

## Architecture audit

W3 did **not** introduce:

- generic collector mechanics;
- universal inventory system;
- generic build/progression framework;
- ECS;
- GameSpec;
- LevelSpec;
- persistent save/progression;
- analytics;
- YouTube adapter;
- playable-ad adapter;
- asset-generation pipeline;
- cross-engine renderer abstraction.

The game-specific implementation remains under `src/games/collector/`.

## W4 handoff

Next roadmap slice:

**W4 — Physics / Puzzle Proof**

W4 should deliberately stress a third gameplay shape and measure shared-foundation churn again.

Do not extract common factory abstractions before W4 evidence exists.

## Final marker

`W3_COLLECTOR_BUILDER_PROOF_PASS`
