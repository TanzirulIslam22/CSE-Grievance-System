import * as auditService from "../services/auditService.js";
import { toCSV } from "../services/csvService.js";

export async function getAuditLogs(req, res, next) {
  try {
    const result = await auditService.getAuditLogs(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function exportAuditCsv(req, res, next) {
  try {
    const result = await auditService.getAuditLogs({ ...req.query, limit: 5000, page: 1 });

    const rows = [["Time (UTC)", "Actor", "Email", "Action", "Target", "Details"]];
    for (const l of result.logs) {
      rows.push([
        new Date(l.createdAt).toISOString(),
        l.actor ? l.actor.name : "",
        l.actor ? l.actor.email : "",
        l.action,
        `${l.targetType || ""}:${l.targetId || ""}`,
        l.metadata ? JSON.stringify(l.metadata) : "",
      ]);
    }

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="audit-${Date.now()}.csv"`);
    res.send(toCSV(rows));
  } catch (error) {
    next(error);
  }
}