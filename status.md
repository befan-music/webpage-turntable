# Project Status — Interactive Vinyl Turntable Portfolio

**Last updated:** February 2026
**Build status:** All phases 1-12 complete. Ready for deployment.
**Bundle size:** 17KB HTML + 12KB CSS + 92KB JS (gzipped: ~42KB total)

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

**Stack:** Vanilla HTML/CSS/JS, Vite 7.x, GSAP 3.x (Draggable), Web Audio API
**Deployment target:** Vercel (config in `vercel.json`)
**No framework** — single-page SPA feel via module orchestration.

### Directory Structure

```
webpage/
├── index.html              # Full page markup (3 zones + turntable SVG + controls)
├── package.json            # Dependencies: gsap, vite
├── vite.config.js          # Vite config with @/ alias → src/
├── vercel.json             # Vercel deployment config (headers, SPA rewrite)
├── .gitignore
├── vision.md               # Original design specification
├── status.md               # This file
├── Turntable.png           # Reference image (not used in production)
├── public/
│   ├── favicon.svg         # Vinyl-record-themed SVG favicon
│   └── audio/              # Reserved for optional audio assets
└── src/
    ├── main.js             # Entry point — imports all CSS + initializes all modules
    ├── styles/
    │   ├── reset.css       # Box-sizing reset, .sr-only utility
    │   ├── variables.css   # CSS custom properties (palette, layout, typography, timing)
    │   ├── layout.css      # Left/right split: Zone A (55% left), Zone B (45% right), Zone C (top-right overlay)
    │   ├── turntable.css   # Platter spin, groove ring states, groove labels, chassis
    │   ├── tonearm.css     # Tonearm transform-origin, cursor states, focus styles
    │   ├── content.css     # Zone B idle/active, expand/collapse, radial reveal, section-specific styles
    │   ├── controls.css    # Control buttons, hover glow, pressed states
    │   ├── animations.css  # Platter spin keyframes, dust particles, dust puff, reduced-motion
    │   ├── themes.css      # Light theme CSS variable overrides
    │   └── responsive.css  # Breakpoints: tablet ≤1024px, mobile ≤768px, small ≤480px
    ├── js/
    │   ├── state.js        # Simple reactive state manager (getState, setState, onStateChange)
    │   ├── utils.js        # Geometry helpers (distance, rotatePoint, degToRad, clamp, throttle)
    │   ├── grooves.js      # Groove data model, hit-detection (getGrooveAtPoint), highlight/active
    │   ├── turntable.js    # Platter speed control (slowPlatter, resumePlatter, platterSpeedDip)
    │   ├── tonearm.js      # GSAP Draggable rotation, angle-to-groove mapping, needle drop, keyboard nav
    │   ├── content.js      # Content loading (Vite ?raw imports), radial reveal, expand/collapse
    │   ├── controls.js     # Control handlers: full mode, sound, theme, auto-play
    │   ├── sound.js        # Web Audio API: synthesized needle thump, vinyl crackle, scratch
    │   ├── particles.js    # DOM-based floating dust particles + needle drop puff
    │   └── animations.js   # SVG groove ripple effect via GSAP
    └── content/
        ├── intro.html          # Personal introduction
        ├── cv.html             # CV / resume content
        ├── portfolio.html      # Portfolio project cards
        ├── blog.html           # Blog post previews
        ├── miscellaneous.html  # Hobbies, playlists, fun facts
        ├── easter-egg-1.html   # Hidden groove: playlist link
        └── easter-egg-2.html   # Hidden groove: strategy hot take
```

---

## Page Layout

Defined in `layout.css`. **Left/right split** — turntable on the left, content on the right, controls overlaid top-right.

```
+---------------------------+--------------------+
|                           |    [controls row]  |  ← Zone C: fixed top-right
|                           |                    |
|   Zone A — Turntable      |   Zone B — Content |
|   (55% viewport width)    |   (45% right panel)|
|                           |                    |
|   SVG turntable with      |   Shows "Drop the  |
|   spinning platter +      |   needle..." idle   |
|   draggable tonearm       |   or section content|
|                           |                    |
+---------------------------+--------------------+
```

