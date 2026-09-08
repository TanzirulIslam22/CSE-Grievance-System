import { Case } from "../models/Case.js";
import { AuditLog } from "../models/AuditLog.js";
import { getConfig } from "../services/configService.js";
import { notifyCaseEscalated, notifyEscalationToStaff } from "../services/emailService.js";
import { emitToRole, emitToUser } from "../realtime/io.js";

const ACTIVE_STATUSES = [
  "submitted",
  "acknowledged",
  "under_review",
  "investigation",
  "action_taken",
];

let intervalId = null;

async function runScan() {
  try {
    const enabled = await getConfig("escalationEnabled");
    if (!enabled) return;

    const days = Number(await getConfig("escalationDays")) || 7;
    const threshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const cases = await Case.find({
      status: { $in: ACTIVE_STATUSES },
      escalated: { $ne: true },
      updatedAt: { $lte: threshold },
    })
      .limit(50)
      .lean();

    if (cases.length === 0) return;

    console.log(`[Escalation] Escalating ${cases.length} case(s) older than ${days} days`);

    for (const c of cases) {
      const reason = `Auto-escalated: no resolution within ${days} days`;
      const updated = await Case.findByIdAndUpdate(
        c._id,
        {
          $set: {
            escalated: true,
            escalatedAt: new Date(),
            escalatedByUserId: null,
            escalationReason: reason,
          },
        },
        { new: false }
      ).lean();

      if (!updated) continue;

      await AuditLog.create({
        actorUserId: null,
        action: "case:auto-escalated",
        targetType: "case",
        targetId: c._id.toString(),
        metadata: { caseId: c.caseId, reason },
      });

      const ownerId = c.submitterUserId?.toString();
      if (ownerId) {
        emitToUser(ownerId, "case:escalated", {
          caseId: c.caseId,
          _id: c._id.toString(),
        });
      }
      emitToRole("hod", "case:escalated", {
        caseId: c.caseId,
        _id: c._id.toString(),
      });
      emitToRole("admin", "case:escalated", {
        caseId: c.caseId,
        _id: c._id.toString(),
      });

      notifyCaseEscalated(c.caseId, c._id.toString(), ownerId, reason).catch(() => {});
      notifyEscalationToStaff(c.caseId, ownerId, reason).catch(() => {});
    }
  } catch (error) {
    console.error("[Escalation] scan error:", error.message);
  }
}

export function startEscalationJob() {
  const intervalMs = parseInt(process.env.ESCALATION_SCAN_INTERVAL_MS || String(30 * 60 * 1000), 10);

  console.log(`[Escalation] Starting background scan every ${Math.round(intervalMs / 1000)}s`);
  setTimeout(runScan, 15 * 1000);
  intervalId = setInterval(runScan, intervalMs);
}

export function stopEscalationJob() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

export { runScan as runEscalationScan };