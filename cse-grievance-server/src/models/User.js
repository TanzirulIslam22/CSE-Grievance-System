import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    institutionalEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    studentOrEmployeeId: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      default: "CSE",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

userSchema.index({ institutionalEmail: 1 });
userSchema.index({ studentOrEmployeeId: 1 });

export const User = mongoose.model("User", userSchema);
