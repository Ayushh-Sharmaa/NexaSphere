/**
 * complianceService.js
 * Compliance & Legal Document Management (Issue #1757)
 *
 * Manages:
 *  - Legal document versioning (Privacy Policy, ToS, Code of Conduct, Event Waivers)
 *  - User acceptance tracking with timestamps
 *  - GDPR requests (data deletion, data export, consent withdrawal)
 *  - Complete audit trail
 *
 * Storage: In-memory with JSON file persistence under server/data/compliance.json
 * (Drop-in replace with a DB-backed implementation when a DB is available.)
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '..', 'data', 'compliance.json');

// ─── Document type catalogue ─────────────────────────────────────────────────

export const DOCUMENT_TYPES = [
  'privacy_policy',
  'terms_of_service',
  'code_of_conduct',
  'event_waiver',
];

export const GDPR_REQUEST_TYPES = ['data_deletion', 'data_export', 'consent_withdrawal'];

// ─── Default seed data ────────────────────────────────────────────────────────

const DEFAULT_STATE = {
  documents: [
    {
      id: 'doc-pp-1',
      type: 'privacy_policy',
      title: 'Privacy Policy',
      version: '1.0.0',
      effectiveDate: '2024-01-01T00:00:00.000Z',
      content:
        'NexaSphere collects and processes your personal data to provide our services. We respect your privacy and comply with GDPR regulations. Data we collect: name, email, activity data. Your rights: access, correction, deletion, portability. Contact dpo@nexasphere.org for any privacy concerns.',
      summary:
        'We collect your name and email to run the platform. You can delete your data anytime.',
      content: 'NexaSphere collects and processes your personal data to provide our services. We respect your privacy and comply with GDPR regulations. Data we collect: name, email, activity data. Your rights: access, correction, deletion, portability. Contact dpo@nexasphere.org for any privacy concerns.',
      summary: 'We collect your name and email to run the platform. You can delete your data anytime.',
      archived: false,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'doc-tos-1',
      type: 'terms_of_service',
      title: 'Terms of Service',
      version: '1.0.0',
      effectiveDate: '2024-01-01T00:00:00.000Z',
      content:
        'By using NexaSphere you agree to these terms. You must be 18+ or have parental consent. You may not use the platform for illegal activities. NexaSphere may suspend accounts that violate these terms.',
      summary:
        'Use the platform responsibly. Be 18+ or have parental consent. No illegal activity.',
      content: 'By using NexaSphere you agree to these terms. You must be 18+ or have parental consent. You may not use the platform for illegal activities. NexaSphere may suspend accounts that violate these terms.',
      summary: 'Use the platform responsibly. Be 18+ or have parental consent. No illegal activity.',
      archived: false,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'doc-coc-1',
      type: 'code_of_conduct',
      title: 'Code of Conduct',
      version: '1.0.0',
      effectiveDate: '2024-01-01T00:00:00.000Z',
      content:
        'NexaSphere is committed to providing a welcoming environment for all. Be respectful and inclusive. No harassment, discrimination, or abusive language. Report violations to conduct@nexasphere.org.',
      content: 'NexaSphere is committed to providing a welcoming environment for all. Be respectful and inclusive. No harassment, discrimination, or abusive language. Report violations to conduct@nexasphere.org.',
      summary: 'Be kind and respectful to everyone. Report harassment immediately.',
      archived: false,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ],
  acceptances: [], // { id, userId, documentId, documentType, version, acceptedAt, ipAddress }
  gdprRequests: [], // { id, userId, type, status, requestedAt, processedAt, notes }
  auditLog: [], // { id, action, actorId, targetId, details, timestamp }
  acceptances: [],    // { id, userId, documentId, documentType, version, acceptedAt, ipAddress }
  gdprRequests: [],   // { id, userId, type, status, requestedAt, processedAt, notes }
  auditLog: [],       // { id, action, actorId, targetId, details, timestamp }
};

// ─── State ────────────────────────────────────────────────────────────────────

let state = null;

async function load() {
  if (state) return state;
  try {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    state = JSON.parse(raw);
  } catch {
    state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    await save();
  }
  return state;
}

async function save() {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(state, null, 2), 'utf8');
}

function audit(action, actorId, targetId, details = {}) {
  state.auditLog.unshift({
    id: randomUUID(),
    action,
    actorId: actorId || 'system',
    targetId: targetId || null,
    details,
    timestamp: new Date().toISOString(),
  });
  // Cap audit log at 500 entries
  if (state.auditLog.length > 500) state.auditLog.length = 500;
}

// ─── Document management ──────────────────────────────────────────────────────

export async function listDocuments({ type, includeArchived = false } = {}) {
  const s = await load();
  let docs = s.documents;
  if (type) docs = docs.filter((d) => d.type === type);
  if (!includeArchived) docs = docs.filter((d) => !d.archived);
  return docs.sort((a, b) => new Date(b.effectiveDate) - new Date(a.effectiveDate));
}

export async function getDocument(id) {
  const s = await load();
  return s.documents.find((d) => d.id === id) || null;
}

export async function getActiveDocument(type) {
  const s = await load();
  const docs = s.documents
    .filter((d) => d.type === type && !d.archived)
    .sort((a, b) => new Date(b.effectiveDate) - new Date(a.effectiveDate));
  return docs[0] || null;
}

export async function createDocument(
  { type, title, version, effectiveDate, content, summary },
  actorId
) {

}
export async function updateDocument(id, updates, actorId) {
  const s = await load();
  const idx = s.documents.findIndex((d) => d.id === id);
  if (idx === -1) throw new Error('Document not found');

  const doc = s.documents[idx];
  const allowed = ['title', 'content', 'summary', 'effectiveDate'];
  for (const key of allowed) {
    if (updates[key] !== undefined) doc[key] = updates[key];
  }
  doc.updatedAt = new Date().toISOString();

  audit('document.updated', actorId, id, { fields: Object.keys(updates) });
  await save();
  return doc;
}

export async function archiveDocument(id, actorId) {
  const s = await load();
  const doc = s.documents.find((d) => d.id === id);
  if (!doc) throw new Error('Document not found');

  doc.archived = true;
  doc.updatedAt = new Date().toISOString();
  audit('document.archived', actorId, id, { type: doc.type, version: doc.version });
  await save();
  return doc;
}

// ─── Acceptance tracking ──────────────────────────────────────────────────────

export async function recordAcceptance({ userId, documentId, ipAddress = null }) {
  const s = await load();
  const doc = s.documents.find((d) => d.id === documentId);
  if (!doc) throw new Error('Document not found');

  const acceptance = {
    id: randomUUID(),
    userId: String(userId),
    documentId,
    documentType: doc.type,
    version: doc.version,
    acceptedAt: new Date().toISOString(),
    ipAddress: ipAddress || null,
  };

  s.acceptances.push(acceptance);
  audit('acceptance.recorded', userId, documentId, { type: doc.type, version: doc.version });
  await save();
  return acceptance;
}

export async function getUserAcceptances(userId) {
  const s = await load();
  return s.acceptances.filter((a) => a.userId === String(userId));
}

export async function hasUserAccepted(userId, documentType) {
  const s = await load();
  const activeDoc = await getActiveDocument(documentType);
  if (!activeDoc) return false;
  return s.acceptances.some((a) => a.userId === String(userId) && a.documentId === activeDoc.id);
  return s.acceptances.some(
    (a) => a.userId === String(userId) && a.documentId === activeDoc.id
  );
}

export async function listAcceptances({ documentId, documentType, limit = 50, offset = 0 } = {}) {
  const s = await load();
  let list = s.acceptances;
  if (documentId) list = list.filter((a) => a.documentId === documentId);
  if (documentType) list = list.filter((a) => a.documentType === documentType);
  list = list.sort((a, b) => new Date(b.acceptedAt) - new Date(a.acceptedAt));
  return { total: list.length, items: list.slice(offset, offset + limit) };
}

// ─── GDPR requests ────────────────────────────────────────────────────────────

export async function createGdprRequest({ userId, type, notes = '' }) {
  const s = await load();
  if (!GDPR_REQUEST_TYPES.includes(type)) throw new Error(`Invalid GDPR request type: ${type}`);

  // Prevent duplicate pending requests of the same type
  const existing = s.gdprRequests.find(
    (r) => r.userId === String(userId) && r.type === type && r.status === 'pending'
  );
  if (existing) throw new Error('A pending request of this type already exists');

  const req = {
    id: randomUUID(),
    userId: String(userId),
    type,
    status: 'pending',
    notes: String(notes || '').substring(0, 1000),
    requestedAt: new Date().toISOString(),
    processedAt: null,
  };

  s.gdprRequests.push(req);
  audit('gdpr.request.created', userId, req.id, { type });
  await save();
  return req;
}

export async function listGdprRequests({ status, userId, limit = 50, offset = 0 } = {}) {
  const s = await load();
  let list = s.gdprRequests;
  if (status) list = list.filter((r) => r.status === status);
  if (userId) list = list.filter((r) => r.userId === String(userId));
  list = list.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
  return { total: list.length, items: list.slice(offset, offset + limit) };
}

export async function processGdprRequest(id, { status, notes }, actorId) {
  const s = await load();
  const req = s.gdprRequests.find((r) => r.id === id);
  if (!req) throw new Error('GDPR request not found');

  req.status = status; // 'completed' | 'rejected'
  req.processedAt = new Date().toISOString();
  if (notes) req.notes = String(notes).substring(0, 1000);

  audit('gdpr.request.processed', actorId, id, { status, userId: req.userId, type: req.type });
  await save();
  return req;
}

// ─── Audit log ────────────────────────────────────────────────────────────────

export async function getAuditLog({ action, actorId, limit = 50, offset = 0 } = {}) {
  const s = await load();
  let log = s.auditLog;
  if (action) log = log.filter((e) => e.action === action);
  if (actorId) log = log.filter((e) => e.actorId === String(actorId));
  return { total: log.length, items: log.slice(offset, offset + limit) };
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getStats() {
  const s = await load();
  return {
    totalDocuments: s.documents.filter((d) => !d.archived).length,
    archivedDocuments: s.documents.filter((d) => d.archived).length,
    totalAcceptances: s.acceptances.length,
    pendingGdprRequests: s.gdprRequests.filter((r) => r.status === 'pending').length,
    totalGdprRequests: s.gdprRequests.length,
    auditLogEntries: s.auditLog.length,
  };
}

export default {
  listDocuments,
  getDocument,
  getActiveDocument,
  createDocument,
  updateDocument,
  archiveDocument,
  recordAcceptance,
  getUserAcceptances,
  hasUserAccepted,
  listAcceptances,
  createGdprRequest,
  listGdprRequests,
  processGdprRequest,
  getAuditLog,
  getStats,
  DOCUMENT_TYPES,
  GDPR_REQUEST_TYPES,
  listDocuments, getDocument, getActiveDocument, createDocument, updateDocument, archiveDocument,
  recordAcceptance, getUserAcceptances, hasUserAccepted, listAcceptances,
  createGdprRequest, listGdprRequests, processGdprRequest,
  getAuditLog, getStats,
  DOCUMENT_TYPES, GDPR_REQUEST_TYPES,
};
