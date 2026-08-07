exports.up = (pgm) => {
  pgm.createTable('hashtags', {
    id: 'id',
    tag: { type: 'varchar(255)', notNull: true, unique: true },
    usage_count: { type: 'integer', notNull: true, default: 1 },
    last_used_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.createIndex('hashtags', 'usage_count');
  pgm.createIndex('hashtags', 'last_used_at');

  pgm.createTable('hashtag_follows', {
    id: 'id',
    user_id: { type: 'uuid', notNull: true },
    hashtag: {
      type: 'varchar(255)',
      notNull: true,
      references: '"hashtags"("tag")',
      onDelete: 'CASCADE',
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.addConstraint('hashtag_follows', 'unique_user_hashtag', {
    unique: ['user_id', 'hashtag']
  });
};

exports.down = (pgm) => {
  pgm.dropTable('hashtag_follows');
  pgm.dropTable('hashtags');
};
