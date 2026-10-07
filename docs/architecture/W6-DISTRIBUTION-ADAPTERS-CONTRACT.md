# W6 — Distribution Adapters Contract

Date: 2026-10-08

Status: **LOCKED FOR W6**

## Mission

Prove that the same accepted `GameModule` gameplay runs behind multiple distribution environments without platform SDK leakage into game families.

W6 is a platform-boundary proof, not a monetization or persistence feature sprint.

## Source of truth entering W6

- `main@ba31c9788c7b1ed41b6dcbd36d9acf9f987aabcd`
- `W5_FACTORY_EXTRACTION_PASS`
- LittleJS 1.25.0

## Distribution targets

W6 supports three wrappers:

1. `web` — standalone browser;
2. `youtube` — YouTube Playables SDK boundary;
3. `playable-ad` — provider-neutral self-contained playable-ad wrapper.

All three must run the same game registry and GameModule implementations.

## Platform contract

The shared platform boundary may expose only currently justified distribution concerns:

- initialization;
- first-frame readiness;
- interaction readiness;
- lifecycle pause/resume source;
- platform audio-enabled state;
- platform audio-enabled change callbacks.

Gameplay may not import distribution SDKs.

## Lifecycle ownership

Lifecycle events become platform-owned.

Standalone Web and generic playable-ad wrappers may use Page Visibility.

YouTube MUST use `ytgame.system.onPause` and `ytgame.system.onResume`.

The shared `LifecycleRuntime` MUST NOT use Page Visibility directly.

## YouTube Playables integration

Verified against the official YouTube Playables documentation on 2026-10-08.

Required W6 boundary behavior:

- the SDK script is loaded before game code;
- `ytgame.game.firstFrameReady()` is called before `gameReady()`;
- `gameReady()` is called only after the first rendered interactive game frame;
- pause/resume comes only from YouTube SDK callbacks;
- audio state comes from `isAudioEnabled()`;
- audio changes come from `onAudioEnabledChange()`.

Current proof games intentionally restart each session and do not claim persistent progress, so W6 does not invent cloud-save semantics. Persistence is added only when a real game needs saved progress.

Score, ads, locale and YouTube content-opening APIs are also deferred until a real game requires them.

Official SDK script:

```html
<script src="https://www.youtube.com/game_api/v1"></script>
```

## Distribution packaging

The standard Vite production build remains the canonical gameplay artifact.

W6 derives:

```text
dist-platforms/
  web/
  youtube/
  playable-ad/
```

Each wrapper must use relative built asset paths.

The YouTube wrapper may contain exactly one external runtime script: the official Playables SDK.

Web and generic playable-ad wrappers must remain self-contained.

## Behavior proof

The same deterministic Runner course signature and foundation seed must be observed under all three adapters.

The YouTube mock contract must additionally prove:

- readiness order = `firstFrameReady -> gameReady`;
- SDK pause callback pauses the engine;
- SDK resume callback resumes it;
- SDK audio-disabled initial state is observed;
- SDK audio change reaches the shared platform state.

## SDK-isolation gate

No source under `src/games/` may reference:

- `ytgame`;
- YouTube;
- `game_api`;
- MRAID;
- playable-ad platform details;
- `PlatformBridge`.

YouTube SDK references must remain under `src/platform/`.

## Artifact budget

The W1 production budget remains unchanged:

- total canonical artifact < 500 KiB;
- main JS gzip < 150 KiB;
- external runtime references in canonical `dist/` = 0.

Distribution wrappers do not justify a larger gameplay budget.

## Exit criteria

W6 closes only after:

- typecheck PASS;
- lint PASS;
- all existing unit tests PASS;
- platform resolver tests PASS;
- create-game automation PASS;
- W1–W4 browser regressions PASS;
- cross-adapter Runner identity PASS;
- YouTube readiness/lifecycle/audio mock contract PASS;
- three distribution wrappers build;
- wrapper static validation PASS;
- SDK-isolation gate PASS;
- artifact budget PASS.

Expected marker:

`W6_DISTRIBUTION_ADAPTERS_PASS`
