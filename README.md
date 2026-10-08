# Game Factory

AI-native web-game production factory built on the accepted LittleJS baseline.

## Source of truth

`main` is accepted state. Work lands through gated PRs and verified GitHub Actions.

## Current phase: W9 — first human playtest

- W0–W8 technical vertical complete; Mass Runner has five authored levels, touch controls, sound, polished visuals and distribution adapters.
- W9.1 prepares a stand-alone Mass Runner HTML5 build and copy-only feedback page.
- W9.2 requires real human observation on a physical phone/desktop.
- W9.3 decides Go / Iterate / Stop from actual player evidence.

The `main` root `index.html` deliberately retains the foundation proof runner.
The W9 playtest export routes a fresh visitor into **Mass Runner** automatically
without changing Factory production gameplay.

## Commands

```bash
npm install
npm run verify
npm run package:playtest
npm run test:w9-playtest
```

The generated `playtest-dist/` folder contains the game at `index.html`
and the separate `feedback.html` page.

For human testing, see [W9 protocol](docs/playtest/W9-HUMAN-PLAYTEST-PROTOCOL.md).
For upload to itch.io or GitHub Pages, prefer the CI-tested release
artifact rather than a local unverified build.

Public-site publishing is deliberately **manual only**. A passing PR
does not automatically deploy or invite testers.
