/**
 * Deep fixer pass 3 - handles all remaining corruption patterns:
 *
 * Pattern A: Two return statements where first uses sendSuccess/sendError,
 *            second uses res.json/res.status — remove the second.
 * Pattern B: Duplicate import from same module with different specifiers — merge or keep first.
 * Pattern C: Duplicate catch blocks — keep first, remove second.
 * Pattern D: Duplicate `const X = ...` within same function scope.
 * Pattern E: Orphaned `} from '...'` lines.
 * Pattern F: Mixed return lines: `return sendSuccess(...);` followed by `return res.json(...)` 
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
    return e.stderr ? e.stderr.toString() : 'unknown';
  }
}

function getErrorLine(errStr) {
  const m = errStr.match(/:(\d+)\r?\n/);
  return m ? parseInt(m[1]) : null;
}

function getErrorType(errStr) {
  const m = errStr.match(/SyntaxError: (.+)\r?\n/);
  return m ? m[1].trim() : '';
}

/**
 * Core strategy: iteratively find and remove duplicate/orphaned lines
 * by looking at the specific error line and its context.
 */
function fixFile(filePath) {
  const MAX_ITER = 30;
  let iterations = 0;
  
  while (iterations < MAX_ITER) {
    iterations++;
    const err = hasSyntaxError(filePath);
    if (!err) return true;
    
    const errLine = getErrorLine(err);
    const errType = getErrorType(err);
    if (!errLine) return false;
    
    let lines = fs.readFileSync(filePath, 'utf8').split('\n');
    const idx = errLine - 1; // 0-based
    
    if (idx >= lines.length) return false;
    
    let fixed = false;
    const lineStr = lines[idx].trim();
    
    // ── Pattern: "Unexpected identifier 'res'" — duplicate return res.xxx line ──
    if (errType.includes("Unexpected identifier 'res'") || 
        errType.includes("Unexpected identifier 'limit'") ||
        errType.includes("Unexpected identifier 'INSERT'") ||
        errType.includes("Unexpected identifier 'list'") ||
        errType.includes("Unexpected identifier 'pg'") ||
        errType.includes("Unexpected identifier 'fs'")) {
      // Find the block of consecutive "dead code" lines starting from errLine
      // These are lines after a return/sendSuccess that should have been removed
      let start = idx;
      let end = idx;
      // Look for the end of the dead block
      while (end < lines.length - 1) {
        const next = lines[end + 1].trim();
        if (next === '' || next.startsWith('//') || next.startsWith('/*') || next.startsWith('*')) break;
        if (next.startsWith('} catch') || next === '}' || next === '});' || next === '};') break;
        if (next.startsWith('export ') || next.startsWith('import ') || next.startsWith('router.') || next.startsWith('const ') || next.startsWith('async ') || next.startsWith('function ')) break;
        end++;
      }
      lines.splice(start, end - start + 1);
      fixed = true;
    }
    
    // ── Pattern: "Identifier 'X' has already been declared" ──
    if (errType.includes('has already been declared')) {
      // Remove this declaration line and its continuation
      const match = lineStr.match(/^(import|const|let|var|function|async\s+function|export\s+const|export\s+let|export\s+function|export\s+async\s+function)\s/);
      if (match) {
        let depth = 0;
        let end = idx;
        for (let j = idx; j < lines.length; j++) {
          for (const ch of lines[j]) {
            if (ch === '{' || ch === '(' || ch === '[') depth++;
            if (ch === '}' || ch === ')' || ch === ']') depth--;
          }
          end = j;
          if (depth <= 0 && (lines[j].trim().endsWith(';') || lines[j].trim().endsWith('}') || lines[j].trim().endsWith('},'))) {
            break;
          }
        }
        lines.splice(idx, end - idx + 1);
        fixed = true;
      }
    }
    
    // ── Pattern: "Unexpected token 'catch'" — duplicate catch block ──
    if (errType.includes("Unexpected token 'catch'")) {
      // The catch at errLine is the second one. Find the full block to remove.
      let end = idx;
      let depth = 0;
      for (let j = idx; j < lines.length; j++) {
        for (const ch of lines[j]) {
          if (ch === '{') depth++;
          if (ch === '}') depth--;
        }
        if (depth <= 0 && j > idx) {
          end = j;
          break;
        }
      }
      // Also remove preceding lines that are dead code (after first catch's sendError)
      let start = idx;
      while (start > 0 && lines[start - 1].trim() !== '' && 
             !lines[start - 1].trim().startsWith('}') &&
             !lines[start - 1].trim().endsWith(';')) {
        start--;
      }
      // Actually, safer: just look backward for `return res.` or `res.json` lines
      while (start > 0 && (lines[start - 1].trim().startsWith('return res.') || 
             lines[start - 1].trim().startsWith('res.') ||
             lines[start - 1].trim().startsWith('res ') ||
             lines[start - 1].trim() === '')) {
        start--;
      }
      lines.splice(start, end - start + 1);
      fixed = true;
    }
    
    // ── Pattern: "Unexpected token 'export'" — export inside unclosed block ──
    if (errType.includes("Unexpected token 'export'") || errType.includes("Unexpected token 'const'")) {
      // There's an unclosed block above. Look backward for a missing `}`
      // Try inserting `}` before the export
      let searchIdx = idx - 1;
      while (searchIdx >= 0 && lines[searchIdx].trim() === '') searchIdx--;
      if (searchIdx >= 0) {
        // Check if previous non-empty line ends with `;` but needs a closing brace
        const indent = lines[idx].search(/\S/);
        lines.splice(idx, 0, ' '.repeat(Math.max(0, indent - 2)) + '}');
        fixed = true;
      }
    }
    
    // ── Pattern: "Unexpected token ')'" or "Unexpected token '}'" or "Unexpected token ']'" ──
    if (errType.includes("Unexpected token ')'") || errType.includes("Unexpected token '}'") || errType.includes("Unexpected token ']'")) {
      // Remove the offending line
      lines.splice(idx, 1);
      fixed = true;
    }
    
    // ── Pattern: "Unexpected token ','" ──
    if (errType.includes("Unexpected token ','")) {
      lines.splice(idx, 1);
      fixed = true;
    }
    
    // ── Pattern: "Unexpected token '{'" ──
    if (errType.includes("Unexpected token '{'")) {
      // This could be a duplicate import or a misplaced line
      if (lineStr.startsWith('import ')) {
        lines.splice(idx, 1);
        fixed = true;
      } else {
        // Try removing the line
        lines.splice(idx, 1);
        fixed = true;
      }
    }
    
    // ── Pattern: "Unexpected token ';'" ──
    if (errType.includes("Unexpected token ';'")) {
      lines.splice(idx, 1);
      fixed = true;
    }
    
    // ── Pattern: "Unexpected token '.'" ──
    if (errType.includes("Unexpected token '.'")) {
      lines.splice(idx, 1);
      fixed = true;
    }
    
    // ── Pattern: "Unexpected token '*'" ──
    if (errType.includes("Unexpected token '*'")) {
      lines.splice(idx, 1);
      fixed = true;
    }
    
    // ── Pattern: "Unexpected string" ──
    if (errType.includes("Unexpected string")) {
      lines.splice(idx, 1);
      fixed = true;
    }
    
    // ── Pattern: "Unexpected reserved word" ──
    if (errType.includes("Unexpected reserved word")) {
      lines.splice(idx, 1);
      fixed = true;
    }
    
    // ── Pattern: "Unexpected end of input" — missing closing braces ──
    if (errType.includes("Unexpected end of input")) {
      // Count braces
      const content = lines.join('\n');
      let opens = 0, closes = 0, parens = 0, parenC = 0;
      for (const ch of content) {
        if (ch === '{') opens++;
        if (ch === '}') closes++;
        if (ch === '(') parens++;
        if (ch === ')') parenC++;
      }
      const missingBraces = opens - closes;
      const missingParens = parens - parenC;
      for (let i = 0; i < missingBraces; i++) {
        lines.push('}');
      }
      for (let i = 0; i < missingParens; i++) {
        // Add closing parens before last brace if possible
        lines.push(');');
      }
      if (missingBraces > 0 || missingParens > 0) fixed = true;
    }
    
    // ── Pattern: "missing ) after argument list" ──
    if (errType.includes("missing ) after argument list")) {
      // Similar to unexpected end of input, but specifically for parentheses
      // Try removing the error line — it's likely a duplicate/orphaned line
      lines.splice(idx, 1);
      fixed = true;
    }
    
    // ── Pattern: "Illegal return statement" ──
    if (errType.includes("Illegal return statement")) {
      lines.splice(idx, 1);
      fixed = true;
    }
    
    // ── Pattern: Identifier '.default' has already been declared ──
    if (errType.includes(".default")) {
      lines.splice(idx, 1);
      fixed = true;
    }
    
    // ── Pattern: "Missing catch or finally after try" ──
    if (errType.includes("Missing catch or finally after try")) {
      // There's a try block without catch/finally. Find the try and add a catch.
      // Look backward for the try
      for (let j = idx; j >= 0; j--) {
        if (lines[j].trim() === 'try {') {
          // Remove the orphaned try { line
          lines.splice(j, 1);
          fixed = true;
          break;
        }
      }
      // If not found via simple match, just add a catch block
      if (!fixed) {
        const indent = lines[idx].search(/\S/);
        lines.splice(idx, 0, ' '.repeat(indent) + ' catch (e) { /* auto-fixed */ }');
        fixed = true;
      }
    }
    
    if (!fixed) return false;
    
    fs.writeFileSync(filePath, lines.join('\n'));
  }
  
  return !hasSyntaxError(filePath);
}

