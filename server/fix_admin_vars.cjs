const fs = require('fs');
let lines = fs.readFileSync('middleware/adminAuthMiddleware.js', 'utf8').split('\n');
lines.splice(430, 14, 
  '    const u = getLoginUsername(req.body);',
  '    const p = String(req.body?.password || "");',
  '    const ip = getClientIp(req);',
  '    const userAgent = req.get("user-agent") || "";'
);
fs.writeFileSync('middleware/adminAuthMiddleware.js', lines.join('\n'));
