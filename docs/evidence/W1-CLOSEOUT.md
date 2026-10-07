# W1 — Factory Foundation Closeout

Date: 2026-10-07

Status: **PASS**

## Exit-criteria audit

| Gate | Result |
|---|---|
| LittleJS 1.25.0 baseline | PASS |
| TypeScript | PASS |
| lint | PASS |
| deterministic unit tests | PASS |
| Vite production build | PASS |
| artifact budget | PASS |
| offline/runtime-reference check | PASS |
| production Playwright smoke | PASS |
| portrait | PASS |
| touch | PASS |
| mouse/pointer | PASS |
| landscape resize | PASS |
| desktop resize | PASS |
| pause/resume | PASS |
| deterministic restart | PASS |
| page/runtime errors | PASS |
| speculative architecture absent | PASS |

## Accepted lessons

1. Keep LittleJS as the owner of engine primitives rather than wrapping canvas/input/rendering.
2. Preserve normalized horizontal state across viewport changes.
3. Handle fast touch presses through edge-state as well as held-state input.
4. Keep deterministic state independent from rendering.
5. Browser tests should read a narrow TestBridge rather than engine internals.
6. Artifact budgets are cheap enough to enforce on every W1+ production build.

## W2 constraint

W2 is allowed to add gameplay-specific code.

W2 is **not** allowed to generalize that code into a factory-wide mechanic architecture until repeated evidence warrants it.

## Marker

`W1_FACTORY_FOUNDATION_PASS`
