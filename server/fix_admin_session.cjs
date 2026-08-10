const fs = require('fs');
let lines = fs.readFileSync('middleware/adminAuthMiddleware.js', 'utf8').split('\n');
lines.splice(320, 10, '    if (!token) {', '      return res.status(401).json({ error: "Unauthorized" });', '    }');
fs.writeFileSync('middleware/adminAuthMiddleware.js', lines.join('\n'));
