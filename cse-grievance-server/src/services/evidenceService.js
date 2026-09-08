import { CaseEvidence } from "../models/CaseEvidence.js";
import { Case } from "../models/Case.js";
import fs from "fs";
import path from "path";
import { uploadDir } from "../middleware/upload.js";

function shapeEvidenceItem(ev, isHodOrAdmin) {
  return {
    _id: ev._id.toString(),
    caseId: ev.caseId.toString(),
    fileName: ev.fileName,
    fileType: ev.fileType,
    fileSize: ev.fileSize,
    uploadedAt: ev.uploadedAt,
    url: `/api/evidence/${ev._id}/download`,
  };
}

function canAccessCase(caseDoc, userId, isHodOrAdmin) {
  if (isHodOrAdmin) return true;
  return caseDoc.submitterUserId.toString() === userId;
}

export async function addEvidence(caseId, userId, role, file) {
  const caseDoc = await Case.findById(caseId);
  if (!caseDoc) {
    const err = new Error("Case not found");
    err.statusCode = 404;
    throw err;
  }

  const isHodOrAdmin = ["hod", "admin"].includes(role);

  if (!canAccessCase(caseDoc, userId, isHodOrAdmin)) {
    const err = new Error("Access denied");
    err.statusCode = 403;
    throw err;
  }

  if (!file) {
    const err = new Error("No file uploaded");
    err.statusCode = 400;
    throw err;
  }

  const evidence = await CaseEvidence.create({
    caseId: caseDoc._id,
    fileUrl: file.filename,
    fileName: file.originalname,
    fileType: file.mimetype,
    fileSize: file.size,
    uploadedBy: userId,
  });

  return shapeEvidenceItem(evidence, isHodOrAdmin);
}

export async function getEvidenceList(caseId, userId, role) {
  const caseDoc = await Case.findById(caseId);
  if (!caseDoc) {
    const err = new Error("Case not found");
    err.statusCode = 404;
    throw err;
  }

  const isHodOrAdmin = ["hod", "admin"].includes(role);

  if (!canAccessCase(caseDoc, userId, isHodOrAdmin)) {
    const err = new Error("Access denied");
    err.statusCode = 403;
    throw err;
  }

  const evidenceList = await CaseEvidence.find({ caseId: caseDoc._id }).sort({ uploadedAt: -1 }).lean();

  return evidenceList.map((ev) => shapeEvidenceItem(ev, isHodOrAdmin));
}

export async function getEvidenceDownload(evidenceId, userId, role) {
  const evidence = await CaseEvidence.findById(evidenceId);
  if (!evidence) {
    const err = new Error("Evidence not found");
    err.statusCode = 404;
    throw err;
  }

  const caseDoc = await Case.findById(evidence.caseId);
  if (!caseDoc) {
    const err = new Error("Case not found");
    err.statusCode = 404;
    throw err;
  }

  const isHodOrAdmin = ["hod", "admin"].includes(role);

  if (!canAccessCase(caseDoc, userId, isHodOrAdmin)) {
    const err = new Error("Access denied");
    err.statusCode = 403;
    throw err;
  }

  const filePath = path.join(uploadDir, evidence.fileUrl);

  if (!fs.existsSync(filePath)) {
    const err = new Error("File not found on server");
    err.statusCode = 404;
    throw err;
  }

  return {
    filePath,
    originalName: evidence.fileName,
    fileType: evidence.fileType,
  };
}

export async function deleteEvidence(evidenceId, userId, role) {
  const evidence = await CaseEvidence.findById(evidenceId);
  if (!evidence) {
    const err = new Error("Evidence not found");
    err.statusCode = 404;
    throw err;
  }

  const caseDoc = await Case.findById(evidence.caseId);
  if (!caseDoc) {
    const err = new Error("Case not found");
    err.statusCode = 404;
    throw err;
  }

  const isOwner = caseDoc.submitterUserId.toString() === userId;
  const isHodOrAdmin = ["hod", "admin"].includes(role);

  if (!isOwner && !isHodOrAdmin) {
    const err = new Error("Access denied");
    err.statusCode = 403;
    throw err;
  }

  const filePath = path.join(uploadDir, evidence.fileUrl);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  await evidence.deleteOne();
  return { success: true };
}
