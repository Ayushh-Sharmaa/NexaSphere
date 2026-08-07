import assert from "node:assert/strict";
import test from "node:test";

import { eventsService } from "../services/eventsService.js";
import {
  readContent,
  writeContent,
  DEFAULT_CONTENT,
  ensureContentFile,
} from "../storage/contentFileStore.js";

test.before(async () => {
  await ensureContentFile();
});

test.skip("eventsService CRU and delete (file store)", async () => {
  // Reset to known default content
  await writeContent(JSON.parse(JSON.stringify(DEFAULT_CONTENT)));

  const before = await eventsService.listEvents();
  const baseCount = Array.isArray(before) ? before.length : 0;

  const created = await eventsService.createEvent({
    name: "TS Test Event",
    date: "2026-05-16",
    description: "desc",
  });
  assert.ok(created.id, "created event must have id");

  const listed = await eventsService.listEvents();
  assert.ok(
    listed.length === baseCount + 1,
    "list should include created event"
  );

  const updated = await eventsService.updateEvent(created.id, {
    name: "TS Updated",
    description: "new",
  });
  assert.equal(updated.name, "TS Updated");

  const deleted = await eventsService.deleteEvent(created.id);
  assert.equal(deleted, true);

  const after = await eventsService.listEvents();
  assert.equal(after.length, baseCount);
});
