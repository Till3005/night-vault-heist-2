// A working best-game-01 entry (Node 22, standard library only): the game is this directory's
// game/ folder, plain static files a desktop browser loads offline (game/index.html and its ES
// modules, no library and no network request), and the program hands it in. It copies game/ and
// screenshots/ from beside this file to /output and writes /output/dossier.json, the summary the
// judge reads, with the vendored make.fun library.
//
// The game: GRAND GALLERY HEIST, a top-down single-screen stealth heist on a 960x600 canvas.
// You are a thief crossing a museum floor at night: three patrolling guards with raycast vision
// cones, three sweeping security cameras, a vault plus two display cases to crack (hold E — the
// noise pings attract guards), a segmented ALARM meter that fills while you are seen and locks
// the gallery at 100%, and a getaway van below the locked exit door. Tools cost charges: a camera
// jammer (Q), a throwable noise decoy (F), and a smoke bomb (C, two per run) that drops a four-
// second cloud blocking guard cones and camera beams inside its radius. SHIFT sneaks (slower,
// quieter), WASD/arrows move, guards escalate patrol -> suspicious -> chase (red cone) -> caught,
// and the run ends in a getaway screen with a GHOST/PRO/LOUD rating or a red LOCKDOWN screen.
// All audio is synthesized WebAudio (no assets): footsteps while moving, crack-progress ticks, a
// rising alarm tone while spotted, a guard alert sting, a camera hum, and win/lose jingles — M
// toggles mute, shown in the HUD. A corner minimap tracks walls, guards, loot, smoke and the
// exit. R restarts, Enter confirms. ?shot=cover|alert|title|win|smoke|chase stages the six
// screenshot scenes deterministically.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB of game
// files, in all, or a path under game/ over 1000 bytes: game/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
