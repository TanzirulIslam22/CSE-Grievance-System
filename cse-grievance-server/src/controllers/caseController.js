import * as caseService from "../services/caseService.js";
import { logAudit } from "../middleware/audit.js";
import { User } from "../models/User.js";
import { Role } from "../models/Role.js";
import {
  notifyNewCase,
  notifyStatusChange,
  notifyNewMessage,
  notifyIdentityRevealed,
} from "../services/emailService.js";
import { emitToRole, emitToUser } from "../realtime/io.js";

export async function createCase(req, res, next) {
  try {
    const userId = req.user.userId;
    const caseData = req.body;
    const newCase = await caseService.createCase(userId, caseData);
    await logAudit(req, "case:create", "case", newCase._id.toString(), {
      caseId: newCase.caseId,
      privacyMode: newCase.privacyMode,
    });

    emitToRole("hod", "case:new", {
      _id: newCase._id,
      caseId: newCase.caseId,
      title: newCase.title,
      category: newCase.category,
      privacyMode: newCase.privacyMode,
    });
    emitToRole("admin", "case:new", {
      _id: newCase._id,
      caseId: newCase.caseId,
      title: newCase.title,
      category: newCase.category,
      privacyMode: newCase.privacyMode,
    });

    notifyNewCase(newCase);

    res.status(201).json({ case: newCase });
  } catch (error) {
    next(error);
  }
}

export async function getCases(req, res, next) {
  try {
    const userId = req.user.userId;
    const role = req.user.role;
    const query = req.query;
    const result = await caseService.getCases(userId, role, query);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getCaseById(req, res, next) {
  try {
    const userId = req.user.userId;
    const role = req.user.role;
    const caseId = req.params.id;
    const result = await caseService.getCaseById(caseId, userId, role);
    await logAudit(req, "case:read", "case", caseId);
    res.json({ case: result });
  } catch (error) {
    next(error);
  }
}

export async function updateCaseStatus(req, res, next) {
  try {
    const userId = req.user.userId;
    const caseId = req.params.id;
    const { status, reason } = req.body;
    const result = await caseService.updateCaseStatus(caseId, userId, status, reason);
    await logAudit(req, "case:status:update", "case", caseId, {
      from: result.fromStatus,
      to: status,
    });

    emitToUser(result.ownerUserId, "case:status", {
      caseId: result.caseId,
      _id: result._id,
      from: result.fromStatus,
      to: result.toStatus,
    });
    emitToRole("hod", "case:status", {
      caseId: result.caseId,
      _id: result._id,
      from: result.fromStatus,
      to: result.toStatus,
    });
    emitToRole("admin", "case:status", {
      caseId: result.caseId,
      _id: result._id,
      from: result.fromStatus,
      to: result.toStatus,
    });

    notifyStatusChange(
      result.caseId,
      result._id,
      result.ownerUserId,
      result.fromStatus,
      result.toStatus
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function addMessage(req, res, next) {
  try {
    const userId = req.user.userId;
    const caseId = req.params.id;
    const { body } = req.body;
    const result = await caseService.addMessage(caseId, userId, body);
    const message = result.message;
    await logAudit(req, "case:message", "case", caseId);

    const senderLabel = result.senderIsStaff ? "department" : "submitter";
    emitToRole("hod", "case:message", {
      caseId: result.caseIdPublic,
      _id: result.caseMongoId,
      message: message.body,
    });
    emitToRole("admin", "case:message", {
      caseId: result.caseIdPublic,
      _id: result.caseMongoId,
      message: message.body,
    });
    emitToUser(result.ownerUserId, "case:message", {
      caseId: result.caseIdPublic,
      _id: result.caseMongoId,
      message: message.body,
    });

    if (result.senderIsStaff) {
      notifyNewMessage(
        result.caseIdPublic,
        result.caseMongoId,
        "department",
        result.ownerUserId,
        message.body.slice(0, 120)
      );
    } else {
      const staffRecipients = await findStaffUserIds();
      for (const id of staffRecipients) {
        notifyNewMessage(result.caseIdPublic, result.caseMongoId, "submitter", id, message.body.slice(0, 120));
      }
    }

    res.status(201).json({ message });
  } catch (error) {
    next(error);
  }
}

export async function getCaseMessages(req, res, next) {
  try {
    const userId = req.user.userId;
    const role = req.user.role;
    const caseId = req.params.id;
    const messages = await caseService.getCaseMessages(caseId, userId, role);
    res.json({ messages });
  } catch (error) {
    next(error);
  }
}

export async function getMyCases(req, res, next) {
  try {
    const userId = req.user.userId;
    const query = req.query;
    const result = await caseService.getMyCases(userId, query);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function revealCaseIdentity(req, res, next) {
  try {
    const userId = req.user.userId;
    const caseId = req.params.id;
    const result = await caseService.revealIdentity(caseId, userId);
    await logAudit(req, "case:identity-reveal", "case", req.params.id, {
      caseId: result.caseId,
      revealedBy: userId,
    });

    const caseDoc = await caseService.getCaseById(caseId, userId, req.user.role);
    if (!result.alreadyRevealed && result.ownerUserId) {
      notifyIdentityRevealed({ caseId: result.caseId }, result.ownerUserId);
      emitToUser(result.ownerUserId, "case:identity-revealed", {
        caseId: result.caseId,
        _id: result._id,
      });
    }
    emitToRole("hod", "case:identity-revealed", {
      caseId: result.caseId,
      _id: result._id,
    });
    emitToRole("admin", "case:identity-revealed", {
      caseId: result.caseId,
      _id: result._id,
    });

    res.json({
      case: caseDoc,
      identityRevealed: result.identityRevealed,
      alreadyRevealed: result.alreadyRevealed,
    });
  } catch (error) {
    next(error);
  }
}

async function findStaffUserIds() {
  const roles = await Role.find({ name: { $in: ["hod", "admin"] } }).select("_id").lean();
  const roleIds = roles.map((r) => r._id);
  if (roleIds.length === 0) return [];
  const users = await User.find({ role: { $in: roleIds } }).select("_id").lean();
  return users.map((u) => u._id.toString());
}