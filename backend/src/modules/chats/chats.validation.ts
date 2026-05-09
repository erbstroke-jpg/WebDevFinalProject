import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  isSupergroup: z.boolean().default(false),
  memberIds: z.array(z.string().uuid()).min(1, 'At least one member required'),
});

export const addMemberSchema = z.object({
  userId: z.string().uuid(),
});

export const createTopicSchema = z.object({
  name: z.string().min(1).max(50),
  iconEmoji: z.string().max(10).optional(),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type CreateTopicInput = z.infer<typeof createTopicSchema>;

export const updateChatSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
});

export type UpdateChatInput = z.infer<typeof updateChatSchema>;