# Project Status — Interactive Vinyl Turntable Portfolio

**Last updated:** February 2026
**Build status:** All phases 1-12 complete. Slider tab redesign complete. Vinyl photo + portfolio stacked deck complete.
**Bundle size:** 13KB HTML + 14KB CSS + 102KB JS (gzipped: ~45KB total)

---

## Quick Start

```bash
cd webpage
npm install        # Installs gsap + vite
npm run dev        # Starts dev server at localhost:5173
npm run build      # Builds to /dist
npm run preview    # Preview production build
```

---

## Architecture Overview

**Stack:** Vanilla HTML/CSS/JS, Vite 7.x, GSAP 3.x, Web Audio API
**Deployment target:** Vercel (config in `vercel.json`)
**No framework** — single-page SPA feel via module orchestration.

### Directory Structure

```
webpage/
├── index.html              # Turntable SVG + slider drawer (fullscreen layout)
├── package.json            # Dependencies: gsap, vite
├── vite.config.js          # Vite config with @/ alias → src/
├── vercel.json             # Vercel deployment config (headers, SPA rewrite)
├── .gitignore
├── vision.md               # Original design specification
├── status.md               # This file
├── Turntable.png           # Reference image (not used in production)
├── public/
│   ├── favicon.svg         # Vinyl-record-themed SVG favicon
│   ├── audio/              # Reserved for optional audio assets
│   └── Pictures/CV-Pictures/  # Portfolio card images + vinyl center photo
└── src/
    ├── main.js             # Entry point — imports all CSS + initializes all modules
    ├── styles/
    │   ├── reset.css       # Box-sizing reset, .sr-only utility
    │   ├── variables.css   # CSS custom properties (palette, layout, typography, timing)
    │   ├── layout.css      # Fullscreen turntable layout
    │   ├── turntable.css   # Platter spin, groove ring states, groove labels, chassis
    │   ├── tonearm.css     # Tonearm transform-origin, cursor states, focus styles
    │   ├── content.css     # Polygon tab + slide-up drawer + section content + portfolio deck styles
    │   ├── controls.css    # Control buttons (currently unused — controls removed from HTML)
    │   ├── animations.css  # Platter spin keyframes, dust particles, dust puff, reduced-motion
    │   ├── themes.css      # Light theme CSS variable overrides
    │   └── responsive.css  # Breakpoints: groove label sizing
    ├── js/
    │   ├── state.js        # Simple reactive state manager (getState, setState, onStateChange)
    │   ├── utils.js        # Geometry helpers (distance, rotatePoint, degToRad, clamp, throttle)
    │   ├── grooves.js      # Groove data model, hit-detection (getGrooveAtPoint), highlight/active
    │   ├── turntable.js    # Platter speed control (slowPlatter, resumePlatter, platterSpeedDip)
    │   ├── tonearm.js      # Custom drag handler, angle-to-groove mapping, needle drop, keyboard nav
    │   ├── content.js      # Polygon tab label update, drawer toggle, content loading, portfolio deck nav
    │   ├── controls.js     # Control handlers (full mode, sound, theme, auto-play) — dormant
    │   ├── sound.js        # Web Audio API: synthesized needle thump, vinyl crackle, scratch
    │   ├── particles.js    # DOM-based floating dust particles + needle drop puff
    │   └── animations.js   # SVG groove ripple effect via GSAP
    └── content/
        ├── intro.html          # Personal introduction
        ├── cv.html             # CV / resume content
        ├── portfolio.html      # Portfolio — stacked deck of 4 project cards
        ├── blog.html           # Blog post previews
        ├── miscellaneous.html  # Hobbies, playlists, fun facts
        ├── easter-egg-1.html   # Hidden groove: playlist link
        └── easter-egg-2.html   # Hidden groove: strategy hot take
```

---

## Page Layout

Defined in `layout.css`. **Fullscreen turntable** with a polygon-clipped slider tab at the bottom.

```
+─────────────────────────────────────────────+
│                                             │
│         Zone A — Turntable (100vw×100vh)    │
│                                             │
│         SVG turntable (90% height) with     │
│         spinning platter + draggable arm    │
│                                             │
│                                             │
│  ┌───────────╭─────────╮───────────┐        │
│  │           │  CV ▲   │           │ ← polygon tab (clip-path hump)
│  └───────────┴─────────┴───────────┘        │
+─────────────────────────────────────────────+
```

