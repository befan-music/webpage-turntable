/**
 * Platter spin logic and turntable initialization.
 */

const NORMAL_DURATION = 12;  // seconds per revolution
const SLOW_DURATION = 24;    // when tonearm is lifted

export function initTurntable() {
  const platter = document.getElementById('platter');
  if (!platter) return;

  // Platter spin is handled by CSS animation (defined in turntable.css)
  // This module provides programmatic speed control.
}

/** Slow the platter (tonearm lifted) */
export function slowPlatter() {
  document.documentElement.style.setProperty('--platter-spin-duration', `${SLOW_DURATION}s`);
}

/** Resume normal platter speed */
export function resumePlatter() {
  document.documentElement.style.setProperty('--platter-spin-duration', `${NORMAL_DURATION}s`);
}

/** Brief speed dip then resume (needle drop effect) */
export function platterSpeedDip() {
  slowPlatter();
  setTimeout(() => resumePlatter(), 400);
}
