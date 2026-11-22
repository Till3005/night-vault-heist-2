// Synthesized WebAudio SFX — no assets, no network. The context is created lazily
// on the first user gesture (unlock), so every call before that is a silent no-op.

let ac = null;
let master = null;
let muted = false;
let alarm = null;
let hum = null;
let noiseBuf = null;
let stepFlip = 0;

const VOL = 0.5;

export function unlock() {
  if (!ac) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    master = ac.createGain();
    master.gain.value = muted ? 0 : VOL;
    master.connect(ac.destination);
    alarm = tone(190, 'sawtooth');
    hum = tone(64, 'triangle');
  }
  if (ac.state === 'suspended') ac.resume();
}

function tone(freq, type) {
  const osc = ac.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  const filt = ac.createBiquadFilter();
  filt.type = 'lowpass';
  filt.frequency.value = 1200;
  const gain = ac.createGain();
  gain.gain.value = 0;
  osc.connect(filt);
  filt.connect(gain);
  gain.connect(master);
  osc.start();
  return { osc, gain };
}

function blip(freq, dur, type, vol, slideTo, delay = 0) {
  if (!ac) return;
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + dur);
  const gain = ac.createGain();
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.03);
}

function whoosh(dur, vol, from, to, delay = 0) {
  if (!ac) return;
  if (!noiseBuf) {
    noiseBuf = ac.createBuffer(1, (ac.sampleRate * 0.5) | 0, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t0 = ac.currentTime + delay;
  const src = ac.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  const filt = ac.createBiquadFilter();
  filt.type = 'lowpass';
  filt.frequency.setValueAtTime(from, t0);
  filt.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
  const gain = ac.createGain();
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filt);
  filt.connect(gain);
  gain.connect(master);
  src.start(t0);
  src.stop(t0 + dur + 0.03);
}

export function step(sneak) {
  stepFlip = 1 - stepFlip;
  blip(stepFlip ? 148 : 130, 0.07, 'sine', sneak ? 0.05 : 0.1, 52);
}

export function crackTick(prog) {
  blip(320 + prog * 560, 0.045, 'square', 0.05);
}

export function sting() {
  blip(740, 0.09, 'square', 0.15);
  blip(560, 0.16, 'square', 0.15, 400, 0.09);
}

export function smokePuff() {
  whoosh(0.5, 0.28, 2600, 160);
}

export function win() {
  blip(523, 0.22, 'triangle', 0.15);
  blip(659, 0.22, 'triangle', 0.15, null, 0.12);
  blip(784, 0.22, 'triangle', 0.15, null, 0.24);
  blip(1047, 0.3, 'triangle', 0.15, null, 0.38);
  blip(1319, 0.42, 'triangle', 0.11, null, 0.54);
}

export function lose() {
  blip(392, 0.3, 'sawtooth', 0.11, 360);
  blip(330, 0.3, 'sawtooth', 0.11, 300, 0.17);
  blip(262, 0.3, 'sawtooth', 0.11, 235, 0.34);
  blip(196, 0.5, 'sawtooth', 0.11, 170, 0.51);
  whoosh(0.8, 0.12, 700, 60, 0.1);
}

export function setAlarm(level, active) {
  if (!ac) return;
  const t = ac.currentTime;
  if (active) {
    alarm.osc.frequency.setTargetAtTime(190 + level * 470, t, 0.08);
    alarm.gain.gain.setTargetAtTime(0.02 + level * 0.09, t, 0.1);
  } else {
    alarm.gain.gain.setTargetAtTime(0, t, 0.15);
  }
}

export function camHum(see) {
  if (!ac) return;
  const t = ac.currentTime;
  hum.osc.frequency.setTargetAtTime(58 + see * 26, t, 0.15);
  hum.gain.gain.setTargetAtTime(see * 0.045, t, 0.2);
}

export function stopLoops() {
  setAlarm(0, false);
  camHum(0);
}

export function toggleMute() {
  muted = !muted;
  if (ac) master.gain.setTargetAtTime(muted ? 0 : VOL, ac.currentTime, 0.02);
  return muted;
}

export function isMuted() {
  return muted;
}
