# W4 — Physics / Puzzle Proof

Status: **IMPLEMENTATION CANDIDATE**

Branch: `w4-physics-puzzle-proof`

## Mission

Add a third structurally different gameplay family without modifying accepted shared-foundation code or prior game production code.

## Candidate loop

```text
tap launch target
      ↓
gravity trajectory
      ↓
bounds / obstacle collisions
      ↓
miss → reset / retry
      ↓
correct arc
      ↓
goal → SOLVED
```

## Evidence plan

- deterministic pure model tests;
- W1/W2/W3 browser regressions;
- W4 production browser test;
- mouse failed shot;
- pause/resume physics freeze;
- touch successful shot;
- portrait/landscape/solved screenshots;
- unchanged artifact budget;
- automated foundation + prior-game production churn audit.

Expected markers:

- `W1_ARTIFACT_BUDGET_PASS`
- `W4_NEW_GAME_CORE_CHURN_PASS`
- `W4_PHYSICS_PUZZLE_PROOF_PASS`

Do not merge before all mandatory evidence passes.
