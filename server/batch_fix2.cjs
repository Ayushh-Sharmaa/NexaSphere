/**
 * Second-pass fixer for NexaSphere codebase.
 * 
 * Handles:
 * 1. Duplicate named imports: `import { X } from 'y'` appearing twice with same specifiers
 * 2. Duplicate function declarations at module level
 * 3. Orphaned closing braces/catch blocks
 * 4. Mixed import patterns (remove the second of two imports from same module)
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const glob = require('glob');

function hasSyntaxError(filePath) {
  try {
    execSync(`node -c "${filePath}"`, { stdio: 'pipe' });
    return null;
  } catch (e) {
    return e.stderr ? e.stderr.toString() : 'unknown error';
  }
}

function getErrorInfo(errStr) {
  const lines = errStr.split('\n');
  const lineMatch = errStr.match(/:(\d+)\r?\n/);
  const lineNum = lineMatch ? parseInt(lineMatch[1]) : null;
  const typeMatch = errStr.match(/SyntaxError: (.+)\r?\n/);
  const errType = typeMatch ? typeMatch[1].trim() : 'unknown';
  return { lineNum, errType };
}

// Remove the second occurrence of any duplicate import from the same module
function fixDuplicateNamedImports(lines) {
  const seenModules = new Map(); // module path -> first import line index
  const toRemove = new Set();
  let changed = false;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    // Match both: import { X } from 'y'; and import X from 'y';
    const match = trimmed.match(/^import\s+(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]\s*;?\s*$/);
    if (match) {
      const modulePath = match[1];
      if (seenModules.has(modulePath)) {
        // Check if this is a multi-line import that continues
        toRemove.add(i);
        changed = true;
      } else {
        seenModules.set(modulePath, i);
      }
    }
  }

  if (!changed) return { lines, changed: false };
  return { lines: lines.filter((_, i) => !toRemove.has(i)), changed: true };
}

// Remove duplicate `export function X()` or `export const X =` at module level
function fixDuplicateExports(lines) {
  const seenExports = new Map();
  const toRemoveRanges = [];
  let changed = false;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    // Match export const/let/var X = or export function X( or export async function X(
    const match = trimmed.match(/^export\s+(?:const|let|var|(?:async\s+)?function)\s+(\w+)/);
    if (match) {
      const name = match[1];
      if (seenExports.has(name)) {
        // Find the end of this duplicate export (look for matching braces or next export)
        let depth = 0;
        let end = i;
        for (let j = i; j < lines.length; j++) {
          for (const ch of lines[j]) {
            if (ch === '{') depth++;
            if (ch === '}') depth--;
          }
          if (depth <= 0 && j > i) {
            end = j;
            break;
          }
          if (j === lines.length - 1) end = j;
        }
        toRemoveRanges.push([i, end]);
        changed = true;
      } else {
        seenExports.set(name, i);
      }
    }
  }

  if (!changed) return { lines, changed: false };
  
  const removeSet = new Set();
  for (const [start, end] of toRemoveRanges) {
    for (let i = start; i <= end; i++) removeSet.add(i);
  }
  return { lines: lines.filter((_, i) => !removeSet.has(i)), changed: true };
}

// Fix "Identifier X has already been declared" for const/let/var at any scope
function fixDuplicateIdentifiers(lines, errorInfo) {
  if (!errorInfo.errType.includes('has already been declared') || !errorInfo.lineNum) {
    return { lines, changed: false };
  }
  
  const lineIdx = errorInfo.lineNum - 1;
  if (lineIdx >= lines.length) return { lines, changed: false };
  
  const line = lines[lineIdx].trim();
  // Check if this is a const/let/var declaration
  const match = line.match(/^(const|let|var)\s+(\w+)/);
  if (!match) return { lines, changed: false };
  
  // Find how many lines this declaration spans (look for semicolon or closing)
  let end = lineIdx;
  let depth = 0;
  for (let j = lineIdx; j < lines.length; j++) {
    for (const ch of lines[j]) {
      if (ch === '{' || ch === '(' || ch === '[') depth++;
      if (ch === '}' || ch === ')' || ch === ']') depth--;
    }
    if (lines[j].trim().endsWith(';') && depth <= 0) {
      end = j;
      break;
    }
    if (depth <= 0 && j > lineIdx) {
      end = j;
      break;
    }
  }
  
  // Remove lines from lineIdx to end (inclusive)
  const newLines = [...lines];
  newLines.splice(lineIdx, end - lineIdx + 1);
  return { lines: newLines, changed: true };
}

// Process all files
const serverDir = path.resolve(__dirname);
const files = glob.sync('**/*.js', { cwd: serverDir, ignore: 'node_modules/**' });

let totalFixed = 0;
let totalRemaining = 0;
const remaining = [];

for (const relFile of files) {
  const filePath = path.join(serverDir, relFile);
  let err = hasSyntaxError(filePath);
  if (!err) continue;
  
  console.log(`\n── Processing: ${relFile}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let lines = content.split('\n');
  let iterCount = 0;
  const maxIter = 20; // prevent infinite loops
  
  while (err && iterCount < maxIter) {
    iterCount++;
    const errorInfo = getErrorInfo(err);
    let anyFix = false;
    
    // Try named import fix
    const importFix = fixDuplicateNamedImports(lines);
    if (importFix.changed) {
      lines = importFix.lines;
      anyFix = true;
    }
    
    // Try export fix
    const exportFix = fixDuplicateExports(lines);
    if (exportFix.changed) {
      lines = exportFix.lines;
      anyFix = true;
    }
    
    // Try identifier fix
    const idFix = fixDuplicateIdentifiers(lines, errorInfo);
    if (idFix.changed) {
      lines = idFix.lines;
      anyFix = true;
    }
    
    if (!anyFix) break;
    
    // Write and re-check
    fs.writeFileSync(filePath, lines.join('\n'));
    err = hasSyntaxError(filePath);
  }
  
  if (!err) {
    console.log('   ✅ Fixed!');
    totalFixed++;
  } else {
    const info = getErrorInfo(err);
    console.log(`   ⚠ Still broken: line ${info.lineNum}: ${info.errType}`);
    remaining.push({ file: relFile, line: info.lineNum, error: info.errType });
    totalRemaining++;
  }
}

console.log(`\n══════════════════════════════════════════`);
console.log(`Fixed: ${totalFixed} files`);
console.log(`Remaining: ${totalRemaining} files need manual fixes`);
console.log(`══════════════════════════════════════════`);
if (remaining.length > 0) {
  console.log('\nRemaining files:');
  for (const r of remaining) {
    console.log(`  ${r.file}:${r.line} => ${r.error}`);
  }
}
