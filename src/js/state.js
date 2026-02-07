/**
 * Simple reactive state manager for the turntable app.
 */

const state = {
  currentSection: null,
  isExpanded: false,
  soundEnabled: false,
  isDragging: false,
  theme: 'dark',
  autoPlaying: false,
};

const listeners = new Map();

export function getState() {
  return { ...state };
}

export function setState(updates) {
  const prev = { ...state };
  Object.assign(state, updates);

  for (const [key, fns] of listeners) {
    if (updates[key] !== undefined && updates[key] !== prev[key]) {
      fns.forEach(fn => fn(updates[key], prev[key]));
    }
  }
}

export function onStateChange(key, fn) {
  if (!listeners.has(key)) {
    listeners.set(key, []);
  }
  listeners.get(key).push(fn);
}
