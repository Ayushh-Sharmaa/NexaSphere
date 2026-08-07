import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildBadgeAssertion,
  buildBadgeClass,
} from '../services/certificates/openBadgesGenerator.js';

test('buildBadgeClass returns an OpenBadges-compliant BadgeClass', () => {
  const badgeClass = buildBadgeClass({
    id: 'https://nexasphere.test/badges/js-basics',
    name: 'JS Basics',
    description: 'Awarded for completing the JavaScript basics track',
    imageUrl: 'https://nexasphere.test/assets/badges/js-basics.png',
    issuer: {
      id: 'https://nexasphere.test/issuer',
      name: 'NexaSphere',
    },
    criteria: {
      id: 'https://nexasphere.test/badges/js-basics/criteria',
      narrative: 'Complete the fundamentals assessment.',
    },
  });

  assert.equal(badgeClass['@context'], 'https://w3id.org/openbadges/v2');
  assert.equal(badgeClass.type, 'BadgeClass');
  assert.equal(badgeClass.id, 'https://nexasphere.test/badges/js-basics');
  assert.equal(badgeClass.name, 'JS Basics');
  assert.equal(badgeClass.description, 'Awarded for completing the JavaScript basics track');
  assert.equal(badgeClass.image, 'https://nexasphere.test/assets/badges/js-basics.png');
  assert.equal(badgeClass.issuer.id, 'https://nexasphere.test/issuer');
  assert.equal(badgeClass.issuer.type, 'Profile');
  assert.equal(badgeClass.criteria.id, 'https://nexasphere.test/badges/js-basics/criteria');
});

test('buildBadgeAssertion returns an OpenBadges-compliant Assertion', () => {
  const assertion = buildBadgeAssertion({
    id: 'https://nexasphere.test/assertions/abc123',
    badgeId: 'https://nexasphere.test/badges/js-basics',
    recipient: {
      email: 'learner@example.com',
      name: 'Learner',
    },
    verificationUrl: 'https://nexasphere.test/certificates/abc123/verify',
    issuedOn: '2026-07-13T00:00:00.000Z',
    evidence: [{ id: 'https://nexasphere.test/evidence/1' }],
  });

  assert.equal(assertion['@context'], 'https://w3id.org/openbadges/v2');
  assert.equal(assertion.type, 'Assertion');
  assert.equal(assertion.id, 'https://nexasphere.test/assertions/abc123');
  assert.equal(assertion.badge, 'https://nexasphere.test/badges/js-basics');
  assert.equal(assertion.recipient.identity, 'learner@example.com');
  assert.equal(assertion.recipient.type, 'email');
  assert.equal(assertion.recipient.hashed, false);
  assert.equal(assertion.verification.type, 'HostedBadge');
  assert.equal(assertion.verification.url, 'https://nexasphere.test/certificates/abc123/verify');
  assert.equal(assertion.issuedOn, '2026-07-13T00:00:00.000Z');
  assert.equal(assertion.evidence.length, 1);
});
