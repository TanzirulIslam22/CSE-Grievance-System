import { Router } from "express";
import * as evidenceController from "../controllers/evidenceController.js";
import { authenticate, loadUser } from "../middleware/auth.js";
import { requirePermission } from "../middleware/rbac.js";
import { upload } from "../middleware/upload.js";
import { PERMISSIONS } from "../config/constants.js";

const router = Router();

router.use(authenticate, loadUser);

// Upload evidence to a case
router.post(
  "/:id/evidence",
  requirePermission(PERMISSIONS.EVIDENCE_UPLOAD, PERMISSIONS.CASE_READ_ALL),
  upload.single("file"),
  evidenceController.uploadEvidence
);

// List evidence for a case
router.get(
  "/:id/evidence",
  requirePermission(PERMISSIONS.EVIDENCE_READ, PERMISSIONS.CASE_READ_ALL),
  evidenceController.getEvidence
);

// Download evidence (access-controlled)
router.get(
  "/:evidenceId/download",
  requirePermission(PERMISSIONS.EVIDENCE_READ, PERMISSIONS.CASE_READ_ALL),
  evidenceController.downloadEvidence
);

// Delete evidence
router.delete(
  "/:evidenceId",
  requirePermission(PERMISSIONS.EVIDENCE_READ, PERMISSIONS.CASE_READ_ALL),
  evidenceController.deleteEvidence
);

export default router;
