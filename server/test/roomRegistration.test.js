import assert from "node:assert/strict";
import test from "node:test";
import { EventEmitter } from "node:events";

// Create a mock socket resembling Socket.IO Socket
const createMockSocket = (id = "test-socket-123") => {
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
    socket.emit("disconnect");
  };
  socket.disconnected = false;
  return socket;
};

test("Room Registration Handler Verification", async (t) => {
  const { _onConnection } = await import("../config/socket.js");

  await t.test(
    "Verify that join_room handles and sanitizes presence fields",
    () => {
      const socket = createMockSocket("socket-alice");
      _onConnection(socket);

      const room = "workspace-123";
      const rawUserPayload = {
        id: "usr-456",
        name: "Alice Cooper",
        color: "#ff0055",
        initials: "AC",
        email: "alice@example.com",
        ignoredField: "malicious",
      };

      socket.emit("join_room", room, rawUserPayload);

      // Verify room was joined
      assert.ok(socket.rooms.has(room));

      // Verify user_joined event was emitted with correctly sanitized fields
      const userJoinedEvent = socket.emittedTo.find(
        (e) => e.event === "user_joined"
      );
      assert.ok(userJoinedEvent);
      assert.equal(userJoinedEvent.room, room);
      assert.equal(userJoinedEvent.data.socketId, socket.id);

      const sanitizedUser = userJoinedEvent.data.user;
      assert.equal(sanitizedUser.id, "usr-456");
      assert.equal(sanitizedUser.name, "Alice Cooper");
      assert.equal(sanitizedUser.color, "#ff0055");
      assert.equal(sanitizedUser.initials, "AC");
      assert.equal(sanitizedUser.email, "alice@example.com");
      // Ensure ignored fields are not included in sanitized user
      assert.equal(sanitizedUser.ignoredField, undefined);
    }
  );

  await t.test("Verify that leave_room works", () => {
    const socket = createMockSocket("socket-bob");
    _onConnection(socket);

    const room = "workspace-leave";
    socket.emit("join_room", room, { name: "Bob" });
    assert.ok(socket.rooms.has(room));
    socket.emittedTo = [];

    socket.emit("leave_room", room);
    assert.ok(!socket.rooms.has(room));

    const userLeftEvent = socket.emittedTo.find((e) => e.event === "user_left");
    assert.ok(userLeftEvent);
    assert.equal(userLeftEvent.room, room);
    assert.equal(userLeftEvent.data.socketId, socket.id);
  });

  await t.test("Verify that typing indicators work correctly", () => {
    const socket = createMockSocket("socket-typing");
    _onConnection(socket);

    const room = "workspace-typing";
    socket.emit("join_room", room, { name: "Typist" });
    socket.emittedTo = [];

    // typing_start
    socket.emit("typing_start", { roomId: room, details: "ignored" });
    const typingStartEvent = socket.emittedTo.find(
      (e) => e.event === "typing_start"
    );
    assert.ok(typingStartEvent);
    assert.equal(typingStartEvent.room, room);
    assert.equal(typingStartEvent.data.socketId, socket.id);

    // typing_stop
    socket.emit("typing_stop", { roomId: room });
    const typingStopEvent = socket.emittedTo.find(
      (e) => e.event === "typing_stop"
    );
    assert.ok(typingStopEvent);
    assert.equal(typingStopEvent.room, room);
    assert.equal(typingStopEvent.data.socketId, socket.id);
  });

  await t.test("Verify no duplicate event listeners exist on socket", () => {
    const socket = createMockSocket("socket-duplicate-test");
    _onConnection(socket);

    const eventsToCheck = [
      "join_room",
      "leave_room",
      "typing_start",
      "typing_stop",
      "disconnect",
    ];
    for (const event of eventsToCheck) {
      const listeners = socket.listeners(event);
      assert.equal(
        listeners.length,
        1,
        `Expected exactly 1 listener for event '${event}', got ${listeners.length}`
      );
    }
  });

  await t.test(
    "Verify that task status events from obsolete roomHandler are not registered/handled",
    () => {
      const socket = createMockSocket("socket-task-test");
      _onConnection(socket);

      // Verify task_status_update is not registered as a listener
      const taskStatusUpdateListeners = socket.listeners("task_status_update");
      assert.equal(
        taskStatusUpdateListeners.length,
        0,
        "Expected no listeners for task_status_update"
      );

      // Emit task_status_update and ensure nothing gets broadcasted or handled
      socket.emit("task_status_update", {
        teamRoomId: "workspace-task",
        taskId: "task-1",
        newStatus: "Done",
      });

      // No events should be emitted in response
      const taskUpdatedEvents = socket.emittedTo.filter(
        (e) => e.event === "task_updated"
      );
      assert.equal(taskUpdatedEvents.length, 0);
    }
  );
});
