import { z } from 'zod';
import { UserProfileSchema } from './user';

export const AuthTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string()
});
export type AuthTokens = z.infer<typeof AuthTokensSchema>;

export const AuthSignupRequestSchema = z.object({
  provider: z.string(),
  token: z.string(),
  name: z.string(),
  icon: z.string().url(),
  github: z.string().optional(),
  x: z.string().optional(),
  mail: z.string().optional()
});
export type AuthSignupRequest = z.infer<typeof AuthSignupRequestSchema>;

export const AuthSigninRequestSchema = z.object({
  provider: z.string(),
  token: z.string()
});
export type AuthSigninRequest = z.infer<typeof AuthSigninRequestSchema>;

export const AuthUpdateRequestSchema = z.object({
  icon: z.string().url().optional(),
  name: z.string().optional(),
  github: z.string().optional(),
  x: z.string().optional(),
  mail: z.string().optional()
});
export type AuthUpdateRequest = z.infer<typeof AuthUpdateRequestSchema>;

export const AuthResponseSchema = z.object({
  user: UserProfileSchema,
  tokens: AuthTokensSchema
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
