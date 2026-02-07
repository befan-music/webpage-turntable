# Personal Webpage Design Specification  
**Project: Interactive Vinyl Turntable Portfolio**  
**Target Audience:** Spotify Recruiters (Business Strategy & Product Management Internship)  
**Date:** February 2026  
**Goal:** Create a surprising, artistic, music-inspired single-page website that feels like dropping the needle on a vinyl record to explore the owner's story, CV, portfolio, etc. No traditional tabs/navigation — everything is driven by the turntable metaphor.

## 1. Overall Concept & Mood
- **Core Metaphor:** A premium, minimalist top-down view of a high-end turntable (inspired by the reference image provided).  
- **Tone:** Elegant, tactile, analog warmth meets modern minimalism. Subtle luxury hi-fi aesthetic.  
- **Key Feeling:** “I’m discovering this person’s story the same way I discover music — by physically dropping the needle.”  
- **Color Palette:**  
  - Dominant: Deep charcoal/dark slate (#0F1215 – #1A1F24)  
  - Accent: Matte silver/gray (#C0C0C0 – #E0E0E0) for platter & tonearm  
  - Highlights: Very subtle Spotify green (#1DB954) for hover states, active groove, or optional theme toggle  
  - Text: Off-white / light gray (#F5F5F5 / #D0D0D0)  
- **Typography:** Clean sans-serif (e.g. Inter, Helvetica Neue, or system-ui) for readability; slightly condensed for modern feel.

## 2. Page Layout – Fixed Zones (Desktop-First)
The viewport is divided into three non-overlapping horizontal/vertical zones that persist:

- **Zone A – Turntable View**  
  - Position: Top of page  
  - Size: 100% width × ~65% height (min-height: 65vh, max-height ~80vh depending on content)  
  - Content: Full overhead photograph / stylized render of the turntable (use provided reference image as base)  
  - Elements always visible:  
    - Large central platter (slow continuous spin animation – ~10–15 seconds per rotation, very subtle)  
    - Tonearm on the right (draggable)  
    - 5 concentric/engraved groove rings with labels:  
      1. INTRO  
      2. CV  
      3. PORTFOLIO  
      4. BLOG  
      5. MISCELLANEOUS  
    - Groove labels: subtle etched / embossed style text or icons that glow softly on hover/drag  
    - Micro-details: faint dust particles, soft platter reflection, shadow under tonearm  

- **Zone B – Content Playback Area**  
  - Position: Directly below Zone A  
  - Size: ~85% width (centered) × ~35% height  
  - Initial state: Neutral / welcoming (e.g. center label art with your name + “Drop the needle to begin…” or very faint waveform)  
  - When needle drops on a groove → selected section content fades/slides in here  
  - Content is vertically scrollable if longer than available height  
  - **Enlarge / Full View button** (↔ icon or “Expand” label):  
    - Clicking → Zone B smoothly expands to nearly full viewport (~90–95%), overlaying most of Zone A  
    - Zone A dims/blurs slightly and scales down a bit in background (keeps tonearm visible in corner)  
    - Toggle same button again → collapse back to original size  

- **Zone C – Controls Sidebar**  
  - Position: Right side, aligned with bottom of Zone B (floating or fixed within the lower 35%)  
  - Size: ~15% width × ~35% height  
  - Contains small, tactile icon buttons (minimal, rounded, subtle hover glow):  
    - Full Mode / Open in New Tab (current section opens in separate browser tab)  
    - Sound toggle (needle drop thump, faint vinyl crackle, low ambient track – optional & off by default)  
    - Theme switch (dark default ↔ light vinyl / green accent variant)  
    - Auto-Play (plays through grooves in order like an album side)  
    - Contact / LinkedIn / Email icons (subtle)  

## 3. Core Interaction Flow
1. **Landing** → Pristine turntable spinning slowly, tonearm parked to the side.  
2. **Drag tonearm** → Hovering over grooves highlights label + subtle ripple/glow.  
3. **Drop needle** (release over groove) →  
   - Small bounce animation + dust puff  
   - Optional soft “thump” sound  
   - Platter very briefly slows then resumes  
   - Corresponding content instantly but smoothly appears in Zone B (fade-in + slight radial reveal from center preferred)  
4. **Explore content** in Zone B (scroll, click links, etc.)  
5. **Enlarge** → Click expand button → Zone B takes over screen (A recedes)  
6. **Switch sections** → Lift tonearm (drag upward or click “lift” cue), drag to new groove, drop again → Zone B updates seamlessly  
7. **Collapse enlarged view** → Click collapse button or lift tonearm  

## 4. Micro-Interactions & Polish (Surprise & Delight)
- Needle scratch: subtle waveform ripple when dragging tonearm across platter  
- Groove hover: gentle concentric ripple from hover point  
- Easter eggs: 1–2 tiny unmarked micro-grooves → secret content (e.g. favorite Spotify playlist link, quirky fact, strategy hot-take)  
- Platter behavior: slows slightly when tonearm is lifted, resumes normal speed on drop  
- Loading states: subtle buffering animation styled like vinyl groove buffering  
- Mobile: Stack A → B vertically (full-width), controls move to bottom bar or hamburger

## 5. Deliverables Expected from Designer
- High-fidelity mockups (desktop + mobile)  
  - Landing state  
  - Tonearm hovering over groove  
  - Needle dropped + content visible in Zone B  
  - Enlarged Zone B view  
  - Optional alternate themes  
- Asset list:  
  - Optimized base turntable image (WebP)  
  - Optional separated tonearm layer (if easier to animate)  
  - SVG groove overlays / labels (if not baked into photo)  
- Animation specs / prototypes (Framer, Figma prototypes, or After Effects snippets):  
  - Tonearm drag & drop  
  - Needle settle bounce  
  - Zone B content reveal  
  - Expand / collapse transition  
- Moodboard references (hi-fi turntables, vinyl close-ups, subtle analog-digital fusion)

## 6. Technical Notes for Hand-off to Developer
- Single-page application feel (no full reloads)  
- Tonearm drag: smooth, physics-feel (use GSAP Draggable or similar)  
- Platter spin: pure CSS @keyframes rotate (lightweight)  
- Content lazy-loading in Zone B  
- Sound: Web Audio API, toggleable, low volume  
- Accessibility: keyboard-focusable tonearm, ARIA labels, high contrast text

This should give your UX designer everything needed to create pixel-perfect mocks and a clear interaction blueprint.  
