import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { config } from "../config/index.js";
import { User } from "../models/User.js";
import { Role } from "../models/Role.js";
import { verifyCaptcha } from "./captchaService.js";
import { getConfig } from "./configService.js";
import { sendEmail } from "./emailService.js";

const SALT_ROUNDS = 12;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function generateTokens(payload) {
  const accessToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.accessExpiry,
  });

  const refreshToken = jwt.sign(
    { ...payload, type: "refresh" },
    config.jwt.secret,
    { expiresIn: config.jwt.refreshExpiry }
  );

  return { accessToken, refreshToken };
}

function sanitizeUser(user, roleName) {
  return {
    id: user._id.toString(),
    email: user.institutionalEmail,
    name: user.name,
    role: roleName,
    department: user.department,
    isVerified: user.isVerified,
  };
}

export async function register(
  email,
  password,
  name,
  studentOrEmployeeId,
  roleName = "student",
  captcha = {}
) {
  const allowRegistration = await getConfig("allowRegistration");
  if (allowRegistration === false) {
    const err = new Error("Registration is currently disabled by the department");
    err.statusCode = 403;
    throw err;
  }

  await assertCaptchaValid(captcha, true);

  const existingUser = await User.findOne({
    $or: [{ institutionalEmail: email }, { studentOrEmployeeId }],
  });

  if (existingUser) {
    const err = new Error("User with this email or ID already exists");
    err.statusCode = 409;
    throw err;
  }

  const role = await Role.findOne({ name: roleName });
  if (!role) {
    const err = new Error("Invalid role");
    err.statusCode = 400;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await User.create({
    institutionalEmail: email,
    passwordHash,
    role: role._id,
    name,
    studentOrEmployeeId,
    department: "CSE",
    isVerified: true,
  });

  const tokens = generateTokens({
    userId: user._id.toString(),
    email: user.institutionalEmail,
    role: role.name,
  });

  return { user: sanitizeUser(user, role.name), tokens };
}

export async function login(email, password, captcha = {}) {
  const captchaEnabled =
    process.env.CAPTCHA_ENABLED !== "false" && (await getConfig("captchaEnabled")) !== false;
  if (captchaEnabled) {
    const ok = verifyCaptcha(captcha.captchaToken, captcha.captchaAnswer);
    if (!ok) {
      const err = new Error("Incorrect captcha answer");
      err.statusCode = 400;
      throw err;
    }
  }

  const user = await User.findOne({
    institutionalEmail: email.toLowerCase(),
  }).populate("role");

  if (!user) {
    const err = new Error("Invalid credentials");
    err.statusCode = 401;
    throw err;
  }

  const role = user.role;
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    const err = new Error("Invalid credentials");
    err.statusCode = 401;
    throw err;
  }

  const tokens = generateTokens({
    userId: user._id.toString(),
    email: user.institutionalEmail,
    role: role.name,
  });

  return { user: sanitizeUser(user, role.name), tokens };
}

export async function refreshTokens(refreshToken) {
  try {
    const decoded = jwt.verify(refreshToken, config.jwt.secret);

    if (decoded.type !== "refresh") {
      const err = new Error("Invalid token type");
      err.statusCode = 401;
      throw err;
    }

    const user = await User.findById(decoded.userId).populate("role");
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 401;
      throw err;
    }

    const role = user.role;

    return generateTokens({
      userId: user._id.toString(),
      email: user.institutionalEmail,
      role: role.name,
    });
  } catch (error) {
    if (error.statusCode) throw error;
    const err = new Error("Invalid refresh token");
    err.statusCode = 401;
    throw err;
  }
}

export async function requestPasswordReset(email) {
  const user = await User.findOne({ institutionalEmail: email.toLowerCase() });
  if (!user) {
    // Always resolve as success to avoid account enumeration.
    return;
  }

  const token = crypto.randomBytes(32).toString("hex");
  user.passwordResetTokenHash = sha256(token);
  user.passwordResetExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  await user.save();

  const resetUrl = `${config.clientUrl}/reset-password?token=${token}&email=${encodeURIComponent(
    user.institutionalEmail
  )}`;

  await sendEmail(
    user.institutionalEmail,
    "Reset your CSE Grievance password",
    [
      `You requested a password reset for your CSE Grievance account.`,
      ``,
      `Open this link to choose a new password (valid for 1 hour):`,
      resetUrl,
      ``,
      `If you didn't request this, you can safely ignore this email.`,
    ].join("\n")
  );
}

export async function resetPassword(token, newPassword) {
  const tokenHash = sha256(token);
  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpires: { $gt: new Date() },
  });

  if (!user) {
    const err = new Error("Password reset link is invalid or has expired");
    err.statusCode = 400;
    throw err;
  }

  user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  user.passwordResetTokenHash = null;
  user.passwordResetExpires = null;
  await user.save();
}

async function assertCaptchaValid(captcha, required) {
  const enabled = config.captcha.enabled !== false;
  if (!enabled) return;
  const ok = verifyCaptcha(captcha.captchaToken, captcha.captchaAnswer);
  if (!ok) {
    const err = new Error("Incorrect captcha answer");
    err.statusCode = 400;
    throw err;
  }
}
