/**
 * Background photo mosaic (cosmos.so-style masonry) on an endless canvas that
 * pans like a map, plus the frosted-glass panel that blurs the photos sitting
 * underneath the turntable chassis.
 *
 * Each tile has a ↗ link to its source; clicking the tile itself blurs the
 * photo and reveals its caption. To add a picture, drop a resized .webp into
 * public/Pictures/Background/ and add an entry below.
 */

const IMAGE_DIR = '/Pictures/Background/';

// Intrinsic sizes let us lay out columns before the images have loaded.
const IMAGES = [
  { src: 'sf.webp', w: 900, h: 1125, title: 'San Francisco', href: 'https://www.cosmos.so/e/576604330',
    caption: 'Where I am currently based.' },
  { src: 'deutschland.webp', w: 768, h: 1024, title: 'Deutschland', href: 'https://www.cosmos.so/e/1720516372',
    caption: 'German is my mother tongue (Thanks dad).' },
  { src: 'spotify.webp', w: 900, h: 900, title: 'Spotify', href: 'https://www.cosmos.so/e/2011440703',
    caption: 'Favorite company I would like to work at.' },
  { src: 'finland.webp', w: 582, h: 909, title: 'Finland', href: 'https://www.cosmos.so/e/1980826710',
    caption: 'My 2nd mother tongue (Thanks mom).' },
  { src: 'fencing.webp', w: 567, h: 850, title: 'Fencing', href: 'https://www.cosmos.so/e/601540192',
    caption: 'My favorite sport. Strategy, competitiveness, athleticism all in one.' },
  { src: 'eu.webp', w: 900, h: 900, title: 'EU', href: 'https://www.cosmos.so/e/1362515853',
    caption: 'My favorite flag and political home.' },
  { src: 'france.webp', w: 900, h: 1125, title: 'France', href: 'https://www.cosmos.so/e/655674763',
    caption: '4th language.' },
  { src: 'brazil.webp', w: 900, h: 1122, title: 'Brazil', href: 'https://www.cosmos.so/e/1255848050',
    caption: 'My fifth language (B1).' },
];

const TARGET_COLUMN_WIDTH = 280; // px — big enough that few photos repeat on one screen
const DRAG_THRESHOLD = 5;        // px of movement before a press becomes a drag
const FRICTION = 0.92;           // per-frame velocity decay for the fling

let mosaic = null;
let layer = null;
let glass = null;
let openTile = null;
let syncQueued = false;

// Canvas geometry (set by buildMosaic). The layout is one block of columns
// that tiles seamlessly in both directions, so the canvas never runs out.
let colWidth = 0;
let blockW = 0;
let blockH = 0;

// Pan state
let panX = 0;
let panY = 0;
let drag = null;
let velocity = { x: 0, y: 0 };
let flingFrame = 0;
let suppressClick = false;

export function initBackground() {
  mosaic = document.getElementById('bg-mosaic');
  glass = document.getElementById('turntable-glass');

  if (mosaic) {
    buildMosaic();
    initPanning();
    document.addEventListener('click', onDocumentClick);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setOpenTile(null);
    });
  }
  if (glass) syncGlass();

  window.addEventListener('resize', onResize);

  const svg = document.querySelector('.turntable-svg');
  if (svg && 'ResizeObserver' in window) {
    new ResizeObserver(queueGlassSync).observe(svg);
  }
}

function onResize() {
  if (mosaic) {
    if (getColumnWidth() !== colWidth) buildMosaic();
    else renderCopies(); // no-op unless the viewport needs more/fewer blocks
  }
  queueGlassSync();
}

function getGap() {
  return parseFloat(getComputedStyle(mosaic).getPropertyValue('--mosaic-gap')) || 32;
}

/** Fixed tile width, shrunk on narrow screens so at least two columns show. */
function getColumnWidth() {
  const gap = getGap();
  return Math.floor(Math.min(TARGET_COLUMN_WIDTH, (mosaic.clientWidth - gap * 3) / 2));
}

/** Smallest column-offset step coprime with the image count, so every column starts on a different photo. */
function getColumnStep(n) {
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  for (let s = 3; s < n; s++) if (gcd(s, n) === 1) return s;
  return 1;
}

/**
 * Lay out one block: one column per image, each column cycling through every
 * image once from a different start. Every column then has the same height
 * (the sum of all tiles), so blocks tile edge to edge with no seams.
 */
