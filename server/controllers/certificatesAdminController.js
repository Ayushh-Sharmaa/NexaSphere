// Admin controllers for certificate management

import { sendSuccess, sendError } from "../utils/responseHelper.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function adminGetCertificateById(req, res) {
  const { id } = req.params;

  try {
    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: { user: true, event: true },
    });

    if (!certificate) {
      return sendError(req, res, "Certificate not found", 404, "NOT_FOUND");
    }

    return sendSuccess(res, {
      certificate: {
        id: certificate.id,
        code: certificate.code,
        attendeeName: certificate.attendeeName || certificate.user?.name,
        eventName: certificate.eventName || certificate.event?.name,
        date:
          certificate.date?.toISOString() ||
          certificate.issuedAt?.toISOString(),
        status: certificate.status,
        verified: certificate.verified,
        verifiedAt: certificate.verifiedAt,
        revoked: certificate.revoked,
        pdfUrl: certificate.pdfUrl,
        qrUrl: certificate.qrUrl,
      },
    });
  } catch (error) {
    return sendError(
      req,
      res,
      "Failed to fetch certificate",
      500,
      "FETCH_ERROR"
    );
  }
}

export async function adminVerifyCertificate(req, res) {
  const { id } = req.params;
  const adminId = req.user?.id || "admin-system";

  try {
    const certificate = await prisma.certificate.findUnique({ where: { id } });
    if (!certificate) {
      return sendError(req, res, "Certificate not found", 404, "NOT_FOUND");
    }

    await prisma.$transaction([
      prisma.certificate.update({
        where: { id },
        data: {
          verified: true,
          status: "VERIFIED",
          verifiedAt: new Date(),
        },
      }),
      prisma.auditLog.create({
        data: {
          actorId: adminId,
          action: "APPROVE",
          entity: "Certificate",
          entityId: id,
          newValues: { status: "VERIFIED", verified: true },
        },
      }),
    ]);

    return sendSuccess(res, { id, verified: true });
  } catch (error) {
    return sendError(
      req,
      res,
      "Failed to verify certificate",
      500,
      "VERIFICATION_ERROR"
    );
  }
}

export async function adminRevokeCertificate(req, res) {
  const { id } = req.params;
  const adminId = req.user?.id || "admin-system";

  try {
    const certificate = await prisma.certificate.findUnique({ where: { id } });
    if (!certificate) {
      return sendError(req, res, "Certificate not found", 404, "NOT_FOUND");
    }

    await prisma.$transaction([
      prisma.certificate.update({
        where: { id },
        data: {
          verified: false,
          revoked: true,
          status: "REJECTED",
        },
      }),
      prisma.auditLog.create({
        data: {
          actorId: adminId,
          action: "REJECT",
          entity: "Certificate",
          entityId: id,
          newValues: { status: "REJECTED", revoked: true },
        },
      }),
    ]);

    return sendSuccess(res, { id, revoked: true });
  } catch (error) {
    return sendError(
      req,
      res,
      "Failed to revoke certificate",
      500,
      "REVOCATION_ERROR"
    );
  }
}

import * as certTemplatesRepo from "../repositories/certificateTemplatesRepository.js";

export async function adminGetTemplates(req, res) {
  try {
    const templates = await certTemplatesRepo.getTemplates();
    return sendSuccess(res, { templates });
  } catch (error) {
    return sendError(res, 500, "Failed to fetch templates");
  }
}

export async function adminSaveTemplate(req, res) {
  try {
    const template = await certTemplatesRepo.saveTemplate(req.body);
    return sendSuccess(res, { template });
  } catch (error) {
    return sendError(res, 500, "Failed to save template");
  }
}
