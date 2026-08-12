# 03 — Design Styles (The 25 Visual Modes)

NexaSphere supports **25 distinct design styles** selectable at runtime via the
Style Switcher panel. Each style is applied by setting `data-style="<name>"` on
`<html>` alongside the existing `data-theme` attribute.

Styles are **CSS-only surface overrides** — they change backgrounds, borders, shadows,
radius, and accent colors, but **never** alter layout, animations, or transitions.

---

## Architecture

```
<html data-theme="dark" data-style="glassmorphism">
```

CSS cascade order (later = higher priority):

```
themes.css          → base dark/light tokens
globals.css         → typography baseline
components.css      → component primitives
aurora.css          → aurora layer
motion.css          → motion layer
material-system.css → material tokens (scoped to [data-style="material"])
design-styles.css   → 25 [data-style="X"] override blocks   ← wins
accessibility.css   → always last, always wins
```

---

## Style Persistence

- Selection saved to `localStorage['ns-style']`
- Loaded on next visit via `ThemeProvider` initializer (validated against known style list)
- `designStyle: 'default'` removes `data-style` attribute entirely (no override)

---

## The 25 Styles

---

### 1. Default (`default`)

**No override.** The raw dark/light theme tokens as defined in `themes.css`.

- Background: `#07090e` (dark) / `#ffffff` (light)
- Accent: Crimson `#f25c66`
- Aurora layer active in dark mode
- Standard depth shadows

---

### 2. Skeuomorphism (`skeuomorphism`)

**Concept:** Physical real-world materials — wood grain, leather, brushed metal.

- **Background:** Dark warm oak `#1a1208` with repeating texture overlay
- **Cards:** Deep brown `rgba(45,35,20,0.92)` with inset box-shadows that simulate physical depth
- **Borders:** Tight physical borders, `--r1: 4px` (very little rounding)
- **Shadows:** Layered: inset warm highlight top + deep black drop bottom
- **Accents:** Warm amber gold `#d4891a` replaces brand crimson
- **Texture:** Subtle noise/grain `filter: contrast(1.05)` on body
- **Character:** Heavy, tangible, warm — feels like holding something physical

---

### 3. Flat Design (`flat`)

**Concept:** No depth, no gradients, pure bold geometric fills.

- **Shadows:** None (`--shcard: none`, `--sh1/sh2: none`)
- **Cards:** Solid flat fills — no translucency
- **Borders:** `2px solid` computed accent stroke — border is the only depth cue
- **Radius:** `0–4px` minimal rounding
- **Accents:** High-contrast `#e63946` with zero glow or blur
- **Character:** Clean, decisive, corporate-modern

---

### 4. Neumorphism / Soft UI (`neumorphism`)

**Concept:** Surfaces appear extruded from the same background material — soft pressed forms.

- **Background and cards share the SAME color** — depth is from shadows alone
  - Dark: `#1e2430`
  - Light: `#e0e5ec`
- **Shadows:** Two-tone soft shadows (light corner + dark corner)
  - Dark: `inset 8px 8px 16px #161c28, inset -8px -8px 16px #262e40`
  - Light: `inset 6px 6px 14px #c5cad6, inset -6px -6px 14px #ffffff`
- **Borders:** None — border would break the illusion
- **Radius:** Very high `16–48px` — everything is rounded and puffy
- **Text contrast:** Deliberately reduced — matches the muted physical aesthetic
- **Character:** Soft, tactile, meditative — suited to wellness/productivity apps

---

### 5. Glassmorphism (`glassmorphism`)

**Concept:** Frosted glass panels floating over a blurred background.

- **Cards:** `rgba(255,255,255,0.06)` dark / `rgba(255,255,255,0.45)` light
- **Backdrop filter:** `blur(20px) saturate(180%)` on all card surfaces
- **Borders:** `rgba(255,255,255,0.14)` fine glass edge
- **Shadows:** `0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)`
- **Background:** Deep navy `#050914` with vibrant ambient orbs providing the
  color that shows through the glass panels
- **Radius:** `12–40px` (generous rounding for the glass feel)
- **Character:** Modern, ethereal, high-tech — dominant in 2021–2024 SaaS UI

