export const up = (pgm) => {
  // 1. Add phone_number to users table
  pgm.addColumns('users', {
    phone_number: { type: 'text' },
  });

  // 2. Add sms boolean to notification_preferences
  pgm.addColumns('notification_preferences', {
    sms: { type: 'boolean', notNull: true, default: false },
  });

  // 3. Create sms_logs table for admin analytics tracking cost
  pgm.createTable('sms_logs', {
    id: { type: 'serial', primaryKey: true },
    user_id: { type: 'text', notNull: true },
    phone_number: { type: 'text', notNull: true },
    message: { type: 'text', notNull: true },
    event_type: { type: 'text' },
    cost: { type: 'numeric', notNull: true, default: 0 },
    status: { type: 'text', notNull: true, default: 'sent' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
};

export const down = (pgm) => {
  pgm.dropTable('sms_logs');
  pgm.dropColumns('notification_preferences', ['sms']);
  pgm.dropColumns('users', ['phone_number']);
};
