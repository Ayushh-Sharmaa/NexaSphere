exports.up = (pgm) => {
  // Add hybrid fields to events
  pgm.addColumns("events", {
    is_hybrid: { type: "boolean", default: false },
    video_link: { type: "text" },
  });

  // Add attendance mode to event registrations
  pgm.addColumns("event_registrations", {
    attendance_mode: { type: "text", default: "in_person" },
  });

  // Update register_for_event to support attendance_mode
  pgm.sql(`
    create or replace function register_for_event(p_event_id text, p_full_name text, p_email text, p_attendance_mode text default 'in_person')
    returns json as $$
    declare
      v_capacity int;
      v_registered int;
      v_registration_id uuid;
      v_series_id text;
      v_event record;
      v_inserted_ids uuid[] := '{}';
    begin
      select capacity, series_id into v_capacity, v_series_id from events where id = p_event_id for update;
      
      if not found then
        raise exception 'Event not found.';
      end if;
      
      if v_capacity is null then
        v_capacity := 9999999;
      end if;

      select count(*) into v_registered from event_registrations where event_id = p_event_id;

      if v_registered >= v_capacity then
        raise exception 'Event capacity has been reached.';
      end if;

      if v_series_id is not null then
        for v_event in select id from events where series_id = v_series_id for update loop
          begin
            insert into event_registrations (event_id, full_name, email, attendance_mode)
            values (v_event.id, p_full_name, p_email, p_attendance_mode)
            returning id into v_registration_id;
            
            v_inserted_ids := array_append(v_inserted_ids, v_registration_id);
          exception when unique_violation then
            -- already registered, continue
          end;
        end loop;
        
        return json_build_object('ok', true, 'registration_ids', v_inserted_ids);
      else
        insert into event_registrations (event_id, full_name, email, attendance_mode)
        values (p_event_id, p_full_name, p_email, p_attendance_mode)
        returning id into v_registration_id;

        return json_build_object('ok', true, 'registration_id', v_registration_id);
      end if;
    end;
    $$ language plpgsql;
  `);
};

exports.down = (pgm) => {
  pgm.dropColumns("events", ["is_hybrid", "video_link"]);
  pgm.dropColumns("event_registrations", ["attendance_mode"]);

  // Revert function to old behavior without attendance_mode
  pgm.sql(`
    create or replace function register_for_event(p_event_id text, p_full_name text, p_email text)
    returns json as $$
    declare
      v_capacity int;
      v_registered int;
      v_registration_id uuid;
      v_series_id text;
      v_event record;
      v_inserted_ids uuid[] := '{}';
    begin
      select capacity, series_id into v_capacity, v_series_id from events where id = p_event_id for update;
      
      if not found then
        raise exception 'Event not found.';
      end if;
      
      if v_capacity is null then
        v_capacity := 9999999;
      end if;

      select count(*) into v_registered from event_registrations where event_id = p_event_id;

      if v_registered >= v_capacity then
        raise exception 'Event capacity has been reached.';
      end if;

      if v_series_id is not null then
        for v_event in select id from events where series_id = v_series_id for update loop
          begin
            insert into event_registrations (event_id, full_name, email)
            values (v_event.id, p_full_name, p_email)
            returning id into v_registration_id;
            
            v_inserted_ids := array_append(v_inserted_ids, v_registration_id);
          exception when unique_violation then
            -- already registered, continue
          end;
        end loop;
        
        return json_build_object('ok', true, 'registration_ids', v_inserted_ids);
      else
        insert into event_registrations (event_id, full_name, email)
        values (p_event_id, p_full_name, p_email)
        returning id into v_registration_id;

        return json_build_object('ok', true, 'registration_id', v_registration_id);
      end if;
    end;
    $$ language plpgsql;
  `);
};