---

### 6. Claymorphism (`claymorphism`)

**Concept:** Puffy, inflated, colorful 3D clay — playful and tactile.

- **Cards:** Bold saturated fills with `filter: saturate(1.3)`
- **Shadows:** Colored offset shadows create the "inflated" appearance
  - `0 8px 0 #b91c1c, 0 16px 32px rgba(0,0,0,0.35)`
- **Radius:** Extreme — `20–56px` everywhere
- **Hover:** Cards scale to `1.01` via token-driven CSS transform
- **Accents:** Saturated red-clay `#ef4444`
- **Character:** Joyful, 3D-web3-adjacent, Instagram-era aesthetic

---

### 7. Aurora UI (`aurora`)

**Concept:** Northern lights — translucent panels over a deep animated aurora sky.

- **Background:** Dark navy with amplified aurora `body::before` radial gradients
- **Cards:** `rgba(8,12,28,0.72)` with `backdrop-filter: blur(24px)`
- **Borders:** Animated rainbow iris gradient via `@property --iris-angle` CSS mask trick
- **Shadows:** `0 0 40px rgba(120,40,220,0.15), 0 20px 60px rgba(0,0,0,0.6)`
- **Accents:** Aurora spectrum — purple `#8b5cf6`, cyan `#06b6d4`, green `#10b981`, warm red `#f25c66`
- **Scroll bar:** Animated rainbow using `progressShift` keyframe
- **Character:** Cosmic, magical, premium — strong visual drama

---

### 8. Material Design (`material`)

**Concept:** Google Material Design 3 — tonal surfaces, color roles, elevation system.

- **Tokens:** Full Material token set from `material-system.css` (scoped to this style)
- **Surfaces:** M3 elevation model — Surface +0 through +5 tonal layers
- **Cards:** Tonal surface with `inset 0 1px 0 --material-highlight` top edge
- **Radius:** `4 / 12 / 16 / 28px` (M3 shape scale)
- **Background:** Subtle warm-tinted `#090a0d` with grid overlay
- **Accents:** Crimson `#e4555f` aligned to M3 error/primary role
- **Focus rings:** 3px outline using `--material-focus`
- **Character:** Authoritative, systematic, Google ecosystem feel

---

### 9. Bento Grid Layout (`bento`)

**Concept:** Dashboard mosaic — asymmetric grid tiles of different spans.

- **Grid:** `grid-template-columns: repeat(auto-fill, minmax(240px,1fr))`
  with `:nth-child(3n)` cards spanning 2 columns
- **Cards:** Sharp 1px accent borders, zero radius (`--r1: 0`, `--r2: 4px`)
- **Fills:** High-contrast dark fills per tile
- **Borders:** `1px solid var(--c1)` accent strokes for grid cell definition
- **Labels:** Monospace font for cell headers
- **Character:** Dashboard-native, data-first, editorial tech

---

### 10. Minimalism (`minimalism`)

**Concept:** Maximum whitespace, minimum ink — typography leads.

- **Background:** Pure `#fafafa` (light) / `#0a0a0a` (dark)
- **Cards:** Transparent fills — no background color
- **Borders:** `1px solid rgba(0,0,0,0.08)` hairline only
- **Shadows:** None
- **Radius:** `0–8px` (very tight)
- **Accents:** Desaturated `#666` (dark) / `#333` (light)
- **Section padding:** Doubled for breathing room
- **Character:** Dieter Rams, Swiss graphic design, intentional restraint

---

### 11. Monochromatic Design (`monochromatic`)

**Concept:** Single hue (the brand crimson) explored across all shades and tints.

- **Background:** Darkest crimson `#0d0203`
- **Elevated surfaces:** `#160406`, `#1f0608`
- **Accent spectrum:** `#cc0000` → `#e63946` → `#ff6b75` → `#ff9ea5`
- **Text:** Warmest tint `#fff5f5`
- **Borders:** `rgba(230,57,70,0.18)`
- **Gradients:** Monochrome red-spectrum only — no hue shifts
- **Character:** Intense, brand-forward, high personality

---

### 12. Color Blocking (`color-blocking`)

