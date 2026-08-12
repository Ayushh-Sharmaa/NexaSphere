import assert from "node:assert/strict";
import test from "node:test";

import { eventsService } from '../services/eventsService.js';
import {
  readContent,
  writeContent,
  DEFAULT_CONTENT,
  ensureContentFile,
} from '../storage/contentFileStore.js';
import { setWithDbOverride } from "../repositories/db.js";

test.before(async () => {
  await ensureContentFile();
});

test.skip('eventsService CRU and delete (file store)', async () => {
  // Reset to known default content
  await writeContent(JSON.parse(JSON.stringify(DEFAULT_CONTENT)));
test("eventsService CRU and delete (file store)", async () => {
  // We mock withDb to support in-memory Postgres queries for events
  let inMemoryEvents = [];

  setWithDbOverride(async (fn) => {
    const client = {
      query: async (sql, params) => {
        const lowerSql = sql.toLowerCase();
        if (lowerSql.includes("select * from events")) {
          // Emulate: select * from events order by created_at desc limit $1 offset $2
          const limit = params[0] || 20;
          const offset = params[1] || 0;
          const sorted = [...inMemoryEvents].sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
          );
          const sliced = sorted.slice(offset, offset + limit);
          return { rows: sliced };
        } else if (lowerSql.includes("select count(*)::int")) {
          // Emulate: select count(*)::int as total from events
          return { rows: [{ total: inMemoryEvents.length }] };
        } else if (lowerSql.includes("insert into events")) {
          // Emulate insert
          const [
            id,
            name,
            short_name,
            date_text,
            description,
            status,
            icon,
            tags,
          ] = params;
          const newEvent = {
            id,
            name,
            short_name,
            date_text,
            description,
            status: status || "completed",
            icon: icon || "Pin",
            tags: tags || [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          // Remove old if exists (conflict handling)
          inMemoryEvents = inMemoryEvents.filter((e) => e.id !== id);
          inMemoryEvents.push(newEvent);
          return { rows: [newEvent] };
        } else if (lowerSql.includes("update events set")) {
          // Emulate update: [id, patch.name, patch.shortName, patch.date, patch.description, patch.status, patch.icon, patch.tags]
          const [
            id,
            name,
            short_name,
            date_text,
            description,
            status,
            icon,
            tags,
          ] = params;
          const idx = inMemoryEvents.findIndex((e) => e.id === id);
          if (idx === -1) return { rows: [] };
          const existing = inMemoryEvents[idx];
          const updated = {
            ...existing,
            name: name !== null ? name : existing.name,
            short_name: short_name !== null ? short_name : existing.short_name,
            date_text: date_text !== null ? date_text : existing.date_text,
            description:
              description !== null ? description : existing.description,
            status: status !== null ? status : existing.status,
            icon: icon !== null ? icon : existing.icon,
            tags: tags !== null ? tags : existing.tags,
            updated_at: new Date().toISOString(),
          };
          inMemoryEvents[idx] = updated;
          return { rows: [updated] };
        } else if (lowerSql.includes("delete from events")) {
          // Emulate delete
          const id = params[0];
          const lenBefore = inMemoryEvents.length;
          inMemoryEvents = inMemoryEvents.filter((e) => e.id !== id);
          return { rowCount: lenBefore - inMemoryEvents.length };
        }
        return { rows: [] };
      },
    };
    return await fn(client);
  });

  const created = await eventsService.createEvent({
    name: 'TS Test Event',
    date: '2026-05-16',
    description: 'desc',
  });
  assert.ok(created.id, 'created event must have id');
  try {
    // Reset to known default content
    await writeContent(JSON.parse(JSON.stringify(DEFAULT_CONTENT)));

    const before = await eventsService.listEvents();
    const baseCount = Array.isArray(before)
      ? before.length
      : before.rows
        ? before.rows.length
        : 0;

  const updated = await eventsService.updateEvent(created.id, {
    name: 'TS Updated',
    description: 'new',
  });
  assert.equal(updated.name, 'TS Updated');
    const created = await eventsService.createEvent({
      name: "TS Test Event",
      date: "2026-05-16",
      description: "desc",
    });
    assert.ok(created.id, "created event must have id");

    const listed = await eventsService.listEvents();
    const listedRows = Array.isArray(listed)
      ? listed
      : listed.rows
        ? listed.rows
        : [];
    assert.ok(
      listedRows.length === baseCount + 1,
      "list should include created event"
    );

    assert.equal(updated.name, "TS Updated");

    const deleted = await eventsService.deleteEvent(created.id);
    assert.equal(deleted, true);

    const after = await eventsService.listEvents();
    const afterRows = Array.isArray(after)
      ? after
      : after.rows
        ? after.rows
        : [];
    assert.equal(afterRows.length, baseCount);
  } finally {
    // Reset DB override
    setWithDbOverride(null);
  }
});

}
);