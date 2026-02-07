/**
 * Dust particle system.
 * Lightweight DOM-based particles floating over the turntable platter.
 */

const PARTICLE_COUNT = 15;
const PUFF_COUNT = 8;

let container = null;

export function initParticles() {
  container = document.getElementById('turntable-zone');
  if (!container) return;

  // Check for reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Spawn ambient floating particles
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    createFloatingParticle();
  }
}

/**
 * Create a single floating dust mote.
 */
function createFloatingParticle() {
  const particle = document.createElement('div');
  particle.className = 'dust-particle';

  // Random properties
  const size = 1 + Math.random() * 2;
  const x = 10 + Math.random() * 80; // % from left
  const y = 10 + Math.random() * 80; // % from top
  const duration = 8 + Math.random() * 12; // seconds
  const delay = Math.random() * duration;
  const drift = 20 + Math.random() * 40; // px horizontal drift

  particle.style.cssText = `
    width: ${size}px;
    height: ${size}px;
    left: ${x}%;
    top: ${y}%;
    animation-duration: ${duration}s;
    animation-delay: -${delay}s;
    --drift: ${drift}px;
    opacity: ${0.1 + Math.random() * 0.2};
  `;

  container.appendChild(particle);
}

/**
 * Emit a dust puff at a specific position (for needle drop).
 * @param {number} x - X position in % of container
 * @param {number} y - Y position in % of container
 */
export function emitDustPuff(x, y) {
  if (!container) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  for (let i = 0; i < PUFF_COUNT; i++) {
    const particle = document.createElement('div');
    particle.className = 'dust-puff';

    const size = 1 + Math.random() * 2;
    const angle = Math.random() * Math.PI * 2;
    const dist = 15 + Math.random() * 30;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;

    particle.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${x}%;
      top: ${y}%;
      --dx: ${dx}px;
      --dy: ${dy}px;
    `;

    container.appendChild(particle);

    // Remove after animation
    particle.addEventListener('animationend', () => particle.remove());
  }
}
