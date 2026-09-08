import { Router } from "express";
import * as auditController from "../controllers/auditController.js";
import { authenticate, loadUser } from "../middleware/auth.js";
import { requirePermission } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import { auditQuerySchema } from "../validators/admin.js";
import { PERMISSIONS } from "../config/constants.js";

const router = Router();

router.use(authenticate, loadUser);

router.get(
  "/",
  requirePermission(PERMISSIONS.AUDIT_READ),
  validate(auditQuerySchema),
  auditController.getAuditLogs
);

router.get("/export", requirePermission(PERMISSIONS.AUDIT_READ), auditController.exportAuditCsv);

export default router;
