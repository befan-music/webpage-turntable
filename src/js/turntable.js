/**
 * Platter spin logic and turntable initialization.
 */

const NORMAL_DURATION = 12;  // seconds per revolution
const SLOW_DURATION = 24;    // when tonearm is lifted

// ── Responsive viewBox ──
// The authored viewBox (1000x700) has ~90 units of empty margin on the left and
// ~210 on the right of the tonearm, plus dead space top and bottom. On a portrait
// phone the SVG is width-bound, so that margin shrinks everything to ~0.49px per
// viewBox unit and renders the groove labels at ~4px — unreadable.
// Cropping to the platter (x 90..710) plus the tonearm pivot base (x..790)
// removes the wasted margin and enlarges the disc. The tonearm pivot (765,85) is
// hardcoded in tonearm.js and drives all groove-angle math, so it must stay in frame.
const DESKTOP_VIEWBOX = '0 0 1000 700';
const MOBILE_VIEWBOX = '88 20 706 660';
const MOBILE_QUERY = '(max-width: 768px)';

function applyViewBox(svg, mq) {
  svg.setAttribute('viewBox', mq.matches ? MOBILE_VIEWBOX : DESKTOP_VIEWBOX);
}

export function initTurntable() {
  const platter = document.getElementById('platter');
  if (!platter) return;

  // Platter spin is handled by CSS animation (defined in turntable.css)
  // This module provides programmatic speed control.

  const svg = document.querySelector('.turntable-svg');
  if (svg && window.matchMedia) {
    const mq = window.matchMedia(MOBILE_QUERY);
    applyViewBox(svg, mq);
    const onChange = () => applyViewBox(svg, mq);
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange); // older Safari
  }
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
