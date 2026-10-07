# W7 — First Real Game Contract

Date: 2026-10-08

Status: **LOCKED FOR W7**

## Mission

Use the accepted Game Factory to build the first game intended to feel like a complete, replayable hypercasual product rather than an architecture proof.

Working title / game id:

`mass-runner` — **Mass Runner**

The title is a working production name and may be rebranded later without changing the gameplay contract.

## Why this game

W7 should maximize learning per unit implementation time.

Mass Runner deliberately reuses the already-proven runner family while adding the product-layer work the proof games did not need:

- multi-level session;
- explicit fail/retry;
- level-to-level progression;
- final completion state;
- difficulty ramp;
- score;
- real HUD/state messaging;
- stronger game-feel rendering;
- full distribution packaging.

This tests the factory rather than inventing another engine architecture.

## Original gameplay loop

```text
tap to start
    ↓
auto-run + horizontal steering
    ↓
collect mass orbs
    ↓
avoid mass-draining hazards
    ↓
choose arithmetic gates
    ↓
reach target mass
    ↓
clear / fail
    ↓
next level / retry
    ↓
five levels → MASSIVE
```

The game uses original generated geometry and no copied proprietary assets.

## Content scope

W7 ships a five-level session.

Each level has:

- distinct name;
- start mass;
- target mass;
- deterministic event layout;
- pickups;
- hazards;
- arithmetic gates;
- finish threshold.

Difficulty must ramp across the session.

## Product behavior

Required:

- start state;
- mouse and touch steering;
- responsive portrait and landscape rendering;
- visible target mass;
- fail state;
- retry;
- level-clear state;
- next-level transition;
- final completion state;
- session score;
- deterministic restart.

No account, cloud persistence or monetization is required for this first session-based release candidate.

## Factory constraint

W7 may add:

- `src/games/mass-runner/**`;
- one registry entry;
- game-specific tests/evidence;
- W7 tooling/docs.

W7 must not modify production code under:

```text
src/core/
src/platform/
src/runtime/
src/testing/
src/games/runner/
src/games/collector/
src/games/physics/
```

Expected marker:

`W7_FIRST_REAL_GAME_CONTRACT_PASS`

## Distribution requirement

The same game must remain packageable through the existing W6 pipeline:

- standalone Web;
- YouTube Playables wrapper;
- playable-ad wrapper.

No platform SDK detail may appear in Mass Runner source.

## Artifact budget

Keep the existing production budget unchanged:

- total canonical artifact < 500 KiB;
- main JS gzip < 150 KiB;
- external runtime references in canonical build = 0.

## Factory ROI metrics

Record:

- first code-bearing commit;
- first green W7 workflow;
- elapsed GitHub wall time between them;
- protected shared-production churn;
- Mass Runner production file count;
- artifact delta from W6;
- human-local execution count.

## Exit criteria

W7 closes only after:

- five-level deterministic session PASS;
- optimal route can complete all levels;
- bad route can fail and retry;
- mouse PASS;
- touch PASS;
- portrait PASS;
- landscape PASS;
- visual opening/clear/complete evidence reviewed;
- W1–W6 regression suite PASS;
- distribution packaging PASS;
- artifact budget PASS;
- protected shared-production churn = 0;
- real-game static contract PASS.

Expected final marker:

`W7_FIRST_REAL_GAME_PASS`
