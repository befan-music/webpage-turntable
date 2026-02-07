/**
 * Slider-based content loading.
 *
 * - Tab at bottom 5% shows groove label when needle drops
 * - Clicking tab opens drawer (95% content view)
 * - Close button returns to turntable
 */

import { GROOVES } from './grooves.js';
import { setState, getState } from './state.js';

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
let slider, sliderTab, sliderLabel, sliderDrawer, sliderClose, contentTitle, contentBody;

export function initContent() {
  slider = document.getElementById('slider');
  sliderTab = document.getElementById('slider-tab');
  sliderLabel = document.getElementById('slider-label');
  sliderDrawer = document.getElementById('slider-drawer');
  sliderClose = document.getElementById('slider-close');
  contentTitle = document.getElementById('content-title');
  contentBody = document.getElementById('content-body');

  if (sliderTab) {
    sliderTab.addEventListener('click', openDrawer);
  }

  if (sliderClose) {
    sliderClose.addEventListener('click', toggleDrawer);
  }
}

/**
 * Load a section's content — updates tab label and pre-loads drawer content.
 */
export function loadContent(sectionId) {
  const html = contentMap[sectionId];
  if (!html) return;

  const groove = GROOVES.find(g => g.id === sectionId);
  const label = groove ? groove.label : sectionId.toUpperCase();

  // Update tab label to show the groove name
  if (sliderLabel) sliderLabel.textContent = label;

  // Mark slider as having content (enables accent color on label)
  if (slider) slider.classList.add('slider--has-content');

  // Pre-load content into drawer
  if (contentTitle) contentTitle.textContent = label;
  if (contentBody) {
    contentBody.classList.remove('slider__body--revealing');
    contentBody.innerHTML = html;
  }
}

/**
 * Open the content drawer.
 */
function openDrawer() {
  if (!slider || !getState().currentSection) return;

  slider.classList.add('slider--open');
  setState({ isExpanded: true });

  // Trigger reveal animation
  if (contentBody) {
    void contentBody.offsetWidth;
    contentBody.classList.add('slider__body--revealing');
  }
}

/**
 * Close the drawer, return to turntable view.
 */
function closeDrawer() {
  if (!slider) return;

  slider.classList.remove('slider--open');
  setState({ isExpanded: false });
}

/**
 * Toggle the drawer — the top tab acts as both open and close.
 */
function toggleDrawer() {
  if (getState().isExpanded) {
    closeDrawer();
  } else {
    openDrawer();
  }
}
