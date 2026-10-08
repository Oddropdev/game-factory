# W9 — First Human Playtest / Publishing Test

Date: 2026-10-08

## Decision

W8.3 proved technical gameplay and presentation; W9 must prove
first-time human understanding and actual feel.

Do **not** build a generic telemetry/analytics platform.
Do **not** publish to a storefront before the first on-device test.
W9 is an evidence-led decision, not another architecture sprint.

## Phases

### W9.1 — Standalone release candidate

- Generate `playtest-dist/` from the accepted W6 Web distribution;
- open Mass Runner by default without teaching testers to append a query;
- preserve Web/touch, polished visuals, and gesture-gated audio;
- package an HTML5 ZIP with root `index.html` for itch.io;
- offer a separate, optional local-only copyable feedback form;
- produce a CI-tested artifact and **manual-only** GitHub Pages workflow.

Status: pending automated CI.

### W9.2 — Real human observations

First the owner personally uses the build:
- desktop with real audio;
- Android/iPhone physical touchscreen in portrait;
- optionally landscape rotation and headphones/speaker.

Then 5–8 first-time external players, preferably mobile-heavy.
Do not explain the controls or gate mechanic before the first play.
Invite them to play for 2–4 minutes and stop whenever they like.

Observe only what is necessary:
1. Did they start within ~15 seconds without instructions?
2. Did they understand steering and desirable arithmetic gates?
3. Were positive pickups/multipliers satisfying to *see and hear*?
4. Any broken touch/viewport/audio behavior?
5. Did they voluntarily replay or continue?

Only after play, ask them to open `feedback.html`.
They fill the short form, copy the results and send via their existing chat.
No gameplay telemetry, persistent local storage, Google Forms or new backend.
Consent before capturing any screen recording or other identifying material.

### W9.3 — Decision

Technical gate:
- game starts and runs on physical phone + computer;
- no critical crash/blocking interaction;
- audio can be heard without being offensively loud.

Qualitative signals (small n; do not overstate statistical significance):
- at least 4 of first 5 players understand how to begin unaided;
- strong desire to keep playing; track spontaneous continuation and replay;
- recurring steering confusion, unclear gate benefits or harsh SFX are blockers
  for widening exposure if multiple players independently report them.

If **2+ independent players** report the same severe confusion or feel
issue, prioritize that problem over additional visual polish.

Sort findings into:
- P0: can't start, can't steer, crash, unusable mobile layout.
- P1: unclear objective/gates, dull growth reward, frustrating control,
  fatiguing audio.
- P2: cosmetic identity and content requests.

Decision: **GO** to a slightly larger invite group, **ITERATE** with at
most 1–3 highest-impact changes, or **STOP** if the core loop is unfun.

## Owner human work — minimal and high value

**One-time publishing setup (optional):**

1. GitHub `Oddropdev/game-factory` → Settings → Pages.
2. Under Build and deployment, choose Source: **GitHub Actions**.
3. Actions → **W9 Publish Playtest to GitHub Pages (manual)**.
4. Select branch **main**, choose **Run workflow**.
5. Open the resulting deployed site. For ordinary project Pages this is
   typically `https://oddropdev.github.io/game-factory/`, but do not
   share that address before its deployment is confirmed healthy.

GitHub Pages sites are publicly reachable even with `noindex`;
`noindex` is not access control. Share with a small invite group only.

**Alternative publishing route (itch.io):**

1. Open the latest W9.1 PASS run's artifact
   `w9-1-playtest-release-candidate`.
2. Download and extract the artifact; find `mass-runner-w9-html5.zip`.
3. On itch.io create a project of kind **HTML Game**.
4. Upload that ZIP (it already has root `index.html` and relative assets).
5. Choose a mobile-friendly fullscreen launch option, save, test on phone,
   and keep visibility limited while collecting feedback.

**Owner's first hands-on test (5–10 minutes):**

- Open the real playtest link on a physical phone, audio on.
- Try to play from zero instructions. Is it obvious to touch/steer?
- Try one win or loss, listen to pickups, hazards and gates.
- Repeat on desktop. Note any difference in controls and viewport.
- Write a short observation in the project chat:

```text
W9 HUMAN #1
Device/browser:
First 15 seconds: clear / partly clear / confusing
Steering 1–5:
Growth/reward 1–5:
Audio: satisfying / neutral / irritating / inaudible
Biggest problem:
Would I play a second round? why?
Any technical blocker:
```

No PowerShell commands are required for the GitHub Pages publication path.

## Frozen code

- W8.3 accepted main: `0c62d9d2cf7f1ae50650b96f76d20467b01e7c40`;
- no production game semantics, runtime, factory or platform changes in W9.1;
- build/export/test/docs workflow only.

## Publication safety

The repository's publishing action is **manual-only**. Merge does not
publish. Human approval/account setup is required for any external
publicly reachable test site.

Expected W9.1 marker: `W9_1_PLAYTEST_RELEASE_PASS`.
This marker proves the testable build, NOT user-validated game feel.

W9 remains OPEN until W9.2 human evidence is recorded and W9.3 decision made.
