# W0 — Game Factory Skeleton Hunt Closeout

Date: 2026-10-07

Status: **W0_SKELETON_HUNT_PASS**

## Mission result

W0 answered the question it was created to answer:

> What is the smallest commercially safe, AI-friendly technical foundation for a repeatable web-game production factory?

Accepted answer:

**LittleJS 1.25.0 + TypeScript + Vite**, with Vitest and Playwright evidence gates.

Phaser 4 is the complex-2D escalation path.

PlayCanvas is the true-3D escalation path.

## Evidence completed

### W0.1 — Broad discovery — PASS

- 68 unique public repositories considered.
- official engine/template anchors included.
- generic search was shown to be too noisy to decide the baseline by popularity.

### W0.2 — Pattern hunt — PASS

- 50 targeted candidates across responsive/input/testing/playable/runner/AI patterns.
- useful patterns identified without adopting old starter kits wholesale.

### W0.3 — Source-level inspection — PASS

- current engine/template sources inspected;
- exact W1 boundaries drafted;
- license-hold repositories separated from reusable permissive source;
- Phaser initially emerged as the strongest conventional baseline.

### W0.4 — Counterfactual challenger sweep — PASS

A deliberate anti-confirmation search inspected:

- LittleJS;
- Excalibur;
- melonJS;
- KAPLAY;
- PixiJS;
- PlayCanvas as the existing 3D challenger.

This found LittleJS + LittleJS-AI as a material mission-aligned challenger and prevented premature Phaser lock-in.

### W0.5 — Phaser vs LittleJS micro-bakeoff — PASS

Both candidates independently passed:

- TypeScript;
- unit tests;
- production build;
- production Playwright smoke;
- mouse/pointer;
- touch;
- portrait/landscape/desktop resize;
- pause/resume;
- deterministic restart;
- clean runtime error gates.

Measured evidence strongly favored LittleJS on artifact footprint while preserving correctness.

Result:

**LittleJS selected.**

## License audit

Production/runtime bakeoff dependencies:

- Phaser 4.2.1 — MIT;
- LittleJS 1.25.0 — MIT.

LittleJS-AI was inspected as an MIT-licensed workflow/template source but is not a production runtime dependency.

No code from license-hold repositories was adopted.

License-hold repositories remain documentation-only idea/evidence references.

## Security audit

W0 did not execute arbitrary third-party search candidates in privileged Game Factory CI.

Only selected package dependencies and Game Factory's own bakeoff code were executed.

The Skeleton Hunt workflow remains static-inspection oriented.

## Automation result

W0 produced a repeatable Skeleton Hunt harness with:

- `general` profile;
- `patterns` profile;
- configurable candidate counts;
- concurrent metadata enrichment;
- PR/manual GitHub Actions execution;
- machine-readable artifacts.

The research process can be re-run later without reopening W0.

## Human-work result

The W0 research, repo changes, CI debugging, bakeoff and evidence collection required **no local human execution**.

This validates the desired operating model for the project:

> GPT performs repository work, tests, evidence and closeout; human input is reserved for subjective gameplay/visual decisions and account-bound platform actions.

## Accepted W1 handoff

Source of truth after merge:

- `docs/architecture/ADR-001-ENGINE-BASELINE.md`
- `docs/architecture/W1-FOUNDATION-CONTRACT.md`
- `docs/research/W0-ENGINE-BAKEOFF-RESULTS.md`

W1 mission:

**Factory Foundation on LittleJS.**

W1 must not reopen engine selection unless an ADR-001 revisit trigger is actually hit.

## Final marker

`W0_SKELETON_HUNT_PASS`
