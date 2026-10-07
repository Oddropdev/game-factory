# W7 — First Real Game

Status: **IMPLEMENTATION CANDIDATE**

Branch: `w7-first-real-game-mass-runner`

Game:

**Mass Runner**

## Candidate product loop

```text
five deterministic levels
      +
auto-run / steer
      +
mass pickups
      +
draining hazards
      +
arithmetic gates
      +
target threshold
      +
clear / retry
      +
final score
```

## Factory hypothesis under test

The first real game should primarily add game-owned code and one registry entry.

It should not force changes to accepted core, platform, runtime, testing infrastructure or previous game families.

## Evidence target

- five-level unit-session completion;
- deterministic failure/retry;
- production browser full-session completion;
- mouse and touch input;
- portrait and landscape;
- opening / level-clear / completion screenshots;
- W6 distribution packages still build;
- canonical artifact budget remains green;
- zero protected production churn.

Expected markers:

- `W1_ARTIFACT_BUDGET_PASS`
- `W6_DISTRIBUTION_ADAPTERS_CONTRACT_PASS`
- `W7_FIRST_REAL_GAME_CONTRACT_PASS`
- `W7_FIRST_REAL_GAME_PASS`
