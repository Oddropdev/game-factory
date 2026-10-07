# W0.5 — Phaser vs LittleJS Micro-Bakeoff Results

Date: 2026-10-07

Status: **PASS — LITTLEJS SELECTED FOR W1**

## Executive result

Both candidates passed the same production-build browser contract.

The bakeoff therefore did not decide on basic correctness. It decided on the Game Factory objective:

> minimum human work, minimum plumbing, small web artifacts, deterministic browser-verifiable games, and fast repeated production.

**Winner: LittleJS 1.25.0.**

Phaser 4.2.1 remains the preferred escalation path for more complex 2D games if LittleJS later creates material engine-level friction.

## Controlled task

Both implementations had to provide the same behavior:

- mobile-first canvas;
- horizontal pointer/mouse control;
- touch control;
- collectible collision and score;
- deterministic seeded respawn positions;
- portrait -> landscape -> desktop resize;
- pause/resume;
- deterministic restart;
- no external art assets;
- TypeScript check;
- unit test;
- production build;
- Playwright test against the production build.

Final CI:

- `W0.5 Engine Bakeoff / phaser` — PASS
- `W0.5 Engine Bakeoff / littlejs` — PASS
- `W0 Skeleton Hunt` on the same PR head — PASS

Human interventions during implementation/debugging: **0**.

## Measured production evidence

| Metric | Phaser 4.2.1 | LittleJS 1.25.0 | Result |
|---|---:|---:|---|
| Production source files | 2 | 2 | tie |
| Non-blank production LOC | 157 | 138 | LittleJS -12% |
| Direct production dependencies | 1 | 1 | tie |
| Artifact bytes | 1,377,600 | 121,613 | LittleJS 11.3x smaller |
| Main JS bytes | 1,377,094 | 121,107 | LittleJS 11.4x smaller |
| Main JS gzip | 356,942 | 45,809 | LittleJS 7.8x smaller |
| Main JS Brotli | 283,713 | 39,749 | LittleJS 7.1x smaller |
| Measured rebuild | 628 ms | 403 ms | LittleJS ~36% faster |
| Unit tests | PASS | PASS | tie |
| Production Playwright smoke | PASS | PASS | tie |
| Mouse/pointer | PASS | PASS | tie |
| Touch | PASS | PASS | tie |
| Portrait/landscape/desktop | PASS | PASS | tie |
| Pause/resume | PASS | PASS | tie |
| Deterministic restart | PASS | PASS | tie |

Build timings are CI-run measurements and are directional evidence only. They are not treated as stable performance benchmarks.

## Correction-loop evidence

Two corrections were shared harness issues rather than engine issues:

1. duplicate TypeScript global declaration between runtime and e2e test;
2. Vitest initially discovering the Playwright spec.

One additional issue was Phaser-specific:

- `Scene.restart()` is queued/asynchronous, so the deterministic restart test initially observed the old ready state before the restarted scene completed. The test was corrected to wait for `restartCount`.

No LittleJS-specific runtime/API correction was required in the final implementation path.

This is weak evidence by itself, but it is directionally consistent with the smaller LittleJS conceptual surface.

## Weighted decision

Scoring follows the pre-registered W0.5 contract.

| Category | Weight | Phaser | LittleJS |
|---|---:|---:|---:|
| AI implementation speed / correction cost | 25 | 21 | 24 |
| Browser/mobile reliability | 20 | 20 | 20 |
| Testing / determinism / observability | 15 | 15 | 15 |
| Artifact + startup footprint | 15 | 9 | 15 |
| Code simplicity / maintainability | 10 | 8 | 9 |
| TypeScript ergonomics | 5 | 5 | 4 |
| Distribution adaptability | 5 | 4 | 5 |
| Ecosystem / future headroom | 5 | 5 | 3 |
| **Total** | **100** | **87** | **95** |

The score is not a claim that LittleJS is generally a better engine than Phaser.

It is the decision for this factory mission.

## Why LittleJS wins W1

The bakeoff found no reliability penalty for the smaller engine on the required contract, while LittleJS produced a dramatically smaller distributable artifact and slightly less production code.

Its current ecosystem also contains an MIT-licensed `LittleJS-AI` project with:

- game scaffolding guidance;
- AI conventions;
- API reference skill;
- feature templates;
- single-file/self-contained distribution patterns.

This aligns unusually well with the project's north star: repeated AI-authored small games rather than one large game.

## Why Phaser stays important

Phaser retains clear advantages:

- larger ecosystem and example corpus;
- mature scene semantics;
- broader built-in game abstractions;
- stronger TypeScript-first conventional project shape;
- explicit YouTube Playables positioning;
- more headroom for complex 2D projects.

Therefore the engine ladder is:

```text
FAST 2D / HYPERCASUAL / PLAYABLE FACTORY
LittleJS
    |
    | escalate if engine friction becomes material
    v
COMPLEX 2D
Phaser 4
    |
    | true 3D requirement
    v
3D
PlayCanvas
```

Do not abstract these engines behind a universal renderer.

## Important caveat

The bakeoff tested a deliberately small game loop.

It does **not** prove that LittleJS will outperform Phaser for every W2–W4 game family.

That uncertainty is handled by explicit revisit triggers rather than further W0 research.

## Revisit triggers

Re-open the engine decision only if W2–W4 show one of these:

- repeated custom plumbing for ordinary game features;
- browser/mobile bugs not reproducible in Phaser;
- poor TypeScript ergonomics materially slowing agents;
- physics/puzzle requirements forcing excessive custom work;
- a distribution platform requirement LittleJS cannot satisfy cleanly;
- a validated game concept grows beyond LittleJS's efficient complexity envelope.

Until then, W1 uses LittleJS.
