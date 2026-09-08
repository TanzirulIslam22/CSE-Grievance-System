import { Case } from "../models/Case.js";
import { User } from "../models/User.js";
import { CaseMessage } from "../models/CaseMessage.js";
import { CaseStatusHistory } from "../models/CaseStatusHistory.js";
import { STATUS_TRANSITIONS } from "../config/constants.js";

let caseSequence = 0;

async function generateCaseId() {
  const year = new Date().getFullYear();
  const latestCase = await Case.findOne().sort({ createdAt: -1 }).select("caseId").lean();

  if (latestCase) {
    const match = latestCase.caseId.match(/CSE-\d{4}-(\d{5})/);
    if (match) {
      caseSequence = parseInt(match[1], 10) + 1;
    } else {
      caseSequence = 1;
    }
  } else {
    caseSequence = 1;
  }

  return `CSE-${year}-${String(caseSequence).padStart(5, "0")}`;
}

function shapeCaseResponse(caseDoc, role, includeSubmitter = false) {
  const base = {
    _id: caseDoc._id.toString(),
    caseId: caseDoc.caseId,
    category: caseDoc.category,
    subcategory: caseDoc.subcategory,
    title: caseDoc.title,
    description: caseDoc.description,
    privacyMode: caseDoc.privacyMode,
    identityRevealed: caseDoc.privacyMode === "confidential" ? !!caseDoc.identityRevealed : undefined,
    status: caseDoc.status,
    priority: caseDoc.priority,
    escalated: !!caseDoc.escalated,
    escalatedAt: caseDoc.escalatedAt || null,
    escalationReason: caseDoc.escalationReason || null,
    courseOrContext: caseDoc.courseOrContext,
    involvedParties: caseDoc.involvedParties,
    createdAt: caseDoc.createdAt,
    updatedAt: caseDoc.updatedAt,
    submitter: null,
  };

  if (includeSubmitter) {
    base.submitter = caseDoc._submitterDetails || null;
  }

  return base;
}

export async function createCase(userId, data) {
  const caseId = await generateCaseId();

  const newCase = await Case.create({
    caseId,
    ...data,
    priority: data.priority || "medium",
    submitterUserId: userId,
    status: "submitted",
  });

  return shapeCaseResponse(newCase, "submitter");
}

export async function getCases(userId, role, query) {
  const page = query.page || 1;
  const limit = query.limit || 20;
  const skip = (page - 1) * limit;

  const filter = {};

  if (query.status) filter.status = query.status;
  if (query.category) filter.category = query.category;
  if (query.priority) filter.priority = query.priority;
  if (query.search) {
    filter.$or = [
      { title: { $regex: query.search, $options: "i" } },
      { caseId: { $regex: query.search, $options: "i" } },
      { description: { $regex: query.search, $options: "i" } },
    ];
  }

  const isHodOrAdmin = ["hod", "admin"].includes(role);

  if (!isHodOrAdmin) {
    filter.submitterUserId = userId;
  }

  const [cases, total] = await Promise.all([
    Case.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Case.countDocuments(filter),
  ]);

  let shapedCases;

  if (isHodOrAdmin) {
    const visibleIds = [
      ...new Set(
        cases
          .filter(
            (c) =>
              c.privacyMode === "identified" ||
              (c.privacyMode === "confidential" && c.identityRevealed === true)
          )
          .map((c) => c.submitterUserId.toString())
      ),
    ];
    const submitterMap = new Map();

    if (visibleIds.length > 0) {
      const submitters = await User.find({ _id: { $in: visibleIds } })
        .select("name institutionalEmail studentOrEmployeeId department")
        .lean();

      submitters.forEach((s) => {
        submitterMap.set(s._id.toString(), {
          name: s.name,
          email: s.institutionalEmail,
          studentOrEmployeeId: s.studentOrEmployeeId,
          department: s.department,
        });
      });
    }

    shapedCases = cases.map((c) => {
      const shaped = shapeCaseResponse(c, role, false);
      if (
        c.privacyMode === "identified" ||
        (c.privacyMode === "confidential" && c.identityRevealed === true)
      ) {
        shaped.submitter = submitterMap.get(c.submitterUserId.toString()) || null;
      }
      return shaped;
    });
  } else {
    shapedCases = cases.map((c) => shapeCaseResponse(c, role, false));
  }

  return { cases: shapedCases, total, page, limit };
}

