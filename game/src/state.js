import { TILE, W, H, clamp, dist, angleTo, angleLerp, angDiff, makeCaster, hasLineOfSight } from './util.js';
import { MAP, GUARDS, CAMERAS, LOOT, DECOR_CASES, THIEF_START, solidFor, assertMap } from './map.js';
import * as input from './input.js';
import * as sound from './sound.js';

assertMap();

const THIEF_R = 10;
const GUARD_R = 12;
const SPEED = { sneak: 56, walk: 116 };
const CATCH_R = 27;

export function createWorld() {
  const world = {
    tiles: MAP,
    cast: makeCaster(MAP),
    screen: 'title',
    t: 3.7,
    freeze: false,
    thief: null,
    guards: [],
    cameras: [],
    loot: [],
    noises: [],
    sparkles: [],
    smoke: [],
    decoy: null,
    alarm: 0,
    alarmPeak: 0,
    seenT: 9,
    doorOpen: false,
    tools: { jammer: 3, decoy: 2, smoke: 2, jamT: 0 },
    prompt: null,
    status: 'UNDETECTED',
    msg: null,
    reason: '',
    rating: '',
    stats: { time: 0, chases: 0, money: 0, peak: 0 },
  };
  reset(world);
  return world;
}

export function reset(world) {
  world.t = 0;
  world.freeze = false;
  world.screen = 'title';
  world.alarm = 0;
  world.alarmPeak = 0;
  world.seenT = 9;
  world.doorOpen = false;
  world.tools = { jammer: 3, decoy: 2, smoke: 2, jamT: 0 };
  world.noises = [];
  world.sparkles = [];
  world.smoke = [];
  sound.stopLoops();
  world.decoy = null;
  world.prompt = null;
  world.status = 'UNDETECTED';
  world.msg = null;
  world.reason = '';
  world.rating = '';
  world.stats = { time: 0, chases: 0, money: 0, peak: 0 };
  world.thief = {
    x: THIEF_START.x,
    y: THIEF_START.y,
    face: -Math.PI / 2,
    moving: false,
    sneak: false,
    bob: 0,
    noiseT: 0,
    footT: 0,
    crackNoiseT: 0,
    crackTickT: 0,
  };
  world.guards = GUARDS.map((def, gi) => ({
    def,
    x: def.wps[0].x * TILE,
    y: def.wps[0].y * TILE,
    face: angleTo(def.wps[0].x * TILE, def.wps[0].y * TILE, def.wps[1 % def.wps.length].x * TILE, def.wps[1 % def.wps.length].y * TILE),
    wi: 1,
    dir: 1,
    state: 'patrol',
    suspicion: 0,
    wait: 0,
    lookBase: 0,
    lookT: 0,
    target: null,
    seen: null,
    loseT: 99,
    stun: 0,
    phase: gi * 1.7,
  }));
  world.cameras = CAMERAS.map((c) => ({ ...c, face: c.base + c.amp * Math.sin(c.phase), see: 0, alertCd: 0 }));
  world.loot = LOOT.map((l) => ({ ...l, got: false, prog: 0 }));
  world.obstacles = [
    ...LOOT.filter((l) => l.kind !== 'vault').map((l) => ({ x: l.x, y: l.y, r: 18 })),
    { x: LOOT[2].x, y: LOOT[2].y, r: 31 },
    ...DECOR_CASES.map((c) => ({ x: c.x, y: c.y, r: 17 })),
  ];
}

function tryMove(world, ent, dx, dy, r, who) {
  const free = (nx, ny) => {
    const x0 = Math.floor((nx - r) / TILE);
    const x1 = Math.floor((nx + r) / TILE);
    const y0 = Math.floor((ny - r) / TILE);
    const y1 = Math.floor((ny + r) / TILE);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (solidFor(world.tiles, tx, ty, who, world.doorOpen)) return false;
      }
    }
    for (const o of world.obstacles) {
      const rr = o.r + r;
      if ((nx - o.x) * (nx - o.x) + (ny - o.y) * (ny - o.y) < rr * rr) return false;
    }
    return true;
  };
  if (dx !== 0 && free(ent.x + dx, ent.y)) ent.x = clamp(ent.x + dx, r, W - r);
  if (dy !== 0 && free(ent.x, ent.y + dy)) ent.y = clamp(ent.y + dy, r, H - r);
}

