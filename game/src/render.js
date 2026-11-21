// render.js — everything the eye sees: the museum floor, the guards and
// their vision cones, the lantern light, and the HUD and screens.
// One job: draw the current game state onto the canvas.

import { COLS, MAP, PALETTE, ROWS, TILE, TUNING, VIEW_H, VIEW_W } from './config.js';
import { GUARD_ALERT, GUARD_SEARCH, GUARD_SUSPICIOUS } from './guards.js';

export function drawGame(ctx, game) {
  drawFloor(ctx);
  drawExit(ctx, game);
  drawPickups(ctx, game);
  drawCover(ctx);
  drawWalls(ctx);
  drawCoinFlight(ctx, game);
  drawGuards(ctx, game);
  drawPlayer(ctx, game);
  drawDarkness(ctx, game);
  drawHud(ctx, game);
  if (game.state === 'title') drawTitle(ctx, game);
  if (game.state === 'won') drawEndScreen(ctx, game, true);
  if (game.state === 'lost') drawEndScreen(ctx, game, false);
}

function drawFloor(ctx) {
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      ctx.fillStyle = (tx + ty) % 2 === 0 ? PALETTE.floorA : PALETTE.floorB;
      ctx.fillRect(tx * TILE, ty * TILE, TILE, TILE);
    }
  }
  // Faint carpet runner down the middle hall, so the floor reads as a museum.
  ctx.fillStyle = 'rgba(122, 44, 44, 0.35)';
  ctx.fillRect(0, 5 * TILE, VIEW_W, TILE);
  ctx.fillStyle = 'rgba(122, 44, 44, 0.35)';
  ctx.fillRect(0, 12 * TILE, VIEW_W, TILE);
  ctx.strokeStyle = PALETTE.floorLine;
  ctx.lineWidth = 1;
  for (let tx = 0; tx <= COLS; tx++) {
    ctx.beginPath();
    ctx.moveTo(tx * TILE, 0);
    ctx.lineTo(tx * TILE, VIEW_H);
    ctx.stroke();
  }
  for (let ty = 0; ty <= ROWS; ty++) {
    ctx.beginPath();
    ctx.moveTo(0, ty * TILE);
    ctx.lineTo(VIEW_W, ty * TILE);
    ctx.stroke();
  }
}

function drawWalls(ctx) {
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      if (MAP[ty][tx] !== '#') continue;
      ctx.fillStyle = PALETTE.wall;
      ctx.fillRect(tx * TILE, ty * TILE, TILE, TILE);
      ctx.fillStyle = PALETTE.wallTop;
      ctx.fillRect(tx * TILE, ty * TILE, TILE, 6);
    }
  }
}

function drawCover(ctx) {
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      const ch = MAP[ty][tx];
      const x = tx * TILE;
      const y = ty * TILE;
      if (ch === 'C') {
        ctx.fillStyle = PALETTE.crate;
        ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
        ctx.fillStyle = PALETTE.crateTop;
        ctx.fillRect(x + 3, y + 3, TILE - 6, 7);
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.strokeRect(x + 3, y + 3, TILE - 6, TILE - 6);
      } else if (ch === 'D') {
        ctx.fillStyle = PALETTE.caseBase;
        ctx.fillRect(x + 4, y + 4, TILE - 8, TILE - 8);
        ctx.fillStyle = PALETTE.caseGlass;
        ctx.fillRect(x + 9, y + 9, TILE - 18, TILE - 18);
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillRect(x + 9, y + 9, TILE - 18, 5);
      }
    }
  }
}

function drawExit(ctx, game) {
  const e = game.exit;
  const pulse = 0.6 + 0.4 * Math.sin(game.time * 3);
  ctx.save();
  ctx.fillStyle = `rgba(47, 191, 113, ${0.25 + 0.35 * pulse})`;
  ctx.fillRect(e.x - 20, e.y - 20, 40, 40);
  ctx.strokeStyle = PALETTE.exit;
  ctx.lineWidth = 3;
  ctx.strokeRect(e.x - 20, e.y - 20, 40, 40);
  ctx.fillStyle = '#eafff3';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('EXIT', e.x, e.y);
  ctx.restore();
}

