# ADR-001 — Game Factory Engine Baseline

Date: 2026-10-07

Status: **PROVISIONAL — PENDING W0.5 PHASER vs LITTLEJS MICRO-BAKEOFF**

This decision becomes accepted project state only after W0.5 selects a winner, this ADR is updated with the final result, and the W0 pull request is merged to `main`.

## Provisional decision

Use **Phaser 4** as the leading primary engine candidate for the first Game Factory line, subject to the final W0.5 micro-bakeoff against LittleJS 1.25.0.

W1 starts from the official Phaser Vite/TypeScript template structure, but pins the current inspected Phaser engine version **4.2.1** rather than blindly copying the template's older `4.0.0` dependency.

Use:

- Phaser 4.2.1
- TypeScript
- Vite
- Vitest for pure TypeScript unit tests
- Playwright for real-browser production-build smoke tests

Use official Phaser repository skills as the primary AI-agent reference because they are part of the MIT-licensed Phaser repository.

## Context

The first factory proof targets fast mobile-first web games:

1. runner;
2. collector/builder;
3. physics/puzzle.

The project must optimize for:

- minimum human intervention;
- fast AI-authored iteration;
- browser-native delivery;
- simple touch/pointer input;
- deterministic automated testing;
- small artifacts;
- later YouTube/playable-ad adapters without platform SDKs leaking into gameplay.

## Why Phaser

Phaser already supplies the core primitives that W1 would otherwise have to recreate:

- scenes and scene lifecycle;
- loader;
- unified mouse/touch pointer input;
- responsive ScaleManager;
- global visibility/pause/resume events;
- tweens;
- particles;
- cameras;
- Arcade and Matter physics;
- TypeScript definitions;
- official AI-agent skills.

This minimizes both implementation surface and agent ambiguity.

## Why not PlayCanvas for W1

PlayCanvas is a strong MIT-licensed engine with a modern TypeScript/Vite scaffold and excellent 3D capabilities.

It is not selected for W1 because the first proof is 2D/2.5D hypercasual, where Phaser provides a smaller and more direct problem model.

PlayCanvas becomes the preferred escalation candidate when a validated concept materially requires:

- 3D scene graphs;
- models/materials/lighting;
- perspective third-person cameras;
- WebGPU-specific features;
- 3D physics as a central mechanic.

## Deliberate non-decision

We will **not** abstract Phaser and PlayCanvas behind a universal rendering interface.

That would be speculative architecture.

If a real 3D product appears, it may share platform/test/content conventions with Game Factory without sharing the renderer implementation.

## External reference policy

### Allowed source/reference categories

- MIT/Apache/BSD/ISC source may be reused when useful, with required notices.
- Official Phaser source/skills are MIT.
- `feliperyba/playable-ad-phaser` is MIT and may inform implementation.

### License-hold repositories

The following inspected repositories do not currently provide a sufficiently clear software license for code reuse:

- `Atifullah/Bus-Jam-Escape-playable`
- `Yakoub-ai/phaser4-gamedev`
- `adam0white/GameEval`
- `Samgeven/phaser-vite-template`

They may inform independently derived architecture or testing ideas, but no source text/code should be copied into Game Factory unless licensing is later resolved.

## Consequences

### Positive

- smallest credible path to the first playable;
- strong mobile-web fit;
- one engine for W1–W4;
- high AI familiarity;
- official agent guidance;
- low platform lock-in because distribution SDKs stay outside gameplay.

### Negative

- a later true-3D factory may require PlayCanvas or another engine;
- Phaser template tooling may lag the latest Vite/TypeScript majors;
- Phaser-specific scene/render code will not be portable to a 3D engine.

These costs are acceptable because premature cross-engine portability would slow the current mission.

## W1 dependency rule

W1 changes one variable at a time:

1. scaffold from the official Vite/TypeScript template structure;
2. update Phaser to 4.2.1;
3. establish build + browser smoke;
4. only then consider build-tool major upgrades if they produce measurable value.

## Revisit triggers

Revisit ADR-001 only if one of the following becomes true:

- Phaser 4.2.1 cannot satisfy the browser/runtime gates;
- bundle/runtime constraints fail materially;
- the first validated commercial concept is fundamentally 3D;
- a platform requirement is incompatible with Phaser but supported by another engine;
- W2–W4 show repeated engine-level workarounds rather than gameplay-specific work.

Do not reopen this ADR merely because another engine has newer tooling or a more attractive demo.
