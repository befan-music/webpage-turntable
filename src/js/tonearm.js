/**
 * Tonearm interaction — custom drag handler.
 *
 * The tonearm arm rotates around a fixed pivot (765, 85).
 * The pivot base is a separate SVG group that does NOT rotate.
 * Only the arm + headshell + needle rotates.
 *
 * Positive rotation swings the needle LEFT toward the platter grooves.
 * The user drags on the arm/needle and horizontal mouse movement
 * is converted to rotation, so it feels like moving the needle left/right.
 */

import { gsap } from 'gsap';
import { rotatePoint, clamp } from './utils.js';
import { PLATTER_CENTER, getGrooveAtPoint, highlightGroove, setActiveGroove, GROOVES } from './grooves.js';
import { platterSpeedDip, slowPlatter, resumePlatter } from './turntable.js';
import { loadContent } from './content.js';
import { setState, getState } from './state.js';
import { createGrooveRipple } from './animations.js';
import { emitDustPuff } from './particles.js';
import { playNeedleThump } from './sound.js';

// ── Tonearm geometry (SVG viewBox coordinates) ──
const PIVOT = { x: 765, y: 85 };
const NEEDLE_TIP_LOCAL = { x: 765, y: 558 };  // tip position at 0° rotation
const ARM_LENGTH = NEEDLE_TIP_LOCAL.y - PIVOT.y; // 473px

// ── Rotation limits ──
const PARKED_ANGLE = 0;
const MIN_ANGLE = -5;
const MAX_ANGLE = 55;

// ── Sensitivity: how many pixels of horizontal mouse movement = 1° rotation ──
const PIXELS_PER_DEGREE = 3;

// ── Snap threshold ──
const SNAP_THRESHOLD = 3; // degrees

// ── Angle-to-groove mapping ──
const grooveAngles = [];

function precomputeGrooveAngles() {
  for (const groove of GROOVES) {
    let bestAngle = null;
    let bestDist = Infinity;

    for (let angle = MIN_ANGLE; angle <= MAX_ANGLE; angle += 0.5) {
      const tip = getNeedleTipAt(angle);
      const dx = tip.x - PLATTER_CENTER.x;
      const dy = tip.y - PLATTER_CENTER.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const err = Math.abs(dist - groove.radius);

      if (err < bestDist) {
        bestDist = err;
        bestAngle = angle;
      }
    }

    grooveAngles.push({ ...groove, angle: bestAngle });
  }
}

function getNeedleTipAt(angleDeg) {
  return rotatePoint(NEEDLE_TIP_LOCAL.x, NEEDLE_TIP_LOCAL.y, PIVOT.x, PIVOT.y, angleDeg);
}

function snapToNearestGroove(angle) {
  for (const g of grooveAngles) {
    if (Math.abs(angle - g.angle) < SNAP_THRESHOLD) {
      return g.angle;
    }
  }
  return angle;
}

// ── State ──
let currentAngle = PARKED_ANGLE;
let currentHighlight = null;
let isDropped = false;
let isDragging = false;
let dragStartX = 0;
let dragStartAngle = 0;

export function initTonearm() {
  const tonearmEl = document.getElementById('tonearm');
  if (!tonearmEl) return;

  precomputeGrooveAngles();

  // Set initial parked position
  setArmRotation(tonearmEl, PARKED_ANGLE);

  // ── Mouse drag ──
  tonearmEl.addEventListener('mousedown', onPointerDown);
  document.addEventListener('mousemove', onPointerMove);
  document.addEventListener('mouseup', onPointerUp);

  // ── Touch drag ──
  tonearmEl.addEventListener('touchstart', onPointerDown, { passive: false });
  document.addEventListener('touchmove', onPointerMove, { passive: false });
  document.addEventListener('touchend', onPointerUp);

  // ── Keyboard support ──
  tonearmEl.addEventListener('keydown', (e) => {
    handleKeyboard(e, tonearmEl);
  });
}

/**
 * Apply rotation to the arm element via CSS transform.
 */
