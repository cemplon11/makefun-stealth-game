// main.js — bootstrap: canvas, input, the animation loop.
// One job: wire the game to the browser and nothing else.

import { VIEW_H, VIEW_W } from './config.js';
import { createGame, clickGame, keyGame, startGame, updateGame } from './game.js';
import { drawGame } from './render.js';
import { initAudio } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW_W;
canvas.height = VIEW_H;

const game = createGame();

const keys = {
  up: false,
  down: false,
  left: false,
  right: false,
  sneak: false,
};

const KEYMAP = {
  KeyW: 'up',
  ArrowUp: 'up',
  KeyS: 'down',
  ArrowDown: 'down',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
  ShiftLeft: 'sneak',
  ShiftRight: 'sneak',
};

window.addEventListener('keydown', (e) => {
  if (KEYMAP[e.code] !== undefined) {
    keys[KEYMAP[e.code]] = true;
    e.preventDefault();
  }
  keyGame(game, e.code, true);
  initAudio();
});

window.addEventListener('keyup', (e) => {
  if (KEYMAP[e.code] !== undefined) keys[KEYMAP[e.code]] = false;
});

function canvasPoint(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * VIEW_W,
    y: ((e.clientY - rect.top) / rect.height) * VIEW_H,
  };
}

canvas.addEventListener('pointerdown', (e) => {
  initAudio();
  const p = canvasPoint(e);
  clickGame(game, p.x, p.y);
});

// Fit the 1040x720 stage into any window while keeping its aspect.
function fitCanvas() {
  const scale = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
  canvas.style.width = `${Math.floor(VIEW_W * scale)}px`;
  canvas.style.height = `${Math.floor(VIEW_H * scale)}px`;
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  updateGame(game, keys, dt);
  drawGame(ctx, game);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Staging hook for screenshots: put the game into a real mid-play state
// (player behind cover, a guard sweeping past) and render it. The game
// itself is unchanged; only positions are set, as if the player walked there.
window.__stage = function (name) {
  const g = game;
  if (g.state === 'title') startGame(g);
  if (name === 'cover') {
    // Player crouched behind the crate row at the top hall, guard closing in.
    g.player.x = 340;
    g.player.y = 150;
    g.player.sneaking = true;
    g.guards[0].x = 420;
    g.guards[0].y = 220;
    g.guards[0].angle = Math.atan2(150 - 220, 340 - 420);
    g.guards[0].suspicion = 55;
    g.guards[0].state = 'suspicious';
    g.guards[0].lastKnown = { x: 340, y: 150 };
  } else if (name === 'chase') {
    // Mid-chase in the middle hall: guard on the player's heels.
    g.player.x = 560;
    g.player.y = 400;
    g.player.sneaking = false;
    g.guards[1].x = 400;
    g.guards[1].y = 400;
    g.guards[1].angle = 0;
    g.guards[1].suspicion = 100;
    g.guards[1].state = 'alert';
    g.guards[1].lastKnown = { x: 520, y: 400 };
    g.timesSpotted = 1;
    g.everAlerted = true;
  } else if (name === 'exit') {
    // Endgame: all relics pocketed, thief one step from the green exit.
    for (const r of g.relics) r.taken = true;
    g.score = 1500;
    g.player.x = 880;
    g.player.y = 660;
    g.player.sneaking = true;
    g.guards[3].x = 780;
    g.guards[3].y = 560;
    g.guards[3].angle = Math.atan2(660 - 560, 880 - 780);
  }
  return true;
};
window.__game = game;
