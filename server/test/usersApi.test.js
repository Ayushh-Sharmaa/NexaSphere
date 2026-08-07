import assert from "node:assert/strict";
import test from "node:test";
import { toPublicUserDTO, toAdminUserDTO } from "../utils/userSerializer.js";
import {
  getPublicUsers,
  getAdminUsers,
} from "../controllers/usersController.js";
import { usersRepository } from "../repositories/usersRepository.js";

const mockRawUser = {
  id: "user-123",
  username: "hacker123",
  display_name: "Hackerman",
  avatar_url: "https://example.com/avatar.png",
  bio: "A cool bio",
  created_at: new Date("2026-06-01T12:00:00Z"),
  email: "hacker@example.com",
  password_hash: "$2b$12$supers3cr3tH4sh",
  reset_token: "secret-reset-token-123",
  admin_roles: ["moderator"],
  last_login: new Date("2026-06-01T13:00:00Z"),
};

test("Scenario 6: Serializer validation - Correct DTO mapping", () => {
  const publicDto = toPublicUserDTO(mockRawUser);

  // Expected Public Fields
  assert.equal(publicDto.id, "user-123");
  assert.equal(publicDto.username, "hacker123");
  assert.equal(publicDto.displayName, "Hackerman");
  assert.equal(publicDto.avatarUrl, "https://example.com/avatar.png");
  assert.equal(publicDto.bio, "A cool bio");

  // Scenario 2, 3, 4: Sensitive Field Exposure
  assert.equal(publicDto.password_hash, undefined);
  assert.equal(publicDto.reset_token, undefined);
  assert.equal(publicDto.email, undefined);
  assert.equal(publicDto.admin_roles, undefined);
});

test("Scenario 5: Admin endpoint - Privileged fields only", () => {
  const adminDto = toAdminUserDTO(mockRawUser);

  assert.equal(adminDto.email, "hacker@example.com");
  assert.deepEqual(adminDto.roles, ["moderator"]);
  assert.equal(adminDto.password_hash, undefined);
  assert.equal(adminDto.reset_token, undefined);
});

test("Controller handles public API responses correctly", async () => {
  const originalGetAll = usersRepository.getAllPublicUsers;
  usersRepository.getAllPublicUsers = async () => [mockRawUser];

  let jsonRes;
  const req = {};
  const res = {
    json: (data) => {
      jsonRes = data;
      return data;
    },
    status: () => res,
  };

  await getPublicUsers(req, res);

  assert.ok(Array.isArray(jsonRes));
  assert.equal(jsonRes.length, 1);
  assert.equal(jsonRes[0].username, "hacker123");
  assert.equal(jsonRes[0].password_hash, undefined);
  assert.equal(jsonRes[0].reset_token, undefined);
  assert.equal(jsonRes[0].email, undefined);

  // Restore mock
  usersRepository.getAllPublicUsers = originalGetAll;
});
