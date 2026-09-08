export const ROLES = {
  STUDENT: "student",
  TEACHER: "teacher",
  FACULTY: "faculty",
  STAFF: "staff",
  HOD: "hod",
  ADMIN: "admin",
};

export const PERMISSIONS = {
  CASE_CREATE: "case:create",
  CASE_READ_OWN: "case:read:own",
  CASE_READ_ALL: "case:read:all",
  CASE_UPDATE_OWN: "case:update:own",
  CASE_UPDATE_ALL: "case:update:all",
  CASE_DELETE_OWN: "case:delete:own",
  CASE_DELETE_ALL: "case:delete:all",
  CASE_STATUS_UPDATE: "case:status:update",
  CASE_RESPOND: "case:respond",
  CASE_REVEAL_IDENTITY: "case:reveal-identity",
  EVIDENCE_UPLOAD: "evidence:upload",
  EVIDENCE_READ: "evidence:read",
  ANALYTICS_READ: "analytics:read",
  USER_READ: "user:read",
  USER_UPDATE: "user:update",
  USER_DELETE: "user:delete",
  USER_MANAGE_ROLES: "user:manage-roles",
  AUDIT_READ: "audit:read",
  SYSTEM_CONFIG: "system:config",
};

export const PRIVACY_MODES = {
  IDENTIFIED: "identified",
  PROTECTED: "protected",
  CONFIDENTIAL: "confidential",
};

export const CASE_STATUS = {
  SUBMITTED: "submitted",
  ACKNOWLEDGED: "acknowledged",
  UNDER_REVIEW: "under_review",
  INVESTIGATION: "investigation",
  ACTION_TAKEN: "action_taken",
  RESOLVED: "resolved",
  REJECTED: "rejected",
  CLOSED: "closed",
};

export const STATUS_TRANSITIONS = {
  submitted: ["acknowledged", "rejected"],
  acknowledged: ["under_review", "rejected"],
  under_review: ["investigation", "action_taken", "rejected"],
  investigation: ["action_taken", "rejected"],
  action_taken: ["resolved", "under_review"],
  resolved: ["closed"],
  rejected: ["closed"],
  closed: [],
};

export const CASE_CATEGORIES = {
  ACADEMIC: "academic",
  FACULTY_CONDUCT: "faculty_conduct",
  FACILITY: "facility",
  ADMINISTRATION: "administration",
  HARASSMENT: "harassment",
  OTHER: "other",
};

export const PRIORITY_LEVELS = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
};
