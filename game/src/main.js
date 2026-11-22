import { initInput } from './input.js';
import { createWorld, update } from './state.js';
import { buildStatic, render } from './render.js';
import { stageShot } from './shots.js';
import * as sound from './sound.js';

const canvas = document.getElementById('game');
canvas.width = 960;
canvas.height = 600;
const ctx = canvas.getContext('2d');
initInput();
window.addEventListener('keydown', () => sound.unlock());
window.addEventListener('pointerdown', () => sound.unlock());
window.__sound = sound;

const world = createWorld();
let staticLayer = buildStatic(world);
window.__world = world;
const shotName = new URLSearchParams(location.search).get('shot');
if (shotName) stageShot(shotName, world);

let last = performance.now();
let frames = 0;
function frame(now) {
  const dt = Math.min((now - last) / 1000, 1 / 20);
  last = now;
  if (world.staticDirty) {
    staticLayer = buildStatic(world);
    world.staticDirty = false;
  }
  update(world, dt);
  render(ctx, world, staticLayer);
  frames += 1;
  if (shotName && frames === 24) window.__SHOT_READY = true;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
