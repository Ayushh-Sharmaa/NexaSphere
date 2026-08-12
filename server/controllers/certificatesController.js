import crypto from "crypto";
import { sendSuccess, sendError } from "../utils/responseHelper.js";
import { studentUsersRepository } from "../repositories/studentUsersRepository.js";
import { eventsRepository } from "../repositories/eventsRepository.js";
import { sendEmail } from "../services/emailService.js";
import { renderCertificatePdf } from "../services/certificates/certificatePdfGenerator.js";
import {
  uploadCertificatePdfToS3,
  uploadQrCodeToS3,
  downloadCertificatePdfFromS3,
  getCertificateStreamFromS3,
} from "../services/certificates/s3Storage.js";
import { PrismaClient } from "@prisma/client";
import {
  generateQrCodeImageBuffer,
  buildVerificationUrl,
} from "../services/certificates/qrGenerator.js";
import { buildBadgeAssertion } from "../services/certificates/openBadgesGenerator.js";

const prisma = new PrismaClient();

// --- Helpers ---
function buildCertificateCode({ userId, eventId }) {
  return crypto
    .createHash("sha256")
    .update(`${userId}:${eventId}:${Date.now()}`)
    .digest("hex")
    .slice(0, 16)
    .toUpperCase();
}

function buildVerifyUrl(code) {
  const baseUrl = process.env.PUBLIC_APP_URL || process.env.APP_URL || "";
  return baseUrl
    ? `${baseUrl.replace(/\/$/, "")}/certificates/verify/${code}`
    : "";
}

// --- Controllers ---
export async function verifyCertificate(req, res) {
  const { code } = req.params;

  try {
    const certificate = await prisma.certificate.findUnique({
      where: { code },
      include: { user: true, event: true },
    });

    if (!certificate) {
      return sendError(req, res, "Certificate not found", 404, "NOT_FOUND");
    }

    return sendSuccess(res, {
      certificate: {
        code: certificate.code,
        attendeeName: certificate.attendeeName || certificate.user?.name,
        eventName: certificate.eventName || certificate.event?.name,
        date:
          certificate.date?.toISOString().slice(0, 10) ||
          certificate.issuedAt?.toISOString().slice(0, 10),
        completionCriteria: certificate.completionCriteria,
        status: certificate.status,
        verified: certificate.verified,
        verifiedAt: certificate.verifiedAt,
        expiresAt: certificate.expiresAt,
        pdfUrl: certificate.pdfUrl,
        qrUrl: certificate.qrUrl,
      },
    });
  } catch (error) {
    return sendError(
      req,
      res,
      "Error verifying certificate",
      500,
      "VERIFICATION_ERROR"
    );
  }
}

export async function getMyCertificates(req, res) {
  const userId = req.user?.id || req.studentUser?.id;
  if (!userId) return sendError(req, res, "Unauthorized", 401, "UNAUTHORIZED");

  try {
    const certificates = await prisma.certificate.findMany({
      where: { userId },
      include: { event: true },
      orderBy: { issuedAt: "desc" },
    });

    const formatted = certificates.map((cert) => ({
      id: cert.id,
      code: cert.code,
      eventName: cert.eventName || cert.event?.name,
      date:
        cert.date?.toISOString().slice(0, 10) ||
        cert.issuedAt?.toISOString().slice(0, 10),
      status: cert.status,
      verified: cert.verified,
      pdfUrl: cert.pdfUrl,
      qrUrl: cert.qrUrl,
    }));

    return sendSuccess(res, { certificates: formatted });
  } catch (error) {
    return sendError(req, res, "Failed to fetch certificates", 500);
  }
}

