# W4 — Physics / Puzzle Proof Contract

Date: 2026-10-07

Status: **LOCKED FOR W4**

## Mission

Prove a third materially different gameplay family on the accepted foundation:

- one-tap launch input;
- deterministic fixed-tick physics;
- gravity;
- wall/floor collision;
- obstacle collision;
- puzzle goal;
- reset/retry;
- solved state.

W4 is the final pre-extraction gameplay proof.

## Baseline

Source of truth entering W4:

- `main@6c98ca776f93d0b7609253ae4ceb16f296a3c30a`
- `W3_COLLECTOR_BUILDER_PROOF_PASS`
- LittleJS 1.25.0

## Architecture rule

New gameplay belongs under:

```text
src/games/physics/
```

W4 may modify `src/main.ts` to select the active game.

W4 should not modify production code under:

```text
src/core/
src/platform/
src/runtime/
src/testing/
src/games/runner/
src/games/collector/
```

Any such modification is a churn failure until explicitly justified.

## Gameplay semantics

The proof must contain:

1. deterministic puzzle geometry;
2. ball start state;
3. pointer/touch launch target;
4. gravity-driven trajectory;
5. bounded world collisions;
6. a blocking obstacle;
7. at least one low shot that collides/fails;
8. one known deterministic arc that reaches the goal;
9. solved state;
10. deterministic restart.

The physics model is deliberately game-specific. Do not extract a generic physics framework in W4.

## Testing

Pure TypeScript tests must prove:

- same seed => same puzzle geometry;
- known arc => solved;
- low direct shot => collision and not solved;
- additional launches are rejected while flying;
- reset restores exact state.

Production browser tests must prove:

- physics mode boots in the real LittleJS runtime;
- mouse launch works;
- pause freezes the simulation;
- resume continues;
- obstacle collision is observable;
- deterministic restart works;
- landscape resize is synchronized before input;
- touch launch works;
- known touch arc solves the puzzle;
- final restart restores exact state;
- no page errors, console errors or failed runtime requests.

## Regression rule

The standard `npm run verify` must continue to pass all accepted browser families:

- W1 Foundation;
- W2 Runner;
- W3 Collector / Builder;
- W4 Physics / Puzzle.

## Visual evidence

Playwright must emit:

- portrait failed-shot / obstacle evidence;
- landscape launch evidence;
- solved-state evidence.

These screenshots are proof/QA evidence, not a polish gate.

## Artifact budget

Keep the W1 budget unchanged:

- total artifact < 500 KiB;
- main JS gzip < 150 KiB;
- external runtime references = 0.

## New Game Core Churn

Expected W4 result:

```text
changes under src/core/            = 0
changes under src/platform/        = 0
changes under src/runtime/         = 0
changes under src/testing/         = 0
changes under src/games/runner/    = 0
changes under src/games/collector/ = 0
```

Changing `src/main.ts` does not count as shared-core churn.

Expected marker:

`W4_NEW_GAME_CORE_CHURN_PASS`

## Explicitly deferred

Do not add:

- generic physics package;
- generic puzzle package;
- ECS;
- GameSpec;
- LevelSpec;
- universal input/action layer;
- save/progression;
- analytics;
- distribution adapters;
- editor tooling.

W4 completes evidence collection. W5 performs extraction.

## Exit criteria

W4 closes only after:

- W1 regression PASS;
- W2 regression PASS;
- W3 regression PASS;
- W4 unit tests PASS;
- W4 production browser test PASS;
- artifact budget PASS;
- W4 New Game Core Churn PASS;
- automated visual evidence reviewed.

Expected marker:

`W4_PHYSICS_PUZZLE_PROOF_PASS`
