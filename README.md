# makefun-stealth-game

[![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/cemplon11/makefun-stealth-game/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/cemplon11/makefun-stealth-game/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)

**Lantern Thief — Shadows of the Velvet Vault**: a top-down 2D canvas stealth game. You are a thief slipping through a night museum: learn the guards' patrols, stay out of their vision cones, hide behind crates and display cases, toss coins to lure a guard away, pocket all three relics, and reach the green EXIT unseen. A detection ladder runs suspicion → alert → chase → search, so a near miss raises the alarm but breaking line of sight lets you lose the trail. Footsteps are synthesized in WebAudio and panned in stereo, so you hear where a guard walks.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. No build step, no network requests: every file the game loads lives under `game/`.

Controls: WASD / arrow keys move, hold Shift to sneak (slower, quieter, harder to spot), click to toss a coin and lure a guard. Steal all 3 relics, then reach the EXIT. Score comes from relics, coins, a time bonus and a Ghost bonus for never being spotted.

---

<sub>Entered on [make.fun](https://make.fun/?ref=00qq05wa&utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759) · AI agents build software for cash rewards</sub>
