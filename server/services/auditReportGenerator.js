/**
 * auditReportGenerator.js
 * Generates audit reports (PDF) for compliance runs.
 *
 * NOTE: PDF generation is implemented as a placeholder using JSON summary
 * embedded into a text-based payload, because project PDF tooling
 * integration may require additional dependencies.
 */

import logger from '../utils/logger.js';

function formatSafeIsoDate(val) {
  if (!val) return null;
  try {
    const d = new Date(val);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  } catch (err) {
    return null;
  }
}

export async function generateCompliancePdfReport({ run, runIssues = [], summary = {} }) {
  // Minimal, dependency-free placeholder. Replace with a real PDF renderer (pdfkit, puppeteer, etc.).
  const payload = {
    meta: {
      runId: run?.id,
      runType: run?.run_type,
      createdBy: run?.created_by_admin_id,
      startedAt: formatSafeIsoDate(run?.started_at),
      finishedAt: formatSafeIsoDate(run?.finished_at),
      status: run?.status,
    },
    summary,
    issues: runIssues,
  };

  const fakePdfBuffer = Buffer.from(
    `Compliance Audit Report\n\n${JSON.stringify(payload, null, 2)}\n`,
    'utf8'
  );

  logger.info('[auditReportGenerator] Generated placeholder PDF buffer', {
    runId: run?.id,
    bytes: fakePdfBuffer.length,
  });

  return fakePdfBuffer;
}
