import { describe, it, beforeEach, after } from 'node:test';
import assert from 'node:assert';
import { promises as fs } from 'fs';
import { runWithFileLock } from '../storage/contentFileStore.js';
import {
  CONTENT_FILE,
  readContent,
  writeContent,
  DEFAULT_CONTENT,
} from '../storage/contentFileStore.js';

describe('ContentStore Race Condition Prevention', () => {
  beforeEach(async () => {
    // Reset the content file before each test
    await fs.writeFile(CONTENT_FILE, JSON.stringify(DEFAULT_CONTENT, null, 2), 'utf8');
  });

  after(async () => {
    // Clean up
    await fs.writeFile(CONTENT_FILE, JSON.stringify(DEFAULT_CONTENT, null, 2), 'utf8');
  });

  it('should not lose writes when multiple operations happen concurrently', async () => {
    const NUM_OPERATIONS = 50;

    // Create an array of promises simulating concurrent requests adding an event
    const promises = Array.from({ length: NUM_OPERATIONS }).map((_, i) => {
      return runWithFileLock(async () => {
        const content = await readContent();
        content.events.push({
          id: `test-event-${i}`,
          name: `Test Event ${i}`,
        });
        await writeContent(content);
      });
    });

    // Run them all concurrently
    await Promise.all(promises);

    // Verify the results
    const finalContent = await readContent();
    // Default content has 1 event, we added 50
    assert.strictEqual(finalContent.events.length, DEFAULT_CONTENT.events.length + NUM_OPERATIONS);

    // Ensure all 50 events are present
    for (let i = 0; i < NUM_OPERATIONS; i++) {
      const found = finalContent.events.find((e) => e.id === `test-event-${i}`);
      assert.notStrictEqual(found, undefined);
    }
  });
});
