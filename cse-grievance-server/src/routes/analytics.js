import { Router } from "express";
import * as analyticsController from "../controllers/analyticsController.js";
import { authenticate, loadUser } from "../middleware/auth.js";
import { requirePermission } from "../middleware/rbac.js";
import { PERMISSIONS } from "../config/constants.js";

const router = Router();

router.use(authenticate, loadUser);

router.get(
  "/summary",
  requirePermission(PERMISSIONS.ANALYTICS_READ),
  analyticsController.getAnalyticsSummary
);

router.post(
  "/report",
  requirePermission(PERMISSIONS.ANALYTICS_READ),
  analyticsController.sendReport
);

export default router;