export async function getMyCases(userId, query) {
  const page = query.page || 1;
  const limit = query.limit || 20;
  const skip = (page - 1) * limit;

  const filter = { submitterUserId: userId };
  if (query.status) filter.status = query.status;
  if (query.category) filter.category = query.category;

  const [cases, total] = await Promise.all([
    Case.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Case.countDocuments(filter),
  ]);

  const shapedCases = cases.map((c) => shapeCaseResponse(c, "submitter", false));

  return { cases: shapedCases, total, page, limit };
}

export async function getCaseById(caseId, userId, role) {
  const caseDoc = await Case.findOne({
    $or: [{ _id: caseId }, { caseId }],
  }).lean();

  if (!caseDoc) {
    const err = new Error("Case not found");
    err.statusCode = 404;
    throw err;
  }

  const isOwner = caseDoc.submitterUserId.toString() === userId;
  const isHodOrAdmin = ["hod", "admin"].includes(role);

  if (!isOwner && !isHodOrAdmin) {
    const err = new Error("Access denied");
    err.statusCode = 403;
    throw err;
  }

  let shaped = shapeCaseResponse(caseDoc, role, false);

  if (
    isHodOrAdmin &&
    (caseDoc.privacyMode === "identified" ||
      (caseDoc.privacyMode === "confidential" && caseDoc.identityRevealed === true))
  ) {
    const submitter = await User.findById(caseDoc.submitterUserId)
      .select("name institutionalEmail studentOrEmployeeId department")
      .lean();

    if (submitter) {
      shaped.submitter = {
        name: submitter.name,
        email: submitter.institutionalEmail,
        studentOrEmployeeId: submitter.studentOrEmployeeId,
        department: submitter.department,
      };
    }
  }

  return shaped;
}

export async function updateCaseStatus(caseId, userId, newStatus, reason) {
  const caseDoc = await Case.findById(caseId);

  if (!caseDoc) {
    const err = new Error("Case not found");
    err.statusCode = 404;
    throw err;
  }

  const allowedTransitions = STATUS_TRANSITIONS[caseDoc.status];

  if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
    const err = new Error(`Cannot transition from '${caseDoc.status}' to '${newStatus}'`);
    err.statusCode = 400;
    throw err;
  }

  const fromStatus = caseDoc.status;
  caseDoc.status = newStatus;
  await caseDoc.save();

  await CaseStatusHistory.create({
    caseId: caseDoc._id,
    fromStatus,
    toStatus: newStatus,
    changedBy: userId,
    reason,
  });

  return {
    fromStatus,
    toStatus: newStatus,
    caseId: caseDoc.caseId,
    _id: caseDoc._id.toString(),
    ownerUserId: caseDoc.submitterUserId.toString(),
  };
}

export async function revealIdentity(caseId, userId) {
  const caseDoc = await Case.findOne({
    $or: [{ _id: caseId }, { caseId }],
  });

  if (!caseDoc) {
    const err = new Error("Case not found");
    err.statusCode = 404;
    throw err;
  }

  if (caseDoc.privacyMode !== "confidential") {
    const err = new Error("Identity reveal is only available for confidential cases");
    err.statusCode = 400;
    throw err;
  }

  if (caseDoc.identityRevealed) {
    return {
      _id: caseDoc._id.toString(),
      caseId: caseDoc.caseId,
      identityRevealed: true,
      alreadyRevealed: true,
      ownerUserId: caseDoc.submitterUserId.toString(),
    };
  }

  caseDoc.identityRevealed = true;
  await caseDoc.save();

  return {
    _id: caseDoc._id.toString(),
    caseId: caseDoc.caseId,
    identityRevealed: true,
    alreadyRevealed: false,
    ownerUserId: caseDoc.submitterUserId.toString(),
  };
}

export async function addMessage(caseId, userId, body) {
  const caseDoc = await Case.findById(caseId);

  if (!caseDoc) {
    const err = new Error("Case not found");
    err.statusCode = 404;
    throw err;
  }

  const user = await User.findById(userId).populate("role");
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  const role = user.role;
  const isOwner = caseDoc.submitterUserId.toString() === userId;
  const isHodOrAdmin = ["hod", "admin"].includes(role.name);

  if (!isOwner && !isHodOrAdmin) {
    const err = new Error("Access denied");
    err.statusCode = 403;
    throw err;
  }

  const senderRoleForMsg = isHodOrAdmin ? "hod" : "submitter";

  const message = await CaseMessage.create({
    caseId: caseDoc._id,
    senderUserId: userId,
    senderDisplayName: user.name,
    senderRole: senderRoleForMsg,
    body,
  });

  return {
    message: {
      _id: message._id.toString(),
      caseId: message.caseId.toString(),
      senderRole: message.senderRole,
      senderDisplayName:
        isAnonymousCase(caseDoc) && message.senderRole === "submitter"
          ? "Anonymous Submitter"
          : message.senderDisplayName,
      body: message.body,
      createdAt: message.createdAt,
    },
    ownerUserId: caseDoc.submitterUserId.toString(),
    caseIdPublic: caseDoc.caseId,
    caseMongoId: caseDoc._id.toString(),
    senderIsStaff: isHodOrAdmin,
  };
}

