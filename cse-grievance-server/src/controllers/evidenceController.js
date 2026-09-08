import * as evidenceService from "../services/evidenceService.js";
import { logAudit } from "../middleware/audit.js";

export async function uploadEvidence(req, res, next) {
  try {
    const caseId = req.params.id;
    const userId = req.user.userId;
    const role = req.user.role;

    const evidence = await evidenceService.addEvidence(
      caseId,
      userId,
      role,
      req.file
    );

    await logAudit(req, "evidence:upload", "evidence", evidence._id, {
      caseId,
      fileName: evidence.fileName,
    });

    console.log(req.file);

    res.status(201).json({ evidence });
  } catch (error) {
    // Clean up file if one was uploaded but processing failed
    if (req.file && error) {
      try {
        const fs = await import("fs");
        const path = await import("path");
        const { uploadDir } = await import("../middleware/upload.js");
        fs.unlinkSync(path.join(uploadDir, req.file.filename));
      } catch {}
    }
    next(error);
  }
}

export async function getEvidence(req, res, next) {
  try {
    const caseId = req.params.id;
    const userId = req.user.userId;
    const role = req.user.role;

    const evidence = await evidenceService.getEvidenceList(caseId, userId, role);
    res.json({ evidence });
  } catch (error) {
    next(error);
  }
}

export async function downloadEvidence(req, res, next) {
  try {
    const evidenceId = req.params.evidenceId;
    const userId = req.user.userId;
    const role = req.user.role;

    const file = await evidenceService.getEvidenceDownload(evidenceId, userId, role);

    await logAudit(req, "evidence:download", "evidence", evidenceId);

    res.download(file.filePath, file.originalName);
  } catch (error) {
    next(error);
  }
}

export async function deleteEvidence(req, res, next) {
  try {
    const evidenceId = req.params.evidenceId;
    const userId = req.user.userId;
    const role = req.user.role;

    const result = await evidenceService.deleteEvidence(evidenceId, userId, role);

    await logAudit(req, "evidence:delete", "evidence", evidenceId);

    res.json(result);
  } catch (error) {
    next(error);
  }
}
