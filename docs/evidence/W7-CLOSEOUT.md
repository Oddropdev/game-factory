# W7 — First Real Game Closeout

Date: 2026-10-08

Status: **PASS**

Game: **Mass Runner**

## Exit criteria

| Gate | Result |
|---|---|
| five-level deterministic session | PASS |
| optimal full-session route | PASS |
| real fail state | PASS |
| retry same level | PASS |
| level-clear transition | PASS |
| final completion state | PASS |
| session score | PASS |
| mouse steering | PASS |
| touch steering | PASS |
| portrait | PASS |
| landscape | PASS |
| opening visual evidence | PASS |
| clear-state visual evidence | PASS |
| final visual evidence | PASS |
| W1–W6 regressions | PASS |
| unit tests | **27/27 PASS** |
| browser contracts | **6/6 PASS** |
| W6 packaging | PASS |
| canonical artifact budget | PASS |
| protected production churn | **0 / PASS** |
| platform SDK leakage into game | **0 / PASS** |
| human-local execution | **0** |

## Factory production result

The first real game required four game-owned production files:

```text
src/games/mass-runner/
  MassRunnerGame.ts
  MassRunnerLevels.ts
  MassRunnerModel.ts
  MassRunnerTestBridge.ts
```

plus the expected one-entry registration in `GameRegistry`.

It did not require a new engine abstraction, platform abstraction, lifecycle change, viewport change or rewrite of any proof family.

## Time-to-green

```text
first code-bearing commit
2026-10-07T22:04:34Z
        ↓
first green full W7 workflow
~2026-10-07T22:13:08Z
```

**8 min 34 s GitHub wall time.**

That number includes automated compile/browser correction loops and the full accepted regression/distribution pipeline.

It is not a human coding-time estimate.

## Final build

```text
total artifact      154,628 B
main JS             154,058 B
gzip                 54,768 B
Brotli               47,606 B
external refs             0
```

The game adds only about **2.2 KiB gzip** over the W6 factory/distribution baseline.

## Product state

Mass Runner is now a complete functional first-game vertical release candidate:

- start;
- play;
- progression;
- fail/retry;
- completion;
- replay;
- multi-input;
- multi-orientation;
- multi-distribution packaging.

The visuals are intentionally procedural/minimal. The next highest-ROI work is product evidence: subjective game-feel/art iteration and then release/testing, not more generalized factory architecture.

## Factory roadmap

```text
W0  Skeleton Hunt               PASS
W1  Factory Foundation          PASS
W2  Runner Proof                PASS
W3  Collector / Builder Proof   PASS
W4  Physics / Puzzle Proof      PASS
W5  Factory Extraction          PASS
W6  Distribution Adapters       PASS
W7  First Real Game             PASS
```

## Marker

`W7_FIRST_REAL_GAME_PASS`
