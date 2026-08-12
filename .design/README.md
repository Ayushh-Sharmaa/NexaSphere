# NexaSphere Design Kit

> A portable, framework-agnostic design system with **25 visual styles**, dark/light themes,
> aurora ambient effects, Material Design 3 tokens, and full WCAG accessibility built in.
> Drop it into any web project in under 60 seconds.

---

## Quick Install

### Option 1 — Copy the folder

Just copy the entire `.design/` directory into your project root. Then run:

```bash
# CSS only (into ./src/styles/)
node .design/install.js

# CSS + React context/hooks
node .design/install.js --react

# CSS + React + HTML starter template
node .design/install.js --all

# Install to a custom path
node .design/install.js ./my-app/src/styles --react
```

---

### Option 2 — PowerShell (Windows)

```powershell
# CSS only
.\.design\install.ps1

# CSS + React + HTML template
.\.design\install.ps1 -All

# Custom target
.\.design\install.ps1 -Target ".\my-app\src\styles" -React

# Preview without writing
.\.design\install.ps1 -DryRun -All
```

---

### Option 3 — Shell (Linux / macOS / Git Bash)

```bash
# Make executable once
chmod +x .design/install.sh

# CSS only
bash .design/install.sh

# CSS + React + HTML
bash .design/install.sh --all

# Custom target
bash .design/install.sh ./my-app/src/styles --react

# Preview without writing
bash .design/install.sh --dry-run --all
```

---

## After Installing

### Vanilla HTML

```html
<!-- 1. Load Google Fonts (required by the design system) -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link
  href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap"
  rel="stylesheet"
/>

<!-- 2. Load the design system (single import) -->
<link rel="stylesheet" href="./src/styles/index.css" />

<!-- 3. Set theme and style on <html> -->
<html data-theme="dark" data-style="glassmorphism">
```

### React / Vite

```jsx
// main.jsx or main.tsx
import './styles/index.css';

// App.jsx
import { ThemeProvider } from './context/theme/ThemeProvider';

export default function App() {
  return (
    <ThemeProvider>
      <YourApp />
    </ThemeProvider>
  );
}
```

```tsx
// Anywhere in your app
import { useTheme } from './hooks/useTheme';

function MyComponent() {
  const { isDark, toggleTheme, designStyle, setDesignStyle } = useTheme();

  return (
    <button onClick={toggleTheme}>
      {isDark ? '🌙' : '☀️'} Toggle theme
    </button>
  );
}
```

---

## Switching Styles at Runtime

**Via HTML attribute (works everywhere):**

```js
// Switch to any of the 25 styles
document.documentElement.setAttribute('data-style', 'cyberpunk');

// Switch theme
document.documentElement.setAttribute('data-theme', 'light');

// Remove style override (back to default)
document.documentElement.removeAttribute('data-style');
```

**Via React hook (if using ThemeProvider):**

```tsx
const { setDesignStyle, setTheme } = useTheme();

setDesignStyle('vaporwave');   // any of the 25 styles
setTheme('dark');              // 'dark' | 'light' | 'system'
```

---

## The 25 Design Styles

| Value | Name | Character |
|-------|------|-----------|
| `default` | Default | Dark-tech crimson core |
| `skeuomorphism` | Skeuomorphism | Real-world textures, wood & metal |
| `flat` | Flat Design | Bold fills, zero shadows |
| `neumorphism` | Neumorphism | Soft extruded surfaces |
| `glassmorphism` | Glassmorphism | Frosted glass panels |
| `claymorphism` | Claymorphism | Puffy inflated clay forms |
| `aurora` | Aurora UI | Northern lights atmosphere |
| `material` | Material Design | Google Material 3 |
| `bento` | Bento Grid | Dashboard mosaic tiles |
| `minimalism` | Minimalism | Maximum whitespace, minimal ink |
| `monochromatic` | Monochromatic | Single crimson hue spectrum |
| `color-blocking` | Color Blocking | Mondrian geometric zones |
| `neo-brutalism` | Neo-Brutalism | Raw confrontational anti-design |
| `maximalism` | Maximalism | More is more, layered chaos |
| `cyberpunk` | Cyberpunk | Neon on dark chrome grid |
| `vaporwave` | Vaporwave | 80s pastel retro nostalgia |
| `pixel-art` | Pixel Art | 8-bit chunky retro gaming |
| `art-deco` | Art Deco | 1920s gold geometric luxury |
| `card-based` | Card-Based | Everything in elevated cards |
| `typography` | Typography | Type-first editorial scale |
| `asymmetric` | Asymmetric | Deliberate imbalance layout |
| `illustrative` | Illustrative | Hand-drawn organic feel |
| `parallax` | Parallax | CSS depth layer separation |
| `spatial` | Spatial UI | visionOS floating panels |
| `dark-native` | Dark Native | Best-in-class pure dark |
| `vui` | Voice / VUI | Chat bubble conversational UI |

