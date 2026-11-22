import { angleTo, TILE } from './util.js';
import { reset } from './state.js';

function burstAt(world, x, y, color, n = 10) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const sp = 25 + (i % 3) * 22;
    world.sparkles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 20, t: 0.15, dur: 0.9, color });
  }
}

export function stageShot(name, world) {
  if (name === 'title') {
    reset(world);
    world.screen = 'title';
    world.freeze = true;
    world.t = 2;
    return;
  }
  if (name === 'win') {
    reset(world);
    world.screen = 'win';
    world.freeze = true;
    world.t = 1;
    world.stats = { time: 94.3, chases: 0, money: 5150000, peak: 22 };
    world.rating = 'GHOST';
    world.doorOpen = true;
    world.loot.forEach((l) => (l.got = true));
    return;
  }
  reset(world);
  world.screen = 'play';
  world.freeze = true;
  if (name === 'alert') stageAlert(world);
  else if (name === 'smoke') stageSmoke(world);
  else if (name === 'chase') stageChase(world);
  else stageCover(world);
}

function stageCover(world) {
  world.t = 4.3;
  world.stats.time = 74.2;
  world.alarm = 46;
  world.alarmPeak = 52;
  world.status = 'SUSPICIOUS';
  world.loot[0].got = true;
  world.stats.money = 850000;
  world.tools = { jammer: 3, decoy: 2, smoke: 2, jamT: 0 };

  const th = world.thief;
  th.x = 508;
  th.y = 462;
  th.face = -0.3;
  th.moving = true;
  th.sneak = false;
  th.bob = 2.2;
  world.noises.push({ x: 508, y: 462, t: 0.3, r: 112 });

  const g1 = world.guards[0];
  g1.x = 622;
  g1.y = 506;
  g1.face = angleTo(622, 506, th.x, th.y) + 0.52;
  g1.state = 'patrol';
  g1.wait = 0.4;

  const g2 = world.guards[1];
  g2.x = 118;
  g2.y = 72;
  g2.face = 0.1;
  g2.state = 'patrol';

  const g3 = world.guards[2];
  g3.x = 498;
  g3.y = 340;
  g3.face = angleTo(498, 340, 380, 440);
  g3.state = 'suspicious';
  g3.suspicion = 0.62;
  g3.target = { x: 380, y: 440 };
  g3.lookT = 0;

  const cams = world.cameras;
  cams[0].face = 0.66;
  cams[0].see = 0.72;
  cams[1].face = 2.82;
  cams[1].see = 0;
  cams[2].face = 0.5;
  cams[2].see = 0;

  burstAt(world, 180, 104, '#ffd873', 9);
}

function stageAlert(world) {
  world.t = 2.1;
  world.stats.time = 113.6;
  world.alarm = 87;
  world.alarmPeak = 87;
  world.status = 'ALERT';
  world.loot[0].got = true;
  world.loot[1].got = true;
  world.stats.money = 1950000;
  world.stats.chases = 2;
  world.tools = { jammer: 2, decoy: 1, smoke: 0, jamT: 0 };

  const th = world.thief;
  th.x = 208;
  th.y = 506;
  th.face = Math.PI;
  th.moving = true;
  th.sneak = false;
  th.bob = 5.1;

  const g1 = world.guards[0];
  g1.x = 392;
  g1.y = 468;
  g1.face = angleTo(392, 468, th.x, th.y);
  g1.state = 'chase';
  g1.suspicion = 1.45;
  g1.seen = { x: th.x, y: th.y };
  g1.loseT = 0;

  const g2 = world.guards[1];
  g2.x = 88;
  g2.y = 252;
  g2.face = -0.5;
  g2.state = 'patrol';

  const g3 = world.guards[2];
  g3.x = 548;
  g3.y = 298;
  g3.face = angleTo(548, 298, th.x, th.y);
  g3.state = 'chase';
  g3.suspicion = 1.3;
  g3.seen = { x: th.x, y: th.y };
  g3.loseT = 0.2;

  const cams = world.cameras;
  cams[0].face = 1.9;
  cams[0].see = 0;
  cams[1].face = 2.3;
  cams[1].see = 0;
  cams[2].face = 0.95;
  cams[2].see = 0;
}

function stageSmoke(world) {
  world.t = 4.3;
  world.stats.time = 66.8;
  world.alarm = 18;
  world.alarmPeak = 34;
  world.status = 'UNDETECTED';
  world.loot[0].got = true;
  world.stats.money = 850000;
  world.tools = { jammer: 3, decoy: 2, smoke: 1, jamT: 0 };

  const th = world.thief;
  th.x = 486;
  th.y = 470;
  th.face = -0.2;
  th.moving = false;
  th.sneak = true;
  th.bob = 1.4;

  world.smoke.push({ x: 566, y: 486, t: 1.4, dur: 4, r: 120 });

  const g1 = world.guards[0];
  g1.x = 700;
  g1.y = 500;
  g1.face = angleTo(700, 500, 430, 452);
  g1.state = 'patrol';
  g1.wait = 0.4;

  const g2 = world.guards[1];
  g2.x = 118;
  g2.y = 72;
  g2.face = 0.1;
  g2.state = 'patrol';

  const g3 = world.guards[2];
  g3.x = 856;
  g3.y = 316;
  g3.face = -1.2;
  g3.state = 'patrol';

  const cams = world.cameras;
  cams[0].face = 0.85;
  cams[0].see = 0;
  cams[1].face = 2.82;
  cams[1].see = 0;
  cams[2].face = 0.5;
  cams[2].see = 0;
}

function stageChase(world) {
  world.t = 2.6;
  world.stats.time = 96.4;
  world.alarm = 78;
  world.alarmPeak = 84;
  world.status = 'ALERT';
  world.loot[0].got = true;
  world.loot[1].got = true;
  world.stats.money = 1950000;
  world.stats.chases = 2;
  world.tools = { jammer: 2, decoy: 1, smoke: 0, jamT: 0 };

  const th = world.thief;
  th.x = 300;
  th.y = 508;
  th.face = Math.PI * 0.85;
  th.moving = true;
  th.sneak = false;
  th.bob = 4.6;
  world.noises.push({ x: 300, y: 508, t: 0.25, r: 112 });

  const g1 = world.guards[0];
  g1.x = 420;
  g1.y = 492;
  g1.face = angleTo(420, 492, th.x, th.y);
  g1.state = 'chase';
  g1.suspicion = 1.5;
  g1.seen = { x: th.x, y: th.y };
  g1.loseT = 0;

  const g2 = world.guards[1];
  g2.x = 150;
  g2.y = 380;
  g2.face = angleTo(150, 380, th.x, th.y);
  g2.state = 'chase';
  g2.suspicion = 1.3;
  g2.seen = { x: th.x, y: th.y };
  g2.loseT = 0.3;

  const g3 = world.guards[2];
  g3.x = 700;
  g3.y = 396;
  g3.face = angleTo(700, 396, th.x, th.y);
  g3.state = 'suspicious';
  g3.suspicion = 0.8;
  g3.target = { x: 420, y: 470 };
  g3.lookT = 0;

  const cams = world.cameras;
  cams[0].face = 2.3;
  cams[0].see = 0.4;
  cams[1].face = 2.3;
  cams[1].see = 0;
  cams[2].face = 0.6;
  cams[2].see = 0;
}
