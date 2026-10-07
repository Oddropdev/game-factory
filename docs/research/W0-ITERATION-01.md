# W0 Skeleton Hunt — Iteration 01

Date: 2026-10-07

Status: **DISCOVERY PASS / BASELINE NOT YET FROZEN**

## Discovery evidence

Eight search families produced **68 unique public repositories** in the first connector-backed pass before official anchors were added manually.

The search was intentionally broad. Results contained useful candidates, old templates, archived repositories, game-specific projects and irrelevant PlayCanvas typing forks. This confirms that popularity/search rank cannot be the selection mechanism.

## Initial deep-inspection set

### 1. phaserjs/template-vite-ts — STRONG PRIMARY BASELINE CANDIDATE

Observed package state:

- Phaser `4.0.0`
- TypeScript `~5.7.2`
- Vite `^6.3.1`
- production build script
- MIT license
- official Phaser Studio template

Why it matters:

- smallest credible current 2D baseline;
- no legacy Webpack baggage;
- browser-native deployment model;
- clear asset separation;
- avoids adopting game-specific architecture before we have evidence for it.

Current verdict: **GO / anchor**.

### 2. playcanvas/create-playcanvas — STRONG 3D REFERENCE, NOT PRIMARY 2D BASELINE

Observed:

- TypeScript + Vite scaffolding;
- production build;
- ESLint + Prettier;
- engine/react/web-components formats;
- 12 starter kits;
- AI agent skills included by default;
- MIT license.

Current verdict: **GO as 3D/reference track; MAYBE for primary factory**.

### 3. smoudjs/playable-template-phaser — HIGH-VALUE DISTRIBUTION REFERENCE

Observed:

- Phaser `^3.88.2`;
- TypeScript;
- playable-ad SDK and build tooling;
- pause/resume/volume/resize/interaction concerns explicitly represented;
- responsive canvas scaling.

Why not adopt wholesale:

- Phaser 3 rather than current Phaser 4 baseline;
- coupled to a specific playable SDK/toolchain.

Current verdict: **GO for adapter/lifecycle patterns; NO for primary baseline**.

### 4. ubershmekel/vite-phaser-ts-starter — HISTORICAL PATTERN ONLY

Observed:

- Phaser `^3.55.2`
- TypeScript `^4.8.4`
- Vite `^3.1.4`
- simple GitHub Actions deployment pattern.

Current verdict: **MAYBE pattern reference; NO baseline**.

### 5. supertorpe/vite-ts-phaser-starter — HISTORICAL PATTERN ONLY

Observed:

- Phaser `3.55.2`
- TypeScript `^4.6.2`
- Vite `^2.8.6`
- MIT according to README.

Current verdict: **NO baseline; low-value reference**.

### 6. yandeu/phaser-project-template — USEFUL FEATURE REFERENCE, LEGACY TOOLCHAIN

Observed:

- Phaser `^3.55.2`;
- TypeScript `^4.5.3`;
- Webpack 5;
- PWA/native-app patterns;
- code splitting and asset/build conventions;
- MIT.

Current verdict: **MAYBE for selected patterns; NO baseline**.

## Early conclusion

The first pass strengthens, rather than weakens, the prior hypothesis:

> Start from the current official Phaser 4 + TypeScript + Vite template, then selectively import proven architectural ideas. Do not adopt an old "hypercasual starter kit" merely because it already contains gameplay.

This is still a hypothesis, not W0 closeout.

## Next iteration

W0 Iteration 02 should focus less on generic starters and more on **specific reusable patterns**:

1. mobile pointer/touch + responsive/orientation handling;
2. data-driven level definitions;
3. runner/collector mechanics implemented cleanly;
4. browser test harnesses for Phaser;
5. playable-ad lifecycle/packaging;
6. AI-agent instructions/skills around Phaser;
7. asset-pipeline separation.

Target: 20–30 higher-signal repositories/examples rather than another broad generic search.

## W0 exit blockers

- top reusable patterns not yet deep-inspected at source-file level;
- controlled build/runtime gate not yet defined for shortlisted external code;
- Phaser 4 AI-agent workflow not yet inspected deeply;
- final baseline ADR not yet frozen.
