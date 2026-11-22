import { TILE, COLS, ROWS, W, H, clamp, lerp, formatTime, formatMoney, conePolygon } from './util.js';
import { ROOMS, MAP, EXIT_TILES, VAN, LAMPS, DECOR_CASES } from './map.js';
import { isMuted } from './sound.js';

const FONT = 'system-ui, -apple-system, sans-serif';
const MONO = 'ui-monospace, Menlo, monospace';

function txt(ctx, str, x, y, o = {}) {
  const size = o.size ?? 14;
  const weight = o.weight ?? 400;
  const family = o.mono ? MONO : FONT;
  ctx.save();
  ctx.font = `${weight} ${size}px ${family}`;
  ctx.fillStyle = o.color ?? '#e8ecf8';
  ctx.textAlign = o.align ?? 'left';
  ctx.textBaseline = o.baseline ?? 'alphabetic';
  if (o.spacing) ctx.letterSpacing = `${o.spacing}px`;
  if (o.glow) {
    ctx.shadowColor = o.glow;
    ctx.shadowBlur = o.glowBlur ?? 12;
  }
  ctx.fillText(str, x, y);
  ctx.restore();
}

function panel(ctx, x, y, w, h, o = {}) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, o.r ?? 8);
  ctx.fillStyle = o.fill ?? 'rgba(7,10,18,0.78)';
  ctx.fill();
  if (o.stroke) {
    ctx.strokeStyle = o.stroke;
    ctx.lineWidth = o.lw ?? 1.5;
    ctx.stroke();
  }
  ctx.restore();
}

function circle(ctx, x, y, r, fill, stroke, lw) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw ?? 2;
    ctx.stroke();
  }
}

function shadowEllipse(ctx, x, y, rx, ry, a = 0.35) {
  ctx.save();
  ctx.fillStyle = `rgba(0,0,0,${a})`;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function buildStatic(world) {
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext('2d');

  ctx.fillStyle = '#0a0e19';
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#0d1119';
  ctx.fillRect(0, 13 * TILE, W, H - 13 * TILE);
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 13 * TILE + 1);
  ctx.lineTo(W, 13 * TILE + 1);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 6; i++) {
    const x = 60 + i * 150;
    ctx.beginPath();
    ctx.moveTo(x, 570);
    ctx.lineTo(x + 46, 596);
    ctx.stroke();
  }
  const moon = ctx.createRadialGradient(820, 590, 10, 820, 590, 210);
  moon.addColorStop(0, 'rgba(160,190,240,0.2)');
  moon.addColorStop(1, 'rgba(160,190,240,0)');
  ctx.fillStyle = moon;
  ctx.fillRect(610, 500, 350, 100);

  const floorTop = 0;
  ctx.fillStyle = '#141926';
  ctx.fillRect(floorTop, floorTop, W, 13 * TILE);
  ctx.fillStyle = 'rgba(255,255,255,0.014)';
  for (let gy = 0; gy < 13; gy++) {
    for (let gx = 0; gx < 24; gx++) {
      if ((gx + gy) % 2 === 0) ctx.fillRect(gx * TILE, gy * TILE, TILE, TILE);
    }
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.035)';
  ctx.lineWidth = 1;
  for (let gx = 0; gx <= 24; gx++) {
    ctx.beginPath();
    ctx.moveTo(gx * TILE + 0.5, 0);
    ctx.lineTo(gx * TILE + 0.5, 13 * TILE);
    ctx.stroke();
  }
  for (let gy = 0; gy <= 13; gy++) {
    ctx.beginPath();
    ctx.moveTo(0, gy * TILE + 0.5);
    ctx.lineTo(W, gy * TILE + 0.5);
    ctx.stroke();
  }

  for (const room of ROOMS) {
    ctx.fillStyle = room.tint;
    ctx.beginPath();
    ctx.roundRect(room.x + 6, room.y + 6, room.w - 12, room.h - 12, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.045)';
    ctx.stroke();
  }
  txt(ctx, 'WEST WING', 160, 186, { size: 24, weight: 800, align: 'center', spacing: 5, color: 'rgba(255,240,200,0.08)' });
  txt(ctx, 'EAST WING', 780, 190, { size: 24, weight: 800, align: 'center', spacing: 5, color: 'rgba(190,220,255,0.08)' });
  txt(ctx, 'MAIN HALL', 480, 436, { size: 26, weight: 800, align: 'center', spacing: 9, color: 'rgba(220,228,255,0.055)' });

  for (const lamp of LAMPS) {
    const g = ctx.createRadialGradient(lamp.x, lamp.y, 4, lamp.x, lamp.y, lamp.r);
    g.addColorStop(0, 'rgba(255,216,150,0.14)');
    g.addColorStop(0.5, 'rgba(255,208,140,0.055)');
    g.addColorStop(1, 'rgba(255,208,140,0)');
    ctx.fillStyle = g;
    ctx.fillRect(lamp.x - lamp.r, lamp.y - lamp.r, lamp.r * 2, lamp.r * 2);
    circle(ctx, lamp.x, lamp.y, 3.5, 'rgba(255,226,170,0.85)');
  }

  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  for (let ty = 0; ty < 15; ty++) {
    for (let tx = 0; tx < 24; tx++) {
      if (MAP[ty][tx] === '#') ctx.fillRect(tx * TILE + 7, ty * TILE + 9, TILE, TILE);
    }
  }

  for (let ty = 0; ty < 15; ty++) {
    for (let tx = 0; tx < 24; tx++) {
      const ch = MAP[ty][tx];
      if (ch !== '#') continue;
      const x = tx * TILE;
      const y = ty * TILE;
      ctx.fillStyle = '#39436a';
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
      const below = ty + 1 < 15 ? MAP[ty + 1][tx] : '#';
      if (below !== '#') {
        ctx.fillStyle = '#232c50';
        ctx.fillRect(x, y + TILE - 10, TILE, 10);
        ctx.fillStyle = 'rgba(165,185,235,0.4)';
        ctx.fillRect(x, y + TILE - 10, TILE, 1.5);
      }
      const above = ty > 0 ? MAP[ty - 1][tx] : '#';
      if (above !== '#') {
        ctx.fillStyle = 'rgba(175,195,245,0.4)';
        ctx.fillRect(x, y, TILE, 2.5);
      }
      const right = tx + 1 < 24 ? MAP[ty][tx + 1] : '#';
      if (right !== '#') {
        ctx.fillStyle = 'rgba(150,170,220,0.2)';
        ctx.fillRect(x + TILE - 2, y, 2, TILE);
      }
      const left = tx > 0 ? MAP[ty][tx - 1] : '#';
      if (left !== '#') {
        ctx.fillStyle = 'rgba(10,13,25,0.5)';
        ctx.fillRect(x, y, 2, TILE);
      }
    }
  }

  for (const c of DECOR_CASES) drawCaseBase(ctx, c, true);

  const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.42, W / 2, H / 2, H * 0.86);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);

  return cv;
}

