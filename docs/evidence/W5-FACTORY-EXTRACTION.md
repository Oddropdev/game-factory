# W5 — Factory Extraction

Status: **W5_FACTORY_EXTRACTION_PASS**

Branch: `w5-factory-extraction`

Source of truth entering W5:

- `main@9adafcbbae72a4854ad1f228c794e8b24933b7e4`
- `W4_PHYSICS_PUZZLE_PROOF_PASS`

## Mission result

W5 extracted only the factory behavior repeated across W2–W4 and left gameplay semantics family-specific.

Accepted shared surface:

- `GameModule` lifecycle/input contract;
- centralized `GameRegistry`;
- shared visible-world-height projection;
- shared normalized Y ↔ world Y projection;
- `create-game` automation;
- GameSpec / LevelSpec conventions without universal runtime schemas.

## Code-bearing verification

Accepted code-bearing head:

`446c609e54678ab64c8ebb22f9bcc8d82769668d`

Workflow:

- `W5 Factory Extraction`
- run `37689504728`
- result: **PASS**

Verification:

- TypeScript — PASS
- ESLint — PASS
- unit tests — **18/18 PASS**
- create-game automation smoke — PASS
- W1 Foundation browser contract — PASS
- W2 Runner browser contract — PASS
- W3 Collector / Builder browser contract — PASS
- W4 Physics / Puzzle browser contract — PASS
- browser suite — **4/4 PASS**

Markers:

- `W5_CREATE_GAME_AUTOMATION_PASS`
- `W1_ARTIFACT_BUDGET_PASS`
- `W5_FACTORY_EXTRACTION_CONTRACT_PASS`

## Extraction ROI

Static before/after evidence:

| Metric | W4 baseline | W5 | Delta |
|---|---:|---:|---:|
| `src/main.ts` non-empty LOC | 185 | **98** | **-87 (-47%)** |
| game-selection comparisons in `main.ts` | 12 | **0** | **-12** |
| concrete game/test imports in `main.ts` | 6 | **0** | **-6** |
| GameModule implementations | 0 | **3** | +3 |
| duplicated normalized-Y helpers | 4 | **0** | **-4** |
| duplicated visible-height formulae | 3 | **0** | **-3** |

The engine entrypoint now selects one registered module once and delegates the accepted lifecycle without family-specific branching.

## Artifact evidence

W4 baseline:

- total artifact: 143,097 bytes;
- main JS gzip: 52,042 bytes.

W5:

- total artifact: **142,758 bytes**;
- main JS: **142,188 bytes**;
- main JS gzip: **52,053 bytes**;
- main JS Brotli: **45,276 bytes**;
- external runtime references: **0**.

The extraction reduced raw artifact size by 339 bytes. Gzip changed by only +11 bytes.

The factory abstraction therefore has effectively zero production bundle cost.

## create-game automation

Supported command:

```text
npm run create-game -- --id mass-runner
```

Optional planning mode:

```text
npm run create-game -- --id mass-runner --dry-run
```

The generator now automatically:

1. creates `src/games/<id>/<Game>Game.ts`;
2. creates a game-specific TestBridge;
3. creates `tests/e2e/<id>.spec.ts`;
4. registers the game in `GameRegistry`.

The smoke test runs generation against an isolated temporary repository, verifies all files/registry edits, verifies overwrite refusal, and exercises the public CLI `--dry-run` path.

This removes manual engine-entrypoint wiring from new-game creation.

## GameSpec / LevelSpec decision

The roadmap requirement is satisfied as a convention rather than a premature universal schema.

Accepted rule:

```text
spec + seed -> deterministic family-owned course / level
```

Runner, Collector and Physics retain different family-local data semantics.

A shared cross-family GameSpec / LevelSpec type is explicitly **not** accepted in W5.

## Visual regression evidence

The W5 browser suite regenerated Runner, Collector / Builder and Physics / Puzzle evidence.

Inspection showed no visible regression after extraction:

- Runner portrait/landscape/finish remained valid;
- Collector portrait/landscape/completion remained valid;
- Physics failed-shot/trajectory/solved states remained valid.

No gameplay or camera correction was required.

## CI efficiency

Closed W1–W4 phase jobs are now restricted to their own historical phase branches or manual dispatch.

Future active-phase changes therefore do not reinstall dependencies and Chromium four extra times merely because historical workflow files remain in the repository.

The active phase remains responsible for full regression.

## Deliberately not abstracted

W5 did not add:

- `src/mechanics/`;
- ECS;
- generic movement;
- generic collection/inventory;
- generic construction;
- generic physics;
- generic puzzle logic;
- universal course/model base classes;
- universal detailed test-state payload;
- universal GameSpec / LevelSpec runtime types;
- distribution/platform adapters.

These remain evidence-gated.

## W6 handoff

W5 completes the factory-extraction roadmap requirement.

Next:

**W6 — Distribution Adapters**

W6 should keep platform SDKs outside gameplay and preserve the same GameModule/game-family code across standalone Web, YouTube Playables when access permits, and playable-ad wrappers.

## Final marker

`W5_FACTORY_EXTRACTION_PASS`
