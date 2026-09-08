import { z } from "zod";

const RUET_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@(student\.)?(cse\.)?ruet\.ac\.bd$/;

const captchaFields = {
  captchaToken: z.string().optional(),
  captchaAnswer: z.union([z.number(), z.string()]).optional(),
};

export const registerSchema = z.object({
  body: z.object({
    institutionalEmail: z
      .string()
      .email("Invalid email")
      .regex(RUET_EMAIL_REGEX, "Must be a valid RUET CSE institutional email"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password too long"),
    name: z.string().min(2, "Name too short").max(100, "Name too long").trim(),
    studentOrEmployeeId: z.string().min(1, "ID is required").max(50, "ID too long").trim(),
    role: z.enum(["student", "teacher", "faculty", "staff"]).optional(),
    ...captchaFields,
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email"),
    password: z.string().min(1, "Password is required"),
    ...captchaFields,
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email"),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(10, "Reset token is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password too long"),
  }),
});

export const preferencesSchema = z.object({
  body: z.object({
    emailOnStatusChange: z.boolean().optional(),
    emailOnMessages: z.boolean().optional(),
  }),
});