function setArmRotation(el, angleDeg) {
  currentAngle = angleDeg;
  el.style.transform = `rotate(${angleDeg}deg)`;
  el.style.transformOrigin = `${PIVOT.x}px ${PIVOT.y}px`;
}

function getClientX(e) {
  if (e.touches && e.touches.length > 0) return e.touches[0].clientX;
  return e.clientX;
}

function onPointerDown(e) {
  e.preventDefault();
  isDragging = true;
  dragStartX = getClientX(e);
  dragStartAngle = currentAngle;

  const tonearmEl = document.getElementById('tonearm');
  if (tonearmEl) tonearmEl.classList.add('is-dragging');
  setState({ isDragging: true });

  if (isDropped) {
    isDropped = false;
    slowPlatter();
  }
}

function onPointerMove(e) {
  if (!isDragging) return;
  e.preventDefault();

  const tonearmEl = document.getElementById('tonearm');
  if (!tonearmEl) return;

  const clientX = getClientX(e);
  const deltaX = clientX - dragStartX;

  // Moving mouse LEFT (negative deltaX) → positive rotation (toward platter)
  // Moving mouse RIGHT (positive deltaX) → negative rotation (away from platter)
  let newAngle = dragStartAngle - (deltaX / PIXELS_PER_DEGREE);
  newAngle = clamp(newAngle, MIN_ANGLE, MAX_ANGLE);
  newAngle = snapToNearestGroove(newAngle);

  setArmRotation(tonearmEl, newAngle);

  // Groove highlight
  const tip = getNeedleTipAt(currentAngle);
  const groove = getGrooveAtPoint(tip.x, tip.y);

  if (groove) {
    if (currentHighlight !== groove.id) {
      currentHighlight = groove.id;
      highlightGroove(groove.id);
      tonearmEl.classList.add('is-over-groove');
    }
  } else {
    if (currentHighlight) {
      currentHighlight = null;
      highlightGroove(null);
      tonearmEl.classList.remove('is-over-groove');
    }
  }
}

function onPointerUp() {
  if (!isDragging) return;
  isDragging = false;

  const tonearmEl = document.getElementById('tonearm');
  if (!tonearmEl) return;

  tonearmEl.classList.remove('is-dragging');
  setState({ isDragging: false });

  const tip = getNeedleTipAt(currentAngle);
  const groove = getGrooveAtPoint(tip.x, tip.y);

  if (groove) {
    dropNeedle(groove, tonearmEl);
  } else {
    returnToParked(tonearmEl);
  }

  highlightGroove(null);
  tonearmEl.classList.remove('is-over-groove');
  currentHighlight = null;
}

/**
 * Drop the needle on a groove — trigger animations and load content.
 */
function dropNeedle(groove, tonearmEl) {
  isDropped = true;

  // Needle drop bounce animation
  const baseAngle = currentAngle;
  gsap.timeline()
    .to({}, {
      duration: 0.08,
      onUpdate() { setArmRotation(tonearmEl, baseAngle + this.progress() * 1); },
    })
    .to({}, {
      duration: 0.12,
      ease: 'bounce.out',
      onUpdate() { setArmRotation(tonearmEl, baseAngle + 1 - this.progress() * 1.3); },
    })
    .to({}, {
      duration: 0.1,
      ease: 'power1.out',
      onUpdate() { setArmRotation(tonearmEl, baseAngle - 0.3 + this.progress() * 0.3); },
    });

  // Sound effect
  playNeedleThump();

  // Platter speed dip
  platterSpeedDip();

  // Groove ripple effect
  if (groove.radius) {
    createGrooveRipple(groove.radius);
  }

  // Dust puff at needle position
  const tip = getNeedleTipAt(currentAngle);
  const zone = document.getElementById('turntable-zone');
  if (zone) {
    const rect = zone.getBoundingClientRect();
    const svg = document.querySelector('.turntable-svg');
    if (svg) {
      const svgRect = svg.getBoundingClientRect();
      const xPercent = ((tip.x / 1000) * svgRect.width + svgRect.left - rect.left) / rect.width * 100;
      const yPercent = ((tip.y / 700) * svgRect.height + svgRect.top - rect.top) / rect.height * 100;
      emitDustPuff(xPercent, yPercent);
    }
  }

  // Set active groove visual
  setActiveGroove(groove.id);

  // Update state
  setState({ currentSection: groove.id });

  // Load content
  loadContent(groove.id);

  // Update ARIA
  tonearmEl.setAttribute('aria-valuetext', `Playing: ${groove.label || groove.id}`);
  const grooveIndex = GROOVES.findIndex(g => g.id === groove.id);
  if (grooveIndex >= 0) {
    tonearmEl.setAttribute('aria-valuenow', grooveIndex + 1);
  }
}

