/**
 * Groove ring data model and hit-detection.
 *
 * SVG coordinate system: platter center at (400, 350), radius 300.
 * Groove radii in SVG units match the <circle> elements in index.html.
 */

import { distance } from './utils.js';

// Platter geometry (SVG viewBox coordinates)
export const PLATTER_CENTER = { x: 400, y: 350 };
export const PLATTER_RADIUS = 300;

// Tolerance for matching needle tip distance to groove radius
const GROOVE_TOLERANCE = 15;

export const GROOVES = [
  { id: 'intro',         label: 'INTRO',         radius: 255 },
  { id: 'cv',            label: 'CV',             radius: 210 },
  { id: 'portfolio',     label: 'PORTFOLIO',      radius: 165 },
];

export const EASTER_EGGS = [
  { id: 'easter-egg-1', radius: 276 },
  { id: 'easter-egg-2', radius: 45  },
];

const ALL_RINGS = [...GROOVES, ...EASTER_EGGS];

/**
 * Find which groove a point (in SVG coordinates) is over.
 * Returns the groove object or null.
 */
export function getGrooveAtPoint(x, y) {
  const dist = distance(x, y, PLATTER_CENTER.x, PLATTER_CENTER.y);

  for (const ring of ALL_RINGS) {
    if (Math.abs(dist - ring.radius) <= GROOVE_TOLERANCE) {
      return ring;
    }
  }
  return null;
}

/**
 * Highlight a groove ring in the SVG.
 */
export function highlightGroove(grooveId) {
  // Clear all highlights
  document.querySelectorAll('.groove-ring--highlighted').forEach(el => {
    el.classList.remove('groove-ring--highlighted');
  });
  document.querySelectorAll('.groove-label--highlighted').forEach(el => {
    el.classList.remove('groove-label--highlighted');
  });

  if (!grooveId) return;

  // Highlight matching groove ring
  document.querySelectorAll(`.groove-ring[data-groove="${grooveId}"]`).forEach(el => {
    el.classList.add('groove-ring--highlighted');
  });

  // Highlight matching label
  document.querySelectorAll(`.groove-label[data-groove="${grooveId}"]`).forEach(el => {
    el.classList.add('groove-label--highlighted');
  });
}

/**
 * Mark a groove as active (needle dropped on it).
 */
export function setActiveGroove(grooveId) {
  // Clear previous active
  document.querySelectorAll('.groove-ring--active').forEach(el => {
    el.classList.remove('groove-ring--active');
  });
  document.querySelectorAll('.groove-label--active').forEach(el => {
    el.classList.remove('groove-label--active');
  });

  if (!grooveId) return;

  document.querySelectorAll(`.groove-ring[data-groove="${grooveId}"]`).forEach(el => {
    el.classList.add('groove-ring--active');
  });
  document.querySelectorAll(`.groove-label[data-groove="${grooveId}"]`).forEach(el => {
    el.classList.add('groove-label--active');
  });
}
