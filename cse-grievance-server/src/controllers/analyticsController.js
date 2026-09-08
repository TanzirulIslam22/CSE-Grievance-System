import * as analyticsService from "../services/analyticsService.js";
import { sendWeeklyReport } from "../services/reportService.js";
import { logAudit } from "../middleware/audit.js";

export async function getAnalyticsSummary(_req, res, next) {
  try {
    const summary = await analyticsService.getAnalyticsSummary();
    res.json(summary);
  } catch (error) {
    next(error);
  }
}

export async function sendReport(req, res, next) {
  try {
    const result = await sendWeeklyReport();
    await logAudit(req, "report:send", "report", null, {
      recipients: result.sent,
      totalCases: result.total,
    });
    if (result.skipped) {
      return res.status(400).json({ error: "No HoD/Admin recipients found" });
    }
    res.json({
      message: "Weekly report sent to department leads.",
      recipients: result.sent,
    });
  } catch (error) {
    next(error);
  }
}