import mongoose from "mongoose";

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    permissions: {
      type: [String],
      default: [],
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Role = mongoose.model("Role", roleSchema);
