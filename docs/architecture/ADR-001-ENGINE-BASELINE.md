# ADR-001 — Game Factory Engine Baseline

Date: 2026-10-07

Status: **ACCEPTED**

## Decision

Use **LittleJS 1.25.0** as the primary engine for the first Game Factory line.

Use:

- LittleJS 1.25.0;
- TypeScript;
- Vite;
- Vitest for pure TypeScript unit tests;
- Playwright for real-browser production-build verification.

The official MIT-licensed `LittleJS-AI` repository may be used as an AI-workflow and template reference.

Phaser 4 is retained as the explicit complex-2D escalation path.

PlayCanvas is retained as the explicit true-3D escalation path.

## Context

The first factory proof targets fast mobile-first web games:

1. runner;
2. collector/builder;
3. physics/puzzle.

The project optimizes for:

- minimum human intervention;
- fast AI-authored iteration;
- browser-native delivery;
- touch/pointer input;
- deterministic automated testing;
- small artifacts;
- later YouTube/playable-ad adapters without platform SDKs leaking into gameplay.

## Evidence

W0 performed:

- broad starter discovery;
- pattern-focused discovery;
- source-level architecture inspection;
- a counterfactual alternative-engine sweep;
- a controlled Phaser 4.2.1 vs LittleJS 1.25.0 implementation bakeoff.

Both engines passed the same browser/mobile/determinism/lifecycle contract.

LittleJS produced:

- 138 non-blank production LOC vs Phaser's 157;
- 121,613-byte total artifact vs Phaser's 1,377,600 bytes;
- 45,809-byte gzip main JS vs Phaser's 356,942 bytes;
- 403 ms measured rebuild vs Phaser's 628 ms in the same CI class;
- no engine-specific correction loop in the final implementation path.

The decisive point is not raw size alone.

LittleJS matched the required correctness gates while requiring a smaller runtime and a slightly smaller implementation surface.

See `docs/research/W0-ENGINE-BAKEOFF-RESULTS.md`.

## Engine ladder

### Default — LittleJS

Use for:

- hypercasual;
- small web games;
- playable-ad style games;
- fast mechanic prototypes;
- procedural/simple-art games;
- the W1–W4 factory proof unless a revisit trigger fires.

### Escalation — Phaser 4

Use when a validated product materially benefits from:

- a larger 2D ecosystem;
- richer scene/game abstractions;
- more complex loader/animation/tween/physics workflows;
- Phaser-specific platform support;
- complexity that causes repeated LittleJS plumbing.

### 3D escalation — PlayCanvas

Use when the validated product materially requires:

- 3D scene graphs;
- models/materials/lighting;
- perspective third-person cameras;
- WebGPU-oriented 3D rendering;
- 3D physics as a core mechanic.

## No universal engine abstraction

Do **not** create a `RenderEngine` interface spanning LittleJS, Phaser and PlayCanvas.

Shared factory concepts may exist above the renderer later, but only after real W2–W4 evidence.

Premature engine-neutral rendering would increase code and agent ambiguity without serving the current mission.

## W1 rule

W1 starts with the smallest TypeScript/Vite LittleJS foundation that can prove:

- production build;
- browser runtime;
- pointer/touch;
- resize;
- pause/resume;
- deterministic restart;
- test observability;
- artifact budgets.

Do not import the full LittleJS-AI toolkit into production by default.

Use only the engine plus independently selected patterns/helpers that earn their place.

## External reference policy

Permissive source may be reused when useful with required notices.

Confirmed permissive references include:

- LittleJS — MIT;
- LittleJS-AI — MIT;
- Phaser — MIT;
- `feliperyba/playable-ad-phaser` — MIT;
- PlayCanvas — MIT;
- Excalibur — BSD-2-Clause.

Repositories with unclear software licensing remain idea/evidence references only.

## Consequences

### Positive

- very small runtime/distribution footprint;
- simple API surface for AI agents;
- current dedicated AI tooling and game templates;
- strong fit for self-contained web/playable output;
- deterministic/headless capabilities already exist in the engine;
- W0.5 proved the required mobile/browser contract.

### Negative

- smaller ecosystem than Phaser;
- less conventional TypeScript-first structure in some official AI examples;
- complex 2D games may eventually benefit from Phaser;
- a true 3D product still needs a different engine.

These are accepted risks.

## Revisit triggers

Revisit ADR-001 only if evidence from W2–W4 shows:

- repeated engine-level workarounds;
- material browser/mobile failures;
- agent productivity degradation from API/project ergonomics;
- physics/puzzle needs that are materially easier in Phaser;
- a platform integration that cannot be isolated cleanly;
- a validated game concept outside LittleJS's efficient complexity envelope.

Do not reopen this ADR because another engine has more features, a newer release, or a more attractive demo.
