const fs = require('fs');
const code = fs.readFileSync('server/index.ts', 'utf8');
const lines = code.split('\n');

let openBraces = 0;
let openParens = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Basic heuristic: ignore comments
  if (line.trim().startsWith('//')) continue;
  
  for (let j = 0; j < line.length; j++) {
    if (line[j] === '{') openBraces++;
    if (line[j] === '}') openBraces--;
    if (line[j] === '(') openParens++;
    if (line[j] === ')') openParens--;
  }
}

console.log('Braces imbalance:', openBraces);
console.log('Parens imbalance:', openParens);
