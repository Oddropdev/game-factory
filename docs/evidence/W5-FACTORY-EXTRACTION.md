# W5 — Factory Extraction

Status: **IMPLEMENTATION CANDIDATE**

Branch: `w5-factory-extraction`

## High-ROI extraction scope

The candidate refactor extracts only four evidence-backed surfaces:

- `GameModule` + pointer input frame;
- centralized game registry;
- visible-world-height calculation;
- normalized Y/world Y projection;
- registry-safe `create-game` automation;
- GameSpec/LevelSpec conventions without universal schemas.

## Baseline duplication

Before W5:

- `src/main.ts`: 185 non-empty LOC;
- game-selection comparisons in `src/main.ts`: 12;
- concrete game/test-bridge imports in `src/main.ts`: 6;
- duplicated game-local Y conversion helpers: 4;
- duplicated visible-world-height formulas: 3.

## Deliberately left game-specific

- course schemas;
- models;
- mechanics;
- rendering;
- detailed TestBridge state;
- scoring/progression semantics.

Factory automation target:

```text
npm run create-game -- --id my-game
```

The command must create a GameModule stub, game-specific TestBridge and Playwright contract, then register the game without manual edits.

Expected markers:

- `W1_ARTIFACT_BUDGET_PASS`
- `W5_CREATE_GAME_AUTOMATION_PASS`
- `W5_FACTORY_EXTRACTION_CONTRACT_PASS`
- `W5_FACTORY_EXTRACTION_PASS`

Do not merge until behavior regression and extraction evidence both pass.
