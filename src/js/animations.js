/**
 * GSAP animation timelines and SVG ripple effects.
 */

import { gsap } from 'gsap';
import { PLATTER_CENTER } from './grooves.js';

/**
 * Create a ripple effect on a groove ring.
 * Adds an SVG circle that expands and fades out.
 */
export function createGrooveRipple(radius) {
  const svg = document.querySelector('.turntable-svg');
  if (!svg) return;

  const ns = 'http://www.w3.org/2000/svg';
  const circle = document.createElementNS(ns, 'circle');
  circle.setAttribute('cx', PLATTER_CENTER.x);
  circle.setAttribute('cy', PLATTER_CENTER.y);
  circle.setAttribute('r', radius);
  circle.setAttribute('fill', 'none');
  circle.setAttribute('stroke', '#1DB954');
  circle.setAttribute('stroke-width', '2');
  circle.setAttribute('opacity', '0.6');

  // Insert before tonearm so it appears under it
  const tonearm = document.getElementById('tonearm');
  svg.insertBefore(circle, tonearm);

  gsap.to(circle, {
    attr: { r: radius + 25 },
    opacity: 0,
    strokeWidth: 0,
    duration: 0.8,
    ease: 'power2.out',
    onComplete: () => circle.remove(),
  });
}
