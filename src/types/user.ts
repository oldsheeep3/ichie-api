import { z } from 'zod';

export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  major: z.number().int(),
  minor: z.number().int(),
  name: z.string(),
  mail: z.string().optional(),
  github: z.string().optional(),
  x: z.string().optional(),
  icon: z.string().url(),
  createdAt: z.string().datetime().optional()
});

export type UserProfile = z.infer<typeof UserProfileSchema>;