export async function getCaseMessages(caseId, userId, role) {
  const caseDoc = await Case.findOne({
    $or: [{ _id: caseId }, { caseId }],
  }).lean();

  if (!caseDoc) {
    const err = new Error("Case not found");
    err.statusCode = 404;
    throw err;
  }

  const isOwner = caseDoc.submitterUserId.toString() === userId;
  const isHodOrAdmin = ["hod", "admin"].includes(role);

  if (!isOwner && !isHodOrAdmin) {
    const err = new Error("Access denied");
    err.statusCode = 403;
    throw err;
  }

  const messages = await CaseMessage.find({ caseId: caseDoc._id })
    .sort({ createdAt: 1 })
    .lean();

  return messages.map((m) => ({
    _id: m._id.toString(),
    caseId: m.caseId.toString(),
    senderRole: m.senderRole,
    senderDisplayName:
      isAnonymousCase(caseDoc) && m.senderRole === "submitter"
        ? "Anonymous Submitter"
        : m.senderDisplayName,
    body: m.body,
    createdAt: m.createdAt,
  }));
}

function isAnonymousCase(caseDoc) {
  return (
    caseDoc.privacyMode === "protected" ||
    (caseDoc.privacyMode === "confidential" && caseDoc.identityRevealed !== true)
  );
}

export async function escalateCase(caseId, userId, reason) {
  const caseDoc = await Case.findOne({
    $or: [{ _id: caseId }, { caseId }],
  });

  if (!caseDoc) {
    const err = new Error("Case not found");
    err.statusCode = 404;
    throw err;
  }

  if (caseDoc.escalated) {
    return {
      caseId: caseDoc.caseId,
      _id: caseDoc._id.toString(),
      ownerUserId: caseDoc.submitterUserId.toString(),
      alreadyEscalated: true,
      escalatedAt: caseDoc.escalatedAt,
    };
  }

  caseDoc.escalated = true;
  caseDoc.escalatedAt = new Date();
  caseDoc.escalatedByUserId = userId;
  caseDoc.escalationReason = reason || null;
  await caseDoc.save();

  return {
    caseId: caseDoc.caseId,
    _id: caseDoc._id.toString(),
    ownerUserId: caseDoc.submitterUserId.toString(),
    alreadyEscalated: false,
    escalatedAt: caseDoc.escalatedAt,
    escalationReason: caseDoc.escalationReason,
  };
}

export async function getCaseTimeline(caseId, userId, role) {
  const caseDoc = await Case.findOne({
    $or: [{ _id: caseId }, { caseId }],
  }).lean();

  if (!caseDoc) {
    const err = new Error("Case not found");
    err.statusCode = 404;
    throw err;
  }

  const isOwner = caseDoc.submitterUserId.toString() === userId;
  const isHodOrAdmin = ["hod", "admin"].includes(role);

  if (!isOwner && !isHodOrAdmin) {
    const err = new Error("Access denied");
    err.statusCode = 403;
    throw err;
  }

  const historyDocs = await CaseStatusHistory.find({ caseId: caseDoc._id })
    .sort({ changedAt: 1 })
    .lean();

  const uniqueActorIds = [...new Set(historyDocs.map((h) => h.changedBy?.toString()).filter(Boolean))];
  const actorMap = new Map();
  if (uniqueActorIds.length > 0) {
    const actors = await User.find({ _id: { $in: uniqueActorIds } })
      .populate("role")
      .select("name role")
      .lean();
    actors.forEach((a) => actorMap.set(a._id.toString(), { name: a.name, role: a.role?.name }));
  }

  const events = [
    {
      type: "created",
      at: caseDoc.createdAt,
      status: "submitted",
      by: null,
      metadata: null,
    },
  ];

  for (const h of historyDocs) {
    const actor = actorMap.get(h.changedBy?.toString());
    events.push({
      type: "status",
      from: h.fromStatus,
      to: h.toStatus,
      reason: h.reason || null,
      at: h.changedAt,
      by: actor || { name: "Unknown", role: null },
      metadata: null,
    });
  }

  if (caseDoc.escalated) {
    events.push({
      type: "escalated",
      reason: caseDoc.escalationReason || null,
      at: caseDoc.escalatedAt,
      by: null,
      metadata: null,
    });
  }

  return events;
}
