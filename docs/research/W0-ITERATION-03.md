# W0 Skeleton Hunt — Iteration 03

Date: 2026-10-07

Status: **SOURCE-LEVEL ARCHITECTURE PASS / BASELINE DECISION READY**

## Mission

Stop searching for more generic starters and answer four concrete questions:

1. What should the W1 technical baseline actually be?
2. Which patterns are worth reimplementing in our own code?
3. Which abstractions should **not** exist yet?
4. Does PlayCanvas provide enough advantage to displace Phaser for the first 2D/hypercasual factory?

## Source snapshots inspected

The following default-branch heads were used for this iteration:

- `phaserjs/phaser@02d8931b626d9764c133cbb3fbf99966c03c757c`
- `phaserjs/template-vite-ts@d1d7d58acfcf47f97642bcb8b4967071b85f8db9`
- `feliperyba/playable-ad-phaser@b5b12db6e696fc08d711d9e6e3b2cbea76d0c0f0`
- `Atifullah/Bus-Jam-Escape-playable@2fd6b58d935cc45c40e0bda9a14a41366a2990b7`
- `playcanvas/create-playcanvas@02d1b3d6cff3a3f7f30908c8ebb1a9c416536c1c`
- `Yakoub-ai/phaser4-gamedev@1c1bf45dec3f0acbe8b2a963cc6dab93be31253a`
- `Samgeven/phaser-vite-template@dd5a1f575fc3da07f70068f276b01eef86d2e98f`

## 1. Official Phaser 4 source — PRIMARY AUTHORITY

### Current engine state

The current Phaser repository package metadata reports:

- Phaser `4.2.1`
- MIT license
- TypeScript definitions
- Vitest in the engine repository
- official AI-agent skills inside `skills/`
- WebGL + Canvas browser rendering
- built-in scenes, loader, input, scale manager, visibility lifecycle, Arcade/Matter physics

This changes one important W0 assumption:

> Third-party Phaser agent-skill repositories are not required for API knowledge. The official MIT-licensed Phaser repository already ships detailed skills for setup/config, scenes, input, responsive scaling, physics, assets and other subsystems.

That gives us a safer AI-native path.

### Template state

The official `template-vite-ts` is structurally useful but its inspected `package.json` still pins:

- Phaser `4.0.0`
- TypeScript `~5.7.2`
- Vite `^6.3.1`

Therefore W1 must **not** copy the template dependency versions blindly.

Decision:

- use the official template's small project structure and boot/preloader pattern;
- pin the engine to the current inspected stable Phaser `4.2.1`;
- initially keep the template's TypeScript/Vite generation as the low-variance starting point;
- upgrade build-tool majors only after the first W1 smoke gate if there is a concrete benefit.

### Responsive/input finding

The Phaser 4 source and official skills already expose:

- unified pointer input for mouse/touch;
- ScaleManager modes such as `FIT`, `RESIZE`, `EXPAND`;
- scale `resize` and orientation events;
- coordinate transforms;
- global hidden/visible/focus/blur/pause/resume lifecycle events.

Implication:

**Do not build a large custom input, resize or browser-lifecycle framework in W1.**

Use Phaser primitives first and put only the thinnest stable boundary around platform-specific behavior.

## 2. feliperyba/playable-ad-phaser — PERMISSIVE HIGH-SIGNAL PATTERN SOURCE

License: **MIT**.

Source inspection confirmed the README-level claims.

### Useful patterns

#### A. Configuration separated by concern

The repository separates tuning into modules such as:

- spawn
- waves
- items
- HUD
- visual juice
- lives
- scanner
- brand/colors

This is a strong pattern for AI-authored hypercasual games because tuning changes do not require editing scene orchestration.

**Adopt the principle, not its game-specific files.**

#### B. Scene as orchestrator, systems as collaborators

`GameScene` coordinates systems such as difficulty, spawning, HUD and scanning rather than placing every mechanic in one giant update loop.

This is useful, but W1 should not pre-create a universal `systems/` abstraction. W2 should extract systems only when the runner proof creates real pressure for them.

#### C. Responsive refresh

The source explicitly refreshes scale on resize/orientation/VisualViewport events.

Phaser 4's own ScaleManager covers most of this. W1 should start with Phaser scale events and add VisualViewport handling only if the browser smoke suite demonstrates a real gap.

#### D. Distribution build

