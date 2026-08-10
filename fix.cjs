const fs = require('fs');

const indexCode = fs.readFileSync('server/observability/httpMetrics.js', 'utf8');
const lines = indexCode.split('\n');
const resultLines = [];
const seenImports = new Set();

for(let line of lines) {
  if (line.trim().startsWith('import ') && line.includes(' from ')) {
    const fromPath = line.split(' from ')[1].trim().replace(/\.js['"]/, "'");
    const importSpecifier = line.split('import ')[1].split(' from ')[0].trim();
    const key = importSpecifier + ' ' + fromPath;
    if (!seenImports.has(key)) {
      seenImports.add(key);
      resultLines.push(line);
    }
  } else {
    resultLines.push(line);
  }
}
fs.writeFileSync('server/observability/httpMetrics.js', resultLines.join('\n'));
console.log('Fixed index.js duplicates');
