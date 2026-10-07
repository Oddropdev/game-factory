# W4 — Physics / Puzzle Proof Closeout

Date: 2026-10-07

Status: **PASS**

## Exit criteria

| Gate | Result |
|---|---|
| deterministic puzzle geometry | PASS |
| one-tap launch | PASS |
| gravity trajectory | PASS |
| bounds collision | PASS |
| obstacle collision | PASS |
| failed low shot | PASS |
| deterministic solution arc | PASS |
| solved state | PASS |
| deterministic restart | PASS |
| pure model tests | PASS |
| W1 browser regression | PASS |
| W2 runner regression | PASS |
| W3 collector regression | PASS |
| W4 production browser test | PASS |
| mouse launch | PASS |
| touch launch | PASS |
| pause/resume | PASS |
| portrait | PASS |
| landscape | PASS |
| visual trajectory evidence | PASS |
| solved-state evidence | PASS |
| W1 artifact budget | PASS |
| external runtime references | PASS |
| shared-foundation production churn | **0 / PASS** |
| prior-game production churn | **0 / PASS** |
| speculative factory abstraction absent | PASS |

## What W4 proved

Three structurally different gameplay families now run on the same foundation:

```text
W2 Runner
  auto-forward + steering + collection + gates + obstacles

W3 Collector / Builder
  free 2D movement + pickup + capacity + deposit + construction

W4 Physics / Puzzle
  one-tap impulse + gravity + collision + obstacle + goal
```

None required production changes to:

- `src/core/`;
- `src/platform/`;
- `src/runtime/`;
- `src/testing/`.

W4 additionally required no production changes to:

- `src/games/runner/`;
- `src/games/collector/`.

The Game Factory reuse hypothesis has therefore passed the three-family proof threshold.

## Artifact progression

Approximate main-JS gzip progression:

```text
W1 foundation          46.3 KiB
W2 runner              47.7 KiB
W3 collector/builder   48.9 KiB
W4 physics/puzzle      52.0 KiB
```

All remain far below the locked 150 KiB gzip budget.

## Visual QA result

Automated browser evidence shows:

- a failed portrait shot visibly blocked by the obstacle;
- a real airborne landscape solution trajectory;
- the ball visibly entering the goal in the solved state.

No viewport or shared-runtime correction was required.

## Extraction gate

W5 Factory Extraction is now **unlocked**.

W5 must not convert every repeated-looking line into a framework.

The extraction rule is:

> only abstract behavior whose reuse is supported by W2–W4 evidence and whose extraction reduces future new-game work without increasing agent ambiguity.

## Workflow result

Human-local execution: **0**.

Repository implementation, tests, CI execution, browser interaction, screenshot generation, visual inspection and closeout were handled through the repository workflow.

## Next

`W5 — FACTORY EXTRACTION`

## Marker

`W4_PHYSICS_PUZZLE_PROOF_PASS`
