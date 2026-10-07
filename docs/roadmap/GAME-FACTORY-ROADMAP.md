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

## North-star engineering metric

**New Game Core Churn:** a new game should add game-specific files/configuration and require minimal changes to shared `core/`.

The factory is not proven by one polished game. It is proven when materially different game families reuse the same lifecycle, input, platform, testing, build and content infrastructure without repeated core rewrites.
