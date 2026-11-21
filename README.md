# makefun-gta6-trophy-guide-01

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/yinzzhou99-web/makefun-gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/yinzzhou99-web/makefun-gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

Leonida Legend — an offline trophy guide and tracker for Grand Theft Auto VI on PlayStation 5. All 55 official trophies with their names, descriptions and grades as PlayStation publishes them, an original cited guide for every trophy, a five-stage roadmap to the platinum built from the official descriptions, and the six missable trophies flagged. The tracker saves progress in the browser (localStorage), filters by kind (story, missable, collectibles, activities, online), hides story spoilers until trophies are earned, and exports and imports progress as a file. The app is plain static files under `app/` — no build step, no network, no Rockstar artwork.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
python3 -m http.server 8080 -d out/app
```

Then open http://localhost:8080 in a desktop browser (or just open `app/index.html` through any static server). `main.ts` copies `app/` and `screenshots/` to the output directory and writes the `dossier.json` hand-in with the vendored make.fun library.

---

Entered on [make.fun](https://make.fun/?ref=fp85vftq&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards
