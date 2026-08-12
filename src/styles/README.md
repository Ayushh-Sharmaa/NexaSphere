# 🎨 src/styles/

Three CSS files — each with a clear, distinct responsibility.

---

## globals.css

**CSS variables, body reset, fonts, layout utilities, scroll UI.**

### To change colors site-wide — edit `:root {}` at the top

```css
--cyan: #00d4ff; /* Primary accent — headings, borders, glows */
--indigo: #6366f1; /* Secondary accent */
--purple: #a855f7; /* Tertiary accent */
--bg-primary: #04060f; /* Page background */
--bg-card: #0d1229; /* Card background */
```

### Also contains

- Scrollbar styling
- Scroll progress bar (`#scroll-progress`)
- Back-to-top button (`#back-to-top`)
- `.container`, `.section`, `.section-title`, `.section-subtitle`
- `.glass-card`, `.gradient-border` utility classes

---

## animations.css

**All `@keyframe` animations and scroll-reveal utility classes.**

### Scroll Reveal Classes

Add any of these to an element — it will animate in when scrolled into view:

| Class                                 | Effect                          |
| ------------------------------------- | ------------------------------- |
| `.reveal`                             | Fade up from below              |
| `.reveal-left`                        | Slide in from left              |
| `.reveal-right`                       | Slide in from right             |
| `.reveal-scale`                       | Scale up from 88%               |
| `.reveal-delay-1` — `.reveal-delay-6` | Stagger delays (0.08s per step) |

### Available Keyframes

`gradientShift` `float` `floatReverse` `orbit` `orbit2` `orbit3` `pulseRing`
`shimmer` `glowPulse` `ripple` `spin` `spinSlow` `spinReverse`
`splashFadeIn` `splashFadeOut` `modalIn` `overlayIn`
`letterDrop` `neonFlicker` `scanline` `dataStream` `countUp`
`warp` `blink` `cardFlipIn` `hexSpin` `sectionReveal`

### To adjust scroll reveal speed

```css
.reveal {
  transition:
    opacity 0.7s...,
    /* ← change duration here */ transform 0.7s...;
}
```

---

## components.css

**Styles for every component — buttons, navbar, cards, modal, timeline, hero, footer, copy popup.**

### Sections inside

- Buttons (`.btn`, `.btn-primary`, `.btn-outline`, `.btn-linkedin`, `.btn-whatsapp`, etc.)
- Navbar — desktop (`.ns-navbar`) and mobile (`.ns-navbar-mobile`)
- Activity cards (`.activity-card`, `.activity-grid`)
- Team cards (`.team-card`, `.team-grid`)
- Team modal (`.modal-overlay`, `.modal-box`, `.modal-photo`, etc.)
- Events timeline (`.events-timeline`, `.timeline-item`, `.timeline-card`, etc.)
- Hero section (`.hero-section`, `.hero-bg`, `.hero-content`, etc.)
- About section (`.about-content`, `.about-text`, `.about-actions`)
- Footer (`.ns-footer`)
- Splash screen (`.splash-screen`, `.splash-logo`, `.splash-spinner`)
- Copy popup (`.copy-popup`, `.copy-popup-value`, `.copy-popup-btn`)

> If something looks visually wrong on the site, this is usually the first file to check.
