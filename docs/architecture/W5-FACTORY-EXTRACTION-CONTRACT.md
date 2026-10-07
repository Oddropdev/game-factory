# W5 — Factory Extraction Contract

Date: 2026-10-07

Status: **LOCKED FOR W5**

## Mission

Extract only the shared factory surface justified by W2–W4 evidence.

W5 is a refactor/proof slice. It must not add a fourth gameplay family or change accepted gameplay semantics.

## Evidence entering W5

Three materially different families have passed on the same foundation:

- W2 Runner;
- W3 Collector / Builder;
- W4 Physics / Puzzle.

All three reached PASS without shared-foundation production rewrites.

## Accepted extraction candidates

W2–W4 demonstrate enough repetition to extract:

1. a minimal common game lifecycle/input contract;
2. one registry-based game-selection boundary;
3. viewport-wide normalized Y/world Y conversion;
4. visible-world-height calculation.

## Explicit non-extractions

W5 documents GameSpec/LevelSpec **conventions**, but must not create universal cross-family GameSpec/LevelSpec runtime types.

W5 must **not** generalize:

- movement;
- collection;
- gates;
- inventory;
- construction;
- physics;
- puzzles;
- course schemas;
- model base classes;
- test-state payloads;
- save/progression;
- analytics;
- rendering;
- ECS;
- GameSpec;
- LevelSpec.

Course → Model → Game remains a documented convention, not an inheritance hierarchy.

Family-specific TestBridges remain family-specific because their detailed evidence payloads are intentionally different.

## Minimal factory contract

The shared game contract may contain only:

```text
init
update(input)
render
renderHud
restart
foundationState
```

Input may contain only the already-proven pointer state:

```text
pointerPressed
pointerDown
pointerWorldX
pointerWorldY
```

## Registry rule

`src/main.ts` must stop knowing concrete game classes.

Adding a family should require registration in one factory registry rather than repeated lifecycle branches in the engine entrypoint.

## Viewport extraction rule

The following repeated math belongs in `ViewportRuntime`:

- visible world height;
- normalized Y → world Y;
- world Y → normalized Y.

No camera-policy abstraction is authorized.

## Behavior gate

After extraction, the unchanged acceptance behavior must still pass:

- W1 Foundation;
- W2 Runner;
- W3 Collector / Builder;
- W4 Physics / Puzzle.

## Artifact gate

W1 budgets remain unchanged:

- total artifact < 500 KiB;
- main JS gzip < 150 KiB;
- external runtime references = 0.

Extraction must not justify a larger budget.

## Static extraction gate

Expected evidence:

- `src/main.ts` non-empty LOC < 120;
- game-selection branches in `src/main.ts` = 0;
- concrete game imports in `src/main.ts` = 0;
- GameModule implementations = 3;
- duplicated game-local normalized-Y helpers = 0;
- duplicated game-local visible-height formulas = 0;
- no `src/mechanics/`, ECS, GameSpec or LevelSpec.

The create-game automation must pass an isolated temporary-repository smoke test and refuse accidental overwrite.

Expected markers:

- `W5_CREATE_GAME_AUTOMATION_PASS`
- `W5_FACTORY_EXTRACTION_CONTRACT_PASS`

## Exit criteria

W5 closes only after:

- typecheck PASS;
- lint PASS;
- all unit tests PASS;
- all four browser contracts PASS;
- artifact budget PASS;
- static extraction gate PASS;
- no gameplay semantic regressions;
- closeout records what was deliberately **not** abstracted.

Expected final marker:

`W5_FACTORY_EXTRACTION_PASS`
