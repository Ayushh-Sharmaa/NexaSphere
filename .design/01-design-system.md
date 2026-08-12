# 01 — Design System Tokens

NexaSphere's design system is entirely CSS-custom-property-driven. Every visual
attribute — color, shadow, radius, spacing — is a named token. This document describes
every token group, its intended meaning, and its canonical values.

---

## Token Naming Conventions

| Prefix | Meaning | Examples |
|--------|---------|---------|
| `--c1` .. `--c5` | Brand accent colors (legacy short names) | `--c1`, `--c2`, `--c3` |
| `--t1` .. `--t3` | Text hierarchy levels | `--t1` (primary), `--t2` (secondary), `--t3` (muted) |
| `--bg`, `--bg2` | Background surface levels | page canvas, slightly elevated |
| `--card`, `--card2` | Card surface fills | base, slightly raised |
| `--bdr`, `--bdr2` | Border/divider opacities | subtle, standard |
| `--sh1`, `--sh2`, `--shcard` | Box shadow presets | accent glow, card depth |
| `--r1` .. `--r4` | Border radius scale | 8 / 14 / 22 / 32 px |
| `--trans-*` | Transition timing presets | base, smooth, bounce |
| `--bp-*` | Breakpoint reference values | sm 480 / md 768 / lg 1024 / xl 1280 |

> **Migration note:** Semantic aliases like `--brand-primary`, `--text-primary-sem` are
> bridges to the short legacy names (`--c1`, `--t1`). All new code should use the
> semantic names. The short names will be removed after full migration.

---

## Color Palette — Dark Mode (default)

### Background Surfaces

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#07090e` | Page canvas — deepest background layer |
| `--bg2` | `#0e121e` | Second surface level (sidebars, footer) |
| `--card` | `#121724` | Card and panel fill |
| `--card2` | `#181f30` | Slightly raised card variant |
| `--card-hover` | `#1e263a` | Card fill on hover state |

### Brand Accent — Crimson Core

| Token | Value | Usage |
|-------|-------|-------|
| `--c1` | `#f25c66` | Primary brand accent — buttons, active states, links |
| `--c2` | `#ff888b` | Lighter accent — hover gradient endpoint |
| `--c3` | `#ff8787` | Tertiary accent — tag backgrounds, chips |
| `--c4` | `#d44450` | Darker accent — gradient start |
| `--c5` | `#4caf50` | Success / positive state |

### Accent Alpha Variants

| Token | Alpha | Usage |
|-------|-------|-------|
| `--c1a` | 8% of `--c1` | Subtle background tint on hover |
| `--c1b` | 22% of `--c1` | Border glow on interactive elements |
| `--c1g` | 28% of `--c1` | Box-shadow glow fill |
| `--c2a` | 8% of `--c2` | Light fill variant |
| `--c2b` | 20% of `--c2` | Border variant |

### Text

| Token | Value | Contrast (on `--bg`) | Usage |
|-------|-------|----------------------|-------|
| `--t1` | `#ffffff` | 21:1 | Headings, primary body text |
| `--t2` | `#cbd5e1` | 13.5:1 | Secondary body, descriptions |
| `--t3` | `#94a3b8` | 7.8:1 | Muted / placeholder / helper text |

### Borders

| Token | Value | Usage |
|-------|-------|-------|
| `--bdr` | `rgba(255,255,255,0.06)` | Hairline divider, card outline |
| `--bdr2` | `rgba(255,255,255,0.10)` | Standard interactive border |
| `--border-hover` | `rgba(242,92,102,0.35)` | Accent border on hover |

### Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `--sh1` | `0 0 32px rgba(242,92,102,0.08), 0 0 70px rgba(242,92,102,0.03)` | Subtle red glow |
| `--sh2` | `0 0 24px rgba(212,68,80,0.06), 0 0 60px rgba(212,68,80,0.02)` | Lighter red glow |
| `--shcard` | `0 12px 48px rgba(0,0,0,0.65)` | Card depth shadow |
| `--shadow-card` | `0 4px 16px rgba(0,0,0,0.4)` | Compact card shadow |
| `--shadow-hover` | `0 8px 24px rgba(242,92,102,0.12)` | Hover lift shadow |

---

## Color Palette — Light Mode

### Background Surfaces

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#ffffff` | Page canvas |
| `--bg2` | `#f5f5f5` | Elevated surface |
| `--card` | `#ffffff` | Card fill |
| `--card2` | `#f9f9f9` | Raised card |

### Brand Accent — Crimson Core (adjusted for light)

| Token | Value | Notes |
|-------|-------|-------|
| `--c1` | `#e63946` | Slightly deeper for contrast on white |
| `--c2` | `#ff5a5f` | Lighter hover endpoint |
| `--c3` | `#ff8787` | Same as dark |
| `--c4` | `#b71c1c` | Darker gradient start |

