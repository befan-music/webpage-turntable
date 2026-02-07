/**
 * Web Audio API sound effects.
 * All sounds are synthesized — no audio files needed.
 * Sound is OFF by default, controlled by the sound toggle in Zone C.
 */

import { getState, onStateChange } from './state.js';

let audioCtx = null;
let crackleNode = null;
let crackleGain = null;

/**
 * Lazily initialize AudioContext on first user interaction.
 */
function ensureContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function initSound() {
  // Start/stop crackle when sound is toggled
  onStateChange('soundEnabled', (enabled) => {
    if (enabled) {
      startCrackle();
    } else {
      stopCrackle();
    }
  });
}

/**
 * Play a low-frequency thump (needle drop).
 */
export function playNeedleThump() {
  if (!getState().soundEnabled) return;
  const ctx = ensureContext();

  // Oscillator: low sine wave
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(55, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.15);

  // Gain envelope: quick attack, fast decay
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.25);

  // Layered noise burst for texture
  playNoiseHit(ctx, 0.08, 0.15);
}

/**
 * Play a short noise burst (part of the thump).
 */
function playNoiseHit(ctx, volume, duration) {
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  // Low-pass filter to keep it thumpy
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 200;

  const gain = ctx.createGain();
  gain.gain.value = volume;

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  source.start(ctx.currentTime);
}

/**
 * Play a scratch sound (tonearm dragging across platter).
 */
export function playScratch() {
  if (!getState().soundEnabled) return;
  const ctx = ensureContext();

  const bufferSize = ctx.sampleRate * 0.1;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.3;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 800;
  filter.Q.value = 2;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  source.start(ctx.currentTime);
}

/**
 * Start continuous vinyl crackle (looped filtered noise).
 */
function startCrackle() {
  if (crackleNode) return;
  const ctx = ensureContext();

  // Create a long noise buffer
  const duration = 2;
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    // Sparse crackle: mostly silence with occasional pops
    data[i] = Math.random() < 0.02 ? (Math.random() * 2 - 1) * 0.5 : (Math.random() * 2 - 1) * 0.01;
  }

  crackleNode = ctx.createBufferSource();
  crackleNode.buffer = buffer;
  crackleNode.loop = true;

  // High-pass to make it crackly, not rumbly
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 1000;

  crackleGain = ctx.createGain();
  crackleGain.gain.value = 0.04; // Very subtle

  crackleNode.connect(filter);
  filter.connect(crackleGain);
  crackleGain.connect(ctx.destination);

  crackleNode.start();
}

/**
 * Stop vinyl crackle.
 */
function stopCrackle() {
  if (crackleNode) {
    crackleNode.stop();
    crackleNode.disconnect();
    crackleNode = null;
  }
  if (crackleGain) {
    crackleGain.disconnect();
    crackleGain = null;
  }
}
