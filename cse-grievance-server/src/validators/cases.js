import { z } from "zod";

export const createCaseSchema = z.object({
  body: z.object({
    title: z.string().min(5, "Title must be at least 5 characters").max(200, "Title too long").trim(),
    description: z.string().min(20, "Description must be at least 20 characters").max(5000, "Description too long"),
    category: z.enum(["academic", "faculty_conduct", "facility", "administration", "harassment", "other"]),
    subcategory: z.string().max(100).trim().optional(),
    privacyMode: z.enum(["identified", "protected", "confidential"]),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    courseOrContext: z.string().max(200).trim().optional(),
    involvedParties: z.string().max(1000).trim().optional(),
  }),
});

export const analyzeCaseSchema = z.object({
  body: z.object({
    title: z.string().min(5, "Title must be at least 5 characters").max(200).trim(),
    description: z.string().min(20, "Description must be at least 20 characters").max(5000),
  }),
});

export const updateCaseStatusSchema = z.object({
  body: z.object({
    status: z.enum(["acknowledged", "under_review", "investigation", "action_taken", "resolved", "rejected", "closed"]),
    reason: z.string().max(500).optional(),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const caseMessageSchema = z.object({
  body: z.object({
    body: z.string().min(1, "Message cannot be empty").max(5000, "Message too long"),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const caseQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(50).optional().default(20),
    status: z.enum(["submitted", "acknowledged", "under_review", "investigation", "action_taken", "resolved", "rejected", "closed"]).optional(),
    category: z.enum(["academic", "faculty_conduct", "facility", "administration", "harassment", "other"]).optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    search: z.string().max(200).optional(),
  }),
});

export const escalateCaseSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    reason: z.string().max(500, "Reason is too long").optional(),
  }),
});

export const caseTimelineSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});
