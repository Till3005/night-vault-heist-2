import { TILE, COLS, ROWS, W, H } from './util.js';

export const MAP = [
  '########################',
  '#......#.......#...##..#',
  '#......#.......#...##..#',
  '#......#.......#.......#',
  '#.##...#.......+..##...#',
  '#.##...#.......#.......#',
  '#......#.......#.......#',
  '#......#.......#.......#',
  '###.########.####.######',
  '#......................#',
  '#..##....##....##...##.#',
  '#..##....##....##...##.#',
  '#......................#',
  '####EE##################',
  '~~~~~~~~~~~~~~~~~~~~~~~~',
];

export const ROOMS = [
  { name: 'WEST WING', x: 40, y: 40, w: 240, h: 280, tint: 'rgba(214,160,74,0.05)', label: 'WEST WING', labelY: 186, labelSize: 24, labelSpacing: 5, labelColor: 'rgba(255,240,200,0.08)' },
  { name: 'VAULT', x: 320, y: 40, w: 280, h: 280, tint: 'rgba(255,196,80,0.06)' },
  { name: 'EAST WING', x: 640, y: 40, w: 280, h: 280, tint: 'rgba(96,150,214,0.05)', label: 'EAST WING', labelY: 190, labelSize: 24, labelSpacing: 5, labelColor: 'rgba(190,220,255,0.08)' },
  { name: 'MAIN HALL', x: 40, y: 360, w: 880, h: 160, tint: 'rgba(150,160,190,0.03)', label: 'MAIN HALL', labelY: 436, labelSize: 26, labelSpacing: 9, labelColor: 'rgba(220,228,255,0.055)' },
];

export const THIEF_START = { x: 4.5 * TILE, y: 12.4 * TILE };
export const EXIT_TILES = [
  { tx: 4, ty: 13 },
  { tx: 5, ty: 13 },
];
export const VAN = { x: 158, y: 556, w: 104, h: 34 };

export const LAMPS = [
  { x: 140, y: 420, r: 120 },
  { x: 430, y: 500, r: 130 },
  { x: 700, y: 420, r: 120 },
  { x: 884, y: 500, r: 110 },
  { x: 176, y: 176, r: 130 },
  { x: 760, y: 150, r: 130 },
  { x: 460, y: 300, r: 120 },
];

export const GUARDS = [
  {
    name: 'HALL',
    speed: { patrol: 54, suspicious: 72, chase: 99 },
    fov: 1.24,
    range: 252,
    wps: [
      { x: 2.5, y: 9.4 },
      { x: 8.5, y: 9.4 },
      { x: 8.5, y: 12.6 },
      { x: 14, y: 12.6 },
      { x: 14, y: 9.4 },
      { x: 22.5, y: 9.4 },
      { x: 22.5, y: 12.6 },
      { x: 2.5, y: 12.6 },
    ],
  },
  {
    name: 'WEST',
    speed: { patrol: 50, suspicious: 68, chase: 94 },
    fov: 1.16,
    range: 224,
    wps: [
      { x: 1.6, y: 1.8 },
      { x: 5.5, y: 1.8 },
      { x: 5.5, y: 6.3 },
      { x: 1.6, y: 6.3 },
    ],
  },
  {
    name: 'EAST',
    speed: { patrol: 52, suspicious: 70, chase: 96 },
    fov: 1.2,
    range: 238,
    wps: [
      { x: 22.3, y: 3.2 },
      { x: 16.4, y: 4.2 },
      { x: 13.9, y: 4.6 },
      { x: 13.9, y: 6.2 },
      { x: 9.1, y: 6.2 },
      { x: 9.1, y: 2.3 },
      { x: 12.2, y: 2.3 },
      { x: 13.9, y: 4.6 },
      { x: 16.4, y: 4.2 },
    ],
  },
  {
    name: 'VAULT',
    speed: { patrol: 48, suspicious: 66, chase: 92 },
    fov: 1.12,
    range: 218,
    wps: [
      { x: 8.8, y: 1.7 },
      { x: 13.5, y: 1.7 },
      { x: 13.5, y: 2.7 },
      { x: 8.8, y: 2.7 },
    ],
  },
];

