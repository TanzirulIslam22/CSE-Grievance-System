import mongoose from "mongoose";

const caseEvidenceSchema = new mongoose.Schema({
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Case",
    required: true,
  },
  fileUrl: { type: String, required: true },
  fileName: { type: String, required: true },
  fileType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  uploadedAt: { type: Date, default: Date.now },
});

caseEvidenceSchema.index({ caseId: 1 });

export const CaseEvidence = mongoose.model("CaseEvidence", caseEvidenceSchema);