function buildMosaic() {
  openTile = null;
  const gap = getGap();
  colWidth = getColumnWidth();
  const pitch = colWidth + gap;
  const n = IMAGES.length;
  const step = getColumnStep(n);

  const heights = IMAGES.map((img) => Math.round(colWidth * (img.h / img.w)));
  blockW = n * pitch;
  blockH = heights.reduce((sum, h) => sum + h + gap, 0);

  const block = document.createElement('div');
  block.className = 'bg-mosaic__block';
  block.style.width = `${blockW}px`;
  block.style.height = `${blockH}px`;

  const seen = new Set();
  for (let c = 0; c < n; c++) {
    let top = 0;
    for (let k = 0; k < n; k++) {
      const index = (c * step + k) % n;
      const tile = createTile(IMAGES[index], seen.has(index));
      seen.add(index);
      Object.assign(tile.style, {
        left: `${c * pitch}px`,
        top: `${top}px`,
        width: `${colWidth}px`,
        height: `${heights[index]}px`,
      });
      block.appendChild(tile);
      top += heights[index] + gap;
    }
  }

  layer = document.createElement('div');
  layer.className = 'bg-mosaic__layer';
  layer.appendChild(block);
  mosaic.replaceChildren(layer);

  // Start with the first column one gap in from the top-left corner
  if (!drag && panX === 0 && panY === 0) {
    panX = gap;
    panY = gap;
  }

  renderCopies();
}

/** Clone the block into a grid just big enough to cover the viewport while panning. */
function renderCopies() {
  const template = layer.firstElementChild;
  const nx = Math.ceil(mosaic.clientWidth / blockW) + 1;
  const ny = Math.ceil(mosaic.clientHeight / blockH) + 1;
  if (layer.childElementCount === nx * ny && layer.dataset.nx === String(nx)) return;
  layer.dataset.nx = nx;

  setOpenTile(null); // clones must not copy an open caption
  const blocks = [template];
  for (let i = 1; i < nx * ny; i++) {
    const copy = template.cloneNode(true);
    // Clones are pure repeats — keep them out of the tab order and a11y tree
    copy.setAttribute('aria-hidden', 'true');
    copy.querySelectorAll('[tabindex]').forEach((el) => el.setAttribute('tabindex', '-1'));
    copy.querySelectorAll('img').forEach(watchLoad);
    blocks.push(copy);
  }

  blocks.forEach((block, i) => {
    block.style.left = `${(i % nx) * blockW}px`;
    block.style.top = `${Math.floor(i / nx) * blockH}px`;
  });

  layer.replaceChildren(...blocks);
  applyPan();
}

/** Positive modulo, so panning left/up wraps as cleanly as right/down. */
function wrap(value, size) {
  return ((value % size) + size) % size;
}

function applyPan() {
  const x = wrap(panX, blockW) - blockW;
  const y = wrap(panY, blockH) - blockH;
  layer.style.transform = `translate3d(${x}px, ${y}px, 0)`;
}

function panBy(dx, dy) {
  panX += dx;
  panY += dy;
  applyPan();
}

/**
 * @param {object} image - entry from IMAGES
 * @param {boolean} isRepeat - repeats are hidden from keyboard/screen readers
 *   so tabbing visits each picture once
 */
function createTile({ src, title, caption, href }, isRepeat) {
  const tile = document.createElement('figure');
  tile.className = 'bg-mosaic__tile';
  if (isRepeat) tile.setAttribute('aria-hidden', 'true');
  const tabIndex = isRepeat ? '-1' : '0';

  const img = document.createElement('img');
  img.src = IMAGE_DIR + src;
  img.alt = title;
  img.decoding = 'async';
  img.draggable = false;
  watchLoad(img);

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'bg-mosaic__toggle';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', `Show note about ${title}`);
  toggle.setAttribute('tabindex', tabIndex);

  const text = document.createElement('figcaption');
  text.className = 'bg-mosaic__caption';
  text.innerHTML = '<span class="bg-mosaic__title"></span><span class="bg-mosaic__text"></span>';
  text.firstChild.textContent = title;
  text.lastChild.textContent = caption;

  const source = document.createElement('a');
  source.className = 'bg-mosaic__source';
  source.href = href;
  source.target = '_blank';
  source.rel = 'noopener noreferrer';
  source.draggable = false;
  source.setAttribute('aria-label', `Open source of ${title} (new tab)`);
  source.setAttribute('tabindex', tabIndex);
  source.innerHTML =
    '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 11 11 5M6 5h5v5" /></svg>';

  tile.append(img, toggle, text, source);
  return tile;
}

function watchLoad(img) {
  if (img.complete && img.naturalWidth) {
    img.classList.add('is-loaded');
  } else {
    img.addEventListener('load', () => img.classList.add('is-loaded'), { once: true });
  }
}

// ── Map-style panning ──

function initPanning() {
  mosaic.addEventListener('pointerdown', onPointerDown);
  mosaic.addEventListener('pointermove', onPointerMove);
  mosaic.addEventListener('pointerup', onPointerUp);
  mosaic.addEventListener('pointercancel', onPointerUp);

  // Trackpad two-finger swipe / mouse wheel pans too
  mosaic.addEventListener('wheel', (e) => {
    e.preventDefault();
    stopFling();
    const unit = e.deltaMode === 1 ? 16 : 1;
    panBy(-e.deltaX * unit, -e.deltaY * unit);
  }, { passive: false });

  // A press that turned into a drag must not also open a caption or link.
  // Window capture runs before the document-level caption handler.
  window.addEventListener('click', (e) => {
    if (!suppressClick) return;
    suppressClick = false;
    e.preventDefault();
    e.stopPropagation();
  }, true);
}

