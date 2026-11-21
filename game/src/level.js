// level.js — the museum floor: tile map, walls, cover and collision.
// One job: answer "what is at this tile / can I stand here / can I see through it".

import { COLS, MAP, ROWS, TILE } from './config.js';

export const TILE_WALL = '#';
export const TILE_CRATE = 'C';
export const TILE_CASE = 'D';

// A tile blocks movement if it is a wall, a crate or a display case.
export function isSolidTile(ch) {
  return ch === '#' || ch === 'C' || ch === 'D';
}

// A tile blocks a guard's line of sight if it is a wall, a crate or a case.
// Crates and cases are the cover the player hides behind.
export function blocksSightTile(ch) {
  return ch === '#' || ch === 'C' || ch === 'D';
}

export function tileAt(tx, ty) {
  if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return '#';
  return MAP[ty][tx];
}

export function tileCenter(tx, ty) {
  return { x: (tx + 0.5) * TILE, y: (ty + 0.5) * TILE };
}

// Circle-vs-tile collision: slide along walls instead of sticking.
export function moveCircle(x, y, dx, dy, radius) {
  const nx = x + dx;
  if (!circleHitsSolid(nx, y, radius)) x = nx;
  const ny = y + dy;
  if (!circleHitsSolid(x, ny, radius)) y = ny;
  return { x, y };
}

function circleHitsSolid(x, y, radius) {
  const x0 = Math.floor((x - radius) / TILE);
  const x1 = Math.floor((x + radius) / TILE);
  const y0 = Math.floor((y - radius) / TILE);
  const y1 = Math.floor((y + radius) / TILE);
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      if (!isSolidTile(tileAt(tx, ty))) continue;
      const cx = Math.max(tx * TILE, Math.min(x, (tx + 1) * TILE));
      const cy = Math.max(ty * TILE, Math.min(y, (ty + 1) * TILE));
      const ddx = x - cx;
      const ddy = y - cy;
      if (ddx * ddx + ddy * ddy < radius * radius) return true;
    }
  }
  return false;
}

// Bresenham-style line of sight: true when no sight-blocking tile
// stands between two points (used for vision cones).
export function hasLineOfSight(x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / (TILE / 4)));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const tx = Math.floor((x0 + dx * t) / TILE);
    const ty = Math.floor((y0 + dy * t) / TILE);
    if (blocksSightTile(tileAt(tx, ty))) return false;
  }
  return true;
}

// Scan the map once for the interesting tiles.
export function findTiles(ch) {
  const out = [];
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      if (MAP[ty][tx] === ch) out.push({ tx, ty, ...tileCenter(tx, ty) });
    }
  }
  return out;
}
