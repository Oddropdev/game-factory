# W3 — Collector / Builder Proof

Status: **IMPLEMENTATION CANDIDATE**

Branch: `w3-collector-builder-proof`

## Mission

Add a second, structurally different gameplay family without changing the accepted shared foundation or the existing runner implementation.

## Candidate loop

```text
move freely in 2D
      ↓
collect resources
      ↓
carry up to 3
      ↓
deposit at build zone
      ↓
advance construction
      ↓
repeat
      ↓
complete after 6 resources
```

## Evidence plan

- deterministic pure model tests;
- W1 browser regression;
- W2 runner browser regression;
- W3 production browser test;
- mouse + touch interaction;
- portrait/landscape/completion screenshots;
- unchanged artifact budget;
- automated shared-foundation + prior-runner churn audit.

Expected markers:

- `W1_ARTIFACT_BUDGET_PASS`
- `W3_NEW_GAME_CORE_CHURN_PASS`
- `W3_COLLECTOR_BUILDER_PROOF_PASS`

Do not merge before all mandatory evidence passes.
