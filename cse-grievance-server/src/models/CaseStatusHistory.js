import mongoose from "mongoose";

const caseStatusHistorySchema = new mongoose.Schema({
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Case",
    required: true,
  },
  fromStatus: { type: String, required: true },
  toStatus: { type: String, required: true },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  reason: { type: String, maxlength: 500 },
  changedAt: { type: Date, default: Date.now },
});

caseStatusHistorySchema.index({ caseId: 1, changedAt: -1 });

export const CaseStatusHistory = mongoose.model("CaseStatusHistory", caseStatusHistorySchema);