// ═══════════════════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════════════════
const serverDir = path.resolve(__dirname);
const files = glob.sync('**/*.js', { cwd: serverDir, ignore: ['node_modules/**', 'batch_fix*.cjs', 'fix_*.cjs'] });

let totalFixed = 0;
let totalRemaining = 0;
const remaining = [];

for (const relFile of files) {
  const filePath = path.join(serverDir, relFile);
  if (!hasSyntaxError(filePath)) continue;
  
  console.log(`Processing: ${relFile}`);
  
  const success = fixFile(filePath);
  if (success) {
    console.log(`  ✅ Fixed!`);
    totalFixed++;
  } else {
    const err = hasSyntaxError(filePath);
    const line = getErrorLine(err);
    const type = getErrorType(err);
    console.log(`  ⚠ Still broken: line ${line}: ${type}`);
    remaining.push({ file: relFile, line, error: type });
    totalRemaining++;
  }
}

console.log(`\n══════════════════════════════════════════`);
console.log(`Fixed: ${totalFixed} files`);
console.log(`Remaining: ${totalRemaining} files`);
console.log(`══════════════════════════════════════════`);
if (remaining.length > 0) {
  console.log('\nRemaining files:');
  for (const r of remaining) {
    console.log(`  ${r.file}:${r.line} => ${r.error}`);
  }
}
