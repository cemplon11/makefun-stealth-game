// audio.js — every sound is synthesized with WebAudio: no audio files.
// One job: footsteps that tell you where a guard is, and the stings that
// mark a pickup, an alarm and a win or a loss.

let ctx = null;
let master = null;
let ambientOn = false;

function ensureContext() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  } catch (_e) {
    ctx = null;
  }
  return ctx;
}

export function initAudio() {
  const c = ensureContext();
  if (c && c.state === 'suspended') c.resume().catch(() => {});
  return !!c;
}

// A short filtered-noise tap: a footstep. pan -1 (left) .. 1 (right)
// places it in stereo, so you hear which side a guard walks on.
export function playFootstep(pan, loud) {
  const c = ensureContext();
  if (!c || c.state !== 'running') return;
  const t = c.currentTime;
  const dur = 0.07;
  const buffer = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 420;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.35 * loud, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  const panner = c.createStereoPanner ? c.createStereoPanner() : null;
  if (panner) {
    panner.pan.value = Math.max(-1, Math.min(1, pan));
    src.connect(filter).connect(gain).connect(panner).connect(master);
  } else {
    src.connect(filter).connect(gain).connect(master);
  }
  src.start(t);
  src.stop(t + dur);
}

function tone(freq, startAt, dur, type, vol, slideTo) {
  const c = ensureContext();
  if (!c || c.state !== 'running') return;
  const t = c.currentTime + startAt;
  const osc = c.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

// The alarm sting: two rising brass-ish notes when a guard spots you.
export function playAlert() {
  tone(220, 0, 0.22, 'sawtooth', 0.22, 330);
  tone(330, 0.16, 0.3, 'sawtooth', 0.2, 440);
}

// A bright chime when a relic is pocketed.
export function playPickup() {
  tone(880, 0, 0.12, 'sine', 0.25);
  tone(1318, 0.09, 0.2, 'sine', 0.22);
}

// A small metallic clink when a coin lands.
export function playCoinClink() {
  tone(2400, 0, 0.06, 'triangle', 0.18, 1800);
  tone(1900, 0.05, 0.09, 'triangle', 0.12, 1400);
}

// A low "you were seen" thud when caught.
export function playCaught() {
  tone(160, 0, 0.4, 'sawtooth', 0.25, 60);
  tone(110, 0.1, 0.5, 'square', 0.15, 55);
}

// A little fanfare when the vault is emptied and the thief slips out.
export function playWin() {
  [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.12, 0.28, 'triangle', 0.22));
}

// A soft, low room tone so the museum never feels dead silent.
export function startAmbient() {
  const c = ensureContext();
  if (!c || ambientOn) return;
  ambientOn = true;
  try {
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 55;
    const gain = c.createGain();
    gain.gain.value = 0.04;
    const lfo = c.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = c.createGain();
    lfoGain.gain.value = 0.02;
    lfo.connect(lfoGain).connect(gain.gain);
    osc.connect(gain).connect(master);
    osc.start();
    lfo.start();
  } catch (_e) {
    ambientOn = false;
  }
}
