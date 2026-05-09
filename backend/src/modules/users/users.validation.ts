import { z } from 'zod';

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  status: z.string().max(50).nullable().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;