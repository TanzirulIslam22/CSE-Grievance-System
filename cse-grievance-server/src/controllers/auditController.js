import * as auditService from "../services/auditService.js";

export async function getAuditLogs(req, res, next) {
  try {
    const result = await auditService.getAuditLogs(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