### Text (Light)

| Token | Value | Contrast on white | Usage |
|-------|-------|-------------------|-------|
| `--t1` | `#1a1a1a` | 19.7:1 | Headings |
| `--t2` | `#4a4a4a` | 9.6:1 | Body text |
| `--t3` | `#5f5f5f` | 7.2:1 | Muted (upgraded from #8A8A8A for WCAG AA) |

---

## Border Radius Scale

| Token | Value | Applied to |
|-------|-------|-----------|
| `--r1` | `8px` | Inputs, tags, small chips |
| `--r2` | `14px` | Buttons, small cards |
| `--r3` | `22px` | Large cards, panels |
| `--r4` | `32px` | Modals, drawers, hero elements |

---

## Transition Timing Presets

| Token | Value | Feel |
|-------|-------|------|
| `--trans-base` | `0.3s cubic-bezier(0.4, 0, 0.2, 1)` | Standard material ease |
| `--trans-smooth` | `0.4s cubic-bezier(0.4, 0, 0.2, 1)` | Slightly slower, smoother |
| `--trans-bounce` | `0.5s cubic-bezier(0.34, 1.56, 0.64, 1)` | Elastic overshoot — playful |

Additional easing variables (in `components.css`):

| Token | Value | Feel |
|-------|-------|------|
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Spring bounce |
| `--ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | Fast start, smooth settle |
| `--ease-ui` | `cubic-bezier(0.4, 0, 0.2, 1)` | Material standard |

---

## Spacing System

NexaSphere uses a **fluid spacing** approach with `clamp()` values rather than a rigid
4/8/12 grid. Key spacing values:

| Context | Value |
|---------|-------|
| Section vertical padding | `100px` (desktop) / `68px` (mobile) |
| Container max-width | `1240px` |
| Container horizontal padding | `28px` (desktop) / `16px` (mobile) |
| Card gap in grids | `24–32px` |
| Nav height (desktop) | `64px` |
| Nav height (mobile) | `88px` |

---

## Typography

### Font Stack

| Role | Font | Fallback |
|------|------|---------|
| Headings (h1–h6) | `Orbitron` (Google Fonts) | `monospace` |
| Body, buttons, nav | `Rajdhani` (Google Fonts) | `sans-serif` |
| Code, labels, monospace | `Space Mono` (Google Fonts) | `monospace` |
| Secondary body (some sections) | `Inter` (Google Fonts) | `sans-serif` |

### Type Scale

| Element | Size | Weight | Notes |
|---------|------|--------|-------|
| Section title | `clamp(1.8rem, 4.5vw, 2.8rem)` | 700 | Gradient clipped text |
| Section subtitle | `1.05rem` | 500 | Secondary description |
| Section label | `0.6rem` | 400 | All-caps monospace eyebrow |
| Nav tab | `0.88rem` | 700 | All-caps, letter-spacing 0.07em |
| Body | `16px` | 400 | Line-height 1.65 |
| Paragraph | `16px` | 400 | Line-height 1.78 |
| Button | inherited from body font | 600–700 | Rajdhani |

### Heading Gradient Effect

Section titles use a CSS gradient clip technique:

```
background: linear-gradient(135deg, --c1, --c2, --c3)
-webkit-background-clip: text
-webkit-text-fill-color: transparent
background-clip: text
```

In light mode the gradient shifts to a deeper crimson range (`#cc1111` → `#880000` → `#aa0000`)
for sufficient contrast on pale backgrounds.

---

## Brand Colors (Root-level)

These are static brand values that do not change with theme or style mode:

| Token | Value | Usage |
|-------|-------|-------|
| `--brand-red-primary` | `#e63946` | Logo, official brand color |
| `--brand-red-dark` | `#b71c1c` | Dark variant |
| `--brand-red-light` | `#ff5a5f` | Light variant |
| `--brand-red-deep` | `#8b0000` | Deep crimson |
| `--gradient-logo` | `linear-gradient(135deg, #e63946, #b71c1c)` | Logo gradient |
| `--gradient-hero` | `linear-gradient(135deg, #e63946, #8b0000, #000)` | Dark hero |

---

## Semantic Status Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--success` | `#4caf50` | Success states, confirmation |
| `--warning` | `#ffc107` | Warnings, pending |
| `--error` | `#e63946` | Error states (same as brand — intentional) |
| `--info` | `#2196f3` | Informational badges |

---

## Breakpoints Reference

These are documentation values only — CSS variables cannot be used inside `@media` queries.

| Token | Value | Name |
|-------|-------|------|
| `--bp-sm` | `480px` | Small mobile |
| `--bp-md` | `768px` | Tablet |
| `--bp-lg` | `1024px` | Small desktop |
| `--bp-xl` | `1280px` | Large desktop |
| `--bp-2xl` | `1536px` | Ultra-wide |