export const CAMERAS = [
  { x: 420, y: 362, base: Math.PI / 2, amp: 0.85, spd: 0.55, phase: 0, range: 195, fov: 0.62 },
  { x: 912, y: 110, base: 2.5, amp: 0.6, spd: 0.42, phase: 2.1, range: 260, fov: 0.56 },
  { x: 326, y: 130, base: 0.42, amp: 0.5, spd: 0.48, phase: 4.2, range: 205, fov: 0.56 },
  { x: 460, y: 44, base: Math.PI / 2, amp: 0.62, spd: 0.5, phase: 3.1, range: 185, fov: 0.54 },
];

export const LOOT = [
  { id: 'gold', label: 'GOLD BARS', value: 850000, dur: 1.2, x: 180, y: 104, w: 44, h: 30, kind: 'gold' },
  { id: 'gem', label: 'STAR SAPPHIRE', value: 1100000, dur: 1.2, x: 664, y: 236, w: 44, h: 30, kind: 'gem' },
  { id: 'crown', label: 'VAULT', value: 3200000, dur: 2.4, x: 460, y: 168, w: 0, h: 0, kind: 'vault' },
];

export const DECOR_CASES = [
  { x: 110, y: 292, w: 44, h: 30, kind: 'vase' },
  { x: 856, y: 268, w: 44, h: 30, kind: 'urn' },
];

export function tileAt(tiles, tx, ty) {
  if (ty < 0 || tx < 0 || ty >= ROWS || tx >= COLS) return '#';
  return tiles[ty][tx];
}

export function solidFor(tiles, tx, ty, who, doorOpen) {
  const t = tileAt(tiles, tx, ty);
  if (t === '#') return true;
  if (t === 'E') return who === 'guard' ? true : !doorOpen;
  if (t === '~') return who === 'guard';
  return false;
}

const LEVEL1 = {
  name: 'THE GRAND GALLERY',
  map: MAP,
  rooms: ROOMS,
  lamps: LAMPS,
  guards: GUARDS,
  cameras: CAMERAS,
  loot: LOOT,
  cases: DECOR_CASES,
  start: THIEF_START,
};

const MAP2 = [
  '########################',
  '#..........#...........#',
  '#..##......#......##...#',
  '#..##.............##...#',
  '#..........#...........#',
  '####.###########.#######',
  '#......................#',
  '#....##....####....##..#',
  '#....##....####....##..#',
  '#......................#',
  '#.......#......#.......#',
  '#..##...#......#...##..#',
  '#..##..............##..#',
  '####EE##################',
  '~~~~~~~~~~~~~~~~~~~~~~~~',
];

const ROOMS2 = [
  { name: 'WEST WING', x: 40, y: 40, w: 400, h: 280, tint: 'rgba(214,160,74,0.05)', label: 'WEST WING', labelY: 186, labelSize: 24, labelSpacing: 5, labelColor: 'rgba(255,240,200,0.08)' },
  { name: 'EAST WING', x: 480, y: 40, w: 440, h: 280, tint: 'rgba(96,150,214,0.05)', label: 'EAST WING', labelY: 190, labelSize: 24, labelSpacing: 5, labelColor: 'rgba(190,220,255,0.08)' },
  { name: 'MAIN HALL', x: 40, y: 360, w: 880, h: 160, tint: 'rgba(150,160,190,0.03)', label: 'MAIN HALL', labelY: 436, labelSize: 26, labelSpacing: 9, labelColor: 'rgba(220,228,255,0.055)' },
];

const LAMPS2 = [
  { x: 140, y: 420, r: 120 },
  { x: 430, y: 500, r: 130 },
  { x: 700, y: 420, r: 120 },
  { x: 884, y: 500, r: 110 },
  { x: 240, y: 140, r: 130 },
  { x: 760, y: 140, r: 130 },
  { x: 480, y: 280, r: 120 },
];

