// player.js — the Lantern Thief: movement, sneaking and the coin toss.
// One job: turn keyboard + mouse input into where the thief is and how loud
// they are being. Detection itself lives in guards.js.

import { TUNING } from './config.js';
import { moveCircle } from './level.js';

export function createPlayer(spawn) {
  return {
    x: spawn.x,
    y: spawn.y,
    radius: TUNING.playerRadius,
    angle: 0, // facing, radians
    sneaking: false,
    moving: false,
    stepPhase: 0, // drives the footstep sound
    coinsThrown: 0,
  };
}

// keys: {up,down,left,right,sneak} booleans. Returns a noise event or null:
// {x, y, radius} when the thief's running feet are loud enough to hear.
export function updatePlayer(player, keys, dt) {
  let mx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  let my = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
  const len = Math.hypot(mx, my);
  player.moving = len > 0;
  if (!player.moving) return null;

  mx /= len;
  my /= len;
  player.angle = Math.atan2(my, mx);
  player.sneaking = !!keys.sneak;
  const speed = player.sneaking ? TUNING.playerSneakSpeed : TUNING.playerWalkSpeed;
  const moved = moveCircle(player.x, player.y, mx * speed * dt, my * speed * dt, player.radius);
  const dist = Math.hypot(moved.x - player.x, moved.y - player.y);
  player.x = moved.x;
  player.y = moved.y;

  // Footsteps tick with distance walked; the audio layer listens to stepPhase.
  player.stepPhase += dist / 26;

  // Running feet carry. Sneaking is silent.
  if (!player.sneaking && dist > 0.01) {
    return { x: player.x, y: player.y, radius: TUNING.noiseRadiusWalk };
  }
  return null;
}

// A thrown coin arcs to a point and clinks there; guards in earshot go
// and look. Returns the landing point, or null when out of throwing range.
export function throwCoin(player, targetX, targetY) {
  const dx = targetX - player.x;
  const dy = targetY - player.y;
  const dist = Math.hypot(dx, dy);
  if (dist > TUNING.coinThrowRange || dist < 8) return null;
  player.coinsThrown += 1;
  return {
    x: targetX,
    y: targetY,
    radius: TUNING.noiseRadiusCoin,
    ttl: 1.2, // seconds the clink keeps ringing
  };
}
