import { Case } from "../models/Case.js";
import { CaseMessage } from "../models/CaseMessage.js";
import { CaseEvidence } from "../models/CaseEvidence.js";
import { CASE_STATUS } from "../config/constants.js";

export async function getAnalyticsSummary() {
  const statuses = Object.values(CASE_STATUS);

  const [byStatus, byCategory, byPrivacy, byPriority, total, resolved, totalMessages, totalEvidence, byMonth, escalatedCount] =
    await Promise.all([
      Case.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Case.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }]),
      Case.aggregate([{ $group: { _id: "$privacyMode", count: { $sum: 1 } } }]),
      Case.aggregate([{ $group: { _id: "$priority", count: { $sum: 1 } } }]),
      Case.countDocuments(),
      Case.countDocuments({ status: { $in: [CASE_STATUS.RESOLVED, CASE_STATUS.CLOSED] } }),
      CaseMessage.countDocuments(),
      CaseEvidence.countDocuments(),
      Case.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 12 },
      ]),
      Case.countDocuments({ escalated: true }),
    ]);

  const statusMap = {};
  statuses.forEach((s) => {
    statusMap[s] = 0;
  });
  byStatus.forEach((r) => {
    if (r._id) statusMap[r._id] = r.count;
  });

  const categoryMap = {};
  byCategory.forEach((r) => {
    categoryMap[r._id] = r.count;
  });

  const privacyMap = {};
  byPrivacy.forEach((r) => {
    privacyMap[r._id] = r.count;
  });

  const priorityMap = {};
  byPriority.forEach((r) => {
    priorityMap[r._id] = r.count;
  });

  const avgResolution = await averageResolutionDays();
  const avgFirstResponseHours = await averageFirstResponseHours();

  return {
    total,
    resolved,
    open: total - resolved,
    totalMessages,
    totalEvidence,
    averageResolutionDays: avgResolution,
    sla: {
      averageResolutionDays: avgResolution,
      averageFirstResponseHours: avgFirstResponseHours,
      escalatedCount,
    },
    byStatus: statusMap,
    byCategory: categoryMap,
    byPrivacy: privacyMap,
    byPriority: priorityMap,
    byMonth: byMonth.map((m) => ({ month: m._id, count: m.count })),
  };
}

async function averageResolutionDays() {
  const agg = await Case.aggregate([
    {
      $match: {
        status: { $in: [CASE_STATUS.RESOLVED, CASE_STATUS.CLOSED] },
        updatedAt: { $exists: true },
        createdAt: { $exists: true },
      },
    },
    {
      $project: {
        days: {
          $divide: [{ $subtract: ["$updatedAt", "$createdAt"] }, 1000 * 60 * 60 * 24],
        },
      },
    },
    { $group: { _id: null, avgDays: { $avg: "$days" } } },
  ]);
  if (agg.length === 0) return 0;
  const avg = agg[0].avgDays || 0;
  return Math.round(avg * 10) / 10;
}

async function averageFirstResponseHours() {
  const agg = await Case.aggregate([
    {
      $lookup: {
        from: "casestatushistories",
        localField: "_id",
        foreignField: "caseId",
        as: "history",
      },
    },
    { $match: { "history.0": { $exists: true } } },
    {
      $project: {
        firstAt: { $min: "$history.changedAt" },
        createdAt: 1,
      },
    },
    {
      $project: {
        hours: { $divide: [{ $subtract: ["$firstAt", "$createdAt"] }, 3600000] },
      },
    },
    { $group: { _id: null, avgHours: { $avg: "$hours" } } },
  ]);
  if (agg.length === 0) return 0;
  const avg = agg[0].avgHours || 0;
  return Math.round(avg * 10) / 10;
}