const GUARDS2 = [
  {
    name: 'HALL',
    speed: { patrol: 58, suspicious: 76, chase: 104 },
    fov: 1.28,
    range: 262,
    wps: [
      { x: 2.5, y: 6.5 },
      { x: 21.5, y: 6.5 },
      { x: 21.5, y: 9.2 },
      { x: 2.5, y: 9.2 },
    ],
  },
  {
    name: 'WEST',
    speed: { patrol: 54, suspicious: 72, chase: 99 },
    fov: 1.2,
    range: 236,
    wps: [
      { x: 1.8, y: 1.8 },
      { x: 9.5, y: 1.8 },
      { x: 9.5, y: 4.4 },
      { x: 1.8, y: 4.4 },
    ],
  },
  {
    name: 'EAST',
    speed: { patrol: 56, suspicious: 74, chase: 101 },
    fov: 1.24,
    range: 248,
    wps: [
      { x: 22.3, y: 1.8 },
      { x: 14.2, y: 1.8 },
      { x: 14.2, y: 4.4 },
      { x: 22.3, y: 4.4 },
    ],
  },
  {
    name: 'CENTER',
    speed: { patrol: 60, suspicious: 78, chase: 106 },
    fov: 1.3,
    range: 256,
    wps: [
      { x: 20.5, y: 2 },
      { x: 20.5, y: 1.4 },
      { x: 16.5, y: 1.4 },
      { x: 16.5, y: 6.4 },
      { x: 12.5, y: 6.4 },
    ],
  },
];

const CAMERAS2 = [
  { x: 420, y: 362, base: Math.PI / 2, amp: 0.95, spd: 0.6, phase: 0, range: 215, fov: 0.66 },
  { x: 912, y: 110, base: 2.5, amp: 0.6, spd: 0.45, phase: 2.1, range: 265, fov: 0.58 },
  { x: 326, y: 130, base: 0.42, amp: 0.55, spd: 0.5, phase: 4.2, range: 215, fov: 0.58 },
  { x: 912, y: 506, base: Math.PI, amp: 0.9, spd: 0.52, phase: 1.3, range: 250, fov: 0.6 },
];

const LOOT2 = [
  { id: 'gold', label: 'BULLION', value: 1200000, dur: 1.4, x: 240, y: 120, w: 44, h: 30, kind: 'gold' },
  { id: 'gem', label: 'EMPEROR RUBY', value: 1600000, dur: 1.4, x: 856, y: 120, w: 44, h: 30, kind: 'gem' },
  { id: 'crown', label: 'VAULT', value: 4600000, dur: 2.8, x: 480, y: 120, w: 0, h: 0, kind: 'vault' },
];

const DECOR_CASES2 = [
  { x: 536, y: 104, w: 44, h: 30, kind: 'vase' },
  { x: 856, y: 500, w: 44, h: 30, kind: 'urn' },
];

const LEVEL2 = {
  name: 'THE LOWER VAULTS',
  map: MAP2,
  rooms: ROOMS2,
  lamps: LAMPS2,
  guards: GUARDS2,
  cameras: CAMERAS2,
  loot: LOOT2,
  cases: DECOR_CASES2,
  start: { x: 6.5 * TILE, y: 12.4 * TILE },
};

export const LEVELS = [LEVEL1, LEVEL2];

export function getLevel(n) {
  const i = Math.max(1, Math.min(LEVELS.length, Math.round(n || 1))) - 1;
  return LEVELS[i];
}

export function assertMap() {
  if (MAP.length !== ROWS) throw new Error('bad map rows');
  for (const row of MAP) if (row.length !== COLS) throw new Error('bad map width: ' + row);
  for (const lv of LEVELS) {
    if (lv.map.length !== ROWS) throw new Error('bad map rows: ' + lv.name);
    for (const row of lv.map) if (row.length !== COLS) throw new Error('bad map width: ' + lv.name + ' ' + row);
    for (const g of lv.guards) {
      for (const wp of g.wps) {
        if (lv.map[Math.floor(wp.y)]?.[Math.floor(wp.x)] === '#') throw new Error('guard wp in wall: ' + lv.name + ' ' + g.name);
      }
    }
  }
}
