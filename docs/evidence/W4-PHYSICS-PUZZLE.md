# W4 — Physics / Puzzle Proof

Status: **W4_PHYSICS_PUZZLE_PROOF_PASS**

Branch: `w4-physics-puzzle-proof`

Source of truth entering W4:

- `main@6c98ca776f93d0b7609253ae4ceb16f296a3c30a`
- `W3_COLLECTOR_BUILDER_PROOF_PASS`
- LittleJS 1.25.0

## Mission result

W4 added the third materially different gameplay family without changing accepted shared-foundation production code or either prior game family's production code.

The physics/puzzle proof contains:

- deterministic seeded puzzle geometry;
- one-tap launch targeting;
- fixed-tick gravity simulation;
- bounded world collisions;
- a blocking obstacle;
- a deterministic failed low shot;
- a deterministic successful arc;
- solved state;
- deterministic restart;
- generated geometry only.

## Accepted code-bearing evidence

Workflow:

- `W4 Physics Puzzle Proof`
- run `37686546684`
- head `85c98dbdc5368f1b2e9c143c8ad48f9d3a20d12e`
- result: **PASS**

The standard verification command proved all accepted families together:

- TypeScript — PASS
- ESLint — PASS
- unit suite — **18/18 PASS**
- W1 Foundation production-browser contract — PASS
- W2 Runner production-browser contract — PASS
- W3 Collector / Builder production-browser contract — PASS
- W4 Physics / Puzzle production-browser contract — PASS

## Pure model evidence

PhysicsModel tests proved:

- same seed => same obstacle/puzzle geometry;
- the registered solution aim reaches the goal deterministically;
- the solution reaches the goal without obstacle/bound collision;
- a low direct shot collides and does not solve;
- a second launch is rejected while the ball is already flying;
- reset restores the exact initial ball, velocity, aim, shot, collision and tick state.

## Production browser evidence

The real LittleJS production build proved:

- physics mode boots;
- mouse launch works;
- pause freezes position and fixed-tick progress;
- resume restores simulation;
- the low shot produces observable collision evidence;
- deterministic restart restores the seeded puzzle;
- landscape resize is synchronized before input;
- touch launch works;
- the known touch arc reaches `SOLVED`;
- final restart restores exact initial state;
- no page errors;
- no unexpected console errors;
- no failed required runtime requests.

Playwright runtime summary:

- Foundation — PASS
- Runner — PASS
- Collector / Builder — PASS
- Physics / Puzzle — PASS
- **4/4 browser tests PASS**

## Artifact evidence

W1 budgets remained unchanged.

Measured on the accepted code-bearing run:

- total artifact: **143,097 bytes**
- main JS: **142,527 bytes**
- main JS gzip: **52,042 bytes**
- main JS Brotli: **45,217 bytes**
- external runtime references: **0**
- observed Vite production build: **154 ms**

Budget:

- total < 512,000 bytes — PASS
- gzip < 153,600 bytes — PASS

Marker:

`W1_ARTIFACT_BUDGET_PASS`

Compared with W3, adding the complete physics/puzzle family increased main JS gzip by only about **3.1 KiB**.

## New Game Core Churn

Final W4 comparison against accepted W3 main is expected to contain **13 changed files** after closeout documentation is included.

Production-code churn remains:

- physics-specific production files: **4**
- changed files under `src/core/`: **0**
- changed files under `src/platform/`: **0**
- changed files under `src/runtime/`: **0**
- changed files under `src/testing/`: **0**
- changed files under `src/games/runner/`: **0**
- changed files under `src/games/collector/`: **0**

Marker:

`W4_NEW_GAME_CORE_CHURN_PASS`

This completes the pre-extraction reuse evidence: runner, collector/builder and physics/puzzle all sit on the same accepted foundation without production rewrites of the shared core or previously accepted game families.

## Automated visual evidence

Playwright emitted:

- portrait obstacle-hit evidence;
- landscape in-flight arc evidence;
- solved-state evidence.

Visual inspection confirmed:

- the failed shot is visibly blocked by the obstacle in portrait;
- the successful landscape trajectory is visibly airborne above the obstacle;
- the solved ball reaches the green goal ring;
- HUD and puzzle geometry remain visible without clipping in both orientations.

The first technically passing screenshot was captured too close to the launch edge and still showed the ball at the start position. The browser evidence was tightened to wait for more than eight physics ticks before taking the landscape trajectory screenshot.

That improvement changed only test evidence. Production code did not change.

## Architecture audit

W4 did **not** introduce:

- generic physics package;
- generic puzzle package;
- ECS;
- GameSpec;
- LevelSpec;
- universal input/action layer;
- save/progression;
- analytics;
- YouTube adapter;
- playable-ad adapter;
- asset-generation pipeline;
- cross-engine renderer abstraction.

The game-specific implementation remains under `src/games/physics/`.

## CI efficiency

W4 also scopes the now-closed W3 workflow to W3-owned surfaces. After this PR is merged, future phases will not rerun W3 merely because `src/main.ts` changes.

The active phase continues to run the full accepted regression suite.

## W5 handoff

The evidence threshold for factory extraction is now met.

W5 may compare W2–W4 and extract only patterns that are demonstrably repeated across multiple families.

Candidate evidence to inspect in W5 includes:

- repeated game lifecycle shape: `init / update / render / renderHud / restart / testState`;
- repeated game selection branching in `src/main.ts`;
- repeated viewport-normalized Y conversion in collector and physics;
- repeated game-specific browser TestBridge shape;
- repeated deterministic course/model/test separation.

These are candidates, not pre-approved abstractions.

## Final marker

`W4_PHYSICS_PUZZLE_PROOF_PASS`
