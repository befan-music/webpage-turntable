/**
 * Zone B content loading, expand/collapse, and content reveal.
 */

import { GROOVES } from './grooves.js';
import { setState, getState, onStateChange } from './state.js';

// Import content partials as raw strings (Vite ?raw)
import introHtml from '../content/intro.html?raw';
import cvHtml from '../content/cv.html?raw';
import portfolioHtml from '../content/portfolio.html?raw';
import blogHtml from '../content/blog.html?raw';
import miscHtml from '../content/miscellaneous.html?raw';
import egg1Html from '../content/easter-egg-1.html?raw';
import egg2Html from '../content/easter-egg-2.html?raw';

const contentMap = {
  'intro': introHtml,
  'cv': cvHtml,
  'portfolio': portfolioHtml,
  'blog': blogHtml,
  'miscellaneous': miscHtml,
  'easter-egg-1': egg1Html,
  'easter-egg-2': egg2Html,
};

// DOM references
let contentIdle, contentActive, contentTitle, contentBody, btnExpand;

export function initContent() {
  contentIdle = document.getElementById('content-idle');
  contentActive = document.getElementById('content-active');
  contentTitle = document.getElementById('content-title');
  contentBody = document.getElementById('content-body');
  btnExpand = document.getElementById('btn-expand');

  if (btnExpand) {
    btnExpand.addEventListener('click', toggleExpand);
  }
}

/**
 * Load a section's content into Zone B.
 */
export function loadContent(sectionId) {
  const html = contentMap[sectionId];
  if (!html) return;

  // Find label
  const groove = GROOVES.find(g => g.id === sectionId);
  const label = groove ? groove.label : sectionId.toUpperCase();

  // Zone B is always visible in the right panel — no class toggle needed

  // Hide idle, show active
  if (contentIdle) contentIdle.hidden = true;
  if (contentActive) contentActive.hidden = false;

  // Update title
  if (contentTitle) contentTitle.textContent = label;

  // Update body with radial reveal
  if (contentBody) {
    contentBody.classList.remove('content-zone__body--revealing');
    contentBody.innerHTML = html;

    // Trigger reflow to restart animation
    void contentBody.offsetWidth;
    contentBody.classList.add('content-zone__body--revealing');
  }
}

/**
 * Toggle expanded/collapsed state of Zone B.
 */
function toggleExpand() {
  const zoneB = document.querySelector('.zone-b');
  const zoneA = document.querySelector('.zone-a');
  if (!zoneB || !zoneA) return;

  const isExpanded = !getState().isExpanded;
  setState({ isExpanded });

  zoneB.classList.toggle('zone-b--expanded', isExpanded);
  zoneA.classList.toggle('zone-a--dimmed', isExpanded);

  // Update ARIA
  if (btnExpand) {
    btnExpand.setAttribute('aria-label', isExpanded ? 'Collapse content area' : 'Expand content area');
  }

  // Focus management
  if (isExpanded && contentBody) {
    contentBody.focus();
  }
}
