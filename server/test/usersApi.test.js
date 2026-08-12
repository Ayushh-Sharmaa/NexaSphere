import assert from 'node:assert/strict';
import test from 'node:test';
import { toPublicUserDTO, toAdminUserDTO } from '../utils/userSerializer.js';
import { getPublicUsers, getAdminUsers } from '../controllers/usersController.js';
import { usersRepository } from '../repositories/usersRepository.js';
import { setWithDbOverride } from '../repositories/db.js';

const mockRawUser = {
  id: 'user-123',
  username: 'hacker123',
  display_name: 'Hackerman',
  avatar_url: 'https://example.com/avatar.png',
  bio: 'A cool bio',
  created_at: new Date('2026-06-01T12:00:00Z'),
  email: 'hacker@example.com',
  password_hash: '$2b$12$supers3cr3tH4sh',
  reset_token: 'secret-reset-token-123',
  admin_roles: ['moderator'],
  last_login: new Date('2026-06-01T13:00:00Z'),
};

test('Scenario 6: Serializer validation - Correct DTO mapping', () => {
  const publicDto = toPublicUserDTO(mockRawUser);

  // Expected Public Fields
  assert.equal(publicDto.id, 'user-123');
  assert.equal(publicDto.username, 'hacker123');
  assert.equal(publicDto.displayName, 'Hackerman');
  assert.equal(publicDto.avatarUrl, 'https://example.com/avatar.png');
  assert.equal(publicDto.bio, 'A cool bio');

  // Scenario 2, 3, 4: Sensitive Field Exposure
  assert.equal(publicDto.password_hash, undefined);
  assert.equal(publicDto.reset_token, undefined);
  assert.equal(publicDto.email, undefined);
  assert.equal(publicDto.admin_roles, undefined);
});

test('Scenario 5: Admin endpoint - Privileged fields only', () => {
  const adminDto = toAdminUserDTO(mockRawUser);

  assert.equal(adminDto.email, 'hacker@example.com');
  assert.deepEqual(adminDto.roles, ['moderator']);
  assert.equal(adminDto.password_hash, undefined);
  assert.equal(adminDto.reset_token, undefined);
});

test('Controller handles admin API responses correctly', async () => {
  const originalGetAll = usersRepository.getAllUsersAdmin;
  let receivedArgs;
  usersRepository.getAllUsersAdmin = async (args) => {
test('Controller handles public API responses correctly', async () => {
  const originalGetAll = usersRepository.getAllPublicUsers;
  let receivedArgs;
  usersRepository.getAllPublicUsers = async (args) => {
    receivedArgs = args;
    return [mockRawUser];
  };

  let jsonRes;
  const req = { query: { page: '2', limit: '5', role: 'moderator' } };
  const res = {
    json: (data) => {
      jsonRes = data;
      return data;
    },
    status: () => res,
  };

  await getAdminUsers(req, res);

  assert.deepEqual(receivedArgs, { page: 2, limit: 5, role: 'moderator' });
  assert.equal(jsonRes.page, 2);
  assert.equal(jsonRes.limit, 5);
  assert.ok(Array.isArray(jsonRes.users));
  assert.equal(jsonRes.users.length, 1);
  assert.equal(jsonRes.users[0].username, 'hacker123');
  assert.equal(jsonRes.users[0].password_hash, undefined);
  assert.equal(jsonRes.users[0].reset_token, undefined);
  assert.equal(jsonRes.users[0].email, 'hacker@example.com');
  assert.ok(Array.isArray(jsonRes));
  assert.equal(jsonRes.length, 1);
  assert.equal(jsonRes[0].username, 'hacker123');
  assert.equal(jsonRes[0].password_hash, undefined);
  assert.equal(jsonRes[0].reset_token, undefined);
  assert.equal(jsonRes[0].email, undefined);

  // Restore mock
  usersRepository.getAllUsersAdmin = originalGetAll;
});

test('Repository applies pagination and role filters to user list queries', async () => {
  let capturedQuery = null;

  setWithDbOverride(async (fn) =>
    fn({
      query: async (text, values) => {
        capturedQuery = { text, values };
        return { rows: [mockRawUser] };
      },
    })
  );

  try {
    const rows = await usersRepository.getAllUsersAdmin({ page: 3, limit: 7, role: 'moderator' });

    assert.equal(rows.length, 1);
    assert.ok(capturedQuery);
    assert.match(capturedQuery.text, /LIMIT \$1/);
    assert.match(capturedQuery.text, /OFFSET \$2/);
    assert.match(capturedQuery.text, /role = \$3/);
    assert.match(capturedQuery.text, /admin_roles = \$3/);
    assert.deepEqual(capturedQuery.values, [7, 14, 'moderator']);
  } finally {
    setWithDbOverride(null);
  }
});

}
}
);