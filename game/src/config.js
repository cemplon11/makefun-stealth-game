// config.js — every tunable number and the level layout for Lantern Thief.
// One job: hold the static data. Nothing here runs game logic.

export const TILE = 40;
export const COLS = 26;
export const ROWS = 18;
export const VIEW_W = COLS * TILE; // 1040
export const VIEW_H = ROWS * TILE; // 720

// Legend: # wall  . floor  C crate (cover, blocks sight)  D display case (cover)
//         P player start  G guard spawn  R relic  E exit  o coin
export const MAP = [
  '##########################',
  '#P....#......#....R......#',
  '#.....#..C...#....#......#',
  '#.....#......#....#...o..#',
  '#.....D......D....#......#',
  '#........................#',
  '#.####..#####..####...#..#',
  '#........................#',
  '#..C....#....#.....C.....#',
  '#....#..#....#..#....#...#',
  '#....#.......#..#....#..o#',
  '#....####..###..#....#...#',
  '#........................#',
  '#..R....#....#.....#.....#',
  '#....#..#....#..C..#..G..#',
  '#....#.......#.....#.....#',
  '#....####..###..#..#..R.E#',
  '##########################',
];

// Patrol routes: lists of tile waypoints each guard walks in a loop.
// Guards walk slowly and pause briefly at each waypoint, so a patient
// player can learn the rhythm and slip through behind them.
export const GUARD_PATROLS = [
  { waypoints: [[5, 5], [20, 5], [20, 7], [5, 7]], speed: 52, pause: 1.2 },
  { waypoints: [[12, 9], [12, 13], [17, 13], [17, 9]], speed: 58, pause: 0.9 },
  { waypoints: [[2, 12], [8, 12], [8, 16], [2, 16]], speed: 48, pause: 1.4 },
  { waypoints: [[21, 12], [24, 12], [24, 16], [21, 16]], speed: 62, pause: 0.7 },
];

export const TUNING = {
  playerWalkSpeed: 150, // px/s, noisy
  playerSneakSpeed: 78, // px/s, quiet, harder to spot
  playerRadius: 13,
  guardRadius: 14,
  visionRange: 185, // px, full when the player runs
  visionRangeSneak: 118, // px, sneaking shrinks the cone's reach
  visionHalfAngle: 0.62, // radians (~35 deg each side)
  suspicionPerSecondClose: 95, // player well inside the cone
  suspicionPerSecondFar: 42, // player at the cone's edge
  suspicionDecayPerSecond: 26,
  alertSuspicion: 100,
  chaseSpeed: 132,
  searchSeconds: 4.5,
  catchDistance: 22,
  noiseRadiusWalk: 95, // guards inside this hear running feet
  noiseRadiusCoin: 150, // a thrown coin rings out this far
  coinThrowRange: 260,
  relicScore: 500,
  coinScore: 50,
  ghostBonus: 400, // finishing without ever being fully spotted
  timeBonusPerSecondLeft: 4, // from a 240 s par
  parSeconds: 240,
};

export const PALETTE = {
  floorA: '#333845',
  floorB: '#2d313d',
  floorLine: '#22262f',
  wall: '#4a4238',
  wallTop: '#6b5f4c',
  crate: '#7a5c33',
  crateTop: '#9c783f',
  caseGlass: '#3f6d8e',
  caseBase: '#54432a',
  exit: '#2fbf71',
  relic: '#ffd75e',
  coin: '#f2c14e',
  player: '#e8b64c',
  playerSneak: '#c98f2e',
  guard: '#c94f4f',
  cone: 'rgba(255, 214, 90, 0.27)',
  coneAlert: 'rgba(255, 70, 60, 0.34)',
  dark: 'rgba(4, 6, 14, 0.58)',
  hud: '#e8e4d8',
};
