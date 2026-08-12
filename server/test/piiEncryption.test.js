import test from 'node:test';
import assert from 'node:assert/strict';
import { encryptPII, decryptPII } from '../utils/piiEncryption.js';

test('AES-256-GCM Field-Level PII Encryption & Decryption', async (t) => {
  await t.test('encrypts and decrypts sensitive phone number and SSN', () => {
    const rawPII = '+1 (555) 019-2834';
    const encrypted = encryptPII(rawPII);

    assert.notEqual(encrypted, rawPII);
    assert.equal(encrypted.split(':').length, 3);

    const decrypted = decryptPII(encrypted);
    assert.equal(decrypted, rawPII);
  });

  await t.test('throws error when authTag or cipher text is tampered with', () => {
    const rawPII = '123 Main St, Anytown, USA';
    const encrypted = encryptPII(rawPII);
    const [iv, authTag, cipherText] = encrypted.split(':');

    // Tamper cipherText
    const corruptedPayload = `${iv}:${authTag}:BOGUS_CIPHER_DATA`;

    assert.throws(() => {
      decryptPII(corruptedPayload);
    });
  });

  await t.test('returns unchanged non-string or falsy input', () => {
    assert.equal(encryptPII(null), null);
    assert.equal(encryptPII(undefined), undefined);
    assert.equal(decryptPII(''), '');
  });
});
