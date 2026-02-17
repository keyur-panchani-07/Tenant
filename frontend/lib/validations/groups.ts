import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').trim(),
});

export const addMemberSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
