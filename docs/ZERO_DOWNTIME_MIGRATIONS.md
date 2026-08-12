# Zero-Downtime Database Schema Migrations

To avoid downtime during database migrations, we strictly enforce the **Expand-and-Contract** pattern. This prevents application crashes caused by schema mismatches between the running application and the database.

## The Problem

If you run \`ALTER TABLE users DROP COLUMN age\`, any currently running pods of the old version that try to \`SELECT age FROM users\` will immediately crash.

## The Expand-and-Contract Pattern

Instead of doing it in one step, we break destructive changes into three phases across multiple deployments:

### Phase 1: Expand

- Add the new column/table.
- Update the application code to write to BOTH the old and new columns, but continue reading from the old one.
- Deploy.

### Phase 2: Migrate

- Run a background script to backfill data from the old column into the new column for historical rows.
- Update the application code to read from the NEW column instead of the old one.
- Deploy.

### Phase 3: Contract

- Now that no code is reading from or writing to the old column, you can safely drop it.
- \`ALTER TABLE users DROP COLUMN age\`.
- Deploy.

## CI/CD Enforcement

We have implemented a custom \`prisma-lint.js\` script that runs in GitHub Actions. It will **block your PR** if it detects unsafe operations like \`DROP COLUMN\`, \`RENAME TABLE\`, or adding \`NOT NULL\` constraints to existing columns. You must split these into multiple PRs following the pattern above.
