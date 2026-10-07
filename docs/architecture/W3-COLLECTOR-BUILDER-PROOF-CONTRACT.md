# W3 — Collector / Builder Proof Contract

Date: 2026-10-07

Status: **LOCKED FOR W3**

## Mission

Prove a second materially different gameplay family on the accepted foundation:

- free 2D pointer/touch movement;
- resource collection;
- finite carry inventory;
- deposit loop;
- staged construction;
- completion.

W3 is a factory-reuse test, not a polished game.

## Baseline

Source of truth entering W3:

- `main@cb43a48e32634e174720b81473f3eb2eec4a37a6`
- `W2_RUNNER_PROOF_PASS`
- LittleJS 1.25.0

## Architecture rule

New gameplay belongs under:

```text
src/games/collector/
```

W3 may modify `src/main.ts` to select the active game.

W3 should not modify:

```text
src/core/
src/platform/
src/runtime/
src/testing/
src/games/runner/
```

A modification in those areas is a churn failure until explicitly justified.

## Gameplay semantics

The proof must contain:

1. 2D mobile pointer/touch target movement;
2. six deterministic resource nodes;
3. carry capacity of three;
4. resource pickup;
5. deposit/build zone;
6. two required deposit trips;
7. three construction stages;
8. deterministic complete state;
9. deterministic restart.

## Testing

Pure TypeScript tests must prove:

- same seed => same resource layout;
- all six resources can be collected and deposited;
- capacity prevents a fourth carried resource;
- two trips complete the three-stage build;
- reset restores exact initial state.

Production browser tests must prove:

- collector mode boots in the real LittleJS runtime;
- mouse resource targeting works;
- touch resource targeting works;
- carry capacity is reached;
- deposit empties carry and advances build;
- pause freezes movement;
- portrait works;
- landscape works;
- completion is reached;
- restart restores the deterministic layout;
- no page errors, console errors or failed runtime requests.

## Regression rule

The standard `npm run verify` must continue to pass:

- W1 Foundation browser contract;
- W2 Runner browser contract;
- W3 Collector browser contract.

## Artifact budget

Keep the W1 budget unchanged:

- total artifact < 500 KiB;
- main JS gzip < 150 KiB;
- external runtime references = 0.

## New Game Core Churn

Expected W3 result:

```text
changes under src/core/          = 0
changes under src/platform/      = 0
changes under src/runtime/       = 0
changes under src/testing/       = 0
changes under src/games/runner/  = 0
```

Changing `src/main.ts` does not count as shared-core churn.

Expected marker:

`W3_NEW_GAME_CORE_CHURN_PASS`

## Explicitly deferred

Do not add:

- generic collector mechanic package;
- universal inventory abstraction;
- generic build/progression system;
- ECS;
- GameSpec;
- LevelSpec;
- save/progression persistence;
- analytics;
- platform adapters;
- editor tooling.

W3 collects evidence. W5 performs extraction after W4.

## Exit criteria

W3 closes only after:

- W1 regression PASS;
- W2 regression PASS;
- W3 unit tests PASS;
- W3 production browser test PASS;
- artifact budget PASS;
- W3 New Game Core Churn PASS;
- automated visual evidence reviewed.

Expected marker:

`W3_COLLECTOR_BUILDER_PROOF_PASS`