function drawCaseBase(ctx, c, withProp) {
  panel(ctx, c.x - c.w / 2, c.y - c.h / 2, c.w, c.h, { r: 5, fill: 'rgba(130,180,255,0.07)', stroke: 'rgba(170,215,255,0.5)', lw: 1.5 });
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.beginPath();
  ctx.moveTo(c.x - c.w / 2 + 5, c.y - c.h / 2 + 5);
  ctx.lineTo(c.x + c.w / 2 - 5, c.y + c.h / 2 - 5);
  ctx.stroke();
  ctx.restore();
  if (!withProp) return;
  const cy = c.y + 3;
  if (c.kind === 'vase') {
    ctx.fillStyle = '#7a5a3a';
    ctx.beginPath();
    ctx.ellipse(c.x, cy, 6, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#93714a';
    ctx.fillRect(c.x - 3, cy - 11, 6, 4);
  } else {
    ctx.fillStyle = '#6d7284';
    ctx.beginPath();
    ctx.ellipse(c.x, cy, 8, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8b90a3';
    ctx.beginPath();
    ctx.ellipse(c.x, cy - 2, 5, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function conePath(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
}

function drawCone(ctx, world, ent, fov, range, color, alpha, pulse = 0) {
  const pts = conePolygon(world.cast, ent.x, ent.y, ent.face, fov, range, 26);
  const g = ctx.createRadialGradient(ent.x, ent.y, 6, ent.x, ent.y, range);
  const a = alpha + pulse * 0.1;
  g.addColorStop(0, color.replace('A', (a).toFixed(3)));
  g.addColorStop(0.5, color.replace('A', (a * 0.45).toFixed(3)));
  g.addColorStop(0.85, color.replace('A', (a * 0.14).toFixed(3)));
  g.addColorStop(1, color.replace('A', '0'));
  conePath(ctx, pts);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth = 1;
  ctx.stroke();
  circle(ctx, ent.x, ent.y, 3, 'rgba(255,255,240,0.85)');
}

function guardConeColor(state, t) {
  if (state === 'chase') {
    const p = 0.5 + 0.5 * Math.sin(t * 9);
    return { color: 'rgba(255,52,52,A)', alpha: 0.46, pulse: p };
  }
  if (state === 'suspicious') return { color: 'rgba(255,150,48,A)', alpha: 0.46, pulse: 0.5 + 0.5 * Math.sin(t * 5) };
  return { color: 'rgba(255,214,80,A)', alpha: 0.42, pulse: 0 };
}

function drawThief(ctx, x, y, face, bob, sneak, t) {
  const r = sneak ? 8.5 : 10.5;
  const by = y + Math.sin(bob) * 1.2;
  const halo = ctx.createRadialGradient(x, y, 2, x, y, 30);
  halo.addColorStop(0, 'rgba(86,217,255,0.13)');
  halo.addColorStop(1, 'rgba(86,217,255,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(x - 30, y - 30, 60, 60);
  shadowEllipse(ctx, x, y + 7, r * 0.95, 4);
  ctx.save();
  ctx.translate(x, by);
  ctx.fillStyle = '#1c2836';
  circle(ctx, 0, 0, r, '#26374a', 'rgba(170,235,255,0.4)', 1.8);
  ctx.fillStyle = '#2f4358';
  ctx.beginPath();
  ctx.arc(0, 0, r, face - 2.1, face + 2.1);
  ctx.arc(0, 0, r - 3.5, face + 2.1, face - 2.1, true);
  ctx.closePath();
  ctx.fill();
  ctx.rotate(face);
  ctx.shadowColor = 'rgba(90,220,255,0.95)';
  ctx.shadowBlur = 9;
  ctx.strokeStyle = '#5fdcff';
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.arc(1.5, 0, r - 2.6, -0.62, 0.62);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#2b3d50';
  ctx.beginPath();
  ctx.roundRect(-r - 3, -3.5, 6, 7, 2);
  ctx.fill();
  ctx.restore();
  if (sneak) {
    ctx.strokeStyle = 'rgba(86,217,255,0.25)';
    ctx.lineWidth = 1.5;
    circle(ctx, x, y + 7, r + 4 + Math.sin(t * 4) * 1, null, 'rgba(86,217,255,0.22)', 1.5);
  }
}

function drawGuard(ctx, g, t) {
  const r = 12;
  shadowEllipse(ctx, g.x, g.y + 8, r, 4.5);
  ctx.save();
  ctx.translate(g.x, g.y);
  ctx.rotate(g.face);
  ctx.fillStyle = '#10162b';
  ctx.beginPath();
  ctx.roundRect(-r - 2, -4, 5, 8, 2);
  ctx.fill();
  circle(ctx, 0, 0, r, '#55639e', 'rgba(220,232,255,0.35)', 1.8);
  ctx.fillStyle = '#ffce56';
  ctx.beginPath();
  ctx.roundRect(-4, -r + 2.5, 8, r * 2 - 5, 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(20,26,48,0.8)';
  ctx.lineWidth = 1;
  ctx.stroke();
  circle(ctx, 0, 0, 4.6, '#1d2547', 'rgba(255,255,255,0.3)', 1);
  ctx.shadowColor = 'rgba(255,190,90,0.95)';
  ctx.shadowBlur = 7;
  ctx.strokeStyle = '#ffc963';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(2, 0, r - 3, -0.55, 0.55);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.restore();
  if (g.state === 'suspicious' || g.state === 'chase') {
    const amber = g.state === 'suspicious';
    const col = amber ? '255,170,70' : '255,70,70';
    ctx.strokeStyle = `rgba(${col},${0.5 + 0.4 * Math.sin(t * 7)})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(g.x, g.y, r + 5, t * 3 % (Math.PI * 2), (t * 3) % (Math.PI * 2) + 2.2);
    ctx.stroke();
    const by = g.y - 24 - Math.sin(t * 4) * 2;
    panel(ctx, g.x - 9, by - 11, 18, 18, { r: 6, fill: amber ? 'rgba(40,26,8,0.92)' : 'rgba(48,8,8,0.92)', stroke: `rgba(${col},0.9)`, lw: 1.5 });
    txt(ctx, amber ? '?' : '!', g.x, by + 3, { size: 13, weight: 900, align: 'center', color: amber ? '#ffb257' : '#ff5c5c' });
  }
}

function drawCamera(ctx, c, t) {
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate(c.face);
  ctx.strokeStyle = '#6a78a8';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(-4, 0);
  ctx.lineTo(-11, -9);
  ctx.stroke();
  ctx.fillStyle = c.jammed ? '#465072' : '#7484bd';
  ctx.beginPath();
  ctx.roundRect(-10, -6.5, 26, 13, 4.5);
  ctx.fill();
  ctx.strokeStyle = 'rgba(12,16,30,0.95)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  circle(ctx, 14, 0, 3.6, c.jammed ? '#20293c' : '#0e1526', c.jammed ? '#2a3550' : '#9fe0ff', 1.8);
  if (!c.jammed) {
    const on = (t * 1.4) % 1 < 0.55;
    if (on) {
      ctx.shadowColor = 'rgba(255,60,60,1)';
      ctx.shadowBlur = 8;
      circle(ctx, -4, -2.5, 1.8, '#ff4848');
      ctx.shadowBlur = 0;
    }
  } else {
    ctx.strokeStyle = `rgba(140,235,255,${0.4 + 0.3 * Math.sin(t * 20)})`;
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 3; i++) {
      const a = t * 9 + i * 2.1;
      ctx.beginPath();
      ctx.arc(15, 0, 5 + i * 2.5, a, a + 1.2);
      ctx.stroke();
    }
  }
  ctx.restore();
  if (c.jammed) txt(ctx, 'JAMMED', c.x, c.y - 14, { size: 10, weight: 800, align: 'center', color: '#8ce4ff' });
}

function drawVault(ctx, v, t) {
  const x = v.x;
  const y = v.y;
  ctx.save();
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.2);
  const glow = ctx.createRadialGradient(x, y, 8, x, y, 64);
  glow.addColorStop(0, `rgba(255,196,80,${0.22 + pulse * 0.1})`);
  glow.addColorStop(1, 'rgba(255,196,80,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x - 64, y - 64, 128, 128);
  circle(ctx, x, y, 32, 'rgba(20,24,40,1)', 'rgba(0,0,0,0.5)', 3);
  if (!v.got) {
    const rim = ctx.createLinearGradient(x - 30, y - 30, x + 30, y + 30);
    rim.addColorStop(0, '#f5d67a');
    rim.addColorStop(0.5, '#d9a441');
    rim.addColorStop(1, '#9a6f24');
    circle(ctx, x, y, 26, rim, '#6e4d15', 2.5);
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = 'rgba(80,55,10,0.85)';
    ctx.lineWidth = 4;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 8, Math.sin(a) * 8);
      ctx.lineTo(Math.cos(a) * 24, Math.sin(a) * 24);
      ctx.stroke();
    }
    ctx.restore();
    circle(ctx, x, y, 9, '#8a611c', '#5e400f', 2);
    circle(ctx, x, y, 3.5, '#3a290a');
    ctx.strokeStyle = 'rgba(255,240,190,0.75)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, 26 + pulse * 3, 0, Math.PI * 2);
    ctx.stroke();
    txt(ctx, 'VAULT · $3.2M', x, y + 52, { size: 11, weight: 800, align: 'center', spacing: 2, color: 'rgba(255,214,120,0.8)' });
  } else {
    circle(ctx, x, y, 26, '#141826', '#5a6284', 2);
    ctx.save();
    ctx.translate(x, y);
    ctx.shadowColor = 'rgba(255,220,120,0.9)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ffd873';
    ctx.beginPath();
    ctx.moveTo(-9, 5);
    ctx.lineTo(-9, -3);
    ctx.lineTo(-5, 1);
    ctx.lineTo(0, -7);
    ctx.lineTo(5, 1);
    ctx.lineTo(9, -3);
    ctx.lineTo(9, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    txt(ctx, 'CLEANED OUT', x, y + 52, { size: 11, weight: 800, align: 'center', spacing: 2, color: 'rgba(160,230,170,0.8)' });
  }
  ctx.restore();
}

function drawLootCase(ctx, l, t) {
  const x = l.x;
  const y = l.y;
  shadowEllipse(ctx, x, y + l.h / 2 + 2, l.w / 2 + 2, 4, 0.3);
  panel(ctx, x - l.w / 2, y - l.h / 2, l.w, l.h, { r: 5, fill: l.got ? 'rgba(20,26,40,0.6)' : 'rgba(130,180,255,0.08)', stroke: l.got ? 'rgba(120,150,200,0.4)' : 'rgba(170,215,255,0.55)', lw: 1.5 });
  if (l.kind === 'gold') {
    if (!l.got) {
      for (let i = 0; i < 3; i++) {
        const bx = x - 12 + i * 8;
        const by = y + 8 - i * 5;
        const g = ctx.createLinearGradient(bx, by - 6, bx + 12, by);
        g.addColorStop(0, '#ffe08a');
        g.addColorStop(0.5, '#e8b64f');
        g.addColorStop(1, '#b5822a');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.roundRect(bx - 6, by - 5, 13, 6, 1.5);
        ctx.fill();
        ctx.strokeStyle = 'rgba(90,60,10,0.6)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }
  } else if (!l.got) {
    ctx.save();
    ctx.translate(x, y + 1);
    ctx.shadowColor = 'rgba(120,200,255,0.95)';
    ctx.shadowBlur = 9;
    const gg = ctx.createLinearGradient(0, -10, 0, 8);
    gg.addColorStop(0, '#bfeaff');
    gg.addColorStop(0.5, '#5aa9e8');
    gg.addColorStop(1, '#2b5fa8');
    ctx.fillStyle = gg;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(9, -2);
    ctx.lineTo(0, 9);
    ctx.lineTo(-9, -2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(230,250,255,0.8)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }
  if (!l.got) {
    const sx = x - l.w / 2 + ((t * 26) % (l.w + 20));
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx, y - l.h / 2 + 2);
    ctx.lineTo(sx - 6, y + l.h / 2 - 2);
    ctx.stroke();
    ctx.restore();
    const tw = (t * 1.3) % 2;
    if (tw < 0.35) {
      const a = 1 - Math.abs(tw - 0.15) / 0.2;
      ctx.strokeStyle = `rgba(255,255,255,${a})`;
      ctx.lineWidth = 1.2;
      const px = x + 10;
      const py = y - 6;
      ctx.beginPath();
      ctx.moveTo(px - 4, py);
      ctx.lineTo(px + 4, py);
      ctx.moveTo(px, py - 4);
      ctx.lineTo(px, py + 4);
      ctx.stroke();
    }
  } else {
    txt(ctx, 'SECURED', x, y + 3, { size: 9, weight: 800, align: 'center', spacing: 1, color: 'rgba(140,240,160,0.85)' });
  }
}

function drawExit(ctx, world, t) {
  const x = 160;
  const y = 520;
  const w = 80;
  const h = 40;
  if (world.doorOpen) {
    ctx.fillStyle = '#0e1424';
    ctx.fillRect(x, y, w, h);
    const g = ctx.createLinearGradient(x, y, x, y + h + 30);
    g.addColorStop(0, 'rgba(120,255,170,0.28)');
    g.addColorStop(1, 'rgba(120,255,170,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 6, y, w + 12, 70);
    const pulse = 0.6 + 0.4 * Math.sin(t * 4);
    txt(ctx, 'EXIT', x + w / 2, y + 26, { size: 15, weight: 900, align: 'center', spacing: 3, color: `rgba(140,255,180,${pulse})`, glow: 'rgba(90,255,150,0.9)', glowBlur: 10 });
    txt(ctx, 'GETAWAY', x + w / 2, y - 8, { size: 10, weight: 800, align: 'center', spacing: 2, color: 'rgba(140,255,180,0.9)' });
  } else {
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, '#454e6e');
    g.addColorStop(1, '#2b324c');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(20,25,40,0.8)';
    for (let i = 0; i < 4; i++) ctx.fillRect(x, y + 4 + i * 10, w, 4);
    ctx.fillStyle = '#d9a441';
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y + h - 12, w, 12);
    ctx.clip();
    for (let i = -1; i < 8; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#d9a441' : '#1c2136';
      ctx.beginPath();
      ctx.moveTo(x + i * 12, y + h);
      ctx.lineTo(x + i * 12 + 12, y + h);
      ctx.lineTo(x + i * 12 + 6, y + h - 12);
      ctx.lineTo(x + i * 12 - 6, y + h - 12);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    const blink = (t * 1.1) % 1 < 0.6;
    txt(ctx, 'LOCKED', x + w / 2, y + 18, { size: 11, weight: 900, align: 'center', spacing: 2, color: blink ? '#ff6b6b' : 'rgba(255,107,107,0.35)' });
  }
}

function drawVan(ctx) {
  const v = VAN;
  const glow = ctx.createRadialGradient(v.x + v.w / 2, v.y + v.h / 2, 10, v.x + v.w / 2, v.y + v.h / 2, 120);
  glow.addColorStop(0, 'rgba(255,190,110,0.12)');
  glow.addColorStop(1, 'rgba(255,190,110,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(v.x - 60, v.y - 50, v.w + 120, v.h + 90);
  shadowEllipse(ctx, v.x + v.w / 2, v.y + v.h + 3, v.w / 2, 6, 0.5);
  ctx.fillStyle = '#2c3a63';
  ctx.beginPath();
  ctx.roundRect(v.x, v.y, v.w, v.h, 7);
  ctx.fill();
  ctx.strokeStyle = '#55689e';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#3d4d80';
  ctx.beginPath();
  ctx.roundRect(v.x + v.w - 26, v.y + 4, 22, v.h - 8, 4);
  ctx.fill();
  ctx.fillStyle = 'rgba(210,235,255,0.5)';
  ctx.beginPath();
  ctx.roundRect(v.x + v.w - 22, v.y + 7, 14, 8, 2);
  ctx.fill();
  ctx.fillStyle = '#16203a';
  ctx.beginPath();
  ctx.roundRect(v.x + 8, v.y - 4, 16, 6, 2);
  ctx.fill();
  circle(ctx, v.x + 24, v.y + v.h + 1, 6, '#0d1119', '#3a4a7c', 2);
  circle(ctx, v.x + v.w - 24, v.y + v.h + 1, 6, '#0d1119', '#3a4a7c', 2);
  txt(ctx, 'GETAWAY Co.', v.x + 6, v.y + 22, { size: 8, weight: 700, color: 'rgba(230,240,255,0.75)', spacing: 1 });
}

function drawSmoke(ctx, world, t, scale) {
  for (const s of world.smoke) {
    const grow = Math.min(1, s.t / 0.35);
    const out = s.t > s.dur - 0.7 ? Math.max(0, (s.dur - s.t) / 0.7) : 1;
    const a = grow * out * scale;
    if (a <= 0.01) continue;
    const r = s.r * (0.62 + 0.38 * grow);
    for (let i = 0; i < 3; i++) {
      const wob = t * 0.7 + i * 2.09;
      const bx = s.x + Math.cos(wob) * r * 0.2;
      const by = s.y + Math.sin(wob * 1.3) * r * 0.16;
      const g = ctx.createRadialGradient(bx, by, r * 0.05, bx, by, r);
      g.addColorStop(0, `rgba(9,11,17,${(0.5 * a).toFixed(3)})`);
      g.addColorStop(0.55, `rgba(13,16,24,${(0.34 * a).toFixed(3)})`);
      g.addColorStop(1, 'rgba(16,20,30,0)');
      ctx.fillStyle = g;
      ctx.fillRect(bx - r, by - r, r * 2, r * 2);
    }
  }
}

function drawMinimap(ctx, world) {
  const s = 0.11;
  const px = W - 136;
  const py = H - 94;
  const pw = 128;
  const ph = 86;
  panel(ctx, px, py, pw, ph, { r: 8, fill: 'rgba(7,10,18,0.82)', stroke: 'rgba(90,110,160,0.5)', lw: 1.2 });
  const mx = px + 11;
  const my = py + 20;
  ctx.fillStyle = 'rgba(22,28,46,0.9)';
  ctx.fillRect(mx, my, COLS * TILE * s, ROWS * TILE * s);
  ctx.fillStyle = 'rgba(125,145,200,0.6)';
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      if (MAP[ty][tx] === '#') ctx.fillRect(mx + tx * TILE * s, my + ty * TILE * s, TILE * s + 0.6, TILE * s + 0.6);
    }
  }
  ctx.fillStyle = world.doorOpen ? 'rgba(120,255,170,0.95)' : 'rgba(255,110,110,0.6)';
  ctx.fillRect(mx + 4 * TILE * s, my + 13 * TILE * s, 2 * TILE * s, 3);
  for (const sm of world.smoke) {
    circle(ctx, mx + sm.x * s, my + sm.y * s, sm.r * s * Math.min(1, sm.t / 0.35), 'rgba(165,180,210,0.3)');
  }
  const marks = [
    { l: world.loot[0], c: '#ffd873' },
    { l: world.loot[1], c: '#7cc4ff' },
    { l: world.loot[2], c: '#ffca5f' },
  ];
  for (const m of marks) {
    const x = mx + m.l.x * s;
    const y = my + m.l.y * s;
    ctx.globalAlpha = m.l.got ? 0.25 : 1;
    if (m.l.kind === 'vault') circle(ctx, x, y, 3, m.c);
    else if (m.l.kind === 'gem') {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = m.c;
      ctx.fillRect(-2.4, -2.4, 4.8, 4.8);
      ctx.restore();
    } else {
      ctx.fillStyle = m.c;
      ctx.fillRect(x - 2.6, y - 2, 5.2, 4);
    }
    ctx.globalAlpha = 1;
  }
  for (const g of world.guards) {
    const x = mx + g.x * s;
    const y = my + g.y * s;
    circle(ctx, x, y, 2.4, g.state === 'chase' ? '#ff5c5c' : g.state === 'suspicious' ? '#ffb257' : '#e8ecf8');
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(g.face) * 5, y + Math.sin(g.face) * 5);
    ctx.stroke();
  }
  circle(ctx, mx + world.thief.x * s, my + world.thief.y * s, 2.6, '#5fdcff', 'rgba(255,255,255,0.8)', 1);
  txt(ctx, `M ${isMuted() ? 'SOUND OFF' : 'SOUND ON'}`, px + 10, py + 13, { size: 7.5, weight: 800, spacing: 1, color: isMuted() ? 'rgba(255,140,140,0.9)' : 'rgba(190,203,235,0.8)' });
  txt(ctx, 'MAP', px + pw - 10, py + 13, { size: 7.5, weight: 900, align: 'right', spacing: 2, color: 'rgba(190,203,235,0.6)' });
}

function keycap(ctx, x, y, label, w = 20) {
  panel(ctx, x, y - 13, w, 17, { r: 4, fill: 'rgba(220,230,255,0.10)', stroke: 'rgba(220,230,255,0.35)', lw: 1 });
  txt(ctx, label, x + w / 2, y, { size: 10, weight: 800, align: 'center', color: '#dfe7ff' });
  return w;
}

export function drawHUD(ctx, world) {
  panel(ctx, 8, 8, 944, 58, { r: 10, fill: 'rgba(7,10,18,0.8)', stroke: 'rgba(90,110,160,0.5)', lw: 1.5 });

  const slots = [
    { l: world.loot[0], label: 'GOLD' },
    { l: world.loot[1], label: 'GEM' },
    { l: world.loot[2], label: 'VAULT' },
  ];
  slots.forEach((s, i) => {
    const x = 20 + i * 40;
    const y = 18;
    panel(ctx, x, y, 32, 32, { r: 6, fill: s.l.got ? 'rgba(255,200,90,0.12)' : 'rgba(255,255,255,0.04)', stroke: s.l.got ? 'rgba(255,205,100,0.75)' : 'rgba(130,150,200,0.35)', lw: 1.5 });
    ctx.save();
    if (s.l.got) {
      ctx.shadowColor = 'rgba(255,205,100,0.9)';
      ctx.shadowBlur = 8;
    }
    if (i === 0) {
      ctx.fillStyle = s.l.got ? '#ffd873' : 'rgba(200,215,245,0.35)';
      for (let k = 0; k < 2; k++) ctx.fillRect(x + 6, y + 18 - k * 8, 20, 6);
    } else if (i === 1) {
      ctx.fillStyle = s.l.got ? '#7cc4ff' : 'rgba(200,215,245,0.35)';
      ctx.beginPath();
      ctx.moveTo(x + 16, y + 7);
      ctx.lineTo(x + 24, y + 16);
      ctx.lineTo(x + 16, y + 26);
      ctx.lineTo(x + 8, y + 16);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = s.l.got ? '#ffd873' : 'rgba(200,215,245,0.35)';
      ctx.beginPath();
      ctx.moveTo(x + 7, y + 22);
      ctx.lineTo(x + 7, y + 13);
      ctx.lineTo(x + 12, y + 18);
      ctx.lineTo(x + 16, y + 10);
      ctx.lineTo(x + 20, y + 18);
      ctx.lineTo(x + 25, y + 13);
      ctx.lineTo(x + 25, y + 22);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    txt(ctx, s.label, x + 16, y + 43, { size: 8, weight: 800, align: 'center', spacing: 1, color: s.l.got ? 'rgba(255,214,120,0.9)' : 'rgba(180,195,230,0.6)' });
  });

  const haul = world.stats.money;
  txt(ctx, 'HAUL', 148, 24, { size: 9, weight: 800, spacing: 2, color: 'rgba(180,195,230,0.75)' });
  txt(ctx, formatMoney(haul), 148, 44, { size: 19, weight: 900, color: haul > 0 ? '#ffd873' : 'rgba(220,230,255,0.85)', glow: haul > 0 ? 'rgba(255,200,90,0.5)' : null, glowBlur: 8 });

  const chips = [
    { key: 'Q', label: 'JAMMER', n: world.tools.jammer, max: 3, active: world.tools.jamT > 0, actLabel: `JAM ${Math.ceil(world.tools.jamT)}s` },
    { key: 'F', label: 'DECOY', n: world.tools.decoy, max: 2, active: false },
    { key: 'C', label: 'SMOKE', n: world.tools.smoke, max: 2, active: false },
  ];
  chips.forEach((c, i) => {
    const x = 320 + i * 98;
    const y = 16;
    panel(ctx, x, y, 92, 18, { r: 9, fill: c.active ? 'rgba(90,220,255,0.16)' : 'rgba(255,255,255,0.045)', stroke: c.active ? 'rgba(140,230,255,0.8)' : 'rgba(130,150,200,0.4)', lw: 1.2 });
    txt(ctx, c.key, x + 12, y + 13, { size: 10, weight: 900, align: 'center', color: c.active ? '#8ce4ff' : '#dfe7ff' });
    txt(ctx, c.active ? c.actLabel : c.label, x + 22, y + 13, { size: 9, weight: 800, spacing: 1, color: c.active ? '#8ce4ff' : 'rgba(210,222,250,0.85)' });
    for (let k = 0; k < c.max; k++) {
      circle(ctx, x + 84 - k * 9, y + 9, 3, k < c.n ? (c.active && i === 0 ? '#8ce4ff' : '#ffd873') : 'rgba(255,255,255,0.14)');
    }
  });

  txt(ctx, formatTime(world.stats.time), 268, 42, { size: 21, weight: 800, align: 'center', mono: true, color: '#dfe7ff', spacing: 2 });

  const st = world.status;
  const sx = 620;
  const sColor = st === 'ALERT' ? '#ff5c5c' : st === 'SUSPICIOUS' ? '#ffb257' : '#7ce895';
  panel(ctx, sx, 16, 96, 20, { r: 10, fill: st === 'UNDETECTED' ? 'rgba(80,200,120,0.1)' : st === 'SUSPICIOUS' ? 'rgba(255,170,70,0.12)' : 'rgba(255,80,80,0.16)', stroke: sColor, lw: 1.4 });
  circle(ctx, sx + 10, 26, 3.5, sColor);
  txt(ctx, st, sx + 52, 30, { size: 10, weight: 900, align: 'center', spacing: 0.5, color: sColor });

  const bx = 732;
  const bw = 204;
  const by = 18;
  const bh = 18;
  txt(ctx, 'ALARM', bx, by - 3, { size: 8.5, weight: 900, spacing: 3, color: 'rgba(200,212,240,0.8)' });
  panel(ctx, bx, by, bw, bh, { r: 5, fill: 'rgba(255,255,255,0.05)', stroke: world.alarm > 80 ? 'rgba(255,80,80,0.9)' : 'rgba(130,150,200,0.5)', lw: world.alarm > 80 ? 2 : 1.4 });
  const frac = world.alarm / 100;
  const grad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
  grad.addColorStop(0, '#ffe08a');
  grad.addColorStop(0.55, '#ff9d3d');
  grad.addColorStop(1, '#ff4040');
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(bx + 1.5, by + 1.5, (bw - 3) * frac, bh - 3, 4);
  ctx.clip();
  ctx.fillStyle = grad;
  ctx.fillRect(bx, by, bw, bh);
  for (let i = 1; i < 10; i++) {
    ctx.fillStyle = 'rgba(10,13,22,0.55)';
    ctx.fillRect(bx + (bw / 10) * i, by, 2, bh);
  }
  ctx.restore();
  if (world.alarmPeak > 4) {
    const px = bx + (bw * world.alarmPeak) / 100;
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillRect(px - 1, by - 3, 2, bh + 6);
  }
  if (world.alarm > 78) {
    const a = 0.4 + 0.4 * Math.sin(world.t * 10);
    txt(ctx, 'LOCKDOWN IMMINENT', bx + bw / 2, by + bh + 14, { size: 9, weight: 900, align: 'center', spacing: 2, color: `rgba(255,90,90,${a})` });
  }

  const ha = clamp(1 - (world.stats.time - 7) / 3, 0, 1);
  if (ha > 0.01) {
    ctx.save();
    ctx.globalAlpha = ha;
    panel(ctx, 10, 570, 800, 24, { r: 7, fill: 'rgba(7,10,18,0.72)', stroke: 'rgba(90,110,160,0.4)', lw: 1 });
    let x = 22;
    const pairs = [
      ['WASD', 'MOVE'],
      ['SHIFT', 'SNEAK'],
      ['E', 'GRAB'],
      ['Q', 'JAMMER'],
      ['F', 'DECOY'],
      ['C', 'SMOKE'],
      ['M', 'MUTE'],
      ['R', 'RESET'],
    ];
    for (const [k, v] of pairs) {
      const w = Math.max(20, k.length * 11 + 8);
      x += keycap(ctx, x, 587, k, w) + 4;
      txt(ctx, v, x, 587, { size: 9.5, weight: 800, spacing: 1, color: 'rgba(190,203,235,0.85)' });
      x += ctx.measureText(v).width + 18;
    }
    ctx.restore();
  }

  drawMinimap(ctx, world);

  if (world.prompt) {
    const p = world.prompt;
    const label = p.kind === 'vault' ? 'CRACK THE VAULT' : `GRAB ${p.label}`;
    const px = clamp(p.x, 120, W - 140);
    const py = p.y - (p.kind === 'vault' ? 58 : 44);
    const w = 168;
    panel(ctx, px - w / 2, py - 20, w, 36, { r: 8, fill: 'rgba(7,10,18,0.85)', stroke: input_held(world) ? 'rgba(255,200,90,0.9)' : 'rgba(130,150,200,0.6)', lw: 1.5 });
    txt(ctx, 'HOLD E', px - w / 2 + 10, py, { size: 10, weight: 900, color: '#ffd873', spacing: 1 });
    txt(ctx, label, px - w / 2 + 58, py, { size: 10, weight: 800, color: '#dfe7ff', spacing: 0.5 });
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.roundRect(px - w / 2 + 10, py + 5, w - 20, 5, 2.5);
    ctx.fill();
    if (p.prog > 0) {
      ctx.fillStyle = '#ffcf6e';
      ctx.beginPath();
      ctx.roundRect(px - w / 2 + 10, py + 5, (w - 20) * Math.min(1, p.prog), 5, 2.5);
      ctx.fill();
    }
  }

  if (world.msg) {
    const m = world.msg;
    const a = m.t < 0.15 ? m.t / 0.15 : m.t > m.dur - 0.5 ? (m.dur - m.t) / 0.5 : 1;
    ctx.save();
    ctx.globalAlpha = a;
    const tw = ctx.measureText(m.text).width;
    ctx.font = '800 13px system-ui';
    ctx.letterSpacing = '1px';
    const w = ctx.measureText(m.text).width + 36;
    panel(ctx, W / 2 - w / 2, 74, w, 30, { r: 15, fill: 'rgba(7,10,18,0.88)', stroke: 'rgba(255,200,90,0.7)', lw: 1.5 });
    txt(ctx, m.text, W / 2, 93, { size: 13, weight: 800, align: 'center', spacing: 1, color: '#ffe2a0' });
    ctx.restore();
  }
}

function input_held(world) {
  return world.prompt && world.prompt.prog > 0 && world.prompt.prog < 1;
}

export function render(ctx, world, staticLayer) {
  ctx.drawImage(staticLayer, 0, 0);
  const t = world.t;

  if (world.screen === 'title') {
    drawTitle(ctx, world, t);
    return;
  }

  drawExit(ctx, world, t);
  drawVan(ctx);

  for (const n of world.noises) {
    const k = clamp(n.t / 0.9, 0, 1);
    const r = 14 + (n.r - 14) * (1 - Math.pow(1 - k, 2));
    ctx.strokeStyle = `rgba(255,220,130,${0.5 * (1 - k)})`;
    ctx.lineWidth = 2.5;
    circle(ctx, n.x, n.y, r, null, ctx.strokeStyle, 2.5);
  }

  for (const g of world.guards) {
    const { color, alpha, pulse } = guardConeColor(g.state, t);
    drawCone(ctx, world, g, g.def.fov, g.def.range, color, alpha, pulse);
  }
  for (const c of world.cameras) {
    if (c.jammed) continue;
    drawCone(ctx, world, c, c.fov, c.range, 'rgba(120,205,255,A)', 0.34);
  }

  drawSmoke(ctx, world, t, 1);

  drawVault(ctx, world.loot[2], t);
  drawLootCase(ctx, world.loot[0], t);
  drawLootCase(ctx, world.loot[1], t);

  for (const s of world.sparkles) {
    const k = s.t / s.dur;
    ctx.save();
    ctx.globalAlpha = 1 - k;
    ctx.fillStyle = s.color;
    ctx.translate(s.x, s.y);
    ctx.rotate(k * 5);
    const r = 3 * (1 - k) + 1;
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.6);
    ctx.lineTo(r, 0);
    ctx.lineTo(0, r * 1.6);
    ctx.lineTo(-r, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  if (world.decoy) {
    const d = world.decoy;
    const k = clamp(d.t / 0.45, 0, 1);
    const dx = lerp(d.x, d.tx, k);
    const dy = lerp(d.y, d.ty, k) - Math.sin(k * Math.PI) * 26;
    ctx.save();
    ctx.shadowColor = 'rgba(255,150,60,0.9)';
    ctx.shadowBlur = 8;
    circle(ctx, dx, dy, 4.5, '#ff9d3d', '#ffd8a0', 1.5);
    ctx.restore();
    txt(ctx, 'DECOY', dx, dy - 12, { size: 9, weight: 800, align: 'center', color: 'rgba(255,180,90,0.9)' });
  }

  const th = world.thief;
  drawThief(ctx, th.x, th.y, th.face, th.bob, th.sneak, t);
  for (const g of world.guards) drawGuard(ctx, g, t);
  for (const c of world.cameras) drawCamera(ctx, c, t);
  drawSmoke(ctx, world, t, 0.32);

  if (world.screen === 'play') {
    if (world.alarm > 0) {
      const a = Math.min(0.34, (world.alarm / 100) * 0.34) * (0.75 + 0.25 * Math.sin(t * 6.5));
      const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.34, W / 2, H / 2, H * 0.78);
      vg.addColorStop(0, 'rgba(255,40,36,0)');
      vg.addColorStop(1, `rgba(255,40,36,${a.toFixed(3)})`);
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);
    }
    drawHUD(ctx, world);
    const tension = Math.max(world.alarm / 100, world.status === 'ALERT' ? 0.85 : 0);
    if (tension > 0.5) {
      const a = (tension - 0.5) * (0.6 + 0.3 * Math.sin(t * 8));
      ctx.save();
      ctx.strokeStyle = `rgba(255,60,50,${a})`;
      ctx.lineWidth = 10;
      ctx.strokeRect(5, 5, W - 10, H - 10);
      const eg = ctx.createLinearGradient(0, H, 0, H - 120);
      eg.addColorStop(0, `rgba(255,40,40,${a * 0.35})`);
      eg.addColorStop(1, 'rgba(255,40,40,0)');
      ctx.fillStyle = eg;
      ctx.fillRect(0, H - 120, W, 120);
      ctx.restore();
    }
  }

  if (world.screen === 'win') drawWin(ctx, world, t);
  if (world.screen === 'lockdown') drawLockdown(ctx, world, t);
}

function drawTitle(ctx, world, t) {
  ctx.fillStyle = 'rgba(7,9,17,0.88)';
  ctx.fillRect(0, 0, W, H);

  const sw = Math.sin(t * 0.4);
  const sg = ctx.createRadialGradient(480, -80, 30, 480, -80, 560);
  sg.addColorStop(0, 'rgba(255,235,190,0.24)');
  sg.addColorStop(1, 'rgba(255,235,190,0)');
  ctx.save();
  ctx.translate(480, -80);
  ctx.rotate(sw * 0.5);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-190, 700);
  ctx.lineTo(190, 700);
  ctx.closePath();
  ctx.fillStyle = sg;
  ctx.fill();
  ctx.restore();

  txt(ctx, 'THE', 480, 128, { size: 22, weight: 800, align: 'center', spacing: 14, color: '#93a7dc' });
  txt(ctx, 'GRAND GALLERY', 480, 178, { size: 50, weight: 900, align: 'center', spacing: 8, color: '#eef2ff', glow: 'rgba(140,170,255,0.35)', glowBlur: 18 });
  const gg = ctx.createLinearGradient(0, 190, 0, 292);
  gg.addColorStop(0, '#fff3c4');
  gg.addColorStop(0.45, '#ffd257');
  gg.addColorStop(1, '#c98f1e');
  ctx.save();
  ctx.font = '900 108px system-ui';
  ctx.shadowColor = 'rgba(255,200,80,0.55)';
  ctx.shadowBlur = 26;
  ctx.fillStyle = gg;
  ctx.letterSpacing = '22px';
  ctx.textAlign = 'center';
  ctx.fillText('HEIST', 480 + 11, 288);
  ctx.restore();
  ctx.fillStyle = 'rgba(255,210,90,0.65)';
  ctx.fillRect(330, 306, 300, 2.5);
  txt(ctx, 'ONE NIGHT · THREE PRIZES · ZERO WITNESSES', 480, 336, { size: 13, weight: 700, align: 'center', spacing: 3, color: '#9fb2dd' });

  panel(ctx, 268, 362, 424, 118, { r: 12, fill: 'rgba(10,14,26,0.85)', stroke: 'rgba(110,135,190,0.55)', lw: 1.5 });
  txt(ctx, 'THE JOB', 290, 388, { size: 11, weight: 900, spacing: 3, color: '#ffd873' });
  txt(ctx, 'Crack the vault · lift the gold · swipe the gem', 290, 410, { size: 13, weight: 600, color: '#e8eeff' });
  txt(ctx, 'Guards and cameras raise the ALARM — stay out of the light.', 290, 432, { size: 12.5, weight: 500, color: '#b9c6e8' });
  txt(ctx, 'Sneak past the cones, grab everything, reach the van below.', 290, 454, { size: 12.5, weight: 500, color: '#b9c6e8' });
  txt(ctx, '100% ALARM = LOCKDOWN.  Get caught = JOB OVER.', 290, 474, { size: 12.5, weight: 800, color: '#ffb257' });

  const cy = 496;
  const pts = conePolygon(world.cast, 560, cy, Math.PI, 1.2, 170, 20);
  const cg = ctx.createRadialGradient(560, cy, 6, 560, cy, 170);
  cg.addColorStop(0, 'rgba(255,214,80,0.42)');
  cg.addColorStop(0.55, 'rgba(255,214,80,0.2)');
  cg.addColorStop(1, 'rgba(255,214,80,0.03)');
  conePath(ctx, pts);
  ctx.fillStyle = cg;
  ctx.fill();
  drawGuard(ctx, { x: 560, y: cy, face: Math.PI, state: 'patrol', def: { fov: 1.2, range: 170 }, phase: 0 }, t);
  drawThief(ctx, 386, cy, 0, t * 9, false, t);
  circle(ctx, 560, cy, 3, 'rgba(255,255,240,0.85)');

  const blink = (t * 1.6) % 1 < 0.65;
  if (blink) txt(ctx, 'PRESS ENTER TO START THE JOB', 480, 566, { size: 17, weight: 900, align: 'center', spacing: 3, color: '#ffe2a0', glow: 'rgba(255,200,90,0.6)', glowBlur: 12 });
  txt(ctx, 'ENTER start · WASD move · SHIFT sneak · E grab · Q jammer · F decoy · C smoke · M sound · R restart', 480, 592, { size: 11, weight: 600, align: 'center', spacing: 1, color: 'rgba(170,185,220,0.8)' });
}

function drawWin(ctx, world, t) {
  ctx.fillStyle = 'rgba(8,10,20,0.9)';
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(480, 200, 20, 480, 200, 420);
  glow.addColorStop(0, 'rgba(255,210,90,0.14)');
  glow.addColorStop(1, 'rgba(255,210,90,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  txt(ctx, 'CLEAN GETAWAY', 480, 120, { size: 22, weight: 800, align: 'center', spacing: 8, color: '#9fb2dd' });
  const gg = ctx.createLinearGradient(0, 140, 0, 250);
  gg.addColorStop(0, '#fff3c4');
  gg.addColorStop(0.5, '#ffd257');
  gg.addColorStop(1, '#c98f1e');
  ctx.save();
  ctx.font = '900 84px system-ui';
  ctx.shadowColor = 'rgba(255,200,80,0.5)';
  ctx.shadowBlur = 26;
  ctx.fillStyle = gg;
  ctx.letterSpacing = '6px';
  ctx.textAlign = 'center';
  ctx.fillText('GETAWAY!', 483, 228);
  ctx.restore();

  panel(ctx, 300, 262, 360, 118, { r: 12, fill: 'rgba(10,14,26,0.9)', stroke: 'rgba(110,135,190,0.55)', lw: 1.5 });
  const rows = [
    ['TIME ON SITE', formatTime(world.stats.time)],
    ['HAUL SECURED', formatMoney(world.stats.money)],
    ['PEAK ALARM', `${world.stats.peak}%`],
    ['TIMES SPOTTED', String(world.stats.chases)],
  ];
  rows.forEach((r, i) => {
    const y = 288 + i * 23;
    txt(ctx, r[0], 322, y, { size: 12, weight: 700, spacing: 2, color: '#9fb2dd' });
    txt(ctx, r[1], 638, y, { size: 13.5, weight: 900, align: 'right', mono: true, color: '#eef2ff' });
  });

  const rc = world.rating === 'GHOST' ? ['#6ee7ff', 'they never knew you were there'] : world.rating === 'PRO' ? ['#ffc95e', 'smooth work — a few close calls'] : ['#ff6b6b', 'subtle as a brick, but rich'];
  ctx.save();
  ctx.translate(740, 96);
  ctx.rotate(-0.16);
  panel(ctx, -86, -34, 172, 68, { r: 10, fill: 'rgba(10,14,26,0.85)', stroke: rc[0], lw: 3 });
  panel(ctx, -78, -26, 156, 52, { r: 7, stroke: rc[0], lw: 1.5, fill: 'rgba(10,14,26,0.4)' });
  txt(ctx, 'RATING', 0, -12, { size: 9, weight: 900, align: 'center', spacing: 4, color: '#9fb2dd' });
  txt(ctx, world.rating, 0, 20, { size: 30, weight: 900, align: 'center', spacing: 4, color: rc[0], glow: rc[0], glowBlur: 16 });
  ctx.restore();
  txt(ctx, rc[1], 740, 150, { size: 11.5, weight: 600, align: 'center', color: '#b9c6e8' });

  const blink = (t * 1.6) % 1 < 0.65;
  if (blink) txt(ctx, 'ENTER — TITLE     R — ONE MORE JOB', 480, 430, { size: 15, weight: 900, align: 'center', spacing: 2, color: '#ffe2a0' });
  txt(ctx, 'The van clears the bridge at 3:04 AM. Nobody looks back.', 480, 466, { size: 12.5, weight: 500, align: 'center', color: '#8fa0c8' });
}

function drawLockdown(ctx, world, t) {
  ctx.fillStyle = 'rgba(46,6,6,0.72)';
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.strokeStyle = '#ff4040';
  ctx.lineWidth = 14;
  for (let x = -H; x < W; x += 44) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + H, H);
    ctx.stroke();
  }
  ctx.restore();

  const shake = world.freeze ? 0 : Math.sin(t * 40) * 2;
  ctx.save();
  ctx.translate(shake, 0);
  txt(ctx, 'LOCKDOWN', 480, 216, { size: 82, weight: 900, align: 'center', spacing: 10, color: '#ff4d4d', glow: 'rgba(255,60,50,0.6)', glowBlur: 30 });
  ctx.restore();
  ctx.fillStyle = 'rgba(255,80,70,0.7)';
  ctx.fillRect(300, 236, 360, 2.5);

  const reason = world.reason === 'caught' ? 'A guard grabbed you red-handed — the job is blown.' : 'The alarm maxed out — police seal every exit.';
  txt(ctx, reason, 480, 272, { size: 15, weight: 700, align: 'center', color: '#ffc2bd' });

  panel(ctx, 300, 300, 360, 118, { r: 12, fill: 'rgba(12,8,10,0.9)', stroke: 'rgba(255,90,80,0.55)', lw: 1.5 });
  const rows = [
    ['TIME BEFORE BUST', formatTime(world.stats.time)],
    ['LOOT CARRIED', formatMoney(world.stats.money)],
    ['PEAK ALARM', `${Math.round(world.alarmPeak)}%`],
    ['TIMES SPOTTED', String(world.stats.chases)],
  ];
  rows.forEach((r, i) => {
    const y = 326 + i * 23;
    txt(ctx, r[0], 322, y, { size: 12, weight: 700, spacing: 2, color: '#d8a5a0' });
    txt(ctx, r[1], 638, y, { size: 13.5, weight: 900, align: 'right', mono: true, color: '#ffecec' });
  });

  const a = 0.45 + 0.35 * Math.sin(t * 6);
  txt(ctx, 'GALLERY IN LOCKDOWN', 480, 452, { size: 13, weight: 900, align: 'center', spacing: 4, color: `rgba(255,90,80,${a})` });
  const blink = (t * 1.6) % 1 < 0.65;
  if (blink) txt(ctx, 'ENTER — TITLE     R — ONE MORE JOB', 480, 486, { size: 15, weight: 900, align: 'center', spacing: 2, color: '#ffe2a0' });
}