**Concept:** Bold geometric zones of solid color — Mondrian / editorial magazine.

- **Body:** Split background `linear-gradient(135deg, #1a0a0a 50%, #0a0a1a 50%)`
- **Cards:** Alternate between brand crimson and deep navy fills
- **Accents:** Two-color system — red `#e63946` + blue `#3a86ff`
- **Radius:** Zero — all square corners
- **Dividers:** Thick 4px solid accent lines between sections
- **Headings:** `text-transform: uppercase` — bold editorial statement
- **Character:** Fashion-editorial, high-impact, intentionally graphic

---

### 13. Neo-Brutalism / Anti-Design (`neo-brutalism`)

**Concept:** Raw confrontational design — the anti-polish aesthetic.

- **Background:** Off-white paper `#f5f0e8` (this style works best in light mode)
- **Cards:** White fills
- **Borders:** `3px solid #000000` — thick black outlines
- **Shadows:** `6px 6px 0px #000000` — hard offset with zero blur
- **Radius:** All zero — brutally square
- **Accents:** Hot raw pink-red `#ff0055`
- **Hover:** Buttons shift `translate(-3px, -3px)` + shadow shifts accordingly
- **Headings:** `letter-spacing: -0.02em`, maximum font weight
- **Character:** Anti-corporate, countercultural, startup energy

---

### 14. Maximalism (`maximalism`)

**Concept:** More is more — layered textures, patterns, saturated colors.

- **Body:** Multiple stacked `background-image` gradients + dot grid overlay
- **Cards:** `rgba(20,10,30,0.88)` over vivid gradient background
- **Shadows:** 5-layer box-shadows with colored glows in multiple hues
- **Radius:** Mixed per element — `8 / 24 / 40 / 60px` variety
- **Accents:** Full rainbow spectrum across sections
- **Headings:** Multi-color gradient text spanning the full spectrum
- **Character:** High-energy, Memphis-inspired, rule-breaking

---

### 15. Retro-Futurism / Cyberpunk (`cyberpunk`)

**Concept:** Neon on dark chrome — grid lines, scan lines, glowing terminal accents.

- **Background:** Deep void `#050510`
- **Body overlay:** CSS grid mesh at `60px` intervals, opacity `0.04`
- **Cards:** `rgba(0,0,20,0.7)` with cyan/magenta neon borders
- **Borders:** `1px solid rgba(0,255,200,0.3)` cyan neon
- **Shadows:** `0 0 20px rgba(0,255,200,0.12), 0 0 60px rgba(255,0,60,0.08)`
- **Body scanlines:** `body::after repeating-linear-gradient` 2px interval overlay
- **Accents:** Hot pink-red `#ff003c` neon
- **Headings:** `Orbitron` font (already loaded) + `letter-spacing: 0.1em`
- **Character:** Ghost in the Shell, Blade Runner, developer-tool aesthetic

---

### 16. Vaporwave / Y2K (`vaporwave`)

**Concept:** Pastel purples, 80s retro grid, CRT glow, late-90s nostalgia.

- **Background:** Dark purple void `#0d0020`
- **Body:** Perspective vanishing-point grid at the bottom half (CSS gradient)
- **Cards:** `rgba(60,0,100,0.5)` with `backdrop-filter: blur(12px)`
- **Borders:** `rgba(255,110,199,0.3)` pink glow
- **Shadows:** `0 0 20px rgba(255,110,199,0.2), 0 0 60px rgba(180,75,225,0.1)`
- **Accents:** Hot pink `#ff6ec7` + purple `#b44be1`
- **Headings:** Chrome/metallic gradient text effect
- **Background stars:** CSS-only starfield via `body::before` multi-layer radial-gradients
- **Character:** Aesthetic Tumblr 2014, vaporwave music cover art

---

### 17. Pixel Art UI (`pixel-art`)

**Concept:** 8-bit pixels — crisp, chunky, retro game console aesthetic.

