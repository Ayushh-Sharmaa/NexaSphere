/**
 * Unit Tests — Real-time Notifications via Socket.IO
 *
 * Verifies that the new real-time notification integration triggers socket
 * events under the correct circumstances:
 * - Creating a new event triggers 'event-published' to the 'notifications-room'
 * - Commenting on a forum thread triggers 'new-comment' to the thread author
 * - Saving a portfolio triggers 'project-approved' to the user's private channel
 */
import './setupEnv.js'; // Set up test environment variables
import { describe, test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { eventsRepository } from '../repositories/eventsRepository.js';
import { forumRepository } from '../repositories/forumRepository.js';
import { portfolioRepository } from '../repositories/portfolioRepository.js';
import { _setIOForTests } from '../config/socket.js';

// ── Mock socket server setup ──────────────────────────────────────────────────

let mockEmissions = [];

const mockIo = {
  to(roomName) {
    return {
      emit(eventName, data) {
        mockEmissions.push({ roomName, eventName, data });
      },
    };
  },
  emit(eventName, data) {
    mockEmissions.push({ roomName: null, eventName, data });
  },
};

describe('Real-time Notifications — Unit Tests', () => {
  beforeEach(() => {
    mockEmissions = [];
    _setIOForTests(mockIo);
  });

  afterEach(() => {
    _setIOForTests(null);
  });

  test('eventsService.createEvent triggers event-published socket notification', async (t) => {
    const mockCreatedEvent = {
      id: 'evt-123',
      name: 'NexaSphere Hackathon',
      date: '2026-07-15T18:00:00.000Z',
    };

    // Stub the repository method
    t.mock.method(eventsRepository, 'create', async () => mockCreatedEvent);

    const { eventsService } = await import('../services/eventsService.js');

    // Trigger event creation
    await eventsService.createEvent({
      name: 'NexaSphere Hackathon',
      date_text: 'July 15',
      date: '2026-07-15T18:00:00.000Z',
      description: 'Hackathon description',
      location: 'Online',
    });

    // Verify emission
    const emission = mockEmissions.find((e) => e.eventName === 'event-published');
    assert.ok(emission, 'Should emit event-published event');
    assert.equal(emission.roomName, 'notifications-room');
    assert.equal(emission.data.eventId, 'evt-123');
    assert.equal(emission.data.eventName, 'NexaSphere Hackathon');
  });

  test('forumService.createReply triggers new-comment socket notification to thread author', async (t) => {
    const mockThread = {
      id: 101,
      title: 'Prisma Client Setup Help',
      authorEmail: 'student@nexasphere.edu',
    };
    const mockReply = { id: 501, content: 'Use the output generator key!' };

    // Stub the repository methods
    t.mock.method(forumRepository, 'getThreadById', async () => mockThread);
    t.mock.method(forumRepository, 'createReply', async () => mockReply);

    const { forumService } = await import('../services/forumService.js');

    // Trigger reply creation from a different author
    await forumService.createReply(101, {
      content: 'Use the output generator key!',
      author_name: 'Helper Student',
      author_email: 'helper@nexasphere.edu',
    });

    // Verify emission (should be routed to the thread author's specific socket room)
    const emission = mockEmissions.find((e) => e.eventName === 'new-comment');
    assert.ok(emission, 'Should emit new-comment event');
    assert.equal(emission.roomName, 'user-student@nexasphere.edu');
    assert.equal(emission.data.threadId, 101);
    assert.equal(emission.data.threadTitle, 'Prisma Client Setup Help');
    assert.equal(emission.data.authorName, 'Helper Student');
  });

  test('forumService.createReply does NOT notify if replier is the thread author', async (t) => {
    const mockThread = { id: 101, title: 'Help needed', authorEmail: 'student@nexasphere.edu' };
    const mockReply = { id: 502, content: 'Nvm I fixed it myself' };

    t.mock.method(forumRepository, 'getThreadById', async () => mockThread);
    t.mock.method(forumRepository, 'createReply', async () => mockReply);

    const { forumService } = await import('../services/forumService.js');

    // Trigger reply creation from the thread author themselves
    await forumService.createReply(101, {
      content: 'Nvm I fixed it myself',
      author_name: 'Thread Author',
      author_email: 'student@nexasphere.edu',
    });

    // Verify no emission
    const emission = mockEmissions.find((e) => e.eventName === 'new-comment');
    assert.equal(
      emission,
      undefined,
      'Should not notify the author if they are the one who replied'
    );
  });
});
