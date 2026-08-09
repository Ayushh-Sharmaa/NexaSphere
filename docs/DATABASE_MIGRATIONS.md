# Database Migrations

NexaSphere uses a multi-stack architecture with three database backends, each with its own migration system.

## Migration Systems

### Node.js Server (`server/migrations/`)

- **Tool**: Node-pg-migrate
- **Database**: PostgreSQL
- **Config**: `server/.postgres_migrations_config.json`

| Migration                                           | Description                                                                                               |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `1705945200000_create-initial-schema.js`            | Baseline schema for admin sessions, events, core team, form submissions, and recommendation engine tables |
| `1705945201000_seed-recommendation-data.js`         | Seed data for collaborative filtering recommendation system                                               |
| `1705945202000_canonicalize-portfolio-usernames.js` | Canonicalize portfolio username format                                                                    |
| `1718696400000_add-ticketing-system.js`             | Comprehensive ticketing system: types, pricing tiers, seats, orders, and individual tickets               |

### Java Server (`server-java/src/main/resources/db/migration/`)

- **Tool**: Flyway
- **Database**: PostgreSQL / H2 (dev fallback)
- **Config**: `application.properties`

| Migration                             | Description                                                                                                          |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `V1__Create_Initial_Schema.sql`       | Baseline schema — admin sessions, events, activity events, core team, form submissions, recommendation engine tables |
| `V2__Seed_Recommendation_Data.sql`    | Seed data for recommendation engine (profiles, events, participation history)                                        |
| `V3__Extend_Event_Metadata.sql`       | Extended events table with KSS metadata fields (category, dates, capacity, location) and dynamic gradient colors     |
| `V4__Create_Certificate_System.sql`   | Certificate templates, participants, and issued certificates tables                                                  |
| `V5__Add_Recruitment_Submissions.sql` | Dedicated table for core team recruitment applications with status tracking                                          |

### Python Server (`server-python/alembic/versions/`)

- **Tool**: Alembic
- **Database**: PostgreSQL
- **Config**: `server-python/alembic.ini`

| Migration                         | Description                         |
| --------------------------------- | ----------------------------------- |
| `001_initial_schema.py`           | Initial schema creation             |
| `002_seed_recommendation_data.py` | Seed data for recommendation engine |

## Running Migrations

### Node.js

```bash
cd server
npm run migrate:latest    # Apply all pending migrations
npm run migrate:rollback  # Rollback last migration batch
```

### Java

Migrations run automatically on application startup via Flyway. To run manually:

```bash
cd server-java
mvn flyway:migrate
```

### Python

```bash
cd server-python
alembic upgrade head       # Apply all pending migrations
alembic downgrade -1       # Rollback one migration
```

## Adding New Migrations

- **Node.js**: Create a new timestamped file in `server/migrations/` following the naming convention `YYYYMMDDHHMMSS_description.js`
- **Java**: Create a new versioned file in `server-java/src/main/resources/db/migration/` named `V{N}__Description.sql` where N is the next version number
- **Python**: Use `alembic revision -m "description"` to generate a new migration file in `server-python/alembic/versions/`

## Best Practices

1. **Always test migrations** against a clean database before merging
2. **Never modify applied migrations** — create a new one instead
3. **Use `IF NOT EXISTS` / `IF EXISTS`** guards where possible for idempotency
4. **Include rollback logic** in Node.js and Python migrations
5. **Document schema changes** in this file when adding new migrations
   NexaSphere uses a multi-stack architecture with three independent database migration systems — one per server implementation. All migration suites target a **PostgreSQL** database.

---

## Migration Systems Overview

