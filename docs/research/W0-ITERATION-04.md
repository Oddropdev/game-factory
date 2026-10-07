# W0 Skeleton Hunt — Iteration 04

Date: 2026-10-07

Status: **COUNTERFACTUAL SWEEP PASS / ONE MATERIAL CHALLENGER FOUND**

## Why this iteration exists

Iterations 01–03 increasingly confirmed Phaser. That creates confirmation-bias risk.

Iteration 04 deliberately searched for engines and toolchains that could make the original Phaser decision wrong for the actual mission:

> minimum-human-work production of many fast web / YouTube-compatible / playable-ad games.

This was not another generic starter hunt. It was a **disconfirming challenger sweep**.

## Search result

Seven alternative-engine/search families produced 20 unique public candidates, then current official projects were inspected directly.

Primary challengers inspected:

- `KilledByAPixel/LittleJS@8f863c14d114e984a59f42c6ef4b98093581f677`
- `KilledByAPixel/LittleJS-AI@3fbbdc1558cec691546f73a68fea9775ed76b501`
- `excaliburjs/Excalibur@2c37dbd6fa4b94eebd0076d9cfd84b96f1aa8f2b`
- `excaliburjs/template-ts-vite@1d7223527eb23b86b63243e5c6b0da87347d2f91`
- `kaplayjs/kaplay@c32349fb375c907dfa22da45f37c7ac9a760e2a2`
- `kaplayjs/create-kaplay@1bc4379c575a8dabade4445b5a4b5f5db7852ceb`
- `melonjs/melonJS@d31bb8cf69134101e4dcf3f0fe63c289972e2a2a`
- `melonjs/typescript-boilerplate@b0aa00194b3eeb0de251722710dbdc2766133c4c`
- `pixijs/pixijs@3910339dc70b1eea86a6ab28e71eaf65d3b73031`

## Challenger 1 — LittleJS

### Why it matters

LittleJS is not a trivial toy candidate.

Observed current state:

- engine package `1.25.0`
- MIT license
- TypeScript declarations
- Vite starter
- browser tests
- mouse / keyboard / gamepad / touch
- arcade physics
- particles
- sound
- scene system
- 2D + lightweight 3D
- single-file / size-coding orientation
- current AI-specific toolkit under `KilledByAPixel/LittleJS-AI`
- LittleJS-AI is also MIT licensed
- LittleJS-AI contains starter templates, helper modules, agent instructions and a game-scaffolding skill
- its README points to 50+ finished games produced with the tooling

Distribution fit is unusually strong:

- games can run directly from `file://`;
- an AI toolkit build path can emit a self-contained HTML + zip;
- the engine is explicitly optimized for small HTML5 game artifacts.

Current dist metadata shows:

- `littlejs.min.js`: ~436 KB raw
- `littlejs.esm.min.js`: ~535 KB raw

This is not directly comparable to a gzipped Phaser figure, but it confirms that LittleJS has a genuinely small runtime surface.

### Why it threatens the Phaser decision

Our north-star is not “most capable framework.”

It is:

> shortest reliable path from game idea to tested distributable artifact with minimal human work.

LittleJS-AI is explicitly built for that workflow.

This means LittleJS wins or plausibly wins on:

- AI-first scaffolding;
- tiny conceptual API;
- self-contained playable packaging;
- low artifact overhead;
- rapid one-file / few-file prototypes;
- ready-made game-generation conventions.

### Why it does not automatically win

Phaser still has material advantages:

- much larger ecosystem and example corpus;
- broader battle-tested game feature surface;
- explicit scene lifecycle and mature loader/input/physics abstractions;
- official Phaser AI skills inside the engine repository;
- more conventional TypeScript/Vite production structure;
- explicit first-class positioning for YouTube Playables;
- likely lower architectural migration risk once games become larger than prototypes.

LittleJS-AI also leans heavily toward global JavaScript/simple-file workflows. It supports TypeScript through the engine declarations and Vite starter, but the AI toolkit's fastest path is less strongly TypeScript-first than the architecture we originally planned.

### Verdict

**REAL CHALLENGER. STATIC RESEARCH IS NOT ENOUGH TO ELIMINATE IT.**

## Challenger 2 — Excalibur

Observed current state:

- engine `0.32.0`
- BSD-2-Clause
- TypeScript-first engine
- official Vite/TypeScript template
- template already contains Playwright integration
- engine itself uses modern Vitest/browser testing

This is a cleaner technical challenger than expected.

Strengths:

- strongest TypeScript-first story among the challengers;
- official browser testing in the starter;
- 2D game-engine semantics rather than renderer-only primitives;
- permissive license.

Weaknesses for this specific factory:

- smaller ecosystem and example surface than Phaser;
- no equally strong dedicated AI game-factory toolkit found in this pass;
- no obvious distribution advantage over Phaser/LittleJS for playable ads.

Verdict: **credible #3, but no reason yet to displace Phaser/LittleJS.**

## Challenger 3 — melonJS

Observed current state:

- MIT
- active TypeScript/Vite ecosystem
- WebGPU / WebGL2 / Canvas fallback
- current README claims ~250 KB minzipped full engine
- physics, tilemaps, audio, input, cameras, tweens, particles, UI
- official TypeScript boilerplate

This is technically impressive and modern.

It loses on the primary mission because its strongest differentiators are renderer breadth, 2.5D/3D capabilities and engine completeness, while the first factory needs extremely fast AI-authored hypercasual iteration.

Verdict: **excellent technical engine; weaker fit than Phaser/LittleJS for W1.**

## Challenger 4 — KAPLAY

Observed:

- MIT
- JavaScript + TypeScript
- official `create-kaplay`
- Vite
- fast component-oriented game API
- simple game-generation surface

Risk:

- default branch currently identifies itself as `4000.0.0-alpha.27.1`;
- the official scaffolder still targets the stable 3001 line by default;
- current major-line transition adds version-selection risk.

Verdict: **high prototyping appeal, but unnecessary version-risk for the first production baseline.**

## Challenger 5 — PixiJS

Observed:

- PixiJS `8.22.0`
- MIT
- TypeScript
- WebGL/WebGPU
- asset loader
- mouse/multitouch
- current repo also ships skills

PixiJS remains primarily a rendering/interaction library rather than a complete opinionated game engine.

Choosing it would make Game Factory own more of:

- scene lifecycle;
- physics;
- game-state conventions;
- gameplay infrastructure.

That is opposite to the minimum-human-work mission.

Verdict: **NO for W1 primary engine; useful rendering option only if a later product demands it.**

## Counterfactual result

The extra sweep was worthwhile.

It did **not** overturn Phaser immediately, but it found one alternative that is too aligned with the mission to dismiss on static evidence:

> **LittleJS + LittleJS-AI**

Therefore W0 should **not** close yet.

Another broad repository search would now be wasteful.

The correct final W0 action is a tiny controlled engine bakeoff:

```text
Phaser 4.2.1
vs
LittleJS 1.25.0
```

Excalibur remains a reserve candidate and does not enter the bakeoff unless one of the two primary candidates fails.

## Decision

**NO W0 closeout yet.**

Proceed to:

`W0.5 — PHASER vs LITTLEJS MICRO-BAKEOFF`

Then close W0 immediately after the bakeoff unless it exposes a new blocker.

This is the final allowed engine-selection investigation. No further broad hunts after W0.5.