/**
 * Animate tonearm back to parked position.
 */
function returnToParked(tonearmEl) {
  isDropped = false;
  resumePlatter();
  setActiveGroove(null);

  const startAngle = currentAngle;
  gsap.to({ progress: 0 }, {
    progress: 1,
    duration: 0.8,
    ease: 'power2.inOut',
    onUpdate() {
      const angle = startAngle + (PARKED_ANGLE - startAngle) * this.targets()[0].progress;
      setArmRotation(tonearmEl, angle);
    },
  });

  tonearmEl.setAttribute('aria-valuetext', 'Parked');
  tonearmEl.setAttribute('aria-valuenow', 0);
}

/**
 * Keyboard navigation for tonearm.
 */
let keyboardGrooveIndex = -1;

function handleKeyboard(e, tonearmEl) {
  switch (e.key) {
    case 'ArrowLeft':
    case 'ArrowUp':
      e.preventDefault();
      keyboardGrooveIndex = Math.min(keyboardGrooveIndex + 1, grooveAngles.length - 1);
      moveToGrooveByIndex(keyboardGrooveIndex, tonearmEl);
      break;

    case 'ArrowRight':
    case 'ArrowDown':
      e.preventDefault();
      keyboardGrooveIndex = Math.max(keyboardGrooveIndex - 1, -1);
      if (keyboardGrooveIndex < 0) {
        returnToParked(tonearmEl);
      } else {
        moveToGrooveByIndex(keyboardGrooveIndex, tonearmEl);
      }
      break;

    case 'Enter':
    case ' ':
      e.preventDefault();
      if (keyboardGrooveIndex >= 0 && keyboardGrooveIndex < grooveAngles.length) {
        const groove = grooveAngles[keyboardGrooveIndex];
        dropNeedle(groove, tonearmEl);
      }
      break;

    case 'Escape':
      e.preventDefault();
      keyboardGrooveIndex = -1;
      returnToParked(tonearmEl);
      break;
  }
}

function moveToGrooveByIndex(index, tonearmEl) {
  const groove = grooveAngles[index];
  if (!groove) return;

  const startAngle = currentAngle;
  gsap.to({ progress: 0 }, {
    progress: 1,
    duration: 0.5,
    ease: 'power2.out',
    onUpdate() {
      const angle = startAngle + (groove.angle - startAngle) * this.targets()[0].progress;
      setArmRotation(tonearmEl, angle);
    },
  });

  highlightGroove(groove.id);
  tonearmEl.setAttribute('aria-valuetext', `Over: ${groove.label}`);
}

/**
 * Programmatically move tonearm to a specific groove (used by auto-play).
 */
export function moveToGroove(grooveId) {
  const tonearmEl = document.getElementById('tonearm');
  const groove = grooveAngles.find(g => g.id === grooveId);
  if (!groove || !tonearmEl) return;

  const startAngle = currentAngle;
  gsap.to({ progress: 0 }, {
    progress: 1,
    duration: 0.8,
    ease: 'power2.inOut',
    onUpdate() {
      const angle = startAngle + (groove.angle - startAngle) * this.targets()[0].progress;
      setArmRotation(tonearmEl, angle);
    },
    onComplete: () => dropNeedle(groove, tonearmEl),
  });
}
