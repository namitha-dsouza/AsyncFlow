import { z } from "zod";

export const createJobSchema = z.object({
  type: z.string().min(1),
  payload: z.record(z.unknown()).default({}),
  maxAttempts: z.number().int().min(1).max(10).optional(),
  priority: z.number().int().min(0).max(100).optional(),
  scheduledAt: z.string().datetime().optional(),
  idempotencyKey: z.string().min(1).max(255).optional(),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;