The Vite configuration uses a single-file build path and aggressive minification for playable handoff.

This should become a **later distribution adapter/build target**, not the default W1 web build.

#### E. Asset manifest

Central asset imports make bundler discovery deterministic and are suitable for later single-file packaging.

This pattern is worth preserving in W1 even with placeholder assets.

## 3. Atifullah/Bus-Jam-Escape-playable — EVIDENCE MODEL, NOT CODE SOURCE

Repository license metadata is `NOASSERTION`; no general source-code LICENSE was found.

Therefore:

**No source code from this repository may be copied into Game Factory.**

The source can still inform independent architectural decisions.

### Strong concepts observed

#### A. Pure game logic can be unit tested outside Phaser

The repository has a typed `LevelConfig` model and Node tests that exercise grid/path/loading/reward rules without booting the renderer.

This is exactly the separation we want:

> deterministic game rules should live in pure TypeScript whenever practical; Phaser should render and route input, not own every rule.

This becomes a W2+ rule. W1 only needs the test infrastructure.

#### B. Artifact validation is a first-class gate

Its packaging script checks:

- final standalone HTML size;
- external runtime asset tags;
- budget failure;
- generated size report.

We will independently implement the same **category of checks** for our own artifacts.

#### C. Lifecycle is tiny

The app uses a small visibility hook rather than a large lifecycle framework.

Phaser 4 already has visibility events, reinforcing the decision to keep our wrapper thin.

## 4. PlayCanvas — RED-TEAM CHALLENGER

PlayCanvas remains technically strong.

The current scaffold inspected in `create-playcanvas` provides:

- TypeScript
- Vite
- ESLint
- Prettier
- production build
- engine/react/web-components modes
- multiple game starters
- AI-agent skills by default
- MIT license

The current engine line is explicitly 3D/WebGL/WebGPU-oriented. The starter catalogue includes physics, first-person, third-person and sprite-game examples.

### Why it does not replace Phaser for W1

For the first factory proof, our target families are:

- runner
- collector/builder
- physics/puzzle

with mobile-first web delivery and very fast iteration.

Phaser gives us:

- a more direct 2D game semantic model;
- scene lifecycle already matching our needs;
- unified pointer input;
- built-in 2D physics choices;
- loader/tweens/particles/UI primitives;
- smaller conceptual surface for the first prototypes;
- official AI skills in the same MIT repository.

PlayCanvas gives us materially more leverage when the game requires:

- real 3D scene graphs;
- model/material/lighting workflows;
- perspective third-person cameras;
- WebGPU-specific rendering;
- 3D physics as a core mechanic.

Those are not W1 requirements.

### Red-team verdict

**Phaser wins W1. PlayCanvas is retained as the explicit 3D escalation path.**

Do not create a generic `RenderEngine` abstraction to support both engines. That abstraction would cost more than it saves before we have a real 3D game.

## 5. Yakoub-ai/phaser4-gamedev — WORKFLOW IDEA ONLY

No repository license was exposed in the inspected state.

No text, scripts or skill files will be copied.

However, source/search inspection reinforced several independently useful principles:

- compile success is not runtime success;
- Playwright should boot the real game;
- browser tests should catch black screens, failed assets, page errors and bad runtime state;
- deterministic seeds and repeated scenarios help distinguish logic failures from timing flakes;
- player feedback can be converted into permanent regression scenarios.

Because the official Phaser repository now contains MIT-licensed AI skills, the Game Factory does not need to depend on this unlicensed project.

## 6. Samgeven/phaser-vite-template — SMALL CONFIRMATION ONLY

The repository combines Phaser, TypeScript, Vite and Vitest, but is older and exposes no detected repository license.

It adds no unique architecture beyond confirming that a lightweight unit-test layer is sufficient.

Verdict: **do not depend on it and do not copy it**.

## W1 exact module boundary

W1 must stay deliberately small.

```text
src/
  app/
    createGame.ts
    gameConfig.ts

  core/
    random/
      SeededRng.ts

  platform/
    PlatformBridge.ts
    WebPlatform.ts

  runtime/
    ResponsiveRuntime.ts
    LifecycleRuntime.ts

  assets/
    assetManifest.ts

  scenes/
    BootScene.ts
    FoundationScene.ts

  testing/
    TestBridge.ts

tests/
  unit/
    seededRng.test.ts

  e2e/
    foundation.spec.ts

tools/
  check-artifact.mjs
```

