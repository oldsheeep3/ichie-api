import { z } from 'zod';

export const EncountKeySchema = z.object({
  major: z.number().int(),
  minor: z.number().int(),
  timestamp: z.string().datetime()
});

export type EncountKey = z.infer<typeof EncountKeySchema>;

export const EncountKeyArraySchema = z.array(EncountKeySchema);
export type EncountKeyArray = z.infer<typeof EncountKeyArraySchema>;

export const EncountCreateRequestSchema = z.object({
  message: z.string().optional()
});
export type EncountCreateRequest = z.infer<typeof EncountCreateRequestSchema>;

export const EncountResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  createAt: z.string().datetime(),
  deleteAt: z.string().datetime().optional(),
  name: z.string(),
  icon: z.string().url(),
  x: z.string().optional(),
  github: z.string().optional(),
  mail: z.string().optional(),
  message: z.string().optional()
});
export type EncountResponse = z.infer<typeof EncountResponseSchema>;

export const EncountResponseArraySchema = z.array(EncountResponseSchema);
export type EncountResponseArray = z.infer<typeof EncountResponseArraySchema>;
