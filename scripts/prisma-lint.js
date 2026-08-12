const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(__dirname, '../prisma/migrations');

const UNSAFE_OPERATIONS = [
  /DROP\s+COLUMN/i,
  /RENAME\s+COLUMN/i,
  /DROP\s+TABLE/i,
  /RENAME\s+TABLE/i,
  /ALTER\s+COLUMN.*SET\s+NOT\s+NULL/i // Making an existing column required without a default
];

function lintMigrations() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.log('No Prisma migrations directory found. Skipping lint.');
    return;
  }

  const migrations = fs.readdirSync(MIGRATIONS_DIR).filter(dir => {
    return fs.statSync(path.join(MIGRATIONS_DIR, dir)).isDirectory();
  });

  let hasErrors = false;

  for (const migration of migrations) {
    const sqlFile = path.join(MIGRATIONS_DIR, migration, 'migration.sql');
    if (fs.existsSync(sqlFile)) {
      const sqlContent = fs.readFileSync(sqlFile, 'utf8');
      
      UNSAFE_OPERATIONS.forEach(regex => {
        if (regex.test(sqlContent)) {
          console.error(`🚨 UNSAFE MIGRATION DETECTED in ${migration}/migration.sql`);
          console.error(`   Found pattern matching: ${regex}`);
          console.error(`   This operation may cause downtime. Please use the Expand-and-Contract pattern.`);
          hasErrors = true;
        }
      });
    }
  }

  if (hasErrors) {
    console.error('\nMigration linting failed. See ZERO_DOWNTIME_MIGRATIONS.md for guidance.');
    process.exit(1);
  } else {
    console.log('✅ Migration linting passed. No unsafe operations detected.');
  }
}

lintMigrations();
