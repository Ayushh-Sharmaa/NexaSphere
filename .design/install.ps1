<#
.SYNOPSIS
    NexaSphere Design Kit — PowerShell Installer (Windows)

.DESCRIPTION
    Copies the complete NexaSphere design system into any web project.

.PARAMETER Target
    Destination folder for CSS files. Default: .\src\styles

.PARAMETER React
    Also copy React ThemeProvider, useTheme hook, ThemeToggle, StyleSwitcher

.PARAMETER Html
    Also copy the HTML starter template to project root

.PARAMETER All
    Copy CSS + React + HTML (equivalent to -React -Html)

.PARAMETER Force
    Overwrite existing files

.PARAMETER DryRun
    Preview what would be copied without writing anything

.EXAMPLE
    .\install.ps1
    .\install.ps1 -Target .\my-app\src\styles
    .\install.ps1 -All
    .\install.ps1 -React -Force
    .\install.ps1 -DryRun
#>

param(
    [string]$Target  = ".\src\styles",
    [switch]$React,
    [switch]$Html,
    [switch]$All,
    [switch]$Force,
    [switch]$DryRun
)

if ($All) { $React = $true; $Html = $true }

$ScriptDir = $PSScriptRoot
$KitDir    = Join-Path $ScriptDir "kit"
$CssSrc    = Join-Path $KitDir    "css"
$ReactSrc  = Join-Path $KitDir    "react"

$TargetCss  = Resolve-Path $Target -ErrorAction SilentlyContinue
if (-not $TargetCss) { $TargetCss = $Target }

# ── Colors ────────────────────────────────────────────────────────────────────
function ok($msg)   { Write-Host "  " -NoNewline; Write-Host "✓" -ForegroundColor Green  -NoNewline; Write-Host " $msg" }
function skip($msg) { Write-Host "  " -NoNewline; Write-Host "–" -ForegroundColor Yellow -NoNewline; Write-Host " $msg" -ForegroundColor DarkGray }
function inf($msg)  { Write-Host "  " -NoNewline; Write-Host "→" -ForegroundColor Cyan   -NoNewline; Write-Host " $msg" }
function hd($msg)   { Write-Host ""; Write-Host $msg -ForegroundColor Cyan -BackgroundColor Black; Write-Host "  $('─' * 52)" }

# ── CSS file list ─────────────────────────────────────────────────────────────
$CssFiles = @(
    @{ file="01-themes.css";          desc="Dark/light CSS custom properties"     },
    @{ file="02-globals.css";         desc="Typography baseline, scrollbar, reset"},
    @{ file="03-animations.css";      desc="30+ keyframes and animation classes"  },
    @{ file="04-aurora.css";          desc="Aurora ambient background layer"      },
    @{ file="05-motion.css";          desc="Scroll reveal, hover, button motion"  },
    @{ file="06-material-system.css"; desc="Material Design 3 surface tokens"     },
    @{ file="07-design-styles.css";   desc="All 25 design style overrides"        },
    @{ file="08-accessibility.css";   desc="WCAG focus rings, reduced motion"     }
)

$ReactFiles = @(
    @{ src="context\ThemeProvider.tsx";     dest="context\theme\ThemeProvider.tsx"         },
    @{ src="hooks\useTheme.ts";             dest="hooks\useTheme.ts"                       },
    @{ src="components\ThemeToggle.tsx";    dest="components\common\ThemeToggle.tsx"       },
    @{ src="components\StyleSwitcher.tsx";  dest="components\common\StyleSwitcher.tsx"     }
)

# ── Helper ────────────────────────────────────────────────────────────────────
function Copy-DesignFile($src, $dest, $label) {
    if (-not (Test-Path $src)) {
        Write-Host "  ⚠ Source not found: $src" -ForegroundColor Yellow
        return $false
    }
    if ((Test-Path $dest) -and -not $Force) {
        skip "Already exists (use -Force): $(Split-Path $dest -Leaf)"
        return $false
    }
    if ($DryRun) {
        inf "[DRY-RUN] Would copy → $dest"
        return $true
    }
    $destDir = Split-Path $dest -Parent
    if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
    Copy-Item -Path $src -Destination $dest -Force
    ok ($label ?? (Split-Path $dest -Leaf))
    return $true
}

# ── Banner ────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "  ╔═══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║   NexaSphere Design Kit — Installer v1    ║" -ForegroundColor Cyan
Write-Host "  ╚═══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
inf "Target CSS dir : $Target"
inf "React files    : $(if($React){'yes'}else{'no'})"
inf "HTML template  : $(if($Html){'yes'}else{'no'})"
inf "Dry run        : $(if($DryRun){'yes'}else{'no'})"
inf "Force overwrite: $(if($Force){'yes'}else{'no'})"

# ── Step 1: CSS ───────────────────────────────────────────────────────────────
hd "① CSS Design System Files"
if (-not $DryRun) { New-Item -ItemType Directory -Path $Target -Force | Out-Null }

foreach ($entry in $CssFiles) {
    $src  = Join-Path $CssSrc   $entry.file
    $dest = Join-Path $Target   $entry.file
    Copy-DesignFile $src $dest "$($entry.file)  — $($entry.desc)"
}

# ── Step 2: Index file ────────────────────────────────────────────────────────
hd "② Generating index.css"
$indexPath = Join-Path $Target "index.css"
if (-not (Test-Path $indexPath) -or $Force) {
    if (-not $DryRun) {
        $lines = @("/* NexaSphere Design Kit — Import all layers in the correct cascade order */", "")
        foreach ($entry in $CssFiles) { $lines += "@import './$($entry.file)';" }
        $lines | Set-Content -Path $indexPath -Encoding UTF8
    }
    ok "index.css — single import for all layers"
} else {
    skip "index.css already exists (use -Force to overwrite)"
}

# ── Step 3: React files ───────────────────────────────────────────────────────
if ($React) {
    hd "③ React Context + Hooks"
    $srcRoot  = Join-Path $ScriptDir "kit\react"
    $destRoot = Resolve-Path (Join-Path $Target "..\..\src") -ErrorAction SilentlyContinue
    if (-not $destRoot) { $destRoot = Join-Path (Split-Path $Target -Parent | Split-Path -Parent) "src" }

    foreach ($rf in $ReactFiles) {
        $src  = Join-Path $srcRoot  $rf.src
        $dest = Join-Path $destRoot $rf.dest
        Copy-DesignFile $src $dest $rf.dest
    }
}

# ── Step 4: HTML Template ─────────────────────────────────────────────────────
if ($Html) {
    hd "④ HTML Starter Template"
    $src  = Join-Path $KitDir "template.html"
    $dest = Join-Path (Get-Location) "design-kit-template.html"
    Copy-DesignFile $src $dest "design-kit-template.html"
}

# ── Done ──────────────────────────────────────────────────────────────────────
hd "✅  Installation Complete"
Write-Host ""
Write-Host "  Next steps:" -ForegroundColor White
Write-Host ""
Write-Host "  1. Import the design system in your entry file:" -ForegroundColor Cyan
Write-Host "     import '$Target/index.css';" -ForegroundColor Green
Write-Host ""
Write-Host "  2. Set the theme on <html>:" -ForegroundColor Cyan
Write-Host "     <html data-theme=`"dark`" data-style=`"glassmorphism`">" -ForegroundColor Green
Write-Host ""
Write-Host "  📚 Full docs: $ScriptDir\README.md" -ForegroundColor DarkGray
Write-Host ""
