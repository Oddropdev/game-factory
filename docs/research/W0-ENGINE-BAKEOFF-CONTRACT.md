# W0.5 — Phaser vs LittleJS Micro-Bakeoff Contract

Status: **REQUIRED BEFORE W0 CLOSEOUT**

## Mission

Resolve the only material uncertainty left by W0:

> For an AI-native rapid web-game factory, does Phaser 4.2.1 or LittleJS 1.25.0 produce the better minimum-human-work foundation?

This is not a feature competition.

It is a controlled implementation experiment.

## Candidates

### A — Phaser

- Phaser 4.2.1
- TypeScript
- Vite
- official Phaser skills as agent reference

### B — LittleJS

- LittleJS 1.25.0
- TypeScript where practical
- Vite
- official MIT LittleJS-AI conventions/templates as agent reference

## Same task for both engines

Build the smallest equivalent interactive foundation:

- 390×844 mobile-first canvas;
- one player primitive;
- one target/collectible primitive;
- pointer/touch input moves the player horizontally;
- collision/collection increments score;
- deterministic seeded spawn positions;
- visible score;
- resize to 844×390 without state corruption;
- pause/resume lifecycle;
- restart returns deterministic initial state;
- no external art assets;
- production build;
- browser smoke test.

No engine-specific decorative features.

## Required evidence per candidate

Record:

- implementation elapsed agent time;
- number of human interventions;
- production source file count;
- production LOC;
- direct dependency count;
- build artifact bytes;
- main JS bytes;
- gzip/brotli where easy to measure;
- build duration;
- TypeScript/lint/test status;
- Playwright smoke result;
- portrait result;
- landscape result;
- pointer/touch result;
- lifecycle result;
- deterministic restart result;
- number of engine-specific workarounds;
- number of agent correction loops;
- qualitative code clarity;
- ease of exposing stable TestBridge state.

## Weighting

The decision prioritizes the actual factory mission:

- AI implementation speed / correction count: **25**
- browser/mobile reliability: **20**
- testing / determinism / observability: **15**
- artifact + startup footprint: **15**
- code simplicity / maintainability: **10**
- TypeScript ergonomics: **5**
- distribution adaptability: **5**
- ecosystem / future headroom: **5**

Total: 100.

## Guard against benchmark gaming

The implementation must use normal recommended engine patterns.

Do not:

- strip required engine functionality only to win size;
- hand-minify source;
- omit tests from one candidate;
- use Phaser features for one candidate but custom code for the other unless required;
- count documentation/examples as implementation LOC.

## Decision rule

### Select LittleJS if

it materially reduces implementation/correction cost and artifact complexity while matching Phaser on browser reliability, testability and lifecycle behavior.

### Select Phaser if

LittleJS's size/simplicity advantage is small, or LittleJS requires noticeably more custom architecture/test plumbing for the same reliability.

### Escalate to Excalibur only if

both Phaser and LittleJS fail a mandatory gate or neither can produce a clean TypeScript/browser-testable foundation.

## Mandatory gates

A candidate cannot win if any of these fail:

- production build;
- portrait browser smoke;
- landscape browser smoke;
- pointer/touch interaction;
- deterministic restart;
- lifecycle pause/resume;
- no uncaught page errors;
- permissive commercial license.

## W0 closeout rule

After the bakeoff:

1. record results in `W0-ENGINE-BAKEOFF-RESULTS.md`;
2. update ADR-001 with the winning engine;
3. write `W0-CLOSEOUT.md`;
4. mark `W0_SKELETON_HUNT_PASS`;
5. merge PR #1;
6. start W1 using only the winning baseline.

No further engine search unless the bakeoff itself exposes a blocker.
