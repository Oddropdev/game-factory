# W0 — Game Factory Skeleton Hunt

## Mission

Identify a minimal web-game baseline and reusable architectural patterns for an AI-native game factory targeting fast standalone-web games first, with later YouTube Playables and playable-ad adapters.

This phase does **not** build the factory gameplay core.

## Search universe

Repeatable discovery covers:

- Phaser + TypeScript + Vite;
- mobile/responsive Phaser games;
- playable-ad Phaser templates;
- runner-oriented Phaser examples;
- PlayCanvas + TypeScript + Vite;
- lightweight HTML5 game starters.

Official anchors are always included:

- `phaserjs/template-vite-ts`
- `phaserjs/examples`
- `playcanvas/create-playcanvas`

## Preliminary score — 100 points

- commercial/license safety: 15
- architecture/tooling proxy: 15
- mobile/responsive proxy: 12
- build-health proxy: 10
- data-driven/content proxy: 10
- bundle/startup proxy: 10
- TypeScript/tooling: 8
- asset separation: 7
- testability: 5
- maintenance proxy: 4
- AI-agent friendliness: 4

The automated score is only triage. It cannot prove architectural quality.

## Hard gates

Reject or hold when:

- license is missing, ambiguous, non-commercial, or incompatible with intended use;
- repository is archived unless it contains a uniquely valuable pattern;
- game-specific code and reusable infrastructure cannot be separated cleanly;
- asset licensing is unclear;
- the design fundamentally assumes desktop-only interaction;
- adoption would pull in unnecessary framework complexity.

## Security rule

Do **not** automatically execute arbitrary third-party `npm install`, lifecycle, build or test scripts in a privileged CI job.

External repositories are untrusted code.

W0 uses static GitHub inspection first. Build/runtime validation happens only after a candidate is selected for a controlled sandbox with no repository secrets or persistent credentials.

## Evidence hierarchy

1. repository LICENSE / package metadata;
2. source tree and configuration;
3. README/docs;
4. controlled build/runtime evidence;
5. popularity metrics only as weak context.

## Adoption rule

The expected result is not necessarily "fork repository X."

A valid result is:

- official baseline A;
- scene/lifecycle pattern from B;
- responsive/input pattern from C;
- level-data pattern from D;
- playable-wrapper idea from E.

This is preferred when it produces a smaller and more maintainable foundation.

## Repeatability

Run locally:

```bash
npm run hunt
```

or dispatch the GitHub Action **W0 Skeleton Hunt**.

Generated raw output goes under `research/generated/`. Each meaningful research pass should be summarized as an immutable iteration document such as `W0-ITERATION-01.md`, `W0-ITERATION-02.md`, etc.
