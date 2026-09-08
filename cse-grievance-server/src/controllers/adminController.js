import * as adminService from "../services/adminService.js";
import { logAudit } from "../middleware/audit.js";

export async function getUsers(req, res, next) {
  try {
    const result = await adminService.listUsers(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getRoles(req, res, next) {
  try {
    const roles = await adminService.listRoles();
    res.json({ roles });
  } catch (error) {
    next(error);
  }
}

export async function changeUserRole(req, res, next) {
  try {
    const userId = req.params.id;
    const { role } = req.body;

    const result = await adminService.updateUserRole(userId, role);

    await logAudit(req, "user:role-update", "user", userId, { newRole: role });

    res.json({ user: result });
  } catch (error) {
    next(error);
  }
}
