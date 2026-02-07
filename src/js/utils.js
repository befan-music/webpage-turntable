/**
 * Geometry and utility helpers.
 */

/** Distance between two points */
export function distance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/** Convert degrees to radians */
export function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

/** Convert radians to degrees */
export function radToDeg(rad) {
  return (rad * 180) / Math.PI;
}

/** Rotate a point around an origin by angle (degrees) */
export function rotatePoint(px, py, ox, oy, angleDeg) {
  const rad = degToRad(angleDeg);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = px - ox;
  const dy = py - oy;
  return {
    x: ox + dx * cos - dy * sin,
    y: oy + dx * sin + dy * cos,
  };
}

/** Clamp a value between min and max */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/** Throttle a function to run at most once per interval */
export function throttle(fn, interval) {
  let lastTime = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastTime >= interval) {
      lastTime = now;
      fn.apply(this, args);
    }
  };
}
