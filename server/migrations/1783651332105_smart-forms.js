/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  pgm.createTable('smart_forms', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    event_id: {
      type: 'varchar(100)',
      notNull: true,
      references: '"events"',
      onDelete: 'CASCADE',
    },
    title: {
      type: 'varchar(255)',
      notNull: true,
    },
    type: {
      type: 'varchar(50)',
      notNull: true,
      comment: 'registration, feedback, survey, custom',
    },
    schema: {
      type: 'jsonb',
      notNull: true,
      comment: 'JSON schema defining form elements, conditional logic, and validation rules',
    },
    is_active: {
      type: 'boolean',
      notNull: true,
      default: true,
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.createIndex('smart_forms', 'event_id');

  pgm.createTable('smart_form_responses', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    form_id: {
      type: 'uuid',
      notNull: true,
      references: '"smart_forms"',
      onDelete: 'CASCADE',
    },
    user_id: {
      type: 'uuid',
      notNull: false, // Optional for public forms
    },
    answers: {
      type: 'jsonb',
      notNull: true,
    },
    status: {
      type: 'varchar(50)',
      notNull: true,
      default: 'submitted',
      comment: 'submitted, approved, rejected, archived',
    },
    submitted_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.createIndex('smart_form_responses', 'form_id');
  pgm.createIndex('smart_form_responses', 'user_id');
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable('smart_form_responses');
  pgm.dropTable('smart_forms');
};
