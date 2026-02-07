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
    // Initialize section-specific interactive elements
    initSectionInteractivity(sectionId);
  }
}

/**
 * Initialize interactive elements after section HTML is injected.
 */
function initSectionInteractivity(sectionId) {
  if (sectionId === 'portfolio') initPortfolioNav();
}

/**
 * Portfolio stacked-deck navigation.
 * All cards are full-size, layered on top of each other.
 * Arrows cycle which card is on top; behind-cards peek out with offset.
 */
function initPortfolioNav() {
  const cards = [...document.querySelectorAll('.pf-card')];
  const upBtn = document.getElementById('pf-nav-up');
  const downBtn = document.getElementById('pf-nav-down');
  const indicator = document.getElementById('pf-nav-indicator');
  if (!cards.length || !upBtn || !downBtn) return;

  const total = cards.length;
  let active = 0;

  function setActive(index) {
    active = Math.max(0, Math.min(total - 1, index));
    cards.forEach((card, i) => {
      const depth = i - active;
      if (depth < 0) {
        // Cards already passed — hide them
        card.setAttribute('data-pf-depth', '');
        card.classList.add('pf-card--hidden');
        card.style.zIndex = 0;
      } else {
        card.classList.remove('pf-card--hidden');
        card.setAttribute('data-pf-depth', Math.min(depth, 3));
        card.style.zIndex = total - depth;
      }
    });
    if (indicator) indicator.textContent = `${active + 1} / ${total}`;
    upBtn.disabled = active === 0;
    downBtn.disabled = active === total - 1;
  }

  upBtn.addEventListener('click', () => setActive(active - 1));
  downBtn.addEventListener('click', () => setActive(active + 1));

  setActive(0);
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
