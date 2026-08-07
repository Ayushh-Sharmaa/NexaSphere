import test from 'node:test';
import assert from 'node:assert/strict';
import { stripPrivilegedRoleFields } from '../middleware/rolePayloadSanitizer.js';

test('Privilege Escalation Prevention & Role Payload Sanitization', async (t) => {
  await t.test('strips role and admin fields when non-admin updates profile', () => {
    const mockReq = {
      user: { id: 'user_123', role: 'user', isMasterAdmin: false },
      body: {
        name: 'John Doe',
        email: 'john@example.com',
        role: 'admin',
        isAdmin: true,
        permissions: ['all'],
      },
    };

    let nextCalled = false;
    stripPrivilegedRoleFields(mockReq, {}, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(mockReq.body.name, 'John Doe');
    assert.equal(mockReq.body.email, 'john@example.com');
    assert.equal(mockReq.body.role, undefined);
    assert.equal(mockReq.body.isAdmin, undefined);
    assert.equal(mockReq.body.permissions, undefined);
  });

  await t.test('allows master admin to modify user roles', () => {
    const mockReq = {
      user: { id: 'master_1', role: 'master_admin', isMasterAdmin: true },
      body: {
        name: 'Jane Doe',
        role: 'admin',
        isAdmin: true,
      },
    };

    let nextCalled = false;
    stripPrivilegedRoleFields(mockReq, {}, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(mockReq.body.role, 'admin');
    assert.equal(mockReq.body.isAdmin, true);
  });
});
