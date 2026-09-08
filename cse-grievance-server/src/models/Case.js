import mongoose from "mongoose";

const caseSchema = new mongoose.Schema(
  {
    caseId: {
      type: String,
      required: true,
      unique: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["academic", "faculty_conduct", "facility", "administration", "harassment", "other"],
    },
    subcategory: { type: String, trim: true },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    privacyMode: {
      type: String,
      required: true,
      enum: ["identified", "protected", "confidential"],
      default: "identified",
    },
    identityRevealed: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      required: true,
      enum: ["submitted", "acknowledged", "under_review", "investigation", "action_taken", "resolved", "rejected", "closed"],
      default: "submitted",
    },
    priority: {
      type: String,
      required: true,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    escalated: {
      type: Boolean,
      default: false,
    },
    escalatedAt: { type: Date },
    escalatedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    escalationReason: { type: String, trim: true, maxlength: 500 },
    submitterUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    courseOrContext: { type: String, trim: true },
    involvedParties: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

caseSchema.index({ submitterUserId: 1 });
caseSchema.index({ status: 1 });
caseSchema.index({ category: 1 });
caseSchema.index({ createdAt: -1 });

export const Case = mongoose.model("Case", caseSchema);
