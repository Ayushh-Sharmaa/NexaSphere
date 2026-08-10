import crypto from 'crypto';

const OPEN_BADGES_CONTEXT = 'https://w3id.org/openbadges/v2';

function coerceId(id, prefix) {
  if (id) return id;
  return `urn:uuid:${prefix}-${crypto.randomUUID()}`;
}

function normalizeIssuer(issuer = {}) {
  if (typeof issuer === 'string') {
    return { id: issuer, type: 'Profile' };
  }

  return {
    id: issuer.id || `${process.env.PUBLIC_APP_URL || 'https://nexasphere.local'}/issuer`,
    type: issuer.type || 'Profile',
    name: issuer.name || 'NexaSphere',
    url: issuer.url || process.env.PUBLIC_APP_URL || 'https://nexasphere.local',
    email: issuer.email,
  };
}

function normalizeRecipient(recipient = {}) {
  const identity = recipient.identity || recipient.email || recipient.id || 'unknown';
  const type = recipient.type || (recipient.email ? 'email' : 'email');

  return {
    identity,
    type,
    hashed: recipient.hashed ?? false,
    salt: recipient.salt,
    name: recipient.name,
  };
}

function normalizeCriteria(criteria = {}) {
  if (!criteria.id && !criteria.narrative) return undefined;
  return {
    id: criteria.id || undefined,
    narrative: criteria.narrative || undefined,
  };
}

export function buildBadgeClass({
  id,
  name = 'Workshop Badge',
  description = 'OpenBadges-compliant badge class',
  imageUrl = '',
  issuer,
  criteria,
} = {}) {
  const badgeClass = {
    '@context': OPEN_BADGES_CONTEXT,
    id: coerceId(id, 'badge-class'),
    type: 'BadgeClass',
    name,
    description,
    issuer: normalizeIssuer(issuer),
  };

  if (imageUrl) badgeClass.image = imageUrl;

  const normalizedCriteria = normalizeCriteria(criteria);
  if (normalizedCriteria) badgeClass.criteria = normalizedCriteria;

  return badgeClass;
}

export function buildBadgeAssertion({
  id,
  badgeId,
  recipient = {},
  verificationUrl = '',
  issuedOn = new Date().toISOString(),
  evidence,
} = {}) {
  const assertion = {
    '@context': OPEN_BADGES_CONTEXT,
    id: coerceId(id, 'assertion'),
    type: 'Assertion',
    badge: badgeId || coerceId(undefined, 'badge-ref'),
    recipient: normalizeRecipient(recipient),
    verification: {
      type: 'HostedBadge',
      url: verificationUrl || badgeId || '',
    },
    issuedOn,
  };

  if (Array.isArray(evidence) && evidence.length > 0) {
    assertion.evidence = evidence;
  }

  return assertion;
// Placeholder OpenBadges generator for #1787.
// TODO: make it OpenBadges standard-compliant (BadgeClass + Assertion).



}