- **Image rendering:** `image-rendering: pixelated` on all images
- **Radius:** All `0` — pixel-perfect square corners
- **Shadows:** `4px 4px 0px var(--c1)` hard pixel-offset shadow
- **Borders:** `3px solid var(--c1)` thick chunky outlines
- **Background:** `#1a1a2e` deep blue-navy
- **Accents:** NES red `#e53935`
- **Body font:** `Space Mono` monospace for the full pixel feel
- **Dithering pattern:** SVG data-URI pixel dither background on body
- **Character:** Retro gaming, indie dev, nostalgia-tech

---

### 18. Art Deco / Vintage Minimal (`art-deco`)

**Concept:** 1920s luxury — antique gold, geometric symmetry, Gatsby-era opulence.

- **Accents:** Antique gold `#c9a84c` → bright gold `#e8c96b`
- **Background:** Dark parchment `#0c0b09`
- **Cards:** `#16140f` with `border: 1px solid rgba(201,168,76,0.25)`
- **Shadows:** `0 0 0 1px rgba(201,168,76,0.1), 0 20px 60px rgba(0,0,0,0.6)`
- **Radius:** `0–8px` geometric — no organic curves
- **Dividers:** Ornamental diamond `◆` pseudo-elements on section breaks
- **Headings:** Fine letter-spacing, geometric font weight
- **Character:** The Great Gatsby, Savoy Hotel, 1920s Art Deco poster

---

### 19. Card-Based UI (`card-based`)

**Concept:** Everything inside prominent elevated cards — maximum information density in card format.

- **Shadows:** Deep three-layer card shadow
  - `0 24px 64px rgba(0,0,0,0.5), 0 8px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)`
- **Hover:** `transform: perspective(1000px) rotateX(0.5deg)` subtle tilt
- **Radius:** `16–36px` generous rounding
- **Borders:** `rgba(255,255,255,0.07)` — barely visible
- **Background:** Flat `#06080d` — pushed all depth into cards
- **Spacing:** Increased card gap
- **Character:** Trello, Notion, information-architecture focused

---

### 20. Typography-Centric Design (`typography`)

**Concept:** Type as the primary design element — scale and hierarchy drive composition.

- **Background:** `#080808`
- **Cards:** Transparent — no fills
- **Borders:** `1px solid rgba(255,255,255,0.06)` barely visible
- **Shadows:** None
- **Section titles:** `clamp(3rem, 8vw, 7rem)` — doubled from default
- **Heading tracking:** `letter-spacing: -0.04em` tight optical spacing
- **Display line-height:** `1.05` — compressed for display type
- **Accents:** Text-as-accent `#f5f5f5` — whiteness is the design accent
- **Character:** Pentagram studio, editorial magazine layout, typographic minimalism

---

### 21. Asymmetrical Layouts (`asymmetric`)

**Concept:** Deliberate imbalance — the anti-grid design language.

- **Card grid:** `grid-template-columns: 2fr 1fr 1.5fr` (intentional asymmetry)
- **Alternating sections:** `margin-left: -48px` / `margin-right: -48px` container breaks
- **Radius:** Mixed — `0 / 32px / 8px / 24px` per element type
- **Section headers:** Alternate left/right alignment per section
- **Character:** Bauhaus, Swiss experimental, contemporary editorial

---

### 22. Illustrative / Doodle UI (`illustrative`)

**Concept:** Hand-drawn sketchy aesthetic — organic, imperfect, warm.

- **Borders:** Organic border-radius: `255px 8px 225px 8px / 8px 225px 8px 255px` (hand-drawn feel)
- **Background:** Warm cream `#fef8f0` (light) / `#1a150f` (dark)
- **Accents:** Sketch orange-red `#e85d04`
- **Heading underlines:** Wavy SVG border-image for hand-drawn underline effect
- **Card shadow:** `2px 3px 0 rgba(0,0,0,0.15)` — slight irregular offset
- **Character:** Mailchimp (old brand), Basecamp, hand-made indie product feel

---

### 23. Parallax UI (`parallax`)

**Concept:** Visible depth layers — CSS-only foreground/midground/background separation.

