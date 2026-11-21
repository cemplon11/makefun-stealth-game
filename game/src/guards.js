// guards.js — the museum watch: patrols, vision cones and the detection
// ladder suspicion -> alert -> chase -> search -> back to patrol.
// One job: decide what each guard knows and where each guard goes.

import { TUNING } from './config.js';
import { hasLineOfSight, moveCircle, tileCenter } from './level.js';

export const GUARD_PATROL = 'patrol';
export const GUARD_SUSPICIOUS = 'suspicious';
export const GUARD_ALERT = 'alert';
export const GUARD_SEARCH = 'search';

export function createGuard(patrolDef) {
  const first = patrolDef.waypoints[0];
  const start = tileCenter(first[0], first[1]);
  return {
    waypoints: patrolDef.waypoints.map(([tx, ty]) => tileCenter(tx, ty)),
    waypointIndex: 1 % patrolDef.waypoints.length,
    pause: patrolDef.pause,
    speed: patrolDef.speed,
    x: start.x,
    y: start.y,
    angle: 0,
    radius: TUNING.guardRadius,
    state: GUARD_PATROL,
    suspicion: 0,
    pauseLeft: 0,
    searchLeft: 0,
    lastKnown: null,
    stepPhase: 0,
  };
}

// How well this guard can see the player right now: 0 = unseen,
// 1 = dead centre of the cone at close range. Sneaking shrinks the cone.
export function visionStrength(guard, player) {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  const range = player.sneaking ? TUNING.visionRangeSneak : TUNING.visionRange;
  if (dist > range) return 0;
  const toPlayer = Math.atan2(dy, dx);
  let diff = Math.abs(toPlayer - guard.angle);
  if (diff > Math.PI) diff = 2 * Math.PI - diff;
  if (diff > TUNING.visionHalfAngle) return 0;
  if (!hasLineOfSight(guard.x, guard.y, player.x, player.y)) return 0;
  // Closer and more centred = spotted faster.
  const closeness = 1 - dist / range;
  const centred = 1 - diff / TUNING.visionHalfAngle;
  return Math.min(1, 0.35 + 0.65 * closeness * (0.5 + 0.5 * centred));
}

// One guard, one tick. noise: {x, y, radius} or null (feet or a coin).
// Returns 'caught' when the guard lays hands on the thief.
export function updateGuard(guard, player, noise, dt) {
  // --- hearing: a noise inside earshot turns the head and raises suspicion.
  if (noise) {
    const d = Math.hypot(noise.x - guard.x, noise.y - guard.y);
    if (d < noise.radius + 40 && guard.state !== GUARD_ALERT) {
      guard.lastKnown = { x: noise.x, y: noise.y };
      guard.suspicion = Math.max(guard.suspicion, 45);
      if (guard.state === GUARD_PATROL) guard.state = GUARD_SUSPICIOUS;
    }
  }

  // --- seeing: suspicion climbs while the player is in the cone.
  const seen = visionStrength(guard, player);
  if (seen > 0) {
    const rate = seen > 0.6 ? TUNING.suspicionPerSecondClose : TUNING.suspicionPerSecondFar;
    guard.suspicion = Math.min(TUNING.alertSuspicion, guard.suspicion + rate * seen * dt);
    guard.lastKnown = { x: player.x, y: player.y };
    if (guard.suspicion >= TUNING.alertSuspicion && guard.state !== GUARD_ALERT) {
      guard.state = GUARD_ALERT;
    } else if (guard.state === GUARD_PATROL) {
      guard.state = GUARD_SUSPICIOUS;
    }
  } else if (guard.state === GUARD_PATROL || guard.state === GUARD_SUSPICIOUS) {
    guard.suspicion = Math.max(0, guard.suspicion - TUNING.suspicionDecayPerSecond * dt);
    if (guard.state === GUARD_SUSPICIOUS && guard.suspicion <= 0) {
      guard.state = GUARD_PATROL;
      guard.lastKnown = null;
    }
  }

  // --- moving, by state.
  if (guard.state === GUARD_PATROL) {
    walkPatrol(guard, dt);
  } else if (guard.state === GUARD_SUSPICIOUS) {
    // Creep toward the last thing that caught the eye, then give up.
    if (guard.lastKnown) {
      const arrived = walkToward(guard, guard.lastKnown.x, guard.lastKnown.y, guard.speed * 0.55, dt);
      if (arrived) {
        guard.lastKnown = null;
        guard.pauseLeft = 0.8;
      }
    } else if (guard.pauseLeft > 0) {
      guard.pauseLeft -= dt;
    } else {
      walkPatrol(guard, dt);
    }
  } else if (guard.state === GUARD_ALERT) {
    // Chase the last known position; keep updating it while the player
    // is visible, so the trail stays hot.
    if (seen > 0) guard.lastKnown = { x: player.x, y: player.y };
    if (guard.lastKnown) {
      walkToward(guard, guard.lastKnown.x, guard.lastKnown.y, TUNING.chaseSpeed, dt);
      if (Math.hypot(player.x - guard.x, player.y - guard.y) < TUNING.catchDistance) {
        return 'caught';
      }
      const atLastKnown =
        Math.hypot(guard.lastKnown.x - guard.x, guard.lastKnown.y - guard.y) < 14;
      if (atLastKnown && seen <= 0) {
        guard.state = GUARD_SEARCH;
        guard.searchLeft = TUNING.searchSeconds;
      }
    } else {
      guard.state = GUARD_SEARCH;
      guard.searchLeft = TUNING.searchSeconds;
    }
  } else if (guard.state === GUARD_SEARCH) {
    // Lost the trail: look around, then walk back to the patrol route.
    guard.searchLeft -= dt;
    guard.angle += dt * 1.6; // scanning sweep
    if (guard.searchLeft <= 0) {
      guard.state = GUARD_PATROL;
      guard.suspicion = 0;
      guard.lastKnown = null;
    }
  }
  return null;
}

function walkPatrol(guard, dt) {
  if (guard.pauseLeft > 0) {
    guard.pauseLeft -= dt;
    return;
  }
  const target = guard.waypoints[guard.waypointIndex];
  const arrived = walkToward(guard, target.x, target.y, guard.speed, dt);
  if (arrived) {
    guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
    guard.pauseLeft = guard.pause;
  }
}

// Walk toward a point, facing it. Returns true when arrived.
function walkToward(guard, tx, ty, speed, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 6) return true;
  guard.angle = Math.atan2(dy, dx);
  const step = Math.min(dist, speed * dt);
  const moved = moveCircle(guard.x, guard.y, (dx / dist) * step, (dy / dist) * step, guard.radius);
  const walked = Math.hypot(moved.x - guard.x, moved.y - guard.y);
  guard.x = moved.x;
  guard.y = moved.y;
  guard.stepPhase += walked / 30;
  return dist - step < 6;
}

// The loudest alarm in the room: 1 while any guard is chasing.
export function alarmLevel(guards) {
  return guards.some((g) => g.state === GUARD_ALERT) ? 1 : 0;
}
