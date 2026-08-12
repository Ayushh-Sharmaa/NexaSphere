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

function checkSyntax(file) {
  try {
    cp.execSync('node -c ' + file, { stdio: 'pipe' });
    return null;
  } catch (e) {
    return e.stderr.toString();
  }
}

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let err = checkSyntax(file);
  
  if (!err) continue;
  
  console.log('Fixing ' + file + ' ...');
  
  // Try adding up to 3 '}' or '});' at the end of the file
  let fixed = false;
  const strategies = [
    (c) => c + '\n}\n',
    (c) => c + '\n});\n',
    (c) => c + '\n}\n}\n',
    (c) => c + '\n});\n});\n',
    (c) => c + '\n}\n});\n',
    // Try adding before 'export default router'
    (c) => c.replace(/export default router;/, '}\nexport default router;'),
    (c) => c.replace(/export default router;/, '});\nexport default router;'),
    (c) => c.replace(/export default router;/, '}\n}\nexport default router;'),
    (c) => c.replace(/export default /, '}\nexport default '),
    // Try removing an extra '}' before export
    (c) => c.replace(/}\r?\nexport default/, 'export default')
  ];

  for (const strategy of strategies) {
    const testContent = strategy(content);
    if (testContent === content) continue;
    
    fs.writeFileSync(file, testContent);
    const newErr = checkSyntax(file);
    if (!newErr) {
      console.log('  -> Fixed with strategy');
      fixed = true;
      break;
    }
  }

  if (!fixed) {
    // Revert
    fs.writeFileSync(file, content);
    console.log('  -> Failed to fix automatically.');
  }
}