- **Background:** Deep space dark with multi-layer pseudo-element depth fog
- **Cards:** Subtle `transform: translateZ(10px)` hover lift effect
- **Fixed layers:** Multiple `position: fixed` pseudo-elements at different `blur()` levels
- **Shadows:** Heavy downward `0 32px 80px rgba(0,0,0,0.65)`
- **Section backgrounds:** `4px` horizontal offset panels to create depth cue
- **Character:** Landing pages, dramatic storytelling, scroll-driven narratives

---

### 24. Spatial UI (`spatial`)

**Concept:** Apple visionOS feel — floating translucent layers with spatial shadows.

- **Cards:** `rgba(255,255,255,0.065)` with `backdrop-filter: blur(40px) saturate(200%)`
- **Shadows:** `0 0 0 1px rgba(255,255,255,0.1), 0 40px 80px rgba(0,0,0,0.5), 0 0 120px rgba(255,255,255,0.03)`
- **Hover:** Cards float at rest `translateY(-4px)`, lift to `translateY(-8px)` on hover
- **Radius:** `16 / 24 / 32 / 48px` (Apple spatial rounding scale)
- **Borders:** `rgba(255,255,255,0.12)` fine glass edge
- **Character:** visionOS, Apple design language, spatial computing UI paradigm

---

### 25. Dark Mode Native (`dark-native`)

**Concept:** Best-in-class pure dark — the enhanced default, optimised for display science.

- **Background:** `#030507` (near-true-black, blue-tinted — avoids pure black halation)
- **Cards:** `#0c0f16` slightly blue-tinted dark surface
- **Borders:** `rgba(255,255,255,0.055)` — hair-thin
- **Shadows:** `0 1px 0 rgba(255,255,255,0.04), 0 20px 60px rgba(0,0,0,0.7)`
- **Accents:** `#f25c66` softer than raw `#e63946` — easier on eye at night
- **Contrast:** Minimum 4.5:1 ratio enforced across all text tokens (WCAG AA)
- **Character:** The "right" dark mode — nuanced, display-science aware

---

### 26. Voice / Conversational UI (`vui`)

**Concept:** Chat/voice interface — message bubbles, waveform accents, minimal chrome.

- **Background:** `#0a0c10`
- **Cards:** Alternating `rgba(30,40,60,0.7)` (user) / `rgba(20,25,35,0.6)` (system)
- **Radius:** `4px / 20px / 20px / 24px` — chat bubble rounding asymmetry
- **Borders:** None on cards — pure bubble aesthetic
- **Section headers:** Waveform decoration via `repeating-linear-gradient` audio bars
- **Accents:** Voice-green `#34d399` — live/active state indicator
- **Nav:** Minimal — collapses toward bottom-tab-bar style in this mode
- **Character:** ChatGPT, voice assistant, conversational AI product design

---

## Style Compatibility Matrix

| Style | Works best in dark | Works best in light | Works in both |
|-------|-------------------|--------------------|----|
| Skeuomorphism | ✓ | ✓ | ✓ |
| Flat Design | — | ✓ | ✓ |
| Neumorphism | ✓ | ✓ | ✓ |
| Glassmorphism | ✓ | — | ✓ |
| Claymorphism | ✓ | ✓ | ✓ |
| Aurora UI | ✓ | — | dark only |
| Material Design | ✓ | ✓ | ✓ |
| Bento Grid | ✓ | ✓ | ✓ |
| Minimalism | ✓ | ✓ | ✓ |
| Monochromatic | ✓ | — | dark preferred |
| Color Blocking | ✓ | ✓ | ✓ |
| Neo-Brutalism | — | ✓ | light preferred |
| Maximalism | ✓ | — | dark preferred |
| Cyberpunk | ✓ | — | dark only |
| Vaporwave | ✓ | — | dark only |
| Pixel Art | ✓ | ✓ | ✓ |
| Art Deco | ✓ | ✓ | ✓ |
| Card-Based | ✓ | ✓ | ✓ |
| Typography | ✓ | ✓ | ✓ |
| Asymmetric | ✓ | ✓ | ✓ |
| Illustrative | — | ✓ | light preferred |
| Parallax | ✓ | — | dark preferred |
| Spatial UI | ✓ | — | dark preferred |
| Dark Native | ✓ | — | dark only |
| VUI | ✓ | — | dark preferred |
