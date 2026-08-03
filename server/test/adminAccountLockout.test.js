import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkPasskeyLockout,
  recordFailedPasskeyAttempt,
  clearPasskeyAttempts,
} from '../middleware/auth/passkeyLockout.js';

test('Account Lockout - recordFailedPasskeyAttempt & checkPasskeyLockout', async (t) => {
  const testUser = 'admin_lockout_test_user@example.com';
  const testIp = '192.168.1.100';

  // Clear initial state
  clearPasskeyAttempts(testUser, testIp);

  await t.test('initial attempt state is unlocked', () => {
    const isLocked = checkPasskeyLockout(testUser, testIp);
    assert.equal(isLocked, false);
  });

  await t.test('less than 5 failed attempts keeps account unlocked', () => {
    for (let i = 0; i < 4; i++) {
      recordFailedPasskeyAttempt(testUser, testIp);
    }
    const isLocked = checkPasskeyLockout(testUser, testIp);
    assert.equal(isLocked, false);
  });

  await t.test('5th failed attempt triggers account lockout', () => {
    recordFailedPasskeyAttempt(testUser, testIp); // 5th attempt
    const isLocked = checkPasskeyLockout(testUser, testIp);
    assert.equal(isLocked, true);
  });

  await t.test('clearPasskeyAttempts resets lockout state', () => {
    clearPasskeyAttempts(testUser, testIp);
    const isLocked = checkPasskeyLockout(testUser, testIp);
    assert.equal(isLocked, false);
  });
});
