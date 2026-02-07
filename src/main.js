// ── Styles ──
import './styles/reset.css';
import './styles/variables.css';
import './styles/layout.css';
import './styles/turntable.css';
import './styles/tonearm.css';
import './styles/content.css';
import './styles/controls.css';
import './styles/animations.css';
import './styles/themes.css';
import './styles/responsive.css';

// ── Modules ──
import { initTurntable } from './js/turntable.js';
import { initTonearm } from './js/tonearm.js';
import { initContent } from './js/content.js';
import { initControls } from './js/controls.js';
import { initParticles } from './js/particles.js';
import { initSound } from './js/sound.js';

// ── Initialize ──
document.addEventListener('DOMContentLoaded', () => {
  initTurntable();
  initTonearm();
  initContent();
  initControls();
  initParticles();
  initSound();
});
