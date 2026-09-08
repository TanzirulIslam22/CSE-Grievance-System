import { Router } from "express";
import * as adminController from "../controllers/adminController.js";
import * as configController from "../controllers/configController.js";
import { authenticate, loadUser } from "../middleware/auth.js";
import { requirePermission } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import { updateRoleSchema, userQuerySchema } from "../validators/admin.js";
import { PERMISSIONS } from "../config/constants.js";

const router = Router();

router.use(authenticate, loadUser);

// Only admins can manage users
router.get(
  "/config",
  requirePermission(PERMISSIONS.SYSTEM_CONFIG),
  configController.getConfig
);

router.patch(
  "/config",
  requirePermission(PERMISSIONS.SYSTEM_CONFIG),
  configController.updateConfig
);

// Only admins can manage users
router.get(
  "/users",
  requirePermission(PERMISSIONS.USER_READ),
  validate(userQuerySchema),
  adminController.getUsers
);

router.get(
  "/roles",
  requirePermission(PERMISSIONS.USER_READ),
  adminController.getRoles
);

router.patch(
  "/users/:id/role",
  requirePermission(PERMISSIONS.USER_MANAGE_ROLES),
  validate(updateRoleSchema),
  adminController.changeUserRole
);

export default router;
