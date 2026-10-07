# W0 Skeleton Hunt — Iteration 02

Date: 2026-10-07

Status: **PATTERN PASS / HIGH-SIGNAL REFERENCES FOUND / BASELINE STILL NOT FROZEN**

## Purpose

Iteration 01 proved that broad repository search is noisy. Iteration 02 changed the search objective from “find a starter kit” to “find reusable patterns” for:

- mobile pointer/touch and resize/orientation;
- data/config separation;
- playable-ad packaging;
- unit/browser testing;
- runner mechanics;
- AI-agent game-development workflows.

Ten targeted search families produced **50 public repositories** in the connector-backed pass.

## High-signal findings

### feliperyba/playable-ad-phaser — GO FOR PATTERNS

License: **MIT**.

Observed stack:

- Phaser 3.x
- TypeScript 5.7
- Vite 6
- single-file playable build
- strict-ish code organization
- portrait/mobile controls
- responsive scaling
- explicit config/entities/scenes/systems separation
- current build reported at ~2.3 MB uncompressed / ~1.1 MB gzip

Source-level patterns worth borrowing into a Phaser 4 implementation:

1. **Config isolation** — tuning constants are separated by concern instead of being embedded in gameplay classes.
2. **Scene flow** — boot/menu/game/game-over are explicit.
3. **Entity/system split** — entity-local behavior is separated from orchestration systems.
4. **Responsive refresh hooks** — resize, orientation change and VisualViewport changes trigger scale refresh.
5. **Single-file distribution build** — Vite + single-file packaging is viable for playable-ad output.
6. **Asset manifest** — a central asset discovery/loading path keeps packaging deterministic.

Do not copy Phaser-3-specific APIs blindly into Phaser 4.

Verdict: **GO as architecture/distribution reference; not primary baseline**.

### Atifullah/Bus-Jam-Escape-playable — STRONG CONCEPTUAL REFERENCE, LICENSE HOLD

Observed:

- Phaser 3.90
- TypeScript 5.8
- Vite 7
- unit tests for game logic
- dedicated playable build command
- responsive portrait + desktop target
- MRAID/AppLovin-aware CTA behavior
- self-contained offline HTML artifact
- automated 5 MB size-budget and external-runtime-asset checks
- visibilitychange sleep/wake lifecycle hook

Important pattern:

> Treat the playable artifact itself as a testable product with explicit size and offline-safety gates.

The repository root did not expose a general source-code LICENSE in the inspected state. It does contain asset-license documentation, but that is not equivalent to a software license.

Verdict: **GO for ideas/evidence model; HOLD for code reuse until software license is explicit**.

### Yakoub-ai/phaser4-gamedev — HIGH-VALUE AI-WORKFLOW REFERENCE, LICENSE HOLD

Observed README claims a Phaser 4-focused agent workflow with:

- portable agent skills;
- architecture/coding/debugging/playtest roles;
- Playwright-based real-game runtime verification;
- black-screen, asset-404, exception and FPS checks;
- deterministic seed/repeat concepts;
- feedback -> failing scenario -> fix -> regression-test loop;
- current Phaser 4 API guidance.

This maps unusually well to Game Factory’s minimum-human-work objective.

However, no root LICENSE was visible in the inspected repository state.

Verdict: **GO as workflow inspiration; HOLD for copying skill text/code until licensing is explicit**.

### adam0white/GameEval — TESTING CONCEPT REFERENCE, LICENSE HOLD

Observed architecture uses browser automation and evidence capture around game evaluation. It is broader and heavier than Game Factory needs, but it reinforces the value of:

- browser-driven runtime tests;
- screenshots/logs/evidence artifacts;
- automated interaction rather than compile-only validation.

No root LICENSE was visible in the inspected state.

Verdict: **MAYBE for testing concepts; NO as dependency/baseline**.

### Samgeven/phaser-vite-template — SMALL TESTING REFERENCE

Observed:

- Phaser 3.60
- TypeScript
- Vite
- Vitest

Useful only as confirmation that lightweight unit-test integration does not require a large game framework.

Verdict: **LOW-VALUE REFERENCE**.

### ourcade/infinite-runner-template-phaser3 — GAMEPLAY REFERENCE ONLY

Observed:

- old Phaser 3.55 / TypeScript 3.8 / Parcel stack;
- MIT package metadata;
- runner-specific example.

Verdict: **NO baseline; MAYBE runner-mechanics reference only**.

## Stronger architectural conclusion after Iteration 02

The emerging foundation is now more specific:

### Primary engine/build baseline

**Phaser 4 + TypeScript + Vite**, starting from the official Phaser template.

### Patterns to implement ourselves

- `core/config`: separated tuning/data;
- explicit scene lifecycle;
- pointer/touch abstraction;
- responsive resize/orientation/VisualViewport handling;
- unit-testable pure gameplay logic;
- Playwright real-browser smoke/playtest layer;
- deterministic seed/replay hooks;
- artifact budgets;
- single-file playable-ad packaging as a separate adapter/build target;
- lifecycle hooks for visibility/pause/resume;
- evidence artifact generation.

### Explicit non-goals

- importing a full Phaser 3 starter as the factory;
- coupling gameplay to AppLovin/MRAID/YouTube SDKs;
- copying unlicensed agent-skill repositories;
- making playable-ad size constraints the core engine architecture.

## Repeatability improvement

The Skeleton Hunt harness now supports profiles:

- `HUNT_PROFILE=general` — broad starter/baseline discovery;
- `HUNT_PROFILE=patterns` — responsive/testing/playable/runner/agent-pattern discovery.

This allows future W0 passes to be materially different instead of repeatedly searching the same generic terms.

## Next gate — Iteration 03

Iteration 03 should be source-oriented, not search-oriented:

1. inspect the official Phaser 4 template and current Phaser 4 example/skill structure;
2. inspect 2–4 MIT/permissive high-signal references at source-file level;
3. define the exact W1 file/module boundaries;
4. define controlled build/browser validation without executing untrusted repos in privileged CI;
5. draft ADR-001 selecting the baseline;
6. red-team the baseline against PlayCanvas for lightweight 3D needs.

W0 should close only after that ADR survives the red-team pass.
