# Game Factory Roadmap

## Operating model

- `main` is accepted state.
- Each major slice runs on its own branch.
- Merge only after an evidence-backed PASS.
- Prefer automation and agent work over manual human work.
- Human intervention is reserved for subjective gameplay feel, visual acceptance, platform-account actions, or evidence that cannot be automated safely.
- Do not run untrusted third-party install/build scripts in privileged CI.

## Roadmap

### W0 — Game Factory Skeleton Hunt

Find and validate the smallest commercially safe, AI-friendly technical foundation.

Exit criteria:

- repeatable candidate discovery exists;
- at least 30 distinct candidates considered across Phaser/PlayCanvas/web-game searches;
- licenses separated into PASS / REVIEW / FAIL;
- top candidates deep-inspected rather than selected by popularity;
- official engine templates used as anchors;
- one primary baseline selected;
- reusable patterns worth borrowing are documented separately from whole-repo adoption;
- W1 scope is explicit.

### W1 — Factory Foundation

Create the production baseline: engine, TypeScript, build, lint/typecheck/tests, browser smoke harness, responsive/input abstraction, lifecycle, deterministic RNG, platform boundary, bundle/performance budgets.

### W2 — Runner Proof

First gameplay family: forward movement + steering + collection + gates + obstacles + finish.

### W3 — Collector / Builder Proof

Second gameplay family using the same factory foundation.

### W4 — Physics / Puzzle Proof

Third gameplay family using the same factory foundation.

### W5 — Factory Extraction

Only after three families: extract stable common abstractions, GameSpec/LevelSpec conventions, and `create-game` automation.

### W6 — Distribution Adapters

Standalone Web first, then YouTube Playables when access permits, plus playable-ad wrappers that keep platform SDKs outside gameplay.

### W7 — First Real Game

Use the proven factory to produce and measure the first release candidate.

### W8 — Presentation Vertical

Turn the first functional release candidate into a sensory/product-quality vertical without reopening factory architecture.

- W8.1 — Reference Mining + Hero Slice: baseline-vs-polished deterministic visual/game-feel A/B.
- W8.2 — Sound + Impact Tuning: route semantic sound/impact feedback through the accepted platform audio boundary.
- W8.3 — Full Five-Level Presentation Spread / Release Polish: apply accepted presentation language to the complete session and prepare a user/publishing test candidate.

W8 presentation work remains game-local unless a later real game independently proves an abstraction reusable.

### W9 — First Real Human Playtest / Publishing Test

The W8 automated PASS did not prove first-time player comprehension or subjective reward.

- W9.1 — Playtest Release Gate: stand-alone mass-runner browser package, safe manual publishing path, zero backend or telemetry, actual browser tests.
- W9.2 — Human Feel Test: owner hands-on phone+desktop trial and 5–8 unaided first-time players; collect direct copyable feedback, not automated metrics.
- W9.2B — Fluid 2D / handcrafted WebGL3D A-B-C spike; technical proof only, custom C rejected as visual production base after Android observations.
- W9.2C — licensed external 3D starter and art source evaluation; choose PlayCanvas browser-first direction.
- W9.2D — isolated PlayCanvas + five pinned Kenney CC0 assets one-level hero slice; technical PASS and owner feedback: remaining blocky/voxel-ish visual language.
- **W9.3 — Soft-Forms Art Direction Pass**: round avatar/gates/track/hazards, unify materials/lighting/background and polish mobile HUD in isolated PlayCanvas `/3d/`; freeze model/factory; compare matched-state screenshots and collect Android acceptance. Implementation contract: [W9.3 Soft-Forms Spec](../playtest/W9.3-SOFT-FORMS-ART-DIRECTION-SPEC.md).
- **W9 final GO / ITERATE / STOP gate** (previously provisionally labelled W9.3): after W9.3 human Android feel and visual acceptance, decide whether to expand 3D levels, fix only the biggest issues, or keep 2D/2.5D. No claims of market readiness from CI alone.

Human action is intentionally required for platform publishing authorization and for subjective feel. Do not widen exposure before physical-device QA.

## North-star engineering metric

**New Game Core Churn:** a new game should add game-specific files/configuration and require minimal changes to shared `core/`.

The factory is not proven by one polished game. It is proven when materially different game families reuse the same lifecycle, input, platform, testing, build and content infrastructure without repeated core rewrites.