- **`#app`:** `100vw × 100vh`, no flex split
- **Zone A:** `width: 100%; height: 100%` — fullscreen turntable
- **Turntable SVG:** `height: 90%; max-height: 90%` — leaves breathing room at bottom
- **Polygon tab:** `position: fixed` at bottom, full width. Single `<button>` with `clip-path: polygon(...)` creating a smooth raised hump in the center. Shows "DROP THE NEEDLE" idle or groove label (e.g. "CV") in accent green when active.
- **Controls (Zone B/C):** Removed from HTML. `controls.js` still imported but dormant (graceful null checks).

---

## Content Slider System

Implemented in `content.js` + `content.css`.

### Slider tab design

The tab is a single full-width `<button>` element shaped with `clip-path: polygon(...)` to create a smooth raised hump in the center (~35%-65% width). No extra divs or pseudo-elements for the shape. Two variants:

- **Bottom tab** (default): Flat bar with hump rising upward — sits at bottom of turntable view
- **Top tab** (`.slider__tab--top`): Mirrored clip-path with hump hanging downward — sits at top of opened drawer

### Slider states
1. **Idle:** Tab shows "DROP THE NEEDLE" in muted text
2. **Groove selected:** Tab shows groove label (e.g. "CV") in accent green. Content pre-loaded in drawer.
3. **Drawer open:** `.slider--open` — drawer slides up from bottom (100vh), bottom tab hidden, top tab visible with same label

### Slider HTML structure
```html
<div class="slider" id="slider">
  <button class="slider__tab" id="slider-tab">
    <span class="slider__tab-label">DROP THE NEEDLE</span>
  </button>
  <div class="slider__drawer" id="slider-drawer">
    <button class="slider__tab slider__tab--top" id="slider-close">
      <span class="slider__tab-label" id="content-title"></span>
    </button>
    <div class="slider__body"></div>  <!-- scrollable content -->
  </div>
</div>
```

### Drawer slide animation
- Drawer is `position: fixed; bottom: 0; height: 100vh` with `transform: translateY(100%)`
- Opening: `transform: translateY(0)` — slides up from bottom
- Closing: `transform: translateY(100%)` — slides back down
- Transition uses `var(--transition-slow)` for smooth motion

### Content loading flow
1. Needle drops on groove → `loadContent(sectionId)` called from `tonearm.js`
2. `loadContent()` updates both tab labels (bottom + top), adds `.slider--has-content`, pre-loads HTML into drawer body
3. User clicks bottom tab → `openDrawer()` adds `.slider--open`, drawer slides up
4. User clicks top tab → `toggleDrawer()` calls `closeDrawer()`, drawer slides down
5. After HTML injection, `initSectionInteractivity(sectionId)` initializes section-specific JS (e.g. portfolio deck nav)

---

## Vinyl Center Label (Photo)

The center label of the vinyl SVG displays a circular-cropped photo (`Vinyl_Picture.jpg`) using:
- `<clipPath id="label-clip">` with a circle at platter center (400, 350), r=60
- `<image>` element with `preserveAspectRatio="xMidYMid slice"` for cover-fit cropping
- Decorative stroke ring on top for the vinyl label edge

---

## Portfolio Stacked Deck

Implemented in `portfolio.html` + `content.css` + `content.js`.

### Design
Full-size cards (1170×720px) stacked on top of each other like a deck. Only the front card is fully visible; behind-cards peek out with increasing offset, reduced opacity, and dimmed brightness. Green accent borders provide contrast between layers.

### Cards (4 projects)
1. **Music Trading Card Game** — TCG mobile app for Gen-Z music superfans
2. **Digital Concert Memory Album** — Web app for uploading/sharing concert memories
3. **Local Desktop Screenrecorder** — Offline screen recorder, open source on GitHub
4. **Turntable Portfolio** — This website itself

### Card structure
Each `.pf-card` is a 2-column CSS grid (`1fr 1fr`):
- **Left** (`.pf-card__body`): counter circle, keywords line, project name, description, link button
- **Right** (`.pf-card__image`): cover-fit project screenshot

### Stacking via `data-pf-depth` attribute
| Depth | Transform | Opacity | Brightness |
|-------|-----------|---------|------------|
| 0 (front) | none | 1.0 | 1.0 |
| 1 | translate(30px, -42px) scale(0.96) | 0.7 | 0.75 |
| 2 | translate(60px, -84px) scale(0.92) | 0.5 | 0.55 |
| 3 | translate(87px, -123px) scale(0.88) | 0.3 | 0.40 |

