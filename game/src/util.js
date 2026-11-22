export const TILE = 40;
export const COLS = 24;
export const ROWS = 15;
export const W = COLS * TILE;
export const H = ROWS * TILE;

export function clamp(v, a, b) {
  return v < a ? a : v > b ? b : v;
}
export function lerp(a, b, t) {
  return a + (b - a) * t;
}
export function dist(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}
export function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}
export function angDiff(a, b) {
  return Math.abs(((b - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
}
export function angleLerp(a, b, t) {
  const d = ((b - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
  return a + d * t;
}
export function formatTime(s) {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}
export function formatMoney(v) {
  if (v >= 1000000) return `$${(v / 1000000).toFixed(2)}M`;
  return `$${Math.round(v / 1000)}K`;
}

const BEST_KEY = 'heist_best_loot';

export function loadBest() {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}

export function saveBest(v) {
  try {
    localStorage.setItem(BEST_KEY, String(Math.round(v)));
  } catch {}
}

export function makeCaster(tiles) {
  return function cast(x, y, angle, maxDist) {
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    let tx = Math.floor(x / TILE);
    let ty = Math.floor(y / TILE);
    const sx = cos > 0 ? 1 : -1;
    const sy = sin > 0 ? 1 : -1;
    const dx = Math.abs(cos) < 1e-9 ? 1e9 : Math.abs(TILE / cos);
    const dy = Math.abs(sin) < 1e-9 ? 1e9 : Math.abs(TILE / sin);
    let mx = cos > 0 ? (tx + 1) * TILE - x : x - tx * TILE;
    let my = sin > 0 ? (ty + 1) * TILE - y : y - ty * TILE;
    let tx2 = Math.abs(cos) < 1e-9 ? Infinity : mx / Math.abs(cos);
    let ty2 = Math.abs(sin) < 1e-9 ? Infinity : my / Math.abs(sin);
    let d = 0;
    for (let i = 0; i < 80; i++) {
      if (tx2 < ty2) {
        d = tx2;
        tx2 += dx;
        tx += sx;
      } else {
        d = ty2;
        ty2 += dy;
        ty += sy;
      }
      if (d >= maxDist) return maxDist;
      if (ty < 0 || tx < 0 || ty >= ROWS || tx >= COLS) return d;
      if (tiles[ty][tx] === '#') return d;
    }
    return maxDist;
  };
}

export function conePolygon(cast, x, y, face, fov, range, rays) {
  const pts = [[x, y]];
  for (let i = 0; i <= rays; i++) {
    const a = face - fov / 2 + (fov * i) / rays;
    const d = cast(x, y, a, range) - 2;
    pts.push([x + Math.cos(a) * d, y + Math.sin(a) * d]);
  }
  return pts;
}

export function hasLineOfSight(cast, ax, ay, bx, by) {
  const d = dist(ax, ay, bx, by);
  if (d < 1) return true;
  return cast(ax, ay, angleTo(ax, ay, bx, by), d) >= d - 1;
}
