#!/usr/bin/env bash
# NexaSphere Design Kit — Shell Installer (Linux / macOS / Git Bash on Windows)
#
# Usage:
#   bash install.sh                         → installs CSS to ./src/styles/
#   bash install.sh ./my-app/src/styles     → custom target
#   bash install.sh --all                   → CSS + React + HTML template
#   bash install.sh --react                 → CSS + React files
#   bash install.sh --html                  → CSS + HTML starter template
#   bash install.sh --force                 → overwrite existing files
#   bash install.sh --dry-run               → preview without writing

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KIT_DIR="$SCRIPT_DIR/kit"
CSS_SRC="$KIT_DIR/css"
REACT_SRC="$KIT_DIR/react"

TARGET_CSS="./src/styles"
DO_REACT=false
DO_HTML=false
DO_FORCE=false
DRY_RUN=false

# ── Parse args ────────────────────────────────────────────────────────────────
for arg in "$@"; do
  case $arg in
    --react|-r)  DO_REACT=true ;;
    --html)      DO_HTML=true  ;;
    --all|-a)    DO_REACT=true; DO_HTML=true ;;
    --force|-f)  DO_FORCE=true ;;
    --dry-run|-d) DRY_RUN=true ;;
    --*) ;;
    *) TARGET_CSS="$arg" ;;
  esac
done

# ── Colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'
YELLOW='\033[1;33m'; BOLD='\033[1m'; DIM='\033[2m'; RESET='\033[0m'

ok()   { echo -e "  ${GREEN}✓${RESET} $1"; }
skip() { echo -e "  ${YELLOW}–${RESET} ${DIM}$1${RESET}"; }
info() { echo -e "  ${CYAN}→${RESET} $1"; }
head() { echo -e "\n${BOLD}${CYAN}$1${RESET}"; echo -e "  ────────────────────────────────────────────────────"; }

# ── CSS Files ─────────────────────────────────────────────────────────────────
CSS_FILES=(
  "01-themes.css"
  "02-globals.css"
  "03-animations.css"
  "04-aurora.css"
  "05-motion.css"
  "06-material-system.css"
  "07-design-styles.css"
  "08-accessibility.css"
)

copy_file() {
  local src="$1" dest="$2" label="$3"
  if [ ! -f "$src" ]; then
    echo -e "  ${YELLOW}⚠${RESET} Source not found: $src"
    return 1
  fi
  if [ -f "$dest" ] && [ "$DO_FORCE" = false ]; then
    skip "Already exists (use --force): $(basename $dest)"
    return 0
  fi
  if [ "$DRY_RUN" = true ]; then
    info "[DRY-RUN] Would copy → $dest"
    return 0
  fi
  mkdir -p "$(dirname $dest)"
  cp "$src" "$dest"
  ok "${label:-$(basename $dest)}"
}

# ── Banner ────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${CYAN}  ╔═══════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${CYAN}  ║   NexaSphere Design Kit — Installer v1    ║${RESET}"
echo -e "${BOLD}${CYAN}  ╚═══════════════════════════════════════════╝${RESET}"
echo ""
info "Target CSS dir : ${BOLD}$TARGET_CSS${RESET}"
info "React files    : $([ $DO_REACT = true ] && echo -e "${GREEN}yes" || echo -e "${DIM}no")${RESET}"
info "HTML template  : $([ $DO_HTML  = true ] && echo -e "${GREEN}yes" || echo -e "${DIM}no")${RESET}"
info "Dry run        : $([ $DRY_RUN  = true ] && echo -e "${YELLOW}yes" || echo -e "${DIM}no")${RESET}"

# ── Step 1: CSS ───────────────────────────────────────────────────────────────
head "① CSS Design System Files"
[ "$DRY_RUN" = false ] && mkdir -p "$TARGET_CSS"

for f in "${CSS_FILES[@]}"; do
  copy_file "$CSS_SRC/$f" "$TARGET_CSS/$f"
done

# ── Step 2: Index ─────────────────────────────────────────────────────────────
head "② Generating index.css"
INDEX_FILE="$TARGET_CSS/index.css"
if [ ! -f "$INDEX_FILE" ] || [ "$DO_FORCE" = true ]; then
  if [ "$DRY_RUN" = false ]; then
    echo "/* NexaSphere Design Kit — Import all layers */" > "$INDEX_FILE"
    echo "" >> "$INDEX_FILE"
    for f in "${CSS_FILES[@]}"; do
      echo "@import './$f';" >> "$INDEX_FILE"
    done
  fi
  ok "index.css — single import for all layers"
else
  skip "index.css already exists"
fi

# ── Step 3: React ─────────────────────────────────────────────────────────────
if [ "$DO_REACT" = true ]; then
  head "③ React Context + Hooks"
  TARGET_SRC="$(dirname $(dirname $TARGET_CSS))/src"
  copy_file "$REACT_SRC/context/ThemeProvider.tsx"     "$TARGET_SRC/context/theme/ThemeProvider.tsx"
  copy_file "$REACT_SRC/hooks/useTheme.ts"             "$TARGET_SRC/hooks/useTheme.ts"
  copy_file "$REACT_SRC/components/ThemeToggle.tsx"    "$TARGET_SRC/components/common/ThemeToggle.tsx"
  copy_file "$REACT_SRC/components/StyleSwitcher.tsx"  "$TARGET_SRC/components/common/StyleSwitcher.tsx"
fi

# ── Step 4: HTML ──────────────────────────────────────────────────────────────
if [ "$DO_HTML" = true ]; then
  head "④ HTML Starter Template"
  copy_file "$KIT_DIR/template.html" "./design-kit-template.html"
fi

# ── Done ──────────────────────────────────────────────────────────────────────
head "✅  Installation Complete"
echo ""
echo -e "  ${BOLD}Next steps:${RESET}"
echo ""
echo -e "  ${CYAN}1.${RESET} Import the design system in your entry file:"
echo ""
echo -e "     ${GREEN}import '$TARGET_CSS/index.css';${RESET}"
echo ""
echo -e "  ${CYAN}2.${RESET} Set the theme on <html>:"
echo ""
echo -e "     ${GREEN}<html data-theme=\"dark\" data-style=\"glassmorphism\">${RESET}"
echo ""
echo -e "  ${CYAN}📚${RESET} Full docs: ${DIM}$SCRIPT_DIR/README.md${RESET}"
echo ""
