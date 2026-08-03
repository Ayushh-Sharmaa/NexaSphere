export const up = (pgm) => {
  pgm.createTable('event_collaborators', {
    id: { type: 'serial', primaryKey: true },
    event_id: { type: 'integer', notNull: true },
    email: { type: 'varchar(255)', notNull: true },
    role: { type: 'varchar(50)', notNull: true, default: 'co-organizer' },
    status: { type: 'varchar(50)', notNull: true, default: 'pending' }, // pending, accepted
    permissions: {
      type: 'jsonb',
      notNull: true,
      default:
        '{"can_edit": true, "can_delete": false, "can_view_attendance": true, "can_message": true}',
    },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.createIndex('event_collaborators', ['event_id', 'email'], { unique: true });

  pgm.createTable('event_collaborator_messages', {
    id: { type: 'serial', primaryKey: true },
    event_id: { type: 'integer', notNull: true },
    sender_email: { type: 'varchar(255)', notNull: true },
    message: { type: 'text', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.createIndex('event_collaborator_messages', 'event_id');
};

export const down = (pgm) => {
  pgm.dropTable('event_collaborator_messages');
  pgm.dropTable('event_collaborators');
};
