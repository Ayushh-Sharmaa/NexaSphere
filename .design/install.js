#!/usr/bin/env node
/**
 * NexaSphere Design Kit — Installer
 * ------------------------------------
 * Copies the complete NexaSphere design system into any web project.
 *
 * Usage:
 *   node install.js                       → installs into ./src/styles/
 *   node install.js ./my-app/src/styles   → custom target path
 *   node install.js --react               → also copies React context + hooks
 *   node install.js --html                → also copies HTML starter template
 *   node install.js --all                 → CSS + React + HTML
 *   node install.js --dry-run             → preview without writing files
 *
 * Options:
 *   --target, -t <path>   Destination folder (default: ./src/styles)
 *   --react, -r           Copy ThemeProvider.tsx + useTheme.ts + ThemeToggle.tsx
 *   --html                Copy starter template.html to project root
 *   --all, -a             Everything (CSS + React + HTML)
 *   --force, -f           Overwrite existing files
 *   --dry-run, -d         Print what would be copied, don't write anything
 *   --no-color            Disable colored output
 */

const fs = require("fs");
const path = require("path");

// ─── CLI argument parsing ─────────────────────────────────────────────────────
const args = process.argv.slice(2);
const flags = {
  target: "./src/styles",
  react:
    args.includes("--react") ||
    args.includes("-r") ||
    args.includes("--all") ||
    args.includes("-a"),
  html:
    args.includes("--html") || args.includes("--all") || args.includes("-a"),
  force: args.includes("--force") || args.includes("-f"),
  dryRun: args.includes("--dry-run") || args.includes("-d"),
  noColor: args.includes("--no-color"),
};

const targetFlagIdx = args.findIndex((a) => a === "--target" || a === "-t");
if (targetFlagIdx !== -1 && args[targetFlagIdx + 1]) {
  flags.target = args[targetFlagIdx + 1];
} else {
  // first positional arg (not a flag)
  const positional = args.find((a) => !a.startsWith("-"));
  if (positional) flags.target = positional;
}

// ─── Colors ───────────────────────────────────────────────────────────────────
const c = flags.noColor
  ? {
      reset: "",
      bold: "",
      dim: "",
      green: "",
      cyan: "",
      yellow: "",
      red: "",
      magenta: "",
    }
  : {
      reset: "\x1b[0m",
      bold: "\x1b[1m",
      dim: "\x1b[2m",
      green: "\x1b[32m",
      cyan: "\x1b[36m",
      yellow: "\x1b[33m",
      red: "\x1b[31m",
      magenta: "\x1b[35m",
    };

const log = (msg) => process.stdout.write(msg + "\n");
const ok = (msg) => log(`  ${c.green}✓${c.reset} ${msg}`);
const skip = (msg) => log(`  ${c.yellow}–${c.reset} ${c.dim}${msg}${c.reset}`);
const warn = (msg) => log(`  ${c.yellow}⚠${c.reset} ${msg}`);
const err = (msg) => log(`  ${c.red}✗${c.reset} ${msg}`);
const info = (msg) => log(`  ${c.cyan}→${c.reset} ${msg}`);
const head = (msg) => log(`\n${c.bold}${c.magenta}${msg}${c.reset}`);
const sep = () => log(`  ${"─".repeat(52)}`);

// ─── Paths ────────────────────────────────────────────────────────────────────
const KIT_DIR = path.join(__dirname, "kit");
const CSS_SRC = path.join(KIT_DIR, "css");
const REACT_SRC = path.join(KIT_DIR, "react");
const TEMPLATE_SRC = path.join(KIT_DIR, "template.html");

const TARGET_CSS = path.resolve(flags.target);
const TARGET_ROOT = path.resolve(flags.target, "..", ".."); // 2 levels up from src/styles
const TARGET_REACT = path.join(TARGET_ROOT, "src");

// ─── File manifests ───────────────────────────────────────────────────────────
const CSS_FILES = [
  { file: "01-themes.css", desc: "Dark/light CSS custom properties" },
  { file: "02-globals.css", desc: "Typography baseline, scrollbar, reset" },
  { file: "03-animations.css", desc: "30+ keyframes and animation classes" },
  { file: "04-aurora.css", desc: "Aurora ambient background layer" },
  { file: "05-motion.css", desc: "Scroll reveal, hover, button motion" },
  { file: "06-material-system.css", desc: "Material Design 3 surface tokens" },
  { file: "07-design-styles.css", desc: "All 25 design style overrides" },
  { file: "08-accessibility.css", desc: "WCAG focus rings, reduced motion" },
];

