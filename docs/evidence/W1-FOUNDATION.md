# W1 — Factory Foundation

Status: **W1_FACTORY_FOUNDATION_PASS**

Branch: `w1-factory-foundation`

Source of truth entering W1:

- `main@94f51237759524516b7093e01bc5345d60cc25af`
- `W0_SKELETON_HUNT_PASS`
- ADR-001: LittleJS 1.25.0 + TypeScript + Vite

## Mission result

W1 implemented the smallest production-grade LittleJS foundation that W2 Runner Proof can build on without introducing speculative game-factory abstractions.

## Accepted production surface

- LittleJS 1.25.0 runtime
- TypeScript 6.0.3
- Vite 8.3.2 production build
- ESLint + TypeScript lint gate
- Vitest deterministic RNG tests
- Playwright production-build browser gate
- thin `PlatformBridge`
- standalone `WebPlatform`
- lifecycle pause/resume runtime
- viewport normalization runtime
- deterministic seeded state
- narrow browser `TestBridge`
- artifact size/offline-reference gate
- CI evidence artifact

## Production browser evidence

Accepted W1 workflow run:

- workflow: `W1 Factory Foundation`
- run: `37676773751`
- head: `102a536d3ad4c68db4644bb4a114a1913b047193`
- result: **PASS**

Verified against the production Vite build:

- 390 × 844 portrait — PASS
- mouse/pointer path — PASS
- touch path — PASS
- pause/resume — PASS
- 844 × 390 landscape resize — PASS
- deterministic seeded restart — PASS
- 1280 × 720 desktop resize — PASS
- page errors — 0
- unexpected console errors — 0
- failed required requests — 0

Unit evidence:

- deterministic replay test — PASS
- RNG range test — PASS

## Artifact evidence

Internal budgets:

- total artifact < 512,000 bytes
- main JS gzip < 153,600 bytes
- external runtime references = 0

Measured:

- total artifact: **123,005 bytes**
- main JS: **122,435 bytes**
- main JS gzip: **46,307 bytes**
- main JS Brotli: **40,147 bytes**
- external runtime references: **0**
- Vite production build observed in accepted run: **159 ms**

Result:

`W1_ARTIFACT_BUDGET_PASS`

The timing value is evidence from one GitHub runner and is not a stable performance benchmark.

## Correction-loop evidence

The first W1 run exposed a real touch-path issue:

- a fast touch tap could set `mouseWasPressed(0)` without remaining down long enough for the separate `mouseIsDown(0)` branch to update normalized pointer state.

The implementation was corrected so a press **or** held pointer updates the position, while only the press increments the event counter.

The next production-browser run passed the full contract.

This is useful W2 evidence: pointer-state mutation must be driven by edge events as well as held-state polling.

## Architecture audit

W1 remains within the locked contract.

No mechanics, ECS, generic system hierarchy, GameSpec, LevelSpec, save/progression, analytics, YouTube SDK, MRAID/AppLovin, editor, asset-generation pipeline, or cross-engine renderer abstraction was introduced.

LittleJS still owns rendering, canvas creation, input and the main loop. Game Factory adds only the boundaries demonstrated by W1 evidence.

## Security / dependency boundary

Normal CI executes only:

- Game Factory code;
- explicitly selected npm dependencies;
- Chromium installed for Playwright.

Arbitrary Skeleton Hunt candidate repositories are not executed.

Top-level dependency versions are exact. The W1 CI evidence artifact also captures the generated npm lockfile used for that run.

## W2 handoff

W2 may now introduce the first real gameplay family:

**Runner Proof — forward movement + steering + collection + gates + obstacles + finish.**

W2 must reuse the accepted lifecycle, viewport/input behavior, deterministic state, platform boundary and browser evidence path before proposing new shared abstractions.

## Final marker

`W1_FACTORY_FOUNDATION_PASS`
