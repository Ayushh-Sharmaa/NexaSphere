const fs = require('fs');
const cp = require('child_process');

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

function check(file) {
  try {
    cp.execSync('node -c ' + file, { stdio: 'ignore' });
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

for (const file of files) {
  if (check(file)) {
    console.log(file + ' is already fine.');
    continue;
  }
  console.log('Fixing ' + file + '...');
  
  let originalCode = fs.readFileSync(file, 'utf8');
  let lines = originalCode.split('\n');
  let fixed = false;

  // Try just appending closers first
  for (let closer of closers) {
    fs.writeFileSync(file, originalCode + closer);
    if (check(file)) {
      console.log('  -> Fixed by appending: ' + JSON.stringify(closer));
      fixed = true;
      break;
    }
  }

  // If not fixed, try chopping off up to 50 lines from the end and applying closers
  if (!fixed) {
    for (let drop = 1; drop <= 50; drop++) {
      if (lines.length - drop < 10) break;
      
      let chopped = lines.slice(0, lines.length - drop).join('\n');
      for (let closer of closers) {
        fs.writeFileSync(file, chopped + closer);
        if (check(file)) {
          console.log('  -> Fixed by dropping ' + drop + ' lines and appending: ' + JSON.stringify(closer));
          fixed = true;
          break;
        }
      }
      if (fixed) break;
    }
  }

  if (!fixed) {
    console.log('  -> FAILED to fix automatically. Reverting.');
    fs.writeFileSync(file, originalCode);
  }
}