const REACT_FILES = [
  {
    file: "context/ThemeProvider.tsx",
    dest: "context/theme/ThemeProvider.tsx",
  },
  { file: "hooks/useTheme.ts", dest: "hooks/useTheme.ts" },
  {
    file: "components/ThemeToggle.tsx",
    dest: "components/common/ThemeToggle.tsx",
  },
  {
    file: "components/StyleSwitcher.tsx",
    dest: "components/common/StyleSwitcher.tsx",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function ensureDir(dirPath) {
  if (!flags.dryRun) fs.mkdirSync(dirPath, { recursive: true });
}

function copyFile(src, dest, label) {
  if (!fs.existsSync(src)) {
    warn(`Source not found: ${path.relative(__dirname, src)}`);
    return false;
  }
  if (fs.existsSync(dest) && !flags.force) {
    skip(`Already exists (use --force to overwrite): ${path.basename(dest)}`);
    return false;
  }
  if (flags.dryRun) {
    info(`[DRY-RUN] Would copy → ${path.relative(process.cwd(), dest)}`);
    return true;
  }
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
  ok(`${label || path.basename(dest)}`);
  return true;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
log("");
log(
  `${c.bold}${c.cyan}  ╔═══════════════════════════════════════════╗${c.reset}`
);
log(
  `${c.bold}${c.cyan}  ║   NexaSphere Design Kit — Installer v1    ║${c.reset}`
);
log(
  `${c.bold}${c.cyan}  ╚═══════════════════════════════════════════╝${c.reset}`
);

log("");
info(`Target CSS dir : ${c.bold}${TARGET_CSS}${c.reset}`);
info(
  `React files    : ${flags.react ? c.green + "yes" : c.dim + "no"}${c.reset}`
);
info(
  `HTML template  : ${flags.html ? c.green + "yes" : c.dim + "no"}${c.reset}`
);
info(
  `Dry run        : ${flags.dryRun ? c.yellow + "yes" : c.dim + "no"}${c.reset}`
);
info(
  `Force overwrite: ${flags.force ? c.yellow + "yes" : c.dim + "no"}${c.reset}`
);

// ── Step 1: CSS files ─────────────────────────────────────────────────────────
head("① CSS Design System Files");
sep();

let cssOk = 0;
ensureDir(TARGET_CSS);

for (const { file, desc } of CSS_FILES) {
  const src = path.join(CSS_SRC, file);
  const dest = path.join(TARGET_CSS, file);
  const copied = copyFile(src, dest, `${file}  ${c.dim}— ${desc}${c.reset}`);
  if (copied) cssOk++;
}

// ── Step 2: Index import file ─────────────────────────────────────────────────
head("② Generating index import file");
sep();

const importLines = CSS_FILES.map(({ file }) => `@import './${file}';`).join(
  "\n"
);

const indexPath = path.join(TARGET_CSS, "index.css");
if (!fs.existsSync(indexPath) || flags.force) {
  if (!flags.dryRun) {
    fs.writeFileSync(
      indexPath,
      `/* NexaSphere Design Kit — Import all layers in the correct cascade order */\n\n${importLines}\n`
    );
  }
  ok(
    `index.css  ${c.dim}— single import that pulls all layers in correct order${c.reset}`
  );
} else {
  skip("index.css already exists (use --force to overwrite)");
}

// ── Step 3: React files (optional) ───────────────────────────────────────────
if (flags.react) {
  head("③ React Context + Hooks");
  sep();
  for (const { file, dest } of REACT_FILES) {
    const src = path.join(REACT_SRC, file);
    const destFull = path.join(TARGET_REACT, dest);
    copyFile(src, destFull, dest);
  }
}

// ── Step 4: HTML template (optional) ─────────────────────────────────────────
if (flags.html) {
  head("④ HTML Starter Template");
  sep();
  copyFile(
    TEMPLATE_SRC,
    path.join(process.cwd(), "design-kit-template.html"),
    "design-kit-template.html"
  );
}

// ── Done ──────────────────────────────────────────────────────────────────────
head("✅  Installation Complete");
sep();

log("");
log(`  ${c.bold}Next steps:${c.reset}`);
log("");
log(`  ${c.cyan}1.${c.reset} Import the design system in your entry file:`);
log("");
log(`     ${c.dim}// In your main CSS or JS entry file:${c.reset}`);
log(`     ${c.green}import '${flags.target}/index.css';${c.reset}`);
log("");
log(`  ${c.cyan}2.${c.reset} Set the theme on <html>:`);
log("");
log(
  `     ${c.green}<html data-theme="dark">          ${c.dim}<!-- dark | light -->${c.reset}`
);
log(
  `     ${c.green}<html data-style="glassmorphism"> ${c.dim}<!-- any of the 25 styles -->${c.reset}`
);
log("");

if (flags.react) {
  log(`  ${c.cyan}3.${c.reset} Wrap your app in ThemeProvider:`);
  log("");
  log(
    `     ${c.green}import { ThemeProvider } from './context/theme/ThemeProvider';${c.reset}`
  );
  log(`     ${c.green}<ThemeProvider><App /></ThemeProvider>${c.reset}`);
  log("");
  log(`  ${c.cyan}4.${c.reset} Use the hook anywhere:`);
  log("");
  log(`     ${c.green}import { useTheme } from './hooks/useTheme';${c.reset}`);
  log(
    `     ${c.green}const { isDark, setDesignStyle } = useTheme();${c.reset}`
  );
  log("");
}

log(
  `  ${c.cyan}📚${c.reset} Full design docs: ${c.dim}${path.join(__dirname, "README.md")}${c.reset}`
);
log(
  `  ${c.cyan}🎨${c.reset} 25 style reference: ${c.dim}${path.join(__dirname, "03-design-styles.md")}${c.reset}`
);
log("");
