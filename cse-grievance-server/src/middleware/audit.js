import { AuditLog } from "../models/AuditLog.js";

export async function logAudit(req, action, targetType, targetId, metadata) {
  try {
    if (!req.user) return;

    await AuditLog.create({
      actorUserId: req.user.userId,
      action,
      targetType,
      targetId,
      metadata,
    });
  } catch (error) {
    console.error("Audit log error:", error);
  }
}