function emitNoise(world, x, y, r) {
  world.noises.push({ x, y, t: 0, r });
  if (world.noises.length > 14) world.noises.shift();
}

function burst(world, x, y, color) {
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + Math.random() * 0.4;
    const sp = 30 + Math.random() * 60;
    world.sparkles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, dur: 0.8 + Math.random() * 0.5, color });
  }
  if (world.sparkles.length > 80) world.sparkles.splice(0, world.sparkles.length - 80);
}

function notify(world, text) {
  world.msg = { text, t: 0, dur: 2.8 };
}

function smokeBlocks(world, ax, ay, bx, by) {
  for (const s of world.smoke) {
    let r = s.r * Math.min(1, s.t / 0.35);
    if (s.t > s.dur - 0.5) r *= (s.dur - s.t) / 0.5;
    if (r < 8) continue;
    if (dist(ax, ay, s.x, s.y) < r || dist(bx, by, s.x, s.y) < r) return true;
    const dx = bx - ax;
    const dy = by - ay;
    const fx = ax - s.x;
    const fy = ay - s.y;
    const a = dx * dx + dy * dy;
    const b = 2 * (fx * dx + fy * dy);
    const c = fx * fx + fy * fy - r * r;
    if (c <= 0) return true;
    let disc = b * b - 4 * a * c;
    if (disc >= 0) {
      disc = Math.sqrt(disc);
      const t1 = (-b - disc) / (2 * a);
      const t2 = (-b + disc) / (2 * a);
      if ((t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1)) return true;
    }
  }
  return false;
}

function twinkle(world, x, y) {
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + 0.26;
    const sp = 12 + (i % 3) * 9;
    world.sparkles.push({ x, y, vx: Math.cos(a) * sp, vy: -26 - (i % 4) * 14, t: 0, dur: 1 + (i % 3) * 0.25, color: i % 2 ? '#fff3cf' : '#ffd873', g: 6 });
  }
}

function inCone(world, ent, fov, range, tx, ty) {
  if (smokeBlocks(world, ent.x, ent.y, tx, ty)) return 0;
  const d = dist(ent.x, ent.y, tx, ty);
  if (d > range) return 0;
  const a = angleTo(ent.x, ent.y, tx, ty);
  if (angDiff(ent.face, a) > fov / 2) return 0;
  if (!hasLineOfSight(world.cast, ent.x, ent.y, tx, ty)) return 0;
  return 1 - d / range;
}