export async function downloadCertificatePdf(req, res) {
  try {
    const { id } = req.params;

    // We fetch the certificate to get the correct eventId and code for the S3 key
    const certificate = await prisma.certificate.findUnique({
      where: { id },
    });

    if (!certificate) {
      return sendError(req, res, "Certificate not found", 404, "NOT_FOUND");
    }

    const key = `certificates/${certificate.eventId}/${certificate.code}.pdf`;

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="certificate-${certificate.code}.pdf"`
    );
    res.setHeader("Content-Type", "application/pdf");

    const fileStream = getCertificateStreamFromS3({ key });

    fileStream.on("error", (err) => {
      console.error("[CertificateDownload] S3 stream error:", err);
      if (!res.headersSent) {
        return sendError(
          req,
          res,
          "Failed to download certificate from S3.",
          500
        );
      }
      res.end();
    });

    fileStream.pipe(res);
  } catch (err) {
    console.error("[CertificateDownload] Error initiating stream:", err);
    return sendError(req, res, "Internal Server Error", 500);
  }
}

export async function getOpenBadge(req, res) {
  const { id } = req.params;

  try {
    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!certificate)
      return sendError(req, res, "Certificate not found", 404, "NOT_FOUND");

    const verifyUrl = buildVerificationUrl({ code: certificate.code });
    const assertion = buildBadgeAssertion({
      id: certificate.id,
      badgeId: "default-badge-class",
      recipient: {
        email: certificate.user?.email || "unknown@example.com",
        name: certificate.attendeeName || certificate.user?.name,
      },
      verificationUrl: verifyUrl,
      issuedOn: (certificate.date || certificate.issuedAt).toISOString(),
    });

    return sendSuccess(res, {
      id,
      openBadges: assertion,
    });
  } catch (error) {
    return sendError(req, res, "Failed to generate OpenBadge assertion", 500);
  }
}

export async function getCertificateVerificationShare(req, res) {
  const { id } = req.params;
  const verifyUrl = `${process.env.PUBLIC_APP_URL || "https://nexasphere.com"}/verify/cert/${id}`;

  return sendSuccess(res, {
    id,
    linkedin: {
      shareUrl: verifyUrl,
    },
    twitter: {
      text: "I earned a digital badge!",
      shareUrl: verifyUrl,
    },
    embeddableHtml: `<div data-badge-id="${id}"></div>`,
  });
}

export async function issueCertificates(req, res) {
  const body = req.body || {};
  const eventId = body.eventId;
  const attendeeIds = Array.isArray(body.attendeeIds) ? body.attendeeIds : [];

  if (!eventId || attendeeIds.length === 0) {
    return sendError(
      req,
      res,
      "eventId and attendeeIds[] are required",
      400,
      "VALIDATION_ERROR"
    );
  }

  const event = await eventsRepository.getById(eventId);
  if (!event) {
    return sendError(req, res, "Event not found", 404, "NOT_FOUND");
  }

  const issued = [];
  const skipped = [];

  for (const userId of attendeeIds) {
    const attendee = await studentUsersRepository.findById(userId);
    if (!attendee?.email) {
      skipped.push({ userId, reason: "missing attendee email" });
      continue;
    }

    const code = buildCertificateCode({ userId, eventId });
    const verifyUrl = buildVerifyUrl(code);
    const pdfBuffer = await renderCertificatePdf({
      event,
      attendee,
      code,
      issuedAt: new Date().toISOString(),
      verifyUrl,
    });

    let storage = { key: null, url: "" };
    const certificateKey = `certificates/${eventId}/${code}.pdf`;
    try {
      storage = await uploadCertificatePdfToS3({
        buffer: pdfBuffer,
        key: certificateKey,
      });
    } catch (err) {
      storage = { key: certificateKey, url: "" };
    }

    const emailResult = await sendEmail({
      to: attendee.email,
      subject: `Your NexaSphere certificate for ${event.name}`,
      templateName: "attendance-confirmation",
      data: {
        name: attendee.full_name || attendee.email,
        eventName: event.name,
        certificateCode: code,
        verifyUrl: verifyUrl || storage.url || "",
      },
      attachments: [
        {
          filename: `${event.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${code}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    issued.push({
      userId,
      email: attendee.email,
      eventId,
      eventName: event.name,
      code,
      status: emailResult.success ? "ISSUED_AND_EMAILED" : "ISSUED",
      certificateUrl: storage.url || null,
      verifyUrl: verifyUrl || null,
    });
  }

  return sendSuccess(res, { issued, skipped });
}
