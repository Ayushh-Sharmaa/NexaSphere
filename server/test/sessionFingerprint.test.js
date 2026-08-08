import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateDeviceFingerprint,
  validateSessionFingerprint,
} from '../middleware/sessionSecurityMiddleware.js';

test('Session Hijacking Prevention & Device Fingerprinting', async (t) => {
  await t.test('generates deterministic SHA-256 fingerprint from request', () => {
    const mockReq = {
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'accept-language': 'en-US,en;q=0.9',
      },
      ip: '192.168.1.50',
    };

    const fp1 = generateDeviceFingerprint(mockReq);
    const fp2 = generateDeviceFingerprint(mockReq);

    assert.equal(typeof fp1, 'string');
    assert.equal(fp1.length, 64);
    assert.equal(fp1, fp2);
  });

  await t.test('binds fingerprint to new session on first validation', () => {
    const mockReq = {
      headers: {
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        'accept-language': 'en-GB,en;q=0.8',
      },
      ip: '10.0.0.15',
      session: {},
    };

    let nextCalled = false;
    const mockRes = {};

    validateSessionFingerprint(mockReq, mockRes, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.ok(mockReq.session.deviceFingerprint);
    assert.equal(mockReq.session.deviceFingerprint.length, 64);
  });

  await t.test('allows requests with matching device fingerprint', () => {
    const mockReq = {
      headers: {
        'user-agent': 'TestBrowser/1.0',
        'accept-language': 'en-US',
      },
      ip: '172.16.0.5',
      session: {},
    };

    // First request binds fingerprint
    validateSessionFingerprint(mockReq, {}, () => {});

    // Subsequent request with matching headers
    let nextCalled = false;
    validateSessionFingerprint(mockReq, {}, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
  });

  await t.test('blocks request & revokes session when User-Agent changes (session hijacking)', () => {
    let sessionDestroyed = false;
    const mockSession = {
      id: 'sess_12345',
      destroy: (cb) => {
        sessionDestroyed = true;
        if (cb) cb();
      },
    };

    const legitimateReq = {
      headers: {
        'user-agent': 'LegitimateBrowser/2.0',
        'accept-language': 'en-US',
      },
      ip: '192.168.1.10',
      session: mockSession,
    };

    // Bind initial fingerprint
    validateSessionFingerprint(legitimateReq, {}, () => {});

    // Attacker sends request with different User-Agent
    const attackerReq = {
      headers: {
        'user-agent': 'AttackerBot/9.9',
        'accept-language': 'en-US',
      },
      ip: '192.168.1.10',
      session: mockSession,
    };

    let responseStatus = null;
    let responseJson = null;

    const mockRes = {
      status(code) {
        responseStatus = code;
        return this;
      },
      json(payload) {
        responseJson = payload;
        return this;
      },
    };

    validateSessionFingerprint(attackerReq, mockRes, () => {});

    assert.equal(responseStatus, 401);
    assert.equal(responseJson.error, 'SESSION_HIJACK_DETECTED');
    assert.equal(sessionDestroyed, true);
  });
});
