import { Router } from "express";
import * as caseController from "../controllers/caseController.js";
import { authenticate, loadUser } from "../middleware/auth.js";
import { requirePermission } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import { submissionLimiter } from "../middleware/rateLimiter.js";
import { createCaseSchema, updateCaseStatusSchema, caseMessageSchema, caseQuerySchema, analyzeCaseSchema } from "../validators/cases.js";
import { PERMISSIONS } from "../config/constants.js";

const router = Router();

router.use(authenticate, loadUser);

router.post("/analyze", submissionLimiter, validate(analyzeCaseSchema), caseController.analyzeCaseRequest);
router.post("/", submissionLimiter, requirePermission(PERMISSIONS.CASE_CREATE), validate(createCaseSchema), caseController.createCase);
router.get("/", requirePermission(PERMISSIONS.CASE_READ_OWN, PERMISSIONS.CASE_READ_ALL), validate(caseQuerySchema), caseController.getCases);
router.get("/export", requirePermission(PERMISSIONS.CASE_READ_ALL), caseController.exportCasesCsv);
router.get("/my", requirePermission(PERMISSIONS.CASE_READ_OWN, PERMISSIONS.CASE_READ_ALL), caseController.getMyCases);
router.get("/:id", requirePermission(PERMISSIONS.CASE_READ_OWN, PERMISSIONS.CASE_READ_ALL), caseController.getCaseById);
router.patch("/:id/status", requirePermission(PERMISSIONS.CASE_STATUS_UPDATE), validate(updateCaseStatusSchema), caseController.updateCaseStatus);
router.post("/:id/reveal-identity", requirePermission(PERMISSIONS.CASE_REVEAL_IDENTITY), caseController.revealCaseIdentity);
router.post("/:id/messages", requirePermission(PERMISSIONS.CASE_RESPOND), validate(caseMessageSchema), caseController.addMessage);
router.get("/:id/messages", requirePermission(PERMISSIONS.CASE_READ_OWN, PERMISSIONS.CASE_READ_ALL), caseController.getCaseMessages);

export default router;
