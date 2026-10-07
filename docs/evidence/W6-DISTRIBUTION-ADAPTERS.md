# W6 — Distribution Adapters

Status: **W6_DISTRIBUTION_ADAPTERS_PASS**

Branch: `w6-distribution-adapters`

Source of truth entering W6:

- `main@ba31c9788c7b1ed41b6dcbd36d9acf9f987aabcd`
- `W5_FACTORY_EXTRACTION_PASS`
- LittleJS 1.25.0

## Mission result

W6 proved that the same accepted GameModule/game registry runs behind three distribution boundaries:

```text
GameModule / GameRegistry
          |
       main.ts
          |
   PlatformBridge
    /     |       \
 Web   YouTube   PlayableAd
```

No game-family production source contains YouTube, MRAID, playable-ad SDK details or PlatformBridge imports.

## Accepted code-bearing evidence

Workflow:

- `W6 Distribution Adapters`
- run `37692223784`
- head `9cdd08c0b94b98ddeeeb206b39f000e534652db3`
- result: **PASS**

Verification:

- TypeScript — PASS
- ESLint — PASS
- unit suite — **22/22 PASS**
- create-game automation — PASS
- W1 Foundation browser contract — PASS
- W2 Runner browser contract — PASS
- W3 Collector / Builder browser contract — PASS
- W4 Physics / Puzzle browser contract — PASS
- W6 cross-adapter browser contract — PASS
- browser suite — **5/5 PASS**

Markers:

- `W5_CREATE_GAME_AUTOMATION_PASS`
- `W1_ARTIFACT_BUDGET_PASS`
- `W6_DISTRIBUTION_ADAPTERS_CONTRACT_PASS`

## Cross-adapter identity

The W6 browser contract ran the accepted Runner through:

- `platform=web`;
- `platform=playable-ad`;
- `platform=youtube`.

All three observed:

- the same deterministic Runner course signature;
- the same foundation seed;
- the same Runner GameModule implementation.

Only platform readiness/lifecycle/audio behavior changed.

## YouTube Playables boundary

W6 was implemented against the current official YouTube Playables SDK contract.

The test SDK recorded readiness calls in exactly this order:

```text
firstFrameReady
gameReady
```

The adapter additionally proved:

- initial YouTube audio-disabled state reaches shared runtime state;
- `onAudioEnabledChange` updates that state;
- SDK `onPause` pauses LittleJS;
- SDK `onResume` resumes LittleJS;
- shared `LifecycleRuntime` contains no Page Visibility API;
- YouTube adapter contains no Page Visibility API.

The production YouTube wrapper contains:

```html
<script src="https://www.youtube.com/game_api/v1"></script>
<script>window.__GAME_FACTORY_PLATFORM__="youtube";</script>
<script type="module" ...></script>
```

The SDK therefore loads before game code.

This is an integration-contract proof, not a claim of YouTube publishing/certification approval. The official YouTube Playables test suite remains a publishing gate when a real game is submitted.

## Lifecycle extraction result

Before W6, `LifecycleRuntime` owned browser visibility behavior.

After W6:

```text
LifecycleRuntime
  receives pause/resume callbacks
        |
        +-- WebPlatform -> Page Visibility
        +-- PlayableAdPlatform -> Page Visibility
        +-- YouTubePlatform -> ytgame.system.onPause/onResume
```

This prevents the YouTube path from violating the platform rule that pause/resume must come from the Playables SDK rather than Page Visibility.

## Audio boundary

PlatformBridge now exposes:

- `isAudioEnabled()`;
- `onAudioEnabledChange(...)`.

The current proof games contain no audio, but the required distribution signal is now available before W7 adds real presentation/audio.

No game-family code knows where the audio state came from.

## Distribution packaging

The canonical Vite build remains `dist/`.

W6 derives three self-contained package directories:

```text
dist-platforms/
  web/
  youtube/
  playable-ad/
```

Measured package directory sizes from accepted CI evidence:

- web: **145,400 bytes**
- playable-ad: **145,408 bytes**
- youtube: **145,468 bytes**

All built asset references are relative.

Static wrapper validation proved:

- Web external runtime scripts: **0**
- Playable-ad external runtime scripts: **0**
- YouTube external runtime scripts: exactly **1**
- that one script is `https://www.youtube.com/game_api/v1`
- the YouTube SDK appears before the game module.

## Canonical artifact budget

W6 canonical build:

- total artifact: **145,338 bytes**
- main JS: **144,768 bytes**
- main JS gzip: **52,613 bytes**
- main JS Brotli: **45,780 bytes**
- external runtime references: **0**

Locked budget:

- total < 512,000 bytes — PASS
- main JS gzip < 153,600 bytes — PASS

Compared with W5, distribution support added only **560 bytes gzip** to the canonical gameplay bundle.

## SDK isolation

Static W6 evidence checked **12 game-family TypeScript source files**.

Forbidden distribution references found in gameplay:

```text
0
```

YouTube SDK references remain under `src/platform/`.

## Scope deliberately deferred

W6 does not invent behavior for capabilities that the proof games do not need.

Deferred until a real game requires them:

- YouTube cloud saves;
- score submission;
- rewarded/interstitial ads;
- locale;
- YouTube content opening;
- provider-specific playable-ad SDKs such as MRAID;
- platform monetization policy.

The current proof games intentionally restart each session and do not claim persistent progress.

## W7 handoff

The Game Factory can now start one real game without choosing its final distribution target up front.

W7 may use:

```text
npm run create-game -- --id <real-game>
```

and keep the resulting gameplay independent of standalone Web, YouTube Playables and playable-ad packaging.

The next north-star measurement changes from architecture proof to:

- time-to-playable;
- game-specific vs shared-file churn;
- human intervention time;
- visual/game-feel iteration cost.

## Final marker

`W6_DISTRIBUTION_ADAPTERS_PASS`
