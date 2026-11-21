// game.js — the heist itself: states, pickups, scoring and the win/lose rules.
// One job: own the game state and advance it one tick at a time.

import { GUARD_PATROLS, TUNING } from './config.js';
import { findTiles } from './level.js';
import { createGuard, updateGuard, GUARD_ALERT } from './guards.js';
import { createPlayer, throwCoin, updatePlayer } from './player.js';
import {
  initAudio,
  playAlert,
  playCaught,
  playCoinClink,
  playFootstep,
  playPickup,
  playWin,
  startAmbient,
} from './audio.js';

export function createGame() {
  const spawn = findTiles('P')[0];
  const game = {
    state: 'title', // title | playing | won | lost
    time: 0,
    timeLeft: TUNING.parSeconds,
    score: 0,
    timesSpotted: 0,
    everAlerted: false,
    player: createPlayer(spawn),
    guards: GUARD_PATROLS.map(createGuard),
    relics: findTiles('R').map((t) => ({ ...t, taken: false })),
    coins: findTiles('o').map((t) => ({ ...t, taken: false })),
    exit: findTiles('E')[0],
    thrownCoin: null,
    lastPlayerStep: 0,
    lastGuardSteps: new Map(),
    wasAlerted: false,
  };
  return game;
}

export function startGame(game) {
  const fresh = createGame();
  Object.assign(game, fresh);
  game.state = 'playing';
  initAudio();
  startAmbient();
}

export function updateGame(game, keys, dt) {
  game.time += dt;
  if (game.state !== 'playing') return;
  game.timeLeft = Math.max(0, game.timeLeft - dt);
  if (game.timeLeft <= 0) {
    loseGame(game, 'time');
    return;
  }

  // The thief moves; running feet are a noise guards can hear.
  const noise = updatePlayer(game.player, keys, dt);
  playSteps(game, dt);

  // A thrown coin's clink is a noise too, while it rings.
  let heard = noise;
  if (game.thrownCoin) {
    game.thrownCoin.ttl -= dt;
    if (game.thrownCoin.ttl <= 0) game.thrownCoin = null;
    else heard = { x: game.thrownCoin.x, y: game.thrownCoin.y, radius: TUNING.noiseRadiusCoin };
  }

  for (const guard of game.guards) {
    const result = updateGuard(guard, game.player, heard, dt);
    if (result === 'caught') {
      loseGame(game, 'caught');
      return;
    }
  }

  // The alarm sting fires once per chase, not every frame.
  const alerted = game.guards.some((g) => g.state === GUARD_ALERT);
  if (alerted && !game.wasAlerted) {
    game.timesSpotted += 1;
    game.everAlerted = true;
    playAlert();
  }
  game.wasAlerted = alerted;

  collectPickups(game);
  checkExit(game);
}

function playSteps(game, dt) {
  // Player footsteps: soft when sneaking, louder when running.
  const p = game.player;
  if (p.moving && Math.floor(p.stepPhase) !== game.lastPlayerStep) {
    game.lastPlayerStep = Math.floor(p.stepPhase);
    playFootstep(0, p.sneaking ? 0.25 : 0.7);
  }
  // Guard footsteps, panned by where they are relative to the player,
  // quieter with distance: footsteps that tell you where a guard is.
  for (const g of game.guards) {
    const step = Math.floor(g.stepPhase);
    if (step === game.lastGuardSteps.get(g)) continue;
    game.lastGuardSteps.set(g, step);
    const dist = Math.hypot(g.x - p.x, g.y - p.y);
    if (dist > 420) continue;
    const pan = Math.max(-1, Math.min(1, (g.x - p.x) / 300));
    playFootstep(pan, Math.max(0.1, 0.9 - dist / 420));
  }
}

function collectPickups(game) {
  const p = game.player;
  for (const r of game.relics) {
    if (!r.taken && Math.hypot(r.x - p.x, r.y - p.y) < 26) {
      r.taken = true;
      game.score += TUNING.relicScore;
      playPickup();
    }
  }
  for (const c of game.coins) {
    if (!c.taken && Math.hypot(c.x - p.x, c.y - p.y) < 22) {
      c.taken = true;
      game.score += TUNING.coinScore;
      playCoinClink();
    }
  }
}

function checkExit(game) {
  const p = game.player;
  const allRelics = game.relics.every((r) => r.taken);
  if (!allRelics) return;
  if (Math.hypot(game.exit.x - p.x, game.exit.y - p.y) < 26) {
    game.state = 'won';
    game.score += Math.round(game.timeLeft) * TUNING.timeBonusPerSecondLeft;
    if (!game.everAlerted) game.score += TUNING.ghostBonus;
    playWin();
  }
}

function loseGame(game, _reason) {
  game.state = 'lost';
  playCaught();
}

// Mouse click during play: toss a coin toward the click to lure a guard.
export function clickGame(game, x, y) {
  if (game.state === 'title') {
    startGame(game);
    return;
  }
  if (game.state === 'won' || game.state === 'lost') {
    startGame(game);
    return;
  }
  const landing = throwCoin(game.player, x, y);
  if (landing) {
    game.thrownCoin = landing;
    playCoinClink();
  }
}

export function keyGame(game, code, down) {
  if (down && code === 'Enter' && game.state === 'title') startGame(game);
  if (down && code === 'KeyR' && (game.state === 'won' || game.state === 'lost')) startGame(game);
}