function onPointerDown(e) {
  if (e.button !== 0) return;
  stopFling();
  drag = { id: e.pointerId, startX: e.clientX, startY: e.clientY, lastX: e.clientX, lastY: e.clientY,
    lastT: e.timeStamp, moved: false };
  velocity = { x: 0, y: 0 };
}

function onPointerMove(e) {
  if (!drag || e.pointerId !== drag.id) return;

  if (!drag.moved) {
    if (Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) < DRAG_THRESHOLD) return;
    drag.moved = true;
    // Capture only once it's a real drag — capturing on press would retarget
    // the click away from the tile and break taps.
    mosaic.setPointerCapture(e.pointerId);
    mosaic.classList.add('is-dragging');
  }

  const dx = e.clientX - drag.lastX;
  const dy = e.clientY - drag.lastY;
  const dt = Math.max(1, e.timeStamp - drag.lastT);
  velocity = { x: (dx / dt) * 16, y: (dy / dt) * 16 }; // px per ~frame
  drag.lastX = e.clientX;
  drag.lastY = e.clientY;
  drag.lastT = e.timeStamp;
  panBy(dx, dy);
}

function onPointerUp(e) {
  if (!drag || e.pointerId !== drag.id) return;
  const { moved, lastT } = drag;
  drag = null;
  mosaic.classList.remove('is-dragging');
  if (!moved) return;

  suppressClick = e.type === 'pointerup';
  // Clear the flag if no click follows (e.g. released outside the window)
  setTimeout(() => { suppressClick = false; }, 0);

  // Fling only if the pointer was still moving when released
  if (e.timeStamp - lastT < 80 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    fling();
  }
}

function fling() {
  velocity.x *= FRICTION;
  velocity.y *= FRICTION;
  if (Math.hypot(velocity.x, velocity.y) < 0.3) return stopFling();
  panBy(velocity.x, velocity.y);
  flingFrame = requestAnimationFrame(fling);
}

function stopFling() {
  cancelAnimationFrame(flingFrame);
  flingFrame = 0;
}

// ── Captions ──

/** Tile click toggles its caption; a click anywhere else closes it. */
function onDocumentClick(e) {
  if (e.target.closest('.bg-mosaic__source')) return;
  const toggle = e.target.closest('.bg-mosaic__toggle');
  const tile = toggle?.parentElement ?? null;
  setOpenTile(tile && tile !== openTile ? tile : null);
}

function setOpenTile(tile) {
  if (openTile) {
    openTile.classList.remove('is-open');
    openTile.querySelector('.bg-mosaic__toggle').setAttribute('aria-expanded', 'false');
  }
  openTile = tile;
  if (tile) {
    tile.classList.add('is-open');
    tile.querySelector('.bg-mosaic__toggle').setAttribute('aria-expanded', 'true');
  }
}

// ── Turntable glass ──

function queueGlassSync() {
  if (!glass || syncQueued) return;
  syncQueued = true;
  requestAnimationFrame(() => {
    syncQueued = false;
    syncGlass();
  });
}

/**
 * Pin the glass panel to the rendered chassis rect. The SVG letterboxes its
 * viewBox (and crops it on mobile), so the chassis bounds can only be known
 * after layout — clip them to the SVG box in case the viewBox crops them.
 */
function syncGlass() {
  const svg = document.querySelector('.turntable-svg');
  const chassis = svg?.querySelector('.chassis');
  const zone = glass.offsetParent;
  if (!chassis || !zone) return;

  const svgRect = svg.getBoundingClientRect();
  const c = chassis.getBoundingClientRect();
  const z = zone.getBoundingClientRect();

  const left = Math.max(c.left, svgRect.left);
  const top = Math.max(c.top, svgRect.top);
  const right = Math.min(c.right, svgRect.right);
  const bottom = Math.min(c.bottom, svgRect.bottom);
  const cropped = left > c.left || top > c.top || right < c.right || bottom < c.bottom;

  // Chassis has rx=8 on a 998-unit-wide rect
  const radius = cropped ? 0 : 8 * (c.width / 998);

  const box = {
    left: `${left - z.left}px`,
    top: `${top - z.top}px`,
    width: `${Math.max(0, right - left)}px`,
    height: `${Math.max(0, bottom - top)}px`,
  };
  Object.assign(glass.style, box, { borderRadius: `${radius}px` });

  // HTML widgets that sit on the chassis (e.g. now-playing) share the same box
  const overlay = document.getElementById('turntable-overlay');
  if (overlay) Object.assign(overlay.style, box);
}
