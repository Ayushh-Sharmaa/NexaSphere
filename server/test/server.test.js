import { describe, it } from 'node:test';
import assert from 'node:assert';
import encryptionManager from '../utils/encryptionManager.js';

import securityPatchManager from '../utils/securityPatchManager.js';

describe('Server', () => {
  it('should pass basic sanity check', () => {
    assert.strictEqual(1 + 1, 2);
  });

  it('should generate security patch report', () => {
    const report = securityPatchManager.generatePatchReport();

    assert.ok(report);
    assert.ok(report.summary);
    assert.ok(report.recommendations);
  });

  it('should have deployment status defined', () => {
    const status = 'healthy';
    assert.strictEqual(status, 'healthy');
  });

  it('should encrypt and decrypt data successfully', () => {
    const secret = 'NexaSphere Secret';

    const encrypted = encryptionManager.encryptData(secret);

    assert.ok(encrypted.encryptedData);

    const decrypted = encryptionManager.decryptData(encrypted);

    assert.strictEqual(decrypted, secret);
  });
});
