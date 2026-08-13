import assert from "node:assert/strict";
import test from "node:test";
import { activityEventsService } from "../services/activityEventsService.js";
import { activityEventsRepository } from "../repositories/activityEventsRepository.js";
import { coreTeamService } from "../services/coreTeamService.js";
import { UnauthorizedError } from "../utils/errors.js";

// Mock the repository database operations to avoid hitting a real DB/file
const originalCreate = activityEventsRepository.create;
const originalDelete = activityEventsRepository.delete;
const originalListMembers = coreTeamService.listMembers;

// Fictional test member — no real PII committed to source (fixes #840)
const TEST_MEMBER = {
  name: "Test Member",
  email: "testmember@example.com",
  whatsapp: "9000000001",
};

test.before(() => {
  // Set up mock implementations
  activityEventsRepository.create = async (key, data) => {
    return { id: "mock-id", ...data };
  };
  activityEventsRepository.delete = async (key, id) => {
    return true;
  };
  // Mock coreTeamService.listMembers so tests do not depend on a live data store
  coreTeamService.listMembers = async () => [TEST_MEMBER];
  process.env.ADMIN_EVENT_PASSWORD = "TestPassword123";
});

test.after(() => {
  // Restore original implementations
  activityEventsRepository.create = originalCreate;
  activityEventsRepository.delete = originalDelete;
  coreTeamService.listMembers = originalListMembers;
  delete process.env.ADMIN_EVENT_PASSWORD;
});

test("activityEventsService.addActivityEvent rejects unauthorized requests", async () => {
  const unauthorizedInput = {
    name: "Hackathon Event",
    date: "2026-06-01T12:00:00Z",
    description: "A test event description",
    password: "wrongpassword", // Incorrect password
    coreTeamName: "John Doe",
    coreTeamEmail: "john@example.com",
    coreTeamPhone: "1234567890",
  };

  await assert.rejects(
    async () => {
      await activityEventsService.addActivityEvent(
        "hackathons",
        unauthorizedInput
      );
    },
    (err) => {
      assert.ok(err instanceof UnauthorizedError);
      return true;
    }
  );
});

test("activityEventsService.addActivityEvent accepts authorized requests", async () => {
  const authorizedInput = {
    name: "Hackathon Event",
    date: "2026-06-01T12:00:00Z",
    description: "A test event description",
    password: "TestPassword123", // Matches process.env.ADMIN_EVENT_PASSWORD
    // Matching the fictional TEST_MEMBER returned by the mocked coreTeamService.listMembers
    coreTeamName: TEST_MEMBER.name,
    coreTeamEmail: TEST_MEMBER.email,
    coreTeamPhone: TEST_MEMBER.whatsapp,
  };

  const result = await activityEventsService.addActivityEvent(
    "hackathons",
    authorizedInput
  );
  assert.equal(result.name, "Hackathon Event");
});

test("activityEventsService.deleteActivityEvent accepts authorized requests", async () => {
  const result = await activityEventsService.deleteActivityEvent(
    "hackathons",
    "mock-id"
  );
  assert.equal(result, true);
});
