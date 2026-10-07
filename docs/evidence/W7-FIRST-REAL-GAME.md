# W7 — First Real Game

Status: **W7_FIRST_REAL_GAME_PASS**

Branch: `w7-first-real-game-mass-runner`

Game:

**Mass Runner**

Working game id:

`mass-runner`

Source of truth entering W7:

- `main@8c8f4a7df201780ad50479454be8c3aed7cb5124`
- `W6_DISTRIBUTION_ADAPTERS_PASS`

## Product result

W7 produced the first multi-level product loop built on the accepted Game Factory rather than another architecture proof.

```text
tap to start
    ↓
auto-run + horizontal steering
    ↓
collect mass
    +
avoid draining hazards
    +
choose arithmetic gates
    ↓
reach target mass
    ↓
clear / fail
    ↓
next / retry
    ↓
5 levels
    ↓
MASSIVE + final score
```

The working title can be changed later without changing the product/factory contract.

## Content

The accepted session contains five authored deterministic levels:

1. Bulk Up
2. Double Down
3. Heavy Traffic
4. Critical Mass
5. Massive Finish

Each level owns:

- start mass;
- target mass;
- finish distance;
- pickups;
- hazards;
- arithmetic gates.

Difficulty ramps from additive choices into multiplication, larger penalties and a 35-mass final threshold.

## Accepted final verification

Final head:

`eec731bdd88a1512781f243cdf3580fdef67da24`

Final workflow:

- `W7 First Real Game`
- run `37694894928`
- result: **PASS**

Verification:

- TypeScript — PASS
- ESLint — PASS
- unit suite — **27/27 PASS**
- create-game automation — PASS
- W1 Foundation browser contract — PASS
- W2 Runner browser contract — PASS
- W3 Collector / Builder browser contract — PASS
- W4 Physics / Puzzle browser contract — PASS
- W6 distribution identity contract — PASS
- W7 Mass Runner full-session browser contract — PASS
- browser suite — **6/6 PASS**

Markers:

- `W5_CREATE_GAME_AUTOMATION_PASS`
- `W1_ARTIFACT_BUDGET_PASS`
- `W6_DISTRIBUTION_ADAPTERS_CONTRACT_PASS`
- `W7_FIRST_REAL_GAME_CONTRACT_PASS`

## Game-model evidence

Five MassRunnerModel unit tests prove:

- five deterministic authored levels exist;
- the optimal route clears every level;
- the full session reaches the final complete state;
- bad decisions can produce a real level failure;
- failure retries the same level from the correct opening state;
- arithmetic operations clamp to the playable mass range;
- session reset restores the exact first-level state.

## Production browser evidence

The real LittleJS production build completed all five levels in one browser session.

The browser proof includes:

- portrait opening state;
- mouse steering on the first level;
- level-clear transition;
- landscape resize;
- touch steering across the remaining levels;
- complete 5/5 session;
- final mass **46 / 35**;
- final score **1320**;
- no page errors;
- no unexpected console errors;
- no failed runtime requests.

Observed W7 browser runtime:

- Mass Runner full session: **17.3 s**
- complete six-contract browser suite: **21.5 s**

## Visual QA

Playwright generated opening, first-level-clear and final-completion screenshots.

The first green visual pass exposed one product-quality issue on the opening screen: level geometry appeared behind the `TAP TO RUN` message and an orb could visually intersect the HUD.

The game was corrected so the ready state renders the track/player/HUD only. Course geometry appears only after the run starts.

Final visual inspection confirms:

- clean portrait opening hierarchy;
- clear `LEVEL CLEAR` state;
- final landscape `MASSIVE!` state;
- readable target mass and score;
- player remains within the visible world in landscape;
- no platform/debug/proof labels are visible in production UI.

This is still generated-geometry art direction; subjective commercial-art polish remains a later product decision rather than a factory blocker.

## Factory ROI

### New-game production churn

Comparison against accepted W6 main:

- changed files total: **13**
- new Mass Runner production files: **4**
- `src/core/` changes: **0**
- `src/platform/` changes: **0**
- `src/runtime/` changes: **0**
- `src/testing/` changes: **0**
- W2 Runner production changes: **0**
- W3 Collector production changes: **0**
- W4 Physics production changes: **0**

The only shared production wiring change is the expected central `GameRegistry` registration.

Marker:

`W7_FIRST_REAL_GAME_CONTRACT_PASS`

### Time-to-green

First code-bearing W7 commit:

- `6ec1f08a5d423af353b5055eff707af4e32cd8be`
- GitHub timestamp: `2026-10-07T22:04:34Z`

First green W7 workflow completed:

- run `37694588138`
- completed at approximately `2026-10-07T22:13:08Z`

GitHub wall time:

**8 min 34 s from first code-bearing commit to first green full W7 workflow.**

That interval includes two automated correction loops.

Final visual-polish head also passed the complete workflow.

Human-local execution:

**0**

## Correction-loop evidence

CI and visual QA caught four concrete issues without local human debugging:

1. TypeScript correctly rejected an insufficiently narrowed upcoming-gate union type.
2. The browser route initially cached the previous level before advancing; it was changed to resolve the active level after the transition.
3. Touch steering evidence was hardened to verify that the target input had actually been observed before waiting for the next event.
4. Visual QA removed course geometry from the pre-start screen to eliminate HUD/CTA overlap.

No correction required protected factory/core production changes.

## Artifact evidence

W6 canonical baseline:

- total artifact: **145,338 B**
- main JS gzip: **52,613 B**

W7 final canonical build:

- total artifact: **154,628 B**
- main JS: **154,058 B**
- main JS gzip: **54,768 B**
- main JS Brotli: **47,606 B**
- external runtime references: **0**

W6 → W7 delta:

- total: **+9,290 B**
- gzip: **+2,155 B**

Locked budget remains comfortably green:

- total < 512,000 B — PASS
- gzip < 153,600 B — PASS

## Distribution result

The existing W6 pipeline still builds:

```text
dist-platforms/
  web/
  youtube/
  playable-ad/
```

Mass Runner itself contains no distribution SDK detail.

The first real game therefore remains distribution-independent at the gameplay layer.

## What W7 does not claim

W7 proves a complete replayable product loop and factory production speed.

It does not yet claim:

- final commercial art;
- final sound design;
- store/YouTube publishing approval;
- retention;
- monetization;
- market fit;
- cloud persistence.

Those require product/distribution evidence rather than more foundation architecture.

## Final marker

`W7_FIRST_REAL_GAME_PASS`