- **`#app`:** `display: flex` — horizontal split
- **Zone A:** `width: 55%; height: 100%` — contains the turntable SVG
- **Zone B:** `flex: 1; height: 100%` — always visible in the right panel. Shows idle prompt by default, switches to content when a groove is selected
- **Zone B expand:** `.zone-b--expanded` → `position: fixed; inset: 3vh 3vw; z-index: 100` (overlays both zones)
- **Zone C:** `position: fixed; top-right` — horizontal row with glassmorphism background (`backdrop-filter: blur(12px)`), `z-index: 60`
- **Zone A dims:** `.zone-a--dimmed` → `filter: blur(4px) brightness(0.4); transform: scale(0.97)` (when Zone B expanded)

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

Each groove has:
- A visible `<circle class="groove-ring">` with thin stroke
- An invisible `<circle class="groove-ring__hitarea">` with 20px transparent stroke for easy targeting

### SVG layer order (bottom to top)
1. Chassis background rect (dark green gradient)
2. Platter well (dark circle)
3. Spinning platter group `#platter` (vinyl gradient, decorative grooves, groove rings, center label)
4. Spindle (non-rotating, on top of platter center)
5. Groove labels group `#groove-labels` (non-rotating `<textPath>` elements)
6. Tonearm base `#tonearm-base` (fixed pivot housing — does NOT rotate)
7. Tonearm arm `#tonearm` (rotating arm, counterweight, headshell, stylus — rotates via CSS transform)

### SVG gradients (defined in `<defs>`)
- `#chassis-bg` — linear gradient, dark green/charcoal
- `#vinyl-gradient` — radial gradient, dark vinyl surface
- `#label-gradient` — radial gradient, brushed metal center label
- `#spindle-gradient` — radial gradient, metallic spindle highlight

### SVG filters
- `#platter-shadow` — drop shadow under platter
- `#tonearm-shadow` — drop shadow under tonearm
- `#groove-glow` — gaussian blur glow for highlighted grooves

