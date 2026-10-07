# W1 — Factory Foundation

Status: **IMPLEMENTATION CANDIDATE**

Branch: `w1-factory-foundation`

Source of truth entering W1:

- `main@94f51237759524516b7093e01bc5345d60cc25af`
- `W0_SKELETON_HUNT_PASS`
- ADR-001: LittleJS 1.25.0 + TypeScript + Vite

## Mission

Implement the smallest production-grade LittleJS foundation that W2 Runner Proof can build on without introducing speculative game-factory abstractions.

## Implemented surface

- LittleJS 1.25.0 runtime
- TypeScript 6
- Vite production build
- ESLint + TypeScript lint gate
- Vitest deterministic RNG test
- Playwright production-build browser gate
- thin `PlatformBridge`
- standalone `WebPlatform`
- lifecycle pause/resume runtime
- viewport normalization runtime
- deterministic seeded state
- narrow browser `TestBridge`
- artifact size/offline-reference gate
- CI evidence artifact

## Explicitly absent

W1 does not introduce:

- mechanics;
- ECS;
- GameSpec/LevelSpec;
- save/progression;
- analytics;
- YouTube SDK;
- MRAID/AppLovin;
- editor tooling;
- asset-generation pipeline;
- cross-engine renderer abstraction.

## Gate

Expected closeout marker:

`W1_FACTORY_FOUNDATION_PASS`

Do not merge until the W1 workflow proves the production build against the accepted contract.
