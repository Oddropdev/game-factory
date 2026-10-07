# W2 — Runner Proof Contract

Date: 2026-10-07

Status: **LOCKED FOR W2**

## Mission

Prove the first real gameplay family on the accepted W1 foundation:

- forward movement;
- horizontal steering;
- collection;
- gates;
- obstacles;
- finish.

The objective is not to build a polished commercial runner.

The objective is to prove that a materially real game loop can be added with near-zero shared-foundation churn.

## Baseline

Source of truth entering W2:

- `main@3da4311757703ba7d34627541e7234819f3c5565`
- `W1_FACTORY_FOUNDATION_PASS`
- LittleJS 1.25.0

## Architecture rule

W2 gameplay belongs under:

```text
src/games/runner/
```

W2 may modify the application entrypoint in `src/main.ts`.

W2 should not modify accepted shared foundation modules unless a real blocker is proven:

```text
src/core/
src/platform/
src/runtime/
src/testing/
```

Any such change is a New Game Core Churn failure until explicitly reviewed.

## Gameplay semantics

The proof must contain:

1. fixed forward progression;
2. bounded horizontal steering;
3. collectible objects that change score;
4. obstacle collisions with a penalty/hit signal;
5. two choice gates with different outcomes;
6. a deterministic finish state;
7. deterministic restart;
8. seeded course layout.

The game-specific course/model must remain ordinary code. Do not extract a generic mechanic framework in W2.

## Testing

Pure TypeScript tests must prove:

- same seed => same course;
- a clean scripted route can collect pickups, avoid obstacles, choose beneficial gates and finish;
- restart resets gameplay state exactly.

Production browser tests must prove:

- real LittleJS runtime boots;
- forward progress occurs;
- mouse steering works;
- touch steering works;
- pause freezes progression;
- resume restores progression;
- portrait and landscape remain usable;
- finish is reached;
- restart returns deterministic initial state;
- no page errors, console errors or failed runtime requests.

## Visual evidence

The browser test should emit screenshots for:

- portrait gameplay;
- landscape gameplay;
- finish state.

These are evidence artifacts, not a visual-polish gate.

## Artifact budget

Keep the W1 budgets unchanged:

- total production artifact < 500 KiB;
- main JS gzip < 150 KiB;
- external runtime references = 0.

W2 must not increase the budget merely because gameplay now exists.

## New Game Core Churn

North-star gate for W2:

```text
changes under src/core/      = 0
changes under src/platform/  = 0
changes under src/runtime/   = 0
changes under src/testing/   = 0
```

Changing `src/main.ts` does not count as shared-core churn.

Expected marker:

`W2_NEW_GAME_CORE_CHURN_PASS`

## Explicitly deferred

Do not add:

- generic mechanics package;
- ECS;
- universal runner template;
- GameSpec;
- LevelSpec;
- save/progression;
- analytics;
- YouTube adapter;
- playable-ad adapter;
- art-generation pipeline.

W2 produces evidence for future extraction. It does not perform that extraction.

## Exit criteria

W2 closes only after:

- W1 regression stays PASS;
- W2 unit tests PASS;
- W2 production browser test PASS;
- artifact budget PASS;
- New Game Core Churn PASS;
- runner evidence is documented.

Expected final marker:

`W2_RUNNER_PROOF_PASS`