### Groove label paths
Labels are `<text><textPath>` elements following circular arc `<path>` definitions. They do NOT rotate with the platter (they're in a separate, non-rotating `<g>` overlay).

---

## Platter Spin

- **CSS animation:** `@keyframes platter-spin` (360° rotation) in `animations.css`
- **Speed:** CSS custom property `--platter-spin-duration` (default: 12s per revolution)
- **Transform origin:** `400px 350px` (platter center)
- **Speed control:** `turntable.js` exports `slowPlatter()` (24s), `resumePlatter()` (12s), `platterSpeedDip()` (slow → resume after 400ms)
- **`will-change: transform`** applied for GPU acceleration

---

## Tonearm Interaction (Custom Drag Handler)

Implemented in `tonearm.js`. The tonearm has a **split SVG structure**:
- **`#tonearm-base`** — Fixed pivot housing (does NOT rotate). Stays anchored in place.
- **`#tonearm`** — Rotating arm (tube + counterweight + headshell + needle). Rotates around pivot (765, 85) via CSS `transform: rotate()`.

This split ensures the pivot base looks screwed down while only the arm swings.

### Drag implementation
**Custom mouse/touch handler** (no GSAP Draggable plugin). Horizontal mouse movement is converted to rotation:
- Drag LEFT → positive rotation → needle swings LEFT toward platter grooves
- Drag RIGHT → negative rotation → needle swings RIGHT away from platter
- Sensitivity: 3 pixels of mouse movement = 1° of rotation

### Rotation angles
| State | Angle |
|-------|-------|
| Parked (default) | 0° (arm points straight down, needle off to the right of platter) |
| Minimum (slight overshoot past parked) | -5° |
| Maximum (fully over inner platter) | +55° |

### How groove detection works

1. On init, `precomputeGrooveAngles()` sweeps from -5° to +55° in 0.5° increments
2. For each angle, it calculates the needle tip position using `rotatePoint()` from `utils.js`
3. It measures the tip's distance from platter center (400, 350)
4. It finds the angle that best matches each groove's radius
5. Result: each groove has a precomputed `angle` field

### Approximate groove angles (computed at runtime)
| Groove | Radius | Approx. angle |
|--------|--------|---------------|
| INTRO | 255 | ~+19° |
| CV | 210 | ~+27° |
| PORTFOLIO | 165 | ~+33° |
| BLOG | 120 | ~+39° |
| MISC | 84 | ~+44° |

### Drag behavior
- **`onPointerDown`:** Adds `.is-dragging` class, records start position, lifts needle (slows platter)
- **`onPointerMove`:** Converts horizontal delta to rotation angle, applies snap, highlights matching groove
- **`onPointerUp`:** If over a groove → `dropNeedle(groove)`. If not → `returnToParked()`

### Needle drop sequence (`dropNeedle()`)
1. Plays needle thump sound (Web Audio)
2. GSAP bounce animation (+1° → -0.3° → settle)
3. Platter speed dip (slow → resume)
4. SVG groove ripple (expanding/fading circle via GSAP)
5. Dust puff particles (8 particles emitted from needle position)
6. Sets active groove visual state
7. Loads content in Zone B (right panel) with radial reveal animation
8. Updates ARIA attributes

### Snap behavior
Snaps to nearest groove when within 3° (soft magnetism, not hard snap).

### Keyboard support
- **Arrow Left/Up:** Move to next groove (outer → inner)
- **Arrow Right/Down:** Move to previous groove (or park)
- **Enter/Space:** Drop needle on current groove
- **Escape:** Return to parked position

---

## Content Loading (Zone B — Right Panel)

Implemented in `content.js`.

### How content is loaded
- Content HTML partials are imported at build time using Vite `?raw` imports:
  ```js
  import introHtml from '../content/intro.html?raw';
  ```
- A `contentMap` object maps groove IDs to their HTML strings
- No runtime fetch calls — all content is bundled into the JS bundle
- Content is cached (already bundled, no repeated loading)

### Content display
- Zone B (right panel) is always visible with a width of ~45% of the viewport
- Initially shows an idle prompt: "Drop the needle to begin..."
- When a groove is selected, the idle state hides and active content is shown with a title and scrollable body

### Content reveal animation
- CSS `clip-path: circle()` animation (`radial-reveal` keyframe) in `content.css`
- Content body gets class `.content-zone__body--revealing` on each load
- Reflow triggered via `void contentBody.offsetWidth` to restart animation

### Expand/collapse
- Toggle button `#btn-expand` in Zone B header
- Adds `.zone-b--expanded` (fixed positioning, 90% viewport) and `.zone-a--dimmed`
- ARIA labels update dynamically
- Hidden on mobile (≤768px) since Zone B is already full-width

---

## Controls Bar (Zone C — top-right overlay)

Implemented in `controls.js`. HTML in `index.html` `#controls-zone`.
Positioned as a horizontal glassmorphism bar (`backdrop-filter: blur(12px)`) in the top-right corner of the viewport.

### Buttons

| Button | ID | Behavior |
|--------|----|----------|
| Full Mode | `btn-fullmode` | Opens current section content in a new browser tab (blob URL) |
| Sound | `btn-sound` | Toggles `soundEnabled` state, starts/stops vinyl crackle |
| Theme | `btn-theme` | Toggles `.theme-light` on `<html>`, swaps icons |
| Auto-Play | `btn-autoplay` | GSAP timeline moves tonearm to each groove every 8s |
| LinkedIn | link | External link (opens in new tab) |
| Email | link | mailto link |

### Theme system
- **Dark theme (default):** Variables in `variables.css`
- **Light theme:** `.theme-light` class on `<html>`, overrides in `themes.css`
- Auto-detects system `prefers-color-scheme: light` on init

### Auto-play
- Creates a GSAP timeline with `call()` at 8-second intervals
- Each call invokes `moveToGroove(grooveId)` from `tonearm.js`
- Toggles `aria-pressed` and state tracking
- Clicking again kills the timeline and stops

---

## Sound System (Web Audio API)

Implemented in `sound.js`. All sounds are **synthesized** — no audio files.

### Sounds
| Sound | Trigger | Implementation |
|-------|---------|----------------|
| Needle thump | Needle drops on groove | 55Hz sine oscillator (decay 0.2s) + filtered noise burst |
| Vinyl crackle | Sound toggled ON | Looped noise buffer with sparse pops, high-pass filtered at 1kHz, volume 0.04 |
| Scratch | Tonearm dragged across platter | Bandpass-filtered (800Hz) noise burst, 0.1s duration |

- **OFF by default** (per vision spec)
- AudioContext created lazily on first user interaction (autoplay policy compliance)
- Controlled by `soundEnabled` state via `onStateChange` listener

---

## Particle System

Implemented in `particles.js`.

### Ambient particles
- 15 DOM `<div class="dust-particle">` elements
- Positioned randomly over Zone A
- CSS `dust-float` animation with random duration (8-20s), drift, and opacity (0.1-0.3)

### Needle drop puff
- `emitDustPuff(x%, y%)` spawns 8 `<div class="dust-puff">` particles
- Each disperses outward at random angle and fades (CSS `dust-puff-anim`, 0.6s)
- Self-cleaning: particles removed on `animationend`

### Groove ripple
- `createGrooveRipple(radius)` in `animations.js`
- Creates an SVG `<circle>` at the groove's radius
- GSAP animates it: expand by 25px + fade to 0 opacity (0.8s)
- Self-cleaning: circle removed on complete

---

## State Management

Implemented in `state.js`. Simple pub/sub pattern.

```js
state = {
  currentSection: null,    // 'intro', 'cv', etc. or null
  isExpanded: false,       // Zone B expanded?
  soundEnabled: false,     // Sound on/off
  isDragging: false,       // Tonearm being dragged?
  theme: 'dark',           // 'dark' or 'light'
  autoPlaying: false,      // Auto-play running?
};
```

- `getState()` — returns copy of state
- `setState(updates)` — merges updates, notifies listeners
- `onStateChange(key, fn)` — subscribe to specific key changes

---

## CSS Custom Properties (Design Tokens)

Defined in `variables.css`:

| Token | Dark Value | Light Override |
|-------|-----------|----------------|
| `--color-bg-primary` | `#0F1215` | `#E8E4DF` |
| `--color-bg-secondary` | `#1A1F24` | `#F5F1EC` |
| `--color-bg-tertiary` | `#252B31` | `#D8D4CF` |
| `--color-accent` | `#1DB954` (Spotify green) | same |
| `--color-text-primary` | `#F5F5F5` | `#1A1A1A` |
| `--color-text-secondary` | `#D0D0D0` | `#4A4A4A` |
| `--platter-spin-duration` | `12s` | same |
| `--font-family` | `Inter, system-ui, sans-serif` | same |

---

## Responsive Breakpoints

| Breakpoint | Layout changes |
|------------|---------------|
| ≤1024px (tablet) | Zone A shrinks to 50% width, smaller groove labels |
| ≤768px (mobile) | Zones stack vertically (`flex-direction: column`), Zone A 50vh / Zone B 50vh, expand button hidden, 44px touch targets |
| ≤480px (small mobile) | Single-column portfolio/CV grids, smaller titles |

---

## Accessibility Features

- **Semantic HTML:** `<section>`, `<main>`, `<aside>`, `<nav>`, `<article>`, `<time>`
- **ARIA:** `role="application"` on Zone A, `aria-live="polite"` on Zone B, `role="slider"` on tonearm, `aria-pressed` on toggles
- **Skip navigation:** Hidden link to `#content-zone`
- **Keyboard navigation:** Full tonearm control via arrow keys / enter / escape
- **`prefers-reduced-motion`:** All animations disabled (duration → 0.01ms, particles hidden)
- **`prefers-color-scheme`:** Auto-detects system theme on load
- **Focus indicators:** Tonearm and controls show Spotify green outline on `:focus-visible`
- **`<noscript>` fallback:** Message displayed when JS is disabled

---

## Build Output

```
dist/index.html        — 17.32 KB (gzip: 4.03 KB)
dist/assets/index.css  — 11.77 KB (gzip: 3.06 KB)
dist/assets/index.js   — 91.97 KB (gzip: 35.37 KB)
                         ──────────────────────────
                         Total gzipped: ~42 KB
```

GSAP core (without Draggable plugin) accounts for ~65KB of the JS bundle. App code is ~27KB. The tonearm uses a custom drag handler instead of GSAP Draggable, reducing bundle size.

---

## Deployment (Phase 13)

Ready but not yet deployed. Configuration is in `vercel.json`:

```bash
# Option A: Vercel CLI
npx vercel

# Option B: Connect GitHub repo in Vercel dashboard
# Push to GitHub, import in vercel.com/new
```

Security headers configured: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`.
Static assets cached with `Cache-Control: immutable, max-age=31536000`.

---

## Remaining Work

- [ ] **Phase 13:** Deploy to Vercel
- [ ] **Personalization:** Replace placeholder content in `src/content/*.html` with real information
- [ ] **Real links:** Update LinkedIn URL, email address, blog post links
- [ ] **OG image:** Create `public/og-image.png` for social sharing preview
- [ ] **Git:** Initialize repository and make initial commit
- [ ] **Browser testing:** Verify in Chrome, Firefox, Safari, Edge, mobile Safari, Chrome Android
