/**
 * Batch syntax fixer for the NexaSphere codebase.
 * 
 * This script addresses the most common corruption patterns:
 * 1. Duplicate import lines (removes exact duplicate import statements)
 * 2. Duplicate const/let/var declarations at module scope
 * 3. Duplicate `} catch (err/error) {` blocks within try-catch
 * 4. Duplicate `return res.json(...)` / `return res.status(...)` after sendSuccess/sendError
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const glob = require('glob');

// Utility to check if a file has syntax errors
function hasSyntaxError(filePath) {
  try {
    execSync(`node -c "${filePath}"`, { stdio: 'pipe' });
    return null;
  } catch (e) {
    return e.stderr ? e.stderr.toString() : 'unknown error';
  }
}

// ── Fix 1: Remove duplicate import lines ──────────────────────────────────────
function removeDuplicateImports(lines) {
  const seenImports = new Set();
  const result = [];
  let changed = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('import ') && !trimmed.includes('{')) {
      // Simple import like `import x from 'y';`
      if (seenImports.has(trimmed)) {
        changed = true;
        continue;
      }
      seenImports.add(trimmed);
    }
    result.push(line);
  }
  return { lines: result, changed };
}

// ── Fix 2: Remove duplicate catch blocks ──────────────────────────────────────
// Pattern: 
//   sendSuccess(res, ...);
//   return res.json(...)      <-- remove this line
// OR:
//   sendError(req, res, ...);
//   res.json(...)             <-- remove this line  
// OR:
//   } catch (err) {
//     sendError(...)
//     res.json(...)           <-- remove this line
//   } catch (err) {           <-- remove this block
//     res.status(...)
//   }
function removeDuplicateCatchBlocks(content) {
  let changed = false;
  
  // Pattern: remove `return res.json(...)` or `res.json(...)` line right after sendSuccess/sendError
  const oldContent = content;
  content = content.replace(
    /(sendSuccess\(res,\s*[^;]+\);?\s*\n)\s*(return\s+)?res\.(json|status)\([^)]*\)(?:\.[^;]*)?\s*;?\s*\n/g,
    '$1'
  );
  
  // Pattern: remove duplicate catch block
  // } catch (err) {
  //   sendError(...)
  //   return res.status(...)   <-- sometimes present
  // } catch (err) {            <-- duplicate
  //   ...
  // }
  content = content.replace(
    /(\} catch \((err|error)\) \{\s*\n(?:\s*(?:return\s+)?send(?:Success|Error)\([^)]*(?:\([^)]*\))*[^)]*\);\s*\n))\s*(?:return\s+)?res\.(?:json|status)\([^)]*\)(?:\.[^;]*)?\s*;?\s*\n\s*\} catch \(\2\) \{\s*\n(?:\s*(?:return\s+)?res\.(?:json|status)\([^)]*\)(?:\.[^;]*)?\s*;?\s*\n)*\s*\}/g,
    '$1  }'
  );
  
  if (content !== oldContent) changed = true;
  return { content, changed };
}

// ── Fix 3: Remove exact duplicate const/let/var declarations ──────────────────
function removeDuplicateDeclarations(lines) {
  const seenDecls = new Map(); // identifier -> line index
  const toRemove = new Set();
  let changed = false;
  
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    // Match `const X =`, `let X =`, `var X =` at top-level (no leading whitespace or minimal)
    const match = trimmed.match(/^(const|let|var)\s+(\w+)\s*=/);
    if (match && lines[i].search(/\S/) < 2) { // top-level (0 or 1 space indent)
      const id = match[2];
      if (seenDecls.has(id)) {
        toRemove.add(i);
        changed = true;
      } else {
        seenDecls.set(id, i);
      }
    }
  }
  
  if (!changed) return { lines, changed: false };
  return { lines: lines.filter((_, i) => !toRemove.has(i)), changed: true };
}

// Process all files
const serverDir = path.resolve(__dirname);
const files = glob.sync('**/*.js', { cwd: serverDir, ignore: 'node_modules/**' });

let totalFixed = 0;
let totalRemaining = 0;

for (const relFile of files) {
  const filePath = path.join(serverDir, relFile);
  const err = hasSyntaxError(filePath);
  if (!err) continue;
  
  console.log(`\n── Processing: ${relFile}`);
  console.log(`   Error: ${err.split('\n').slice(0, 3).join(' | ').substring(0, 200)}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let lines = content.split('\n');
  let anyChange = false;
  
  // Fix 1: duplicate imports
  const importFix = removeDuplicateImports(lines);
  if (importFix.changed) {
    lines = importFix.lines;
    content = lines.join('\n');
    anyChange = true;
    console.log('   ✓ Removed duplicate imports');
  }
  
  // Fix 2: duplicate catch blocks / res.json after sendSuccess
  const catchFix = removeDuplicateCatchBlocks(content);
  if (catchFix.changed) {
    content = catchFix.content;
    lines = content.split('\n');
    anyChange = true;
    console.log('   ✓ Removed duplicate catch/response blocks');
  }
  
  // Fix 3: duplicate top-level declarations
  const declFix = removeDuplicateDeclarations(lines);
  if (declFix.changed) {
    lines = declFix.lines;
    content = lines.join('\n');
    anyChange = true;
    console.log('   ✓ Removed duplicate declarations');
  }
  
  if (anyChange) {
    fs.writeFileSync(filePath, content);
    const stillErr = hasSyntaxError(filePath);
    if (stillErr) {
      console.log(`   ⚠ Still has errors: ${stillErr.split('\n').slice(3, 5).join(' | ').substring(0, 150)}`);
      totalRemaining++;
    } else {
      console.log('   ✅ File is now clean!');
      totalFixed++;
    }
  } else {
    console.log('   ⚠ No auto-fixable patterns found');
    totalRemaining++;
  }
}

console.log(`\n══════════════════════════════════════════`);
console.log(`Fixed: ${totalFixed} files`);
console.log(`Remaining: ${totalRemaining} files still need manual fixes`);
console.log(`══════════════════════════════════════════`);