export function update(world, dt) {
  if (world.freeze) return;
  if (input.pressed('KeyM')) sound.toggleMute();
  world.t += dt;

  if (world.screen === 'title') {
    if (input.pressed('Enter')) {
      reset(world);
      world.screen = 'play';
    }
    input.clearPressed();
    return;
  }
  if (world.screen === 'win' || world.screen === 'lockdown') {
    if (input.pressed('Enter')) world.screen = 'title';
    if (input.pressed('KeyR')) {
      reset(world);
      world.screen = 'play';
    }
    input.clearPressed();
    return;
  }

  world.stats.time += dt;
  const thief = world.thief;
  thief.sneak = input.sneaking();
  const ax = input.axis();
  thief.moving = ax.any;
  if (ax.any) {
    const sp = thief.sneak ? SPEED.sneak : SPEED.walk;
    tryMove(world, thief, ax.x * sp * dt, ax.y * sp * dt, THIEF_R, 'thief');
    thief.face = angleLerp(thief.face, Math.atan2(ax.y, ax.x), Math.min(1, dt * 14));
    thief.bob += dt * (thief.sneak ? 7 : 12);
    thief.footT -= dt;
    if (thief.footT <= 0) {
      sound.step(thief.sneak);
      thief.footT = thief.sneak ? 0.44 : 0.3;
    }
    thief.noiseT -= dt;
    if (thief.noiseT <= 0) {
      emitNoise(world, thief.x, thief.y, thief.sneak ? 26 : 112);
      thief.noiseT = thief.sneak ? 0.85 : 0.55;
    }
  } else {
    thief.footT = 0;
  }

  if (input.pressed('KeyQ') && world.tools.jammer > 0 && world.tools.jamT <= 0) {
    world.tools.jammer -= 1;
    world.tools.jamT = 6;
    notify(world, 'CAMERA JAMMER ACTIVE — 6s');
  }
  if (world.tools.jamT > 0) world.tools.jamT -= dt;
  if (input.pressed('KeyF') && world.tools.decoy > 0 && !world.decoy) {
    world.tools.decoy -= 1;
    let tx = thief.x + Math.cos(thief.face) * 150;
    let ty = thief.y + Math.sin(thief.face) * 150;
    while (solidFor(world.tiles, Math.floor(tx / TILE), Math.floor(ty / TILE), 'thief', true) && dist(thief.x, thief.y, tx, ty) > 30) {
      tx -= Math.cos(thief.face) * 16;
      ty -= Math.sin(thief.face) * 16;
    }
    tx = clamp(tx, TILE + 14, W - TILE - 14);
    ty = clamp(ty, TILE + 14, 13 * TILE - 14);
    world.decoy = { x: thief.x, y: thief.y, tx, ty, t: 0 };
  }
  if (input.pressed('KeyC') && world.tools.smoke > 0) {
    world.tools.smoke -= 1;
    world.smoke.push({ x: thief.x, y: thief.y, t: 0, dur: 4, r: 120 });
    sound.smokePuff();
    notify(world, 'SMOKE DEPLOYED — SIGHTS BLOCKED');
  }

  let anySee = false;
  let anyChase = false;
  let anySusp = false;

  for (const c of world.cameras) {
    c.face = c.base + c.amp * Math.sin(world.t * c.spd + c.phase);
    c.jammed = world.tools.jamT > 0 && dist(c.x, c.y, thief.x, thief.y) < 235;
    if (c.jammed) {
      c.see = Math.max(0, c.see - dt * 3);
      continue;
    }
    const str = inCone(world, c, c.fov, c.range, thief.x, thief.y);
    if (str > 0) {
      anySee = true;
      c.see = Math.min(1, c.see + dt * 3);
      world.alarm += dt * 15 * (0.4 + 0.6 * str);
      c.alertCd -= dt;
      if (c.alertCd <= 0) {
        c.alertCd = 1.2;
        let best = null;
        let bd = 1e9;
        for (const g of world.guards) {
          const d = dist(g.x, g.y, thief.x, thief.y);
          if (d < bd && g.state !== 'chase') {
            bd = d;
            best = g;
          }
        }
        if (best) {
          best.state = 'suspicious';
          best.target = { x: thief.x, y: thief.y };
          best.suspicion = Math.max(best.suspicion, 0.55);
          best.lookT = 0;
        }
      }
    } else {
      c.see = Math.max(0, c.see - dt * 1.5);
    }
  }

  for (const g of world.guards) {
    if (g.stun > 0) {
      g.stun -= dt;
      anyChase = g.state === 'chase';
      continue;
    }
    const str = inCone(world, g, g.def.fov, g.def.range, thief.x, thief.y);
    if (str > 0) {
      anySee = true;
      g.suspicion += dt * 2.5 * (0.35 + 0.65 * str) * (thief.sneak ? 0.6 : 1);
      g.seen = { x: thief.x, y: thief.y };
      g.loseT = 0;
    } else {
      g.loseT += dt;
      g.suspicion -= dt * (g.state === 'chase' ? 0.1 : 0.42);
    }
    g.suspicion = clamp(g.suspicion, 0, 1.6);

    for (const n of world.noises) {
      if (n.t > 0.12) continue;
      if (dist(g.x, g.y, n.x, n.y) < n.r && g.state !== 'chase') {
        g.state = 'suspicious';
        g.target = { x: n.x, y: n.y };
        g.suspicion = Math.max(g.suspicion, 0.5);
        g.lookT = 0;
      }
    }

    if (g.state !== 'chase' && g.suspicion >= 1) {
      g.state = 'chase';
      world.stats.chases += 1;
      sound.sting();
      notify(world, 'SPOTTED — RUN!');
    }

    const speed = g.def.speed;
    let vx = 0;
    let vy = 0;
    if (g.state === 'chase') {
      const tgt = str > 0 || g.loseT < 0.4 ? { x: thief.x, y: thief.y } : g.seen;
      if (tgt && dist(g.x, g.y, tgt.x, tgt.y) > 10) {
        const a = angleTo(g.x, g.y, tgt.x, tgt.y);
        vx = Math.cos(a) * speed.chase;
        vy = Math.sin(a) * speed.chase;
        g.face = angleLerp(g.face, a, Math.min(1, dt * 10));
      } else {
        g.face += Math.sin(world.t * 2.4 + g.phase) * dt * 1.6;
        if (g.loseT > 2.6) {
          g.state = 'suspicious';
          g.target = g.seen;
          g.lookT = 0;
        }
      }
      anyChase = true;
    } else if (g.state === 'suspicious') {
      anySusp = true;
      const tgt = g.target;
      if (tgt && dist(g.x, g.y, tgt.x, tgt.y) > 8) {
        const a = angleTo(g.x, g.y, tgt.x, tgt.y);
        vx = Math.cos(a) * speed.suspicious;
        vy = Math.sin(a) * speed.suspicious;
        g.face = angleLerp(g.face, a, Math.min(1, dt * 8));
        g.lookT = 0;
        g.lookBase = g.face;
      } else {
        g.lookT += dt;
        g.face = g.lookBase + Math.sin(world.t * 1.7 + g.phase) * 0.95;
        if (g.lookT > 2.4 && g.suspicion < 0.9) {
          g.state = 'patrol';
          g.suspicion = Math.min(g.suspicion, 0.25);
        }
      }
    } else {
      if (g.wait > 0) {
        g.wait -= dt;
        g.face = g.lookBase + Math.sin(world.t * 1.5 + g.phase) * 0.8;
      } else {
        const wp = g.def.wps[g.wi];
        const wx = wp.x * TILE;
        const wy = wp.y * TILE;
        const d = dist(g.x, g.y, wx, wy);
        if (d < 7) {
          g.wi += g.dir;
          if (g.wi >= g.def.wps.length) {
            g.wi = g.def.wps.length - 2;
            g.dir = -1;
          } else if (g.wi < 0) {
            g.wi = 1;
            g.dir = 1;
          }
          g.wait = g.wi === 0 || g.wi === g.def.wps.length - 1 ? 2 : 1.1;
          g.lookBase = g.face;
        } else {
          const a = angleTo(g.x, g.y, wx, wy);
          vx = Math.cos(a) * speed.patrol;
          vy = Math.sin(a) * speed.patrol;
          g.face = angleLerp(g.face, a, Math.min(1, dt * 6));
        }
      }
    }
    if (vx || vy) tryMove(world, g, vx * dt, vy * dt, GUARD_R, 'guard');

    const gd = dist(g.x, g.y, thief.x, thief.y);
    if (g.state !== 'chase' && gd < CATCH_R) {
      g.state = 'chase';
      g.suspicion = 1.3;
      g.seen = { x: thief.x, y: thief.y };
      g.stun = 0.55;
      world.alarm += 8;
      sound.sting();
      notify(world, 'SPOTTED — RUN!');
    } else if (g.state === 'chase' && gd < CATCH_R) {
      world.screen = 'lockdown';
      world.reason = 'caught';
      world.alarm = Math.max(world.alarm, 88);
      sound.stopLoops();
      sound.lose();
      input.clearPressed();
      return;
    }

    if (str > 0) world.alarm += dt * (g.state === 'chase' ? 13 : 7 * (0.4 + 0.6 * str));
  }

  if (world.decoy) {
    world.decoy.t += dt;
    if (world.decoy.t >= 0.45) {
      emitNoise(world, world.decoy.tx, world.decoy.ty, 300);
      world.decoy = null;
    }
  }
  for (const n of world.noises) n.t += dt;
  world.noises = world.noises.filter((n) => n.t < 1.4);
  for (const s of world.smoke) s.t += dt;
  world.smoke = world.smoke.filter((s) => s.t < s.dur);
  for (const s of world.sparkles) {
    s.t += dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.vy += (s.g ?? 60) * dt;
  }
  world.sparkles = world.sparkles.filter((s) => s.t < s.dur);

  let prompt = null;
  for (const l of world.loot) {
    if (l.got) continue;
    const range = l.kind === 'vault' ? 62 : 44;
    if (dist(thief.x, thief.y, l.x, l.y) < range) {
      prompt = l;
      break;
    }
  }
  world.prompt = prompt;
  if (prompt) {
    if (input.holding()) {
      prompt.prog += dt / prompt.dur;
      thief.crackTickT -= dt;
      if (thief.crackTickT <= 0) {
        sound.crackTick(prompt.prog);
        thief.crackTickT = 0.21;
      }
      thief.crackNoiseT -= dt;
      if (thief.crackNoiseT <= 0) {
        emitNoise(world, thief.x, thief.y, prompt.kind === 'vault' ? 130 : 95);
        thief.crackNoiseT = 0.8;
      }
      if (prompt.prog >= 1) {
        prompt.got = true;
        prompt.prog = 1;
        world.stats.money += prompt.value;
        world.alarm += 5;
        burst(world, prompt.x, prompt.y, '#ffd873');
        twinkle(world, prompt.x, prompt.y);
        notify(world, `SECURED ${prompt.label} · $${(prompt.value / 1000000).toFixed(2)}M`);
        const left = world.loot.filter((l) => !l.got).length;
        if (left === 0) {
          world.doorOpen = true;
          notify(world, 'ALL LOOT SECURED — EXIT UNLOCKED, GET OUT!');
        }
      }
    } else {
      prompt.prog = Math.max(0, prompt.prog - dt * 0.06);
    }
  }

  if (anySee) world.seenT = 0;
  else world.seenT += dt;
  if (!anySee && world.seenT > 0.9) world.alarm -= dt * 7;
  world.alarm = clamp(world.alarm, 0, 100);
  world.alarmPeak = Math.max(world.alarmPeak, world.alarm);
  sound.setAlarm(world.alarm / 100, anySee);
  sound.camHum(world.cameras.reduce((m, c) => Math.max(m, c.see), 0));
  if (world.alarm >= 100) {
    world.screen = 'lockdown';
    world.reason = 'alarm';
    sound.stopLoops();
    sound.lose();
    input.clearPressed();
    return;
  }

  world.status = anyChase || world.alarm > 82 ? 'ALERT' : anySee || anySusp || world.cameras.some((c) => c.see > 0.3) ? 'SUSPICIOUS' : 'UNDETECTED';

  if (thief.y > 13 * TILE + 22) {
    if (world.loot.every((l) => l.got)) {
      world.screen = 'win';
      world.stats.peak = Math.round(world.alarmPeak);
      world.rating = world.alarmPeak < 25 && world.stats.chases === 0 ? 'GHOST' : world.alarmPeak < 70 ? 'PRO' : 'LOUD';
      sound.stopLoops();
      sound.win();
      input.clearPressed();
      return;
    }
  }

  if (input.pressed('KeyR')) {
    reset(world);
    world.screen = 'play';
  }
  input.clearPressed();
  if (world.msg) {
    world.msg.t += dt;
    if (world.msg.t > world.msg.dur) world.msg = null;
  }
}
