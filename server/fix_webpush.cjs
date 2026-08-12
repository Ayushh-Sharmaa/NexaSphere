const fs = require('fs');
let lines = fs.readFileSync('services/webPushService.js', 'utf8').split('\n');
lines.splice(28, 21,
  'export async function sendWebPush(subscription, payload) {',
  '  if (!hasVapid) return null;',
  '  try {',
  '    const result = await webPushBreaker.execute(subscription, payload);',
  '    return result;',
  '  } catch (err) {',
  '    if (err.code === "CIRCUIT_OPEN") {',
  '      return null;',
  '    }',
  '    if (err.statusCode === 410 || err.statusCode === 404) {',
  '      return { expired: true };',
  '    }',
  '    throw err;',
  '  }',
  '}'
);
fs.writeFileSync('services/webPushService.js', lines.join('\n'));
