import { AuditLog } from "../models/AuditLog.js";

export async function getAuditLogs(query) {
  const page = query.page || 1;
  const limit = query.limit || 20;
  const skip = (page - 1) * limit;

  const filter = {};
  if (query.action) filter.action = query.action;
  if (query.targetType) filter.targetType = query.targetType;
  if (query.actorUserId) filter.actorUserId = query.actorUserId;

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .populate("actorUserId", "name institutionalEmail")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments(filter),
  ]);

  const shaped = logs.map((l) => ({
    _id: l._id.toString(),
    actor: l.actorUserId
      ? { id: l.actorUserId._id.toString(), name: l.actorUserId.name, email: l.actorUserId.institutionalEmail }
      : null,
    action: l.action,
    targetType: l.targetType,
    targetId: l.targetId,
    metadata: l.metadata,
    createdAt: l.createdAt,
  }));

  return { logs: shaped, total, page, limit };
}
