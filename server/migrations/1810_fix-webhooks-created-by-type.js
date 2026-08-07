// Fixes Issue #3262: the webhooks table's `created_by` column was created as
// UUID, but admin identity in this codebase is tracked by username (string),
// not a UUID (see req.adminSession.username, and e.g. audit_runs.created_by_admin_id
// varchar(255)). Storing a username in a UUID column would fail with a
// Postgres "invalid input syntax for type uuid" error, so the column type
// needs to change to match how admins are actually identified.

export const up = (pgm) => {
  pgm.alterColumn('webhooks', 'created_by', {
    type: 'varchar(255)',
  });
};

export const down = (pgm) => {
  pgm.alterColumn('webhooks', 'created_by', {
    type: 'uuid',
  });
};
