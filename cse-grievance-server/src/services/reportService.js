import { Case } from "../models/Case.js";
import { User } from "../models/User.js";
import { Role } from "../models/Role.js";
import { toCSV } from "./csvService.js";
import { sendEmail } from "./emailService.js";

async function hodAdminEmails() {
  const roles = await Role.find({ name: { $in: ["hod", "admin"] } }).select("_id").lean();
  const roleIds = roles.map((r) => r._id);
  if (roleIds.length === 0) return [];
  const users = await User.find({ role: { $in: roleIds } })
    .select("institutionalEmail")
    .lean();
  return [...new Set(users.map((u) => u.institutionalEmail))];
}

function buildSummary(cases) {
  const counts = { total: cases.length };
  const byStatus = {};
  const byCategory = {};
  for (const c of cases) {
    byStatus[c.status] = (byStatus[c.status] || 0) + 1;
    byCategory[c.category] = (byCategory[c.category] || 0) + 1;
  }
  counts.byStatus = byStatus;
  counts.byCategory = byCategory;
  return counts;
}

function buildCsv(cases) {
  const rows = [[
    "Case ID", "Title", "Category", "Priority", "Status", "Privacy", "Escalated", "Created (UTC)",
  ]];
  for (const c of cases) {
    rows.push([
      c.caseId,
      c.title,
      c.category,
      c.priority,
      c.status,
      c.privacyMode,
      c.escalated ? "yes" : "no",
      new Date(c.createdAt).toISOString(),
    ]);
  }
  return toCSV(rows);
}

export async function generateWeeklyReport() {
  const cases = await Case.find()
    .sort({ createdAt: -1 })
    .select("caseId title category priority status privacyMode escalated createdAt")
    .limit(500)
    .lean();

  const escalatedCount = await Case.countDocuments({ escalated: true });

  const summary = buildSummary(cases);
  const csv = buildCsv(cases);

  const resolvedClosed = (summary.byStatus.resolved || 0) + (summary.byStatus.closed || 0);
  const lines = [
    "CSE Grievance System — Weekly summary report",
    `Generated: ${new Date().toISOString()}`,
    ``,
    `Total cases: ${summary.total}`,
    `Open: ${summary.total - resolvedClosed}`,
    `Resolved + closed: ${resolvedClosed}`,
    `Escalated: ${escalatedCount}`,
    ``,
    "By status:",
    ...Object.entries(summary.byStatus).map(([k, v]) => `  ${k}: ${v}`),
    ``,
    "By category:",
    ...Object.entries(summary.byCategory).map(([k, v]) => `  ${k}: ${v}`),
    ``,
    "CSV of the 500 most recent cases:",
    csv,
  ].join("\n");

  return { summary, csv, text: lines };
}

export async function sendWeeklyReport() {
  const recipients = await hodAdminEmails();
  if (recipients.length === 0) {
    return { sent: 0, skipped: true };
  }
  const { text, summary } = await generateWeeklyReport();
  for (const email of recipients) {
    await sendEmail(
      email,
      `Weekly grievance report (${new Date().toDateString()})`,
      text
    );
  }
  return { sent: recipients.length, total: summary.total };
}