| Stack              | Tool                                                                         | Directory                                      | Config                                    |
| ------------------ | ---------------------------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------- |
| Node.js            | [node-postgres-migrate](https://github.com/brianbrunner/yowl) / `db-migrate` | `server/migrations/`                           | `server/.postgres_migrations_config.json` |
| Java (Spring Boot) | [Flyway](https://flywaydb.org/)                                              | `server-java/src/main/resources/db/migration/` | `server-java/pom.xml`                     |
| Python (FastAPI)   | [Alembic](https://alembic.sqlalchemy.org/)                                   | `server-python/alembic/versions/`              | `server-python/alembic.ini`               |

---

## Node.js Migrations (`server/`)

Migration files live in `server/migrations/` and are managed via `npm run migrate:latest` / `npm run migrate:rollback`.

### Files

| File                                                | Description                                                                            |
| --------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `1705945200000_create-initial-schema.js`            | Creates the initial database schema — users, events, activities, and core team tables. |
| `1705945201000_seed-recommendation-data.js`         | Seeds initial recommendation/sample data for development and testing.                  |
| `1705945202000_canonicalize-portfolio-usernames.js` | Normalises existing portfolio usernames to a canonical lowercase format.               |

### Running Migrations

```bash
# Apply all pending migrations
npm --prefix server run migrate:latest

# Roll back the most recent migration
npm --prefix server run migrate:rollback

# Check current migration version
npm --prefix server run migrate -- --version
```

### Environment Variables

| Variable       | Example                                          | Description                       |
| -------------- | ------------------------------------------------ | --------------------------------- |
| `DATABASE_URL` | `postgres://user:pass@localhost:5432/nexasphere` | Full PostgreSQL connection string |

---

## Java Migrations (`server-java/`)

Migration files follow the Flyway naming convention (`V{version}__{description}.sql`) and live in `server-java/src/main/resources/db/migration/`. Flyway runs automatically on Spring Boot startup.

### Files

| File                               | Description                                                                                 |
| ---------------------------------- | ------------------------------------------------------------------------------------------- |
| `V1__Create_Initial_Schema.sql`    | Creates the initial database schema for the Spring Boot application.                        |
| `V2__Seed_Recommendation_Data.sql` | Populates seed data used for the recommendation engine.                                     |
| `V3__Extend_Event_Metadata.sql`    | Adds additional metadata columns to the events table (location, capacity, gradient colors). |

### Running Migrations

Flyway migrations execute automatically when the Spring Boot application starts. To validate without starting the app:

```bash
cd server-java
mvn clean validate
```

### Configuration

Flyway is declared as a Maven dependency in `pom.xml`. The datasource is configured via environment variables or `application.properties`:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/nexasphere
spring.datasource.username=postgres
spring.datasource.password=postgres
spring.flyway.enabled=true
```

---

## Python Migrations (`server-python/`)

Migration files are managed by Alembic and live in `server-python/alembic/versions/`. Alembic is configured via `server-python/alembic.ini`.

### Files

| File                              | Description                                               |
| --------------------------------- | --------------------------------------------------------- |
| `001_initial_schema.py`           | Creates the initial schema for the Python/FastAPI server. |
| `002_seed_recommendation_data.py` | Seeds initial data for recommendations and activities.    |

### Running Migrations

```bash
cd server-python

# Apply all pending migrations
alembic upgrade head

# Roll back one migration
alembic downgrade -1

# Show current revision
alembic current

# Generate SQL for pending migrations (dry-run)
alembic upgrade head --sql
```

### Environment Variables

| Variable       | Example                                            | Description                       |
| -------------- | -------------------------------------------------- | --------------------------------- |
| `DATABASE_URL` | `postgresql://user:pass@localhost:5432/nexasphere` | Full PostgreSQL connection string |

---

## CI Validation

The **Database Migrations CI** workflow (`.github/workflows/db-migrations-ci.yml`) runs automatically on `push` to `main` or on pull requests that modify migration files. It performs the following jobs:

| Job                             | Description                                                                                                       |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `Validate Node.js Migrations`   | Spins up a PostgreSQL service, installs dependencies, runs migrations, validates constraints, and tests rollback. |
| `Validate Java Migrations`      | Validates Flyway SQL files and checks the Maven build.                                                            |
| `Validate Python Migrations`    | Validates Alembic migration Python files and tests the DB connection.                                             |
| `Check Migration Documentation` | Verifies this file (`DATABASE_MIGRATIONS.md`) exists and all migration directories are present.                   |
| `Migration Validation Summary`  | Aggregates all job results and fails the workflow if any job failed.                                              |

---

## Blue-Green Migration Strategy

To support zero-downtime database updates during Blue-Green deployments, schema modifications must follow the **Expand and Contract** pattern:

1. **Expand Phase (Additive Changes)**:
   - Add new columns as nullable or with a default value.
   - Create new tables or indexes.
   - Do NOT drop old columns/tables or rename existing ones.
   - The database schema is backward-compatible, meaning both the old (Blue) and new (Green) application versions can run concurrently on the same database.

2. **Transition Phase (Dual Writes / Data Sync)**:
   - If migrating data from an old column to a new one, update the application code to write to both columns (dual-write) and read from the old one.
   - Run a backfill script to sync historical data.

3. **Contract Phase (Destructive Changes)**:
   - Once the new application version (Green) is fully promoted and stable, and the old version (Blue) is shut down:
   - Update the application code to read/write only from/to the new schema.
   - Deploy a final database migration to drop the old columns or tables.

---

## Rollback Plan

Each stack supports rolling back database migrations using their respective CLI commands:

### Node.js (PostgreSQL)

Run the rollback command to revert the last batch of migrations:

```bash
npm --prefix server run migrate:rollback
```

To roll back to a specific migration version, inspect the `pgmigrations` table and run down migrations to that revision.

### Java (Flyway)

Since Flyway Community Edition does not support manual down migrations natively, rollbacks are handled by:

1. Reverting the application deployment to the previous (Blue) version.
2. Since schema changes are backward-compatible, no DB rollback is required.
3. For destructive rollbacks, apply an additive compensating migration (e.g. recreating dropped columns).

### Python (Alembic)

To revert the most recent migration:

```bash
cd server-python
alembic downgrade -1
```

Or downgrade to a specific revision ID:

```bash
alembic downgrade <revision_id>
```

---

## Database Validation Checks

We implement automated data validation checks to verify schema integrity and foreign key constraints before and after migration.

### Validation Script

A dedicated validation script resides in `server/scripts/validate-database.js`. It performs the following checks:

1. Verifies that all expected tables exist.
2. Verifies that critical columns and their datatypes are correct.
3. Validates data integrity (e.g., checks for orphan entries in relationship tables).

To run the checks manually:

```bash
npm --prefix server run db:validate
```

This validation script runs automatically as part of the Database Migrations CI pipeline and staging deployment workflows.

| Job                             | Description                                                                                     |
| ------------------------------- | ----------------------------------------------------------------------------------------------- |
| `Validate Node.js Migrations`   | Spins up a PostgreSQL service, installs dependencies, runs migrations, validates constraints, and tests rollback. |
| `Validate Java Migrations`      | Validates Flyway SQL files and checks the Maven build.                                          |
| `Validate Python Migrations`    | Validates Alembic migration Python files and tests the DB connection.                           |
| `Check Migration Documentation` | Verifies this file (`DATABASE_MIGRATIONS.md`) exists and all migration directories are present. |
| `Migration Validation Summary`  | Aggregates all job results and fails the workflow if any job failed.                            |

---

## Blue-Green Migration Strategy

To support zero-downtime database updates during Blue-Green deployments, schema modifications must follow the **Expand and Contract** pattern:

1. **Expand Phase (Additive Changes)**:
   - Add new columns as nullable or with a default value.
   - Create new tables or indexes.
   - Do NOT drop old columns/tables or rename existing ones.
   - The database schema is backward-compatible, meaning both the old (Blue) and new (Green) application versions can run concurrently on the same database.

2. **Transition Phase (Dual Writes / Data Sync)**:
   - If migrating data from an old column to a new one, update the application code to write to both columns (dual-write) and read from the old one.
   - Run a backfill script to sync historical data.

3. **Contract Phase (Destructive Changes)**:
   - Once the new application version (Green) is fully promoted and stable, and the old version (Blue) is shut down:
   - Update the application code to read/write only from/to the new schema.
   - Deploy a final database migration to drop the old columns or tables.

---

## Rollback Plan

Each stack supports rolling back database migrations using their respective CLI commands:

### Node.js (PostgreSQL)

Run the rollback command to revert the last batch of migrations:

```bash
npm --prefix server run migrate:rollback
```

To roll back to a specific migration version, inspect the `pgmigrations` table and run down migrations to that revision.

### Java (Flyway)

Since Flyway Community Edition does not support manual down migrations natively, rollbacks are handled by:

1. Reverting the application deployment to the previous (Blue) version.
2. Since schema changes are backward-compatible, no DB rollback is required.
3. For destructive rollbacks, apply an additive compensating migration (e.g. recreating dropped columns).

### Python (Alembic)

To revert the most recent migration:

```bash
cd server-python
alembic downgrade -1
```

Or downgrade to a specific revision ID:

```bash
alembic downgrade <revision_id>
```

---

## Database Validation Checks

We implement automated data validation checks to verify schema integrity and foreign key constraints before and after migration.

### Validation Script

A dedicated validation script resides in `server/scripts/validate-database.js`. It performs the following checks:

1. Verifies that all expected tables exist.
2. Verifies that critical columns and their datatypes are correct.
3. Validates data integrity (e.g., checks for orphan entries in relationship tables).

To run the checks manually:

```bash
npm --prefix server run db:validate
```

This validation script runs automatically as part of the Database Migrations CI pipeline and staging deployment workflows.

---

## Best Practices

1. **Never edit an existing migration file** after it has been merged to `main`. Create a new migration instead.
2. **Name migrations descriptively** — use timestamps (Node.js), version numbers with double underscores (Flyway), or sequential numbers (Alembic).
3. **Always write a rollback** for Node.js migrations (`exports.down`).
4. **Test locally** before opening a PR — run your migration against a fresh DB to catch issues early.
5. **Update this document** when adding new migration files so the CI documentation check passes.

## Staging Migration Test Procedure

Before any migration reaches production, it must pass the full staging cycle:

### Steps

1. **Push to `develop` or `staging` branch** — triggers the Staging Deployment Pipeline automatically.

2. **Pre-migration validation** — `node scripts/validate-database.js --pre` runs against `STAGING_DATABASE_URL` and snapshots table existence, column types, row counts, and foreign key integrity.

3. **Apply migrations** — `npm run migrate:latest` runs all pending Node.js migrations against the staging database.

4. **Post-migration validation** — `node scripts/validate-database.js --post` re-runs all checks to confirm the schema is correct after migration.

5. **Rollback test** — `npm run migrate:rollback` is called automatically to verify the down migration executes cleanly, then `migrate:latest` re-applies to leave staging in the final state.

6. **Schema version check** — the `pgmigrations` table is queried to confirm the expected migration count and timestamps.

7. **Health check** — `GET /health` on the staging API confirms the backend is responding after migration.

Only after all 7 steps pass on staging should the migration be merged to `main` and promoted to production using `scripts/blue-green-migrate.sh`.

### Running Locally Against Staging

```bash
export DATABASE_URL=$STAGING_DATABASE_URL
bash scripts/blue-green-migrate.sh expand
bash scripts/blue-green-migrate.sh validate
```
