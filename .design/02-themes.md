# 02 — Theme Architecture

NexaSphere supports three theme modes: **dark**, **light**, and **system**. This document
explains how the theme engine works, how tokens change per theme, and how the system
integrates with user preference.

---

## Theme Modes

| Mode | Behaviour |
|------|-----------|
| `dark` | Always uses dark palette regardless of OS setting |
| `light` | Always uses light palette regardless of OS setting |
| `system` | Follows OS `prefers-color-scheme` — updates live when user changes OS preference |

**Default on fresh install:** `system` (resolved to `dark` for most users)

---

## How It Works — Architecture

```
ThemeProvider (React context)
    │
    ├── Reads localStorage['ns-theme'] on mount
    ├── Listens to window.matchMedia('prefers-color-scheme') for system mode
    ├── Resolves final theme: dark | light
    │
    └── Writes data-theme="dark"|"light" to <html> element
            │
            └── CSS cascade reads [data-theme='dark'] / [data-theme='light']
                    and swaps all CSS custom properties
```

### State management

- Theme is stored in **two** localStorage keys for backwards compatibility:
  - `ns-theme` (current canonical key)
  - `nexasphere-theme` (legacy, read on mount, kept in sync)
- Theme preference is also synced to the server via `POST /api/auth/theme` for
  authenticated users (best-effort — failures are silently caught).
- `ThemeContext` exposes: `theme`, `resolvedTheme`, `isDark`, `setTheme`, `toggleTheme`.

### Smooth transitions

When `data-theme` changes, the following elements transition their visual properties
over ~400ms to prevent a jarring flash:

- `body`, `html` — background-color, color
- `.ns-navbar`, `.ns-navbar-mobile` — background-color, border-color, color, box-shadow
- `.activity-card`, `.team-card`, `.timeline-card`, `.about-card-inner`
- `.modal-box`, `.ns-footer`, `#back-to-top`

Transition is deliberately **suppressed on `canvas`** elements because particle/WebGL
contexts don't need CSS transitions and it prevents compositing bugs.

---

## Token Overrides Per Theme

### Dark (`:root, :root[data-theme='dark']`)

The default theme. All values documented in `01-design-system.md`.

Key characteristics:
- Background: `#07090e` (near-black, blue-tinted)
- Cards: semi-transparent dark fills with subtle glass sheen
- Text: white primary → slate secondary → blue-gray muted
- Borders: barely-visible white alpha lines
- Shadows: deep black drops with crimson glow accents
- `color-scheme: dark` (tells browser to use dark form controls)

### Light (`[data-theme='light']`)

Key differences from dark:

| Property | Dark value | Light value |
|----------|-----------|-------------|
| `--bg` | `#07090e` | `#ffffff` |
| `--card` | `#121724` | `#ffffff` |
| `--t1` | `#ffffff` | `#1a1a1a` |
| `--t3` | `#94a3b8` | `#5f5f5f` (bumped for WCAG AA) |
| `--bdr` | `rgba(255,255,255,0.06)` | `rgba(230,57,70,0.12)` |
| `--shcard` | `0 12px 48px rgba(0,0,0,0.65)` | `0 4px 24px rgba(0,0,0,0.09)` |
| `--c1` | `#f25c66` | `#e63946` (slightly deeper) |
| `color-scheme` | `dark` | `light` |

### System / Auto-detection

When `theme === 'system'` the resolved theme follows `prefers-color-scheme`. The
listener is attached via `mediaQuery.addEventListener('change', …)` with a fallback
to the deprecated `.addListener()` for older browsers.

---

## Light Mode Extended Overrides (`globals.css`)

Beyond token swaps, light mode applies additional visual corrections:

- **Ambient orb opacity** reduced to `0.18` and `mix-blend-mode: multiply` (prevents
  orbs from washing out light backgrounds)
- **Canvas particle opacity** reduced to `0.35`
- **Cursor orb** switches from red to `--accent-cyan` (`#0097c4`)
- **Scroll progress bar** uses cyan → blue gradient instead of crimson
- **Body background** uses a slate-blue tinted gradient (`#f0f2f8` → `#e4e8f2`)
  instead of the near-black default

### Light Mode Navbar

In light mode the scrolled navbar becomes:

```
background: rgba(248, 247, 245, 0.85)
backdrop-filter: blur(24px) saturate(200%)
border-bottom: 1px solid rgba(204,17,17,0.08)
box-shadow: 0 1px 0 rgba(204,17,17,0.10), 0 6px 32px rgba(0,0,0,0.06)
```

---

## Theme Toggle Component

**File:** `website/src/components/common/ThemeToggle.tsx`

- Renders a `Sun` icon (light mode) and `Moon` icon (dark mode) in a 20×20 container
- Both icons are always rendered — visibility controlled by `opacity` + `transform` transitions
- Active icon: `opacity: 1, rotate: 0deg, scale: 1`
- Inactive icon: `opacity: 0, rotate: ±90deg, scale: 0.5`
- Transition: `0.4s ease` on both opacity and transform
- Hover: background becomes `var(--bdr)` (subtle reveal)
- Press: `scale(0.9)` scale down

---

## `prefers-color-scheme` Auto-Resolution

| OS Setting | Theme Token | Resolved |
|-----------|-------------|---------|
| Light | `system` | `light` |
| Dark | `system` | `dark` |
| Light | `dark` | `dark` |
| Dark | `light` | `light` |
| Light | `light` | `light` |
| Dark | `dark` | `dark` |

---

## `data-theme` vs `data-style`

| Attribute | Controls | Set by |
|-----------|---------|--------|
| `data-theme` | Dark vs light color palette | `ThemeProvider` |
| `data-style` | Visual style mode (glassmorphism, cyberpunk, etc.) | `ThemeProvider` (designStyle state) |

Both attributes coexist on `<html>`:

```html
<html data-theme="dark" data-style="glassmorphism">
```

Styles cascade in this order: base tokens → theme override → style override → accessibility.

---

## Aurora Layer (Dark Mode Only)

When in dark mode, `aurora.css` injects a `body::before` pseudo-element with an animated
radial-gradient background creating subtle purple/blue/red atmospheric glow. This layer:

- Is `position: fixed`, `z-index: 0`, `pointer-events: none`
- Animates with `auroraFloat` (28s, ease-in-out, infinite alternate)
- Is **disabled** in light mode via `[data-theme='light'] body::before { display: none }`
- Also adds iris-gradient borders on cards via `@property --iris-angle` + `@keyframes irisRotate`
