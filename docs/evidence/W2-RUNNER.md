# W2 — Runner Proof

Status: **IMPLEMENTATION CANDIDATE**

Branch: `w2-runner-proof`

## Mission

Add the first real gameplay family without modifying accepted W1 shared-foundation modules.

## Implemented gameplay

- deterministic seeded runner course;
- automatic forward progression;
- bounded horizontal steering;
- pickups;
- obstacles;
- two choice gates;
- score/hit/gate state;
- finish state;
- deterministic restart;
- simple generated geometry only.

## Evidence plan

- pure RunnerModel unit tests;
- existing W1 foundation/browser regression;
- W2 production browser run;
- portrait/landscape/finish screenshots;
- unchanged artifact budgets;
- automated New Game Core Churn audit.

Expected markers:

- `W1_ARTIFACT_BUDGET_PASS`
- `W2_NEW_GAME_CORE_CHURN_PASS`
- `W2_RUNNER_PROOF_PASS`

Do not merge before all mandatory evidence passes.
