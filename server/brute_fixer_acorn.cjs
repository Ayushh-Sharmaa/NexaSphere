const fs = require('fs');
const acorn = require('acorn');

const files = [
  'test/adminSessions.test.js',
  'test/adminAuthMiddleware.test.js',
  'services/eventEmitterService.js',
  'services/bulkOperationsService.js',
  'routes/userGroups.js',
  'routes/rateLimitAdminRoutes.js',
  'routes/monitoring.js',
  'routes/compliance.js',
  'routes/api.js',
  'routes/adminStream.js',
  'routes/admin.js',
  'repositories/userGroupsRepository.js',
  'repositories/learningPathsRepository.js',
  'repositories/customEventRepository.js',
  'controllers/waitlistController.js',
  'controllers/searchController.js',
  'controllers/recommendationsController.js',
  'controllers/eventsController.js',
  'controllers/eventConflictController.js',
  'controllers/eventAnalyticsController.js',
  'controllers/bannersController.js',
  'config/studentOAuth.js'
];

function check(code) {
  try {
    acorn.parse(code, { ecmaVersion: 2024, sourceType: 'module' });
    return true;
  } catch (e) {
    return false;
  }
}

const closers = [
  '',
  '\n}',
  '\n});',
  '\n}\n}',
  '\n});\n});',
  '\n}\n});',
  '\n});\n}',
  '\n]',
  '\n)',
  '\n};',
  '\n};}',
  '\n} catch(e){}'
];

let totalFixed = 0;
let totalFailed = 0;

for (const file of files) {
  let originalCode = fs.readFileSync(file, 'utf8');
  if (check(originalCode)) {
    console.log(file + ' is already fine.');
    continue;
  }
  console.log('Fixing ' + file + '...');
  
  let lines = originalCode.split('\n');
  let fixed = false;

  // Try replacing duplicate export default with properly closed ones
  if (/export default/i.test(originalCode)) {
    const exportStrategies = [
      (c) => c.replace(/export default router;/, '}\nexport default router;'),
      (c) => c.replace(/export default router;/, '});\nexport default router;'),
      (c) => c.replace(/export default router;/, '}\n}\nexport default router;'),
      (c) => c.replace(/export default /, '}\nexport default '),
      (c) => c.replace(/}\r?\nexport default/, 'export default')
    ];
    for (let strategy of exportStrategies) {
      const testCode = strategy(originalCode);
      if (check(testCode)) {
        fs.writeFileSync(file, testCode);
        console.log('  -> Fixed by export strategy.');
        fixed = true;
        break;
      }
    }
  }

  if (fixed) {
    totalFixed++;
    continue;
  }

  // Try appending closers
  for (let closer of closers) {
    let testCode = originalCode + closer;
    if (check(testCode)) {
      fs.writeFileSync(file, testCode);
      console.log('  -> Fixed by appending: ' + JSON.stringify(closer));
      fixed = true;
      break;
    }
  }

  // If not fixed, try chopping off up to 100 lines from the end and applying closers
  if (!fixed) {
    for (let drop = 1; drop <= 100; drop++) {
      if (lines.length - drop < 10) break;
      
      let chopped = lines.slice(0, lines.length - drop).join('\n');
      for (let closer of closers) {
        let testCode = chopped + closer;
        if (check(testCode)) {
          fs.writeFileSync(file, testCode);
          console.log('  -> Fixed by dropping ' + drop + ' lines and appending: ' + JSON.stringify(closer));
          fixed = true;
          break;
        }
      }
      if (fixed) break;
    }
  }

  if (fixed) {
    totalFixed++;
  } else {
    console.log('  -> FAILED to fix automatically.');
    totalFailed++;
  }
}
console.log(`\nResults: ${totalFixed} fixed, ${totalFailed} failed.`);