---

## CSS File Load Order

The design system must be loaded in this order (handled automatically by `index.css`):

```
01-themes.css           ← CSS custom property tokens (dark + light)
02-globals.css          ← Typography, scrollbar, reset, utility classes
03-animations.css       ← All @keyframes (30+ animations)
04-aurora.css           ← Aurora ambient background layer
05-motion.css           ← Scroll reveal, hover, button motion
06-material-system.css  ← Material Design 3 surface tokens
07-design-styles.css    ← 25 [data-style="X"] override blocks
08-accessibility.css    ← Focus rings, reduced motion (always last)
```

---

## What's Inside `kit/`

```
kit/
├── css/
│   ├── 01-themes.css           ← dark/light palette tokens
│   ├── 02-globals.css          ← typography, scrollbar, utility
│   ├── 03-animations.css       ← 30+ keyframes
│   ├── 04-aurora.css           ← aurora ambient layer
│   ├── 05-motion.css           ← scroll reveal, hover effects
│   ├── 06-material-system.css  ← Material Design 3 tokens
│   ├── 07-design-styles.css    ← all 25 design style overrides
│   ├── 08-accessibility.css    ← WCAG focus rings, reduced motion
│   └── index.css               ← single entry import (auto-generated)
│
├── react/
│   ├── context/
│   │   └── ThemeProvider.tsx   ← theme + designStyle React context
│   ├── hooks/
│   │   └── useTheme.ts         ← useTheme() hook
│   └── components/
│       ├── ThemeToggle.tsx     ← dark/light toggle button
│       └── StyleSwitcher.tsx   ← 25-style picker panel
│
└── template.html               ← standalone HTML demo with live style switcher
```

---

## Keeping the Kit Up to Date

If you're working inside the NexaSphere repo and update any CSS files:

```bash
node .design/sync.js
```

This copies changed files from `website/src/styles/` into `kit/css/` using
modification timestamps — unchanged files are skipped automatically.

---

## Install Flags Reference

| Flag | Short | Description |
|------|-------|-------------|
| `--react` | `-r` | Copy React ThemeProvider, useTheme, ThemeToggle, StyleSwitcher |
| `--html` | | Copy HTML starter template to project root |
| `--all` | `-a` | CSS + React + HTML (equivalent to `--react --html`) |
| `--force` | `-f` | Overwrite already-existing files |
| `--dry-run` | `-d` | Preview what would be copied, nothing written |
| `--no-color` | | Disable ANSI colors in output |
| `--target <path>` | `-t` | Custom CSS destination (default: `./src/styles`) |

---

## Design Docs

| File | Contents |
|------|---------|
| [01-design-system.md](./01-design-system.md) | Every CSS token, value, and meaning |
| [02-themes.md](./02-themes.md) | Dark/light theme architecture |
| [03-design-styles.md](./03-design-styles.md) | All 25 styles with character & token values |

---

## Requirements

- **Node.js 16+** — for the installer scripts only
- **Modern browser** — for `backdrop-filter`, `@property`, `color-scheme`
- **No npm dependencies** — zero runtime dependencies

---

## License

MIT — use in any project, commercial or personal.
