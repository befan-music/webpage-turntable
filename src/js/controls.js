/**
 * Zone C sidebar control handlers.
 */

import { gsap } from 'gsap';
import { getState, setState } from './state.js';
import { GROOVES } from './grooves.js';
import { moveToGroove } from './tonearm.js';

let autoPlayTimeline = null;

export function initControls() {
  // Full Mode
  const btnFull = document.getElementById('btn-fullmode');
  if (btnFull) {
    btnFull.addEventListener('click', openFullMode);
  }

  // Sound Toggle
  const btnSound = document.getElementById('btn-sound');
  if (btnSound) {
    btnSound.addEventListener('click', toggleSound);
  }

  // Theme Switch
  const btnTheme = document.getElementById('btn-theme');
  if (btnTheme) {
    btnTheme.addEventListener('click', toggleTheme);

    // Auto-detect system preference
    if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      applyTheme('light');
    }
  }

  // Auto-Play
  const btnAutoplay = document.getElementById('btn-autoplay');
  if (btnAutoplay) {
    btnAutoplay.addEventListener('click', toggleAutoPlay);
  }
}

/** Open current section in a new tab */
function openFullMode() {
  const state = getState();
  if (!state.currentSection) return;

  const contentBody = document.getElementById('content-body');
  if (!contentBody) return;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${state.currentSection.toUpperCase()} — Turntable Portfolio</title>
      <style>
        body {
          font-family: 'Inter', system-ui, sans-serif;
          background: #0F1215; color: #F5F5F5;
          max-width: 800px; margin: 2rem auto; padding: 0 1.5rem;
          line-height: 1.7;
        }
        a { color: #1DB954; }
        h1, h2, h3 { color: #F5F5F5; }
      </style>
    </head>
    <body>${contentBody.innerHTML}</body>
    </html>
  `;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}

/** Toggle sound on/off */
function toggleSound() {
  const btn = document.getElementById('btn-sound');
  const state = getState();
  const enabled = !state.soundEnabled;
  setState({ soundEnabled: enabled });

  btn.setAttribute('aria-pressed', String(enabled));
  btn.querySelector('.icon-sound-off').style.display = enabled ? 'none' : '';
  btn.querySelector('.icon-sound-on').style.display = enabled ? '' : 'none';
}

/** Toggle dark/light theme */
function toggleTheme() {
  const state = getState();
  const newTheme = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
}

function applyTheme(theme) {
  setState({ theme });
  const btn = document.getElementById('btn-theme');

  document.documentElement.classList.toggle('theme-light', theme === 'light');

  if (btn) {
    btn.setAttribute('aria-pressed', String(theme === 'light'));
    btn.setAttribute('aria-label', theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
    btn.querySelector('.icon-moon').style.display = theme === 'light' ? 'none' : '';
    btn.querySelector('.icon-sun').style.display = theme === 'light' ? '' : 'none';
  }
}

/** Toggle auto-play through all grooves */
function toggleAutoPlay() {
  const btn = document.getElementById('btn-autoplay');
  const state = getState();

  if (state.autoPlaying) {
    // Stop auto-play
    if (autoPlayTimeline) {
      autoPlayTimeline.kill();
      autoPlayTimeline = null;
    }
    setState({ autoPlaying: false });
    btn.setAttribute('aria-pressed', 'false');
    return;
  }

  // Start auto-play
  setState({ autoPlaying: true });
  btn.setAttribute('aria-pressed', 'true');

  autoPlayTimeline = gsap.timeline({
    onComplete: () => {
      setState({ autoPlaying: false });
      btn.setAttribute('aria-pressed', 'false');
      autoPlayTimeline = null;
    },
  });

  GROOVES.forEach((groove, i) => {
    autoPlayTimeline.call(() => moveToGroove(groove.id), null, i * 8);
  });
}
