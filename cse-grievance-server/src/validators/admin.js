import { z } from "zod";

export const updateRoleSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    role: z.enum(["student", "teacher", "faculty", "staff", "hod", "admin"]),
  }),
});

export const userQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(50).optional().default(20),
    search: z.string().max(200).optional(),
    role: z.string().max(50).optional(),
  }),
});

export const auditQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(50).optional().default(20),
    action: z.string().max(100).optional(),
    targetType: z.string().max(100).optional(),
  }),
});
