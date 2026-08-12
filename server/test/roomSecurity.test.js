import assert from 'node:assert/strict';
import test from 'node:test';
import { EventEmitter } from 'node:events';

// Create a mock socket resembling Socket.IO Socket
const createMockSocket = (id = 'test-socket-123') => {
  const socket = new EventEmitter();
  socket.id = id;
  socket.adminAuthenticated = false;
  socket.rooms = new Set([id]); // Mimic Socket.io rooms Set containing socket.id by default
  socket.emittedTo = []; // Track socket.to(room).emit(event, data) calls
  socket.join = (room) => {
    socket.rooms.add(room);
  };
  socket.leave = (room) => {
    socket.rooms.delete(room);
  };
  socket.to = (room) => {
    const self = socket;
    return {
      emit: (event, data) => {
        self.emittedTo.push({ room, event, data });
      },
    };
  };
  socket.disconnect = () => {
    socket.disconnected = true;
    socket.emit('disconnect');
  };
  socket.disconnected = false;
  socket.use = (fn) => {};
  return socket;
};

test('Security Audit & Validation: Socket Room Hardening', async (t) => {
  const { _onConnection } = await import('../config/socket.js');

  await t.test('Scenario 1: Legitimate room joins and leaves succeed', () => {
    const socket = createMockSocket('socket-1');
    _onConnection(socket);

    // Join notifications-room
    socket.emit('room:join', 'notifications-room');
    assert.ok(socket.rooms.has('notifications-room'));

    // Leave notifications-room
    socket.emit('room:leave', 'notifications-room');
    assert.ok(!socket.rooms.has('notifications-room'));
  });

  await t.test('Scenario 2: Unapproved and arbitrary rooms are rejected', () => {
    const socket = createMockSocket('socket-2');
    _onConnection(socket);

    // Try joining arbitrary room
    socket.emit('room:join', 'random-room-99');
    assert.ok(!socket.rooms.has('random-room-99'));

    // Try joining empty/null
    socket.emit('room:join', '');
    assert.ok(!socket.rooms.has(''));
  });

  await t.test('Scenario 3: Non-string and nested objects are rejected', () => {
    const socket = createMockSocket('socket-3');
    _onConnection(socket);

    socket.emit('room:join', { nested: 'obj' });
    assert.ok(!socket.rooms.has('[object Object]'));

    socket.emit('room:join', ['array']);
    assert.equal(socket.rooms.size, 1); // Only contains default socket.id
  });

  await t.test('Scenario 4: Protected room joins reject unauthorized sockets', () => {
    const socket = createMockSocket('socket-4');
    _onConnection(socket);

    // Unauthorized join to admin-room
    socket.emit('room:join', 'admin-room');
    assert.ok(!socket.rooms.has('admin-room'));

    // Authorized join to admin-room
    const adminSocket = createMockSocket('admin-socket');
    adminSocket.adminAuthenticated = true;
    _onConnection(adminSocket);

    adminSocket.emit('room:join', 'admin-room');
    assert.ok(adminSocket.rooms.has('admin-room'));
  });

  await t.test('Scenario 5: Workspace dynamic room joins require structured ID validation', () => {
    const socket = createMockSocket('socket-5');
    _onConnection(socket);

    // Valid workspace uuid/id
    socket.emit('join_room', 'workspace-abc-123', { name: 'Alice' });
    assert.ok(socket.rooms.has('workspace-abc-123'));

    // Invalid/malformed workspace ID containing special injection chars
    socket.emit('join_room', 'workspace; DROP TABLE users; --', { name: 'Alice' });
    assert.ok(!socket.rooms.has('workspace; DROP TABLE users; --'));
  });

  await t.test('Scenario 6: Per-socket room limits prevent unbounded room subscriptions', () => {
    const socket = createMockSocket('socket-6');
    _onConnection(socket);

    // Attempt to join 15 distinct valid workspace rooms
    for (let i = 0; i < 15; i++) {
      socket.emit('join_room', `room-${i}`, { name: 'User' });
    }

    // Should cap at MAX_ROOMS_PER_SOCKET (10) + default socket.id = 11 total entries
    assert.ok(socket.rooms.size <= 11);
  });

  await t.test(
    'Scenario 7: Workspace event relay only forwards from authorized room members',
    () => {
      const alice = createMockSocket('socket-alice');
      const eve = createMockSocket('socket-eve');
      _onConnection(alice);
      _onConnection(eve);

      const room = 'workspace-abc';

      // Alice joins the workspace room
      alice.emit('join_room', room, { name: 'Alice' });
      alice.emittedTo = []; // Clear the user_joined notification from our tracking

      // Eve does NOT join workspace-abc

      // Alice sends a workspace update — should be relayed
      alice.emit('workspace_update', { roomId: room, content: 'Hello' });
      const aliceUpdates = alice.emittedTo.filter((e) => e.event === 'workspace_update');
      assert.equal(aliceUpdates.length, 1);
      assert.equal(aliceUpdates[0].room, room);

      // Eve sends a workspace update to the same room — should be blocked
      eve.emit('workspace_update', { roomId: room, content: 'Malicious' });
      const eveUpdates = eve.emittedTo.filter((e) => e.event === 'workspace_update');
      assert.equal(eveUpdates.length, 0);

      // Same for document_change
      alice.emit('document_change', { roomId: room, doc: 'doc1' });
      const aliceDocs = alice.emittedTo.filter((e) => e.event === 'document_change');
      assert.equal(aliceDocs.length, 1);

      eve.emit('document_change', { roomId: room, doc: 'doc1' });
      const eveDocs = eve.emittedTo.filter((e) => e.event === 'document_change');
      assert.equal(eveDocs.length, 0);

      // cursor_moved
      alice.emit('cursor_moved', { roomId: room, pos: 5 });
      const aliceCursors = alice.emittedTo.filter((e) => e.event === 'cursor_moved');
      assert.equal(aliceCursors.length, 1);

      eve.emit('cursor_moved', { roomId: room, pos: 99 });
      const eveCursors = eve.emittedTo.filter((e) => e.event === 'cursor_moved');
      assert.equal(eveCursors.length, 0);
    // Same for document_change
    alice.emit('document_change', { roomId: room, content: 'doc1', version: 0 });
    assert.equal(aliceDocs.length, 1);

    eve.emit('document_change', { roomId: room, content: 'doc1', version: 0 });
    assert.equal(eveDocs.length, 0);

    // cursor_moved
    alice.emit('cursor_moved', { roomId: room, cursor: { x: 100, y: 200 } });
    assert.equal(aliceCursors.length, 1);

    eve.emit('cursor_moved', { roomId: room, cursor: { x: 999, y: 999 } });
    assert.equal(eveCursors.length, 0);

      // typing_start
      alice.emit('typing_start', { roomId: room });
      const aliceTypingStart = alice.emittedTo.filter((e) => e.event === 'typing_start');
      assert.equal(aliceTypingStart.length, 1);

      eve.emit('typing_start', { roomId: room });
      const eveTypingStart = eve.emittedTo.filter((e) => e.event === 'typing_start');
      assert.equal(eveTypingStart.length, 0);

      // typing_stop
      alice.emit('typing_stop', { roomId: room });
      const aliceTypingStop = alice.emittedTo.filter((e) => e.event === 'typing_stop');
      assert.equal(aliceTypingStop.length, 1);

      eve.emit('typing_stop', { roomId: room });
      const eveTypingStop = eve.emittedTo.filter((e) => e.event === 'typing_stop');
      assert.equal(eveTypingStop.length, 0);
    }
  );

  await t.test('Scenario 8: Workspace event relay blocked when roomId is missing', () => {
    const socket = createMockSocket('socket-8');
    _onConnection(socket);
    socket.emit('join_room', 'workspace-xyz', { name: 'User' });
    socket.emittedTo = [];

    // Events without roomId should not be relayed
    socket.emit('workspace_update', { content: 'No room' });
    assert.equal(socket.emittedTo.length, 0);
  });

  await t.test('Scenario 9: leave_room clears workspace membership tracking', () => {
    const socket = createMockSocket('socket-9');
    _onConnection(socket);

    const room = 'workspace-leave-test';
    socket.emit('join_room', room, { name: 'Bob' });
    assert.ok(socket.rooms.has(room));

    socket.emittedTo = [];

    // Bob leaves the room
    socket.emit('leave_room', room);
    assert.ok(!socket.rooms.has(room));

    // After leaving, workspace events should be blocked
    socket.emit('workspace_update', { roomId: room, content: 'After leave' });
    const updates = socket.emittedTo.filter((e) => e.event === 'workspace_update');
    assert.equal(updates.length, 0);

    socket.emit('document_change', { roomId: room, doc: 'doc2' });
    const docs = socket.emittedTo.filter((e) => e.event === 'document_change');
    socket.emit('document_change', { roomId: room, content: 'doc2', version: 0 });
    assert.equal(docs.length, 0);
  });

  await t.test('Scenario 10: disconnect cleans up workspace membership tracking', () => {
    const socket = createMockSocket('socket-10');
    _onConnection(socket);

    const room = 'workspace-disc-test';
    socket.emit('join_room', room, { name: 'Charlie' });
    assert.ok(socket.rooms.has(room));

    socket.emittedTo = [];

    // Disconnect the socket
    socket.disconnect();

    // Re-using the same socket after disconnect — events should be blocked
    // (membership was cleaned up)
    socket.emit('workspace_update', { roomId: room, content: 'After disc' });
    const updates = socket.emittedTo.filter((e) => e.event === 'workspace_update');
    assert.equal(updates.length, 0);
  });

  await t.test('Scenario 11: join_room rate limiting prevents room enumeration', async () => {
    const { _clearJoinRoomAttempts } = await import('../config/socket.js');
    _clearJoinRoomAttempts();

    const socket = createMockSocket('socket-11');
    _onConnection(socket);

    // Round 1: join 10 rooms, then leave 10 (counter = 10)
    for (let i = 0; i < 10; i++) socket.emit('join_room', `r1-${i}`, { name: 'User' });
    for (let i = 0; i < 10; i++) socket.emit('leave_room', `r1-${i}`);

    // Round 2: join 10 rooms, then leave 10 (counter = 20)
    for (let i = 0; i < 10; i++) socket.emit('join_room', `r2-${i}`, { name: 'User' });
    for (let i = 0; i < 10; i++) socket.emit('leave_room', `r2-${i}`);

    // Round 3: try to join 10 rooms — rate limit should block all (counter would be 30)
    let joinedCount = 0;
    for (let i = 0; i < 10; i++) {
      socket.emit('join_room', `r3-${i}`, { name: 'User' });
      if (socket.rooms.has(`r3-${i}`)) joinedCount++;
    }

    // All 10 round 3 joins should be blocked by rate limit
    assert.equal(joinedCount, 0, `Expected 0 joined in round 3, got ${joinedCount}`);
  });

  await t.test('Scenario 12: Only authorized room members can publish Yjs delta events', () => {
    const socket = createMockSocket('socket-12');
    const attackerSocket = createMockSocket('attacker-socket-12');

    _onConnection(socket);
    _onConnection(attackerSocket);

    // Socket joins legitimate room
    socket.emit('join_room', 'room-abc', { name: 'Alice' });

    // Attacker tries to publish to room-abc without joining it
    attackerSocket.emit('yjs_update', 'room-abc', Buffer.from([1, 2, 3]));
    const attackerUpdates = attackerSocket.emittedTo.filter((e) => e.event === 'yjs_update');
    assert.equal(
      attackerUpdates.length,
      0,
      'Attacker should not be able to publish Yjs updates to rooms they have not joined'
    );
  });
});