### Navigation
- Up/down arrow buttons positioned absolutely on the right rail (`right: -80px`)
- `1 / 4` indicator between arrows
- JS in `initPortfolioNav()` manages `data-pf-depth` and `z-index` per card
- Cards already passed (depth < 0) are hidden with `.pf-card--hidden`

---

## Turntable SVG (Zone A)

The turntable is a single `<svg viewBox="0 0 1000 700">` in `index.html`, section `#turntable-zone`.

### Key coordinates (SVG viewBox space)

| Element | Position | Notes |
|---------|----------|-------|
| Platter center | (400, 350) | Offset left, like reference image |
| Platter radius | 300 | Main vinyl surface |
| Platter well | r=310 | Dark recessed ring behind platter |
| Tonearm pivot | (765, 85) | CSS transform-origin for rotation |
| Needle tip (at 0°) | (765, 558) | Rotates with tonearm group |

### Groove rings

| Groove | ID | SVG Radius | Hit tolerance |
|--------|----|-----------|---------------|
| INTRO | `intro` | 255 | ±15px |
| CV | `cv` | 210 | ±15px |
| PORTFOLIO | `portfolio` | 165 | ±15px |
| BLOG | `blog` | 120 | ±15px |
| MISCELLANEOUS | `miscellaneous` | 84 | ±15px |
| Easter egg 1 | `easter-egg-1` | 276 | ±15px (nearly invisible) |
| Easter egg 2 | `easter-egg-2` | 45 | ±15px (nearly invisible) |

### Tonearm interaction
- Custom mouse/touch drag handler (no GSAP Draggable plugin)
- Horizontal mouse movement converted to rotation (3px = 1°)
- Rotation range: -5° to +55°
- Soft snap to nearest groove within 3°
- Keyboard: Arrow keys navigate, Enter/Space drops needle, Escape parks

### Needle drop sequence
1. Plays needle thump sound (Web Audio)
2. GSAP bounce animation
3. Platter speed dip
4. SVG groove ripple
5. Dust puff particles
6. Sets active groove visual + updates slider tab label
7. Updates ARIA attributes

---

## Sound System (Web Audio API)

All sounds synthesized — no audio files. OFF by default.

| Sound | Trigger | Implementation |
|-------|---------|----------------|
| Needle thump | Needle drops on groove | 55Hz sine oscillator + noise burst |
| Vinyl crackle | Sound toggled ON | Looped noise buffer, high-pass 1kHz |
| Scratch | Tonearm dragged | Bandpass 800Hz noise burst |

---

## State Management

Simple pub/sub in `state.js`:

```js
state = {
  currentSection: null,    // 'intro', 'cv', etc. or null
  isExpanded: false,       // Drawer open?
  soundEnabled: false,     // Sound on/off
  isDragging: false,       // Tonearm being dragged?
  theme: 'dark',           // 'dark' or 'light'
  autoPlaying: false,      // Auto-play running?
};
```

---

## Build Output

```
dist/index.html        — 13.32 KB (gzip: 3.18 KB)
dist/assets/index.css  — 14.35 KB (gzip: 3.69 KB)
dist/assets/index.js   — 102.38 KB (gzip: 37.84 KB)
                         ──────────────────────────
                         Total gzipped: ~45 KB
```

---

## Git Branches

| Branch | Description |
|--------|-------------|
| `main` | Current development (fullscreen turntable + polygon slider) |
| `split-window-with-bottom-content` | Previous layout: turntable top, two panels below |

---

## Remaining Work

- [x] **Slider tab design:** Polygon clip-path hump with text-only label
- [x] **Slide-up drawer:** Bottom-to-top slide animation with mirrored top tab to close
- [x] **Vinyl center photo:** Circular-cropped photo in vinyl center label via SVG clipPath
- [x] **Portfolio stacked deck:** 4 project cards with depth stacking, green borders, arrow navigation
- [ ] **Re-add controls:** Sound, theme, auto-play as floating overlay or inside slider
- [ ] **Deploy to Vercel**
- [ ] **Personalization:** Replace placeholder content in `src/content/*.html`
- [ ] **Real links:** Update LinkedIn URL, email address, blog post links
- [ ] **OG image:** Create `public/og-image.png` for social sharing preview
- [ ] **Browser testing:** Verify in Chrome, Firefox, Safari, Edge, mobile Safari, Chrome Android
