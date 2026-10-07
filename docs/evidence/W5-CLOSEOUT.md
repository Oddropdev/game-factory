# W5 — Factory Extraction Closeout

Date: 2026-10-07

Status: **PASS**

## Exit criteria

| Gate | Result |
|---|---|
| evidence-backed lifecycle extraction | PASS |
| registry-based game selection | PASS |
| shared viewport Y projection | PASS |
| create-game automation | PASS |
| overwrite protection | PASS |
| CLI dry-run path | PASS |
| GameSpec / LevelSpec conventions | PASS |
| TypeScript | PASS |
| ESLint | PASS |
| unit tests | **18/18 PASS** |
| Foundation browser regression | PASS |
| Runner browser regression | PASS |
| Collector browser regression | PASS |
| Physics browser regression | PASS |
| browser suite | **4/4 PASS** |
| artifact budget | PASS |
| external runtime references | 0 / PASS |
| static extraction contract | PASS |
| gameplay semantics unchanged | PASS |
| premature generic mechanics absent | PASS |

## Factory surface after W5

```text
src/factory/
  GameModule.ts
  GameRegistry.ts

src/runtime/
  ViewportRuntime.ts
    normalized X ↔ world X
    normalized Y ↔ world Y
    visible world height
```

`src/main.ts` is now engine/bootstrap code rather than a growing family router.

## Measured ROI

```text
main.ts LOC                  185 -> 98
game-family comparisons       12 -> 0
concrete game imports          6 -> 0
duplicated Y helpers           4 -> 0
visible-height duplicates      3 -> 0
gzip bundle             52,042 -> 52,053 B
```

The extraction removes substantial agent wiring while adding essentially no bundle weight.

## New-game workflow

Before W5, a new family required manual entrypoint/registry/test wiring.

After W5:

```text
npm run create-game -- --id <game-id>
        ↓
GameModule stub
        +
family TestBridge
        +
Playwright contract
        +
registry wiring
        ↓
agent implements game-specific Course / Model / Game behavior
```

The generator intentionally does **not** invent mechanics, Course, Model, GameSpec or LevelSpec schemas. Those remain game/family-owned.

## Three-family evidence retained

The extraction was performed only after:

```text
Runner             PASS
Collector/Builder  PASS
Physics/Puzzle     PASS
```

and the same four production-browser contracts still pass after the refactor.

## Workflow result

Human-local execution: **0**.

Implementation, refactor, generator creation, temporary-repo automation test, browser regression, artifact measurement and closeout were performed through the repository workflow.

## Next

`W6 — DISTRIBUTION ADAPTERS`

## Marker

`W5_FACTORY_EXTRACTION_PASS`
