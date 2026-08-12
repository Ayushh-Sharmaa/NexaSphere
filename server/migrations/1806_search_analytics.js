exports.up = (pgm) => {
  pgm.createTable('search_analytics', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    query: { type: 'text', notNull: true },
    result_count: { type: 'integer', notNull: true, default: 0 },
    user_id: { type: 'uuid' },
    timestamp: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.createIndex('search_analytics', 'query');
  pgm.createIndex('search_analytics', 'timestamp');
};

exports.down = (pgm) => {
  pgm.dropTable('search_analytics');
};
