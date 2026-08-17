exports.up = (pgm) => {
  pgm.sql(`
    create table if not exists venue_layouts (
      id uuid primary key default gen_random_uuid(),
      name text not null,
      grid_data jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    alter table events
      add column if not exists venue_layout_id uuid references venue_layouts(id) on delete set null;

    alter table event_registrations
      add column if not exists seat_code text;

    create unique index if not exists event_registrations_event_seat_unique
      on event_registrations (event_id, seat_code)
      where seat_code is not null and status = 'confirmed';
  `);
};

exports.down = (pgm) => {
  pgm.dropIndex("event_registrations", ["event_id", "seat_code"], {
    name: "event_registrations_event_seat_unique",
    ifExists: true,
  });
  pgm.dropColumns("event_registrations", ["seat_code"], { ifExists: true });
  pgm.dropColumns("events", ["venue_layout_id"], { ifExists: true });
  pgm.dropTable("venue_layouts", { ifExists: true });
};
