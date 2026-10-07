# W5 — Factory Extraction Contract

Date: 2026-10-07

Status: **ACCEPTED**

## Mission

Extract only the shared factory surface justified by W2–W4 evidence.

W5 is a refactor/proof slice. It must not add a fourth gameplay family or change accepted gameplay semantics.

## Evidence entering W5

Three materially different families have passed on the same foundation:

- W2 Runner;
- W3 Collector / Builder;
- W4 Physics / Puzzle.

All three reached PASS without shared-foundation production rewrites.

## Accepted extraction surface

W2–W4 demonstrate enough repetition to extract exactly these shared surfaces:

1. a minimal common game lifecycle/input contract;
2. one registry-based game-selection boundary;
3. viewport-wide normalized Y ↔ world Y conversion;
4. visible-world-height calculation;
5. `create-game` automation that wires a new game into the registry and creates its minimum browser contract;
6. GameSpec / LevelSpec **conventions**, without universal cross-family runtime schemas.

## Explicit non-extractions

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
- detailed test-state payloads;
- save/progression;
- analytics;
- rendering;
- ECS;
- universal GameSpec / LevelSpec runtime types.

Course → Model → Game remains a convention, not an inheritance hierarchy.

Family-specific TestBridges remain family-specific because their detailed evidence payloads are intentionally different.

## Minimal factory contract

The shared game contract contains only:

```text
init
update(input)
render
renderHud
restart
foundationState
```

Input contains only the already-proven pointer state:

```text
pointerPressed
pointerDown
pointerWorldX
pointerWorldY
```

## Registry rule

`src/main.ts` must not know concrete game classes.

Adding a family is performed through the factory registry rather than repeated lifecycle branches in the engine entrypoint.

The registry contains stable automation markers used by `tools/create-game.mjs`.

## create-game rule

The supported entrypoint is:

```text
npm run create-game -- --id mass-runner
```

The automation must:

- validate the game id;
- refuse accidental overwrite;
- create a `GameModule` implementation;
- create a game-specific TestBridge;
- create a Playwright browser contract;
- update the central registry;
- support `--dry-run`.

The automation itself must pass an isolated temporary-repository smoke test.

## GameSpec / LevelSpec convention

W5 standardizes data conventions only.

Family-local specs may be introduced when variants or multiple levels justify them. Shared cross-family GameSpec / LevelSpec runtime types remain out of scope until new evidence supports them.

See:

`docs/architecture/GAME-SPEC-LEVEL-SPEC-CONVENTIONS.md`

## Viewport extraction rule

The following repeated math belongs in `ViewportRuntime`:

- visible world height;
- normalized Y → world Y;
- world Y → normalized Y.

No generic camera-policy abstraction is authorized.

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

Required evidence:

- `src/main.ts` non-empty LOC < 120;
- game-selection branches in `src/main.ts` = 0;
- concrete game imports in `src/main.ts` = 0;
- GameModule implementations = 3;
- duplicated game-local normalized-Y helpers = 0;
- duplicated game-local visible-height formulas = 0;
- no generic mechanics/ECS layer;
- no universal shared GameSpec / LevelSpec runtime files.

Expected markers:

- `W5_CREATE_GAME_AUTOMATION_PASS`
- `W5_FACTORY_EXTRACTION_CONTRACT_PASS`

## Exit criteria

W5 closes only after:

- typecheck PASS;
- lint PASS;
- all unit tests PASS;
- create-game automation smoke PASS;
- all four browser contracts PASS;
- artifact budget PASS;
- static extraction gate PASS;
- GameSpec / LevelSpec conventions documented;
- no gameplay semantic regressions;
- closeout records what was deliberately **not** abstracted.

Expected final marker:

`W5_FACTORY_EXTRACTION_PASS`
