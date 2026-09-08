import mongoose from "mongoose";

const caseMessageSchema = new mongoose.Schema({
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Case",
    required: true,
  },
  senderUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  senderDisplayName: { type: String, required: true },
  senderRole: { type: String, required: true },
  body: { type: String, required: true, maxlength: 5000 },
  createdAt: { type: Date, default: Date.now },
});

caseMessageSchema.index({ caseId: 1, createdAt: 1 });

export const CaseMessage = mongoose.model("CaseMessage", caseMessageSchema);
