#!/usr/bin/env node
/**
 * NexaSphere Design Kit — Sync Script
 * ─────────────────────────────────────
 * Copies the live CSS files from the NexaSphere website source into kit/css/
 * so the kit stays up-to-date with any changes made to the design system.
 *
 * Run this from within the NexaSphere repo whenever you update a CSS file:
 *
 *   node .design/sync.js
 *
 * This is NOT required when using the kit in other projects — the kit/css/
 * folder already contains the latest exported copy.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const CSS_SRC = path.join(ROOT, "website", "src", "styles");
const KIT_CSS = path.join(__dirname, "kit", "css");

const REACT_SRC = path.join(ROOT, "website", "src");
const KIT_REACT = path.join(__dirname, "kit", "react");

// CSS: source filename → kit filename (with numbered prefix for correct load order)
const CSS_MAP = [
  { src: "themes.css", kit: "01-themes.css" },
  { src: "globals.css", kit: "02-globals.css" },
  { src: "animations.css", kit: "03-animations.css" },
  { src: "aurora.css", kit: "04-aurora.css" },
  { src: "motion.css", kit: "05-motion.css" },
  { src: "material-system.css", kit: "06-material-system.css" },
  { src: "design-styles.css", kit: "07-design-styles.css" },
  { src: "accessibility.css", kit: "08-accessibility.css" },
];

// React: source path → kit path
const REACT_MAP = [
  { src: "context/theme/ThemeProvider.tsx", kit: "context/ThemeProvider.tsx" },
  { src: "hooks/useTheme.ts", kit: "hooks/useTheme.ts" },
  {
    src: "components/common/ThemeToggle.tsx",
    kit: "components/ThemeToggle.tsx",
  },
  {
    src: "components/common/StyleSwitcher.tsx",
    kit: "components/StyleSwitcher.tsx",
  },
];

const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

const ok = (msg) => console.log(`  ${GREEN}✓${RESET} ${msg}`);
const skip = (msg) => console.log(`  ${YELLOW}–${RESET} ${DIM}${msg}${RESET}`);
const head = (msg) =>
  console.log(`\n${BOLD}${CYAN}${msg}${RESET}\n  ${"─".repeat(52)}`);

// ── Ensure kit dirs exist ─────────────────────────────────────────────────────
fs.mkdirSync(KIT_CSS, { recursive: true });
fs.mkdirSync(path.join(KIT_REACT, "context"), { recursive: true });
fs.mkdirSync(path.join(KIT_REACT, "hooks"), { recursive: true });
fs.mkdirSync(path.join(KIT_REACT, "components"), { recursive: true });

console.log(`\n${BOLD}${CYAN}  NexaSphere Design Kit — Sync${RESET}`);
console.log(`  ${DIM}Syncing live source → kit/css/ and kit/react/${RESET}\n`);

// ── CSS sync ──────────────────────────────────────────────────────────────────
head("CSS Files");
for (const { src, kit } of CSS_MAP) {
  const srcPath = path.join(CSS_SRC, src);
  const kitPath = path.join(KIT_CSS, kit);

  if (!fs.existsSync(srcPath)) {
    skip(`MISSING: ${src} — skipped (will be created later)`);
    continue;
  }

  const srcMtime = fs.statSync(srcPath).mtimeMs;
  const kitMtime = fs.existsSync(kitPath) ? fs.statSync(kitPath).mtimeMs : 0;

  if (srcMtime > kitMtime) {
    fs.copyFileSync(srcPath, kitPath);
    ok(`${src} → kit/css/${kit}`);
  } else {
    skip(`${kit} — already up to date`);
  }
}

// ── React sync ────────────────────────────────────────────────────────────────
head("React Files");
for (const { src, kit } of REACT_MAP) {
  const srcPath = path.join(REACT_SRC, src);
  const kitPath = path.join(KIT_REACT, kit);

  if (!fs.existsSync(srcPath)) {
    skip(`MISSING: ${src} — skipped`);
    continue;
  }

  const srcMtime = fs.statSync(srcPath).mtimeMs;
  const kitMtime = fs.existsSync(kitPath) ? fs.statSync(kitPath).mtimeMs : 0;

  if (srcMtime > kitMtime) {
    fs.copyFileSync(srcPath, kitPath);
    ok(`${src} → kit/react/${kit}`);
  } else {
    skip(`${kit} — already up to date`);
  }
}

console.log(
  `\n  ${GREEN}✅ Sync complete.${RESET} Run ${CYAN}node install.js --dry-run --all${RESET} to preview the kit.\n`
);