### Explicitly deferred

Do **not** add these in W1:

- `mechanics/`
- universal ECS
- generic `System` base classes
- `GameSpec`
- `LevelSpec`
- generic input-intent framework
- generic render-engine interface
- YouTube SDK adapter
- MRAID/AppLovin adapter
- save/progression framework
- editor tooling
- asset-generation pipeline

Those abstractions need gameplay evidence from W2–W4.

## W1 runtime contract

### `createGame.ts`

Owns Phaser game creation and returns the game instance.

### `gameConfig.ts`

Owns only engine configuration:

- renderer choice;
- scale mode;
- parent/canvas settings;
- scene registration;
- input basics;
- background/render flags.

No gameplay tuning belongs here.

### `SeededRng.ts`

Pure deterministic random source used by tests and later generation/mechanics.

It must not depend on Phaser scene state.

### `PlatformBridge.ts`

A tiny capability boundary, not an SDK kitchen sink.

W1 surface:

- `init()`
- `ready()`
- `pause()`
- `resume()`

Save, ads, score submission and monetization capabilities are deferred until a platform actually requires them.

### `WebPlatform.ts`

No-op/browser implementation used by the default standalone-web build.

### `ResponsiveRuntime.ts`

Owns only glue that Phaser's ScaleManager does not already provide.

Rule:

> first use Phaser ScaleManager and its events; only add DOM/VisualViewport workarounds when a failing browser test proves the need.

### `LifecycleRuntime.ts`

Maps Phaser's global hidden/visible/pause/resume events to the platform boundary and test bridge.

Do not duplicate the browser visibility stack if Phaser already emits the required signal.

### `assetManifest.ts`

Central place for static asset imports/keys so later single-file packaging remains deterministic.

### `BootScene.ts`

Loads only what the foundation smoke scene requires.

### `FoundationScene.ts`

Not a real game.

It must prove:

- visible canvas;
- pointer/touch event path;
- deterministic state mutation;
- responsive layout;
- lifecycle pause/resume;
- clean restart.

### `TestBridge.ts`

A deliberately narrow read-only/debug interface for Playwright.

It exposes enough state to assert behavior without having tests reach through arbitrary Phaser internals.

## W1 controlled validation gate

Only Game Factory's own code and explicitly selected dependencies execute in normal CI.

Random Skeleton Hunt candidates remain **static-inspection only**.

W1 CI should run:

```text
typecheck
lint
unit tests
production build
artifact check
Playwright production-build smoke
```

### Browser smoke profiles

At minimum:

- 390 × 844 portrait
- 844 × 390 landscape
- 1280 × 720 desktop

### Runtime assertions

- document loads;
- canvas exists and has non-zero dimensions;
- FoundationScene reaches ready state;
- no uncaught page errors;
- no unexpected `console.error`;
- no failed local asset requests;
- pointer input changes deterministic test state;
- viewport change does not recreate/corrupt the game;
- hidden/visible lifecycle transitions are observable;
- restart returns deterministic foundation state.

### Artifact assertions

W1 contains almost no content assets, so its budget should be intentionally strict.

Initial proposed W1 budgets:

- production artifact total: **< 2 MiB**
- no unexpected external runtime asset URLs
- artifact size report emitted to CI

Do not hard-fail wall-clock startup performance on shared GitHub runners yet. Record it as evidence first; create a hard timing gate only after a stable measurement environment exists.

## Iteration 03 decision

The evidence now supports a concrete baseline:

> **Phaser 4.2.1 + TypeScript + Vite, using the official Phaser template structure as a scaffold, official Phaser AI skills as the primary agent reference, and our own minimal runtime/testing/platform boundaries.**

The template is a scaffold, not a dependency lockfile.

PlayCanvas remains the future 3D escalation path.

No unlicensed repository is a code dependency.

## Remaining W0 closeout work

Iteration 03 resolves the architecture question.

Before W0 is merged to `main`, perform a short closeout pass:

1. finalize ADR-001;
2. verify the latest Skeleton Hunt CI on the PR head;
3. audit the PR for accidental dependency/code adoption from license-hold repositories;
4. write `W0-CLOSEOUT.md`;
5. merge only if all W0 exit criteria are satisfied.

No human-local execution is required for this closeout.
