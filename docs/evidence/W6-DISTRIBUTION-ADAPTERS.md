# W6 — Distribution Adapters

Status: **IMPLEMENTATION CANDIDATE**

Branch: `w6-distribution-adapters`

## Candidate architecture

```text
GameModule / GameRegistry
          |
     shared main
          |
   PlatformBridge
    /     |      \
 Web  YouTube  PlayableAd
```

Platform SDK concerns stay below `PlatformBridge`.

## Packaging target

```text
dist-platforms/
  web/
  youtube/
  playable-ad/
```

## High-ROI proof

Use the already accepted deterministic Runner as the cross-adapter canary.

Expected invariant:

```text
same Runner course signature
same seed
same GameModule code
different platform lifecycle/readiness boundary
```

## YouTube evidence target

The fake SDK must record exactly:

```text
firstFrameReady
gameReady
```

in that order, and its pause/resume/audio callbacks must drive shared runtime state without Page Visibility API usage inside the YouTube adapter.

## Expected markers

- `W1_ARTIFACT_BUDGET_PASS`
- `W6_DISTRIBUTION_ADAPTERS_CONTRACT_PASS`
- `W6_DISTRIBUTION_ADAPTERS_PASS`

Do not merge before all W1–W6 behavior and packaging gates pass.