function drawPickups(ctx, game) {
  for (const r of game.relics) {
    if (r.taken) continue;
    const bob = Math.sin(game.time * 2.5 + r.x) * 3;
    ctx.save();
    ctx.translate(r.x, r.y + bob);
    ctx.fillStyle = PALETTE.relic;
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(9, 0);
    ctx.lineTo(0, 12);
    ctx.lineTo(-9, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(4, 0);
    ctx.lineTo(0, 6);
    ctx.lineTo(-4, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  for (const c of game.coins) {
    if (c.taken) continue;
    ctx.fillStyle = PALETTE.coin;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff0b0';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCoinFlight(ctx, game) {
  const coin = game.thrownCoin;
  if (!coin) return;
  ctx.fillStyle = PALETTE.coin;
  ctx.beginPath();
  ctx.arc(coin.x, coin.y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(242,193,78,0.6)';
  ctx.beginPath();
  ctx.arc(coin.x, coin.y, 10 + (1.2 - coin.ttl) * 30, 0, Math.PI * 2);
  ctx.stroke();
}

function drawGuards(ctx, game) {
  for (const g of game.guards) {
    drawVisionCone(ctx, g, game.player);
    // Body: a red-coated watchman with a cap brim and a lantern dot.
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.fillStyle = PALETTE.guard;
    ctx.beginPath();
    ctx.arc(0, 0, TUNING.guardRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7e2b2b';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.rotate(g.angle);
    ctx.fillStyle = '#ffd75e';
    ctx.beginPath();
    ctx.arc(10, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2b2b2b';
    ctx.fillRect(8, -7, 9, 14);
    ctx.restore();

    // Suspicion meter above the head: ? while curious, ! while chasing.
    if (g.suspicion > 4 || g.state === GUARD_ALERT) {
      const w = 30;
      const frac = g.suspicion / 100;
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(g.x - w / 2, g.y - 30, w, 5);
      ctx.fillStyle = g.state === GUARD_ALERT ? '#ff5040' : '#ffd75e';
      ctx.fillRect(g.x - w / 2, g.y - 30, w * frac, 5);
      ctx.fillStyle = g.state === GUARD_ALERT ? '#ff5040' : '#ffd75e';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(g.state === GUARD_ALERT ? '!' : '?', g.x, g.y - 34);
    }
    if (g.state === GUARD_SEARCH) {
      ctx.fillStyle = '#ffd75e';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', g.x, g.y - 34);
    }
  }
}

function drawVisionCone(ctx, guard, player) {
  const range = player.sneaking ? TUNING.visionRangeSneak : TUNING.visionRange;
  const alert = guard.state === GUARD_ALERT;
  ctx.save();
  ctx.fillStyle = alert ? PALETTE.coneAlert : PALETTE.cone;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.arc(
    guard.x,
    guard.y,
    range,
    guard.angle - TUNING.visionHalfAngle,
    guard.angle + TUNING.visionHalfAngle,
  );
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawPlayer(ctx, game) {
  const p = game.player;
  ctx.save();
  ctx.translate(p.x, p.y);
  // A soft lantern glow under the thief.
  ctx.fillStyle = 'rgba(232,182,76,0.25)';
  ctx.beginPath();
  ctx.arc(0, 0, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.rotate(p.angle);
  // Hooded cloak: a dark circle, a gold trim, and the lantern ahead.
  ctx.fillStyle = p.sneaking ? PALETTE.playerSneak : PALETTE.player;
  ctx.beginPath();
  ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1d1a16';
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  ctx.arc(11, 0, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Night lighting: the room is dim except for the lantern light around
// the thief and a small pool around each guard's lamp. The darkness layer
// is one reused offscreen canvas, punched through with radial gradients.
const darkLayer = document.createElement('canvas');
darkLayer.width = VIEW_W;
darkLayer.height = VIEW_H;

function drawDarkness(ctx, game) {
  const dctx = darkLayer.getContext('2d');
  dctx.globalCompositeOperation = 'source-over';
  dctx.clearRect(0, 0, VIEW_W, VIEW_H);
  dctx.fillStyle = PALETTE.dark;
  dctx.fillRect(0, 0, VIEW_W, VIEW_H);
  dctx.globalCompositeOperation = 'destination-out';
  const hole = (x, y, r) => {
    const grad = dctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, 'rgba(0,0,0,1)');
    grad.addColorStop(0.7, 'rgba(0,0,0,0.85)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    dctx.fillStyle = grad;
    dctx.beginPath();
    dctx.arc(x, y, r, 0, Math.PI * 2);
    dctx.fill();
  };
  hole(game.player.x, game.player.y, 260);
  for (const g of game.guards) hole(g.x, g.y, 160);
  hole(game.exit.x, game.exit.y, 120);
  ctx.drawImage(darkLayer, 0, 0);
}

function drawHud(ctx, game) {
  ctx.save();
  ctx.fillStyle = 'rgba(8, 10, 18, 0.72)';
  ctx.fillRect(0, 0, VIEW_W, 34);
  ctx.fillStyle = PALETTE.hud;
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const relics = game.relics.filter((r) => r.taken).length;
  ctx.fillText(`◆ Relics ${relics}/${game.relics.length}`, 12, 18);
  ctx.fillText(`Score ${game.score}`, 190, 18);
  const t = Math.max(0, game.timeLeft);
  const mm = String(Math.floor(t / 60)).padStart(2, '0');
  const ss = String(Math.floor(t % 60)).padStart(2, '0');
  ctx.fillText(`Time ${mm}:${ss}`, 330, 18);
  const alarm = game.guards.some((g) => g.state === GUARD_ALERT);
  const suspicious = game.guards.some(
    (g) => g.state === GUARD_SUSPICIOUS || g.state === GUARD_SEARCH,
  );
  ctx.textAlign = 'right';
  if (alarm) {
    ctx.fillStyle = '#ff5040';
    ctx.fillText('⚠ SPOTTED — RUN!', VIEW_W - 12, 18);
  } else if (suspicious) {
    ctx.fillStyle = '#ffd75e';
    ctx.fillText('? Something heard you…', VIEW_W - 12, 18);
  } else {
    ctx.fillStyle = '#9fd6a8';
    ctx.fillText('Unseen', VIEW_W - 12, 18);
  }
  ctx.restore();

  // Bottom hint bar.
  ctx.save();
  ctx.fillStyle = 'rgba(8, 10, 18, 0.6)';
  ctx.fillRect(0, VIEW_H - 26, VIEW_W, 26);
  ctx.fillStyle = '#c9c4b4';
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    'WASD / arrows move · Hold Shift to sneak · Click to toss a coin and lure a guard · Steal all relics, then reach the EXIT',
    VIEW_W / 2,
    VIEW_H - 13,
  );
  ctx.restore();
}

function drawTitle(ctx, game) {
  veil(ctx, 'rgba(4, 6, 14, 0.72)');
  centred(ctx, 'LANTERN THIEF', VIEW_H / 2 - 110, 'bold 54px Georgia, serif', '#ffd75e');
  centred(
    ctx,
    'Shadows of the Velvet Vault',
    VIEW_H / 2 - 62,
    'italic 22px Georgia, serif',
    '#e8e4d8',
  );
  centred(
    ctx,
    'A top-down stealth heist. Slip past the night watch, pocket every relic,',
    VIEW_H / 2 - 8,
    '16px sans-serif',
    '#c9c4b4',
  );
  centred(
    ctx,
    'and reach the green EXIT unseen. Guards patrol, watch, and chase —',
    VIEW_H / 2 + 16,
    '16px sans-serif',
    '#c9c4b4',
  );
  centred(
    ctx,
    'break their line of sight to lose the trail.',
    VIEW_H / 2 + 40,
    '16px sans-serif',
    '#c9c4b4',
  );
  centred(ctx, 'Click or press Enter to begin', VIEW_H / 2 + 92, 'bold 18px sans-serif', '#ffd75e');
  centred(
    ctx,
    'WASD / arrows move · Shift sneaks · Mouse click tosses a coin',
    VIEW_H / 2 + 122,
    '14px sans-serif',
    '#9aa0b0',
  );
}

function drawEndScreen(ctx, game, won) {
  veil(ctx, won ? 'rgba(6, 26, 14, 0.78)' : 'rgba(26, 6, 6, 0.78)');
  centred(
    ctx,
    won ? 'CLEAN GETAWAY!' : 'CAUGHT!',
    VIEW_H / 2 - 80,
    'bold 48px Georgia, serif',
    won ? '#7be495' : '#ff6a5e',
  );
  centred(
    ctx,
    won
      ? 'Every relic is yours, and no guard ever laid a hand on you.'
      : 'A guard caught you in the lamplight. The vault keeps its secrets… this time.',
    VIEW_H / 2 - 28,
    '16px sans-serif',
    '#e8e4d8',
  );
  const lines = [
    `Score ${game.score}`,
    `Relics ${game.relics.filter((r) => r.taken).length}/${game.relics.length}`,
    `Times spotted ${game.timesSpotted}`,
    `Coins tossed ${game.player.coinsThrown}`,
  ];
  lines.forEach((line, i) => {
    centred(ctx, line, VIEW_H / 2 + 12 + i * 24, '15px sans-serif', '#c9c4b4');
  });
  centred(
    ctx,
    'Press R or click to play again',
    VIEW_H / 2 + 128,
    'bold 17px sans-serif',
    '#ffd75e',
  );
}

function veil(ctx, color) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function centred(ctx, text, y, font, color) {
  ctx.save();
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, VIEW_W / 2, y);
  ctx.restore();
}
