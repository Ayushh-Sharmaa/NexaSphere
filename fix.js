const fs = require('fs');
const lines = fs.readFileSync('server/repositories/mentorshipRepository.js', 'utf8').split('\n');
let endLine = 178;
while (endLine < lines.length && !lines[endLine].includes('if (sets.length === 0) return null;')) {
  endLine++;
}
lines.splice(178, endLine - 178, 
  "          if (key === 'domains') {", 
  "            sets.push(`${column} = $${paramIdx++}`);", 
  "            params.push(JSON.stringify(value));", 
  "          } else {", 
  "            sets.push(`${column} = $${paramIdx++}`);", 
  "            params.push(value);", 
  "          }", 
  "        }", 
  "      }");
fs.writeFileSync('server/repositories/mentorshipRepository.js', lines.join('\n'));
