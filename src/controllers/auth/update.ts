import { Request, Response } from 'express';
import { AuthUpdateRequestSchema } from '../../types/auth';
import * as users from '../../db/users';
import { makeTokens } from '../../utils/jwt';
import * as tokensDb from '../../db/refreshTokens';
import mapUserRowToProfile from '../../utils/mapUserRowToProfile';

export default async function updateHandler(req: Request, res: Response) {
  const parse = AuthUpdateRequestSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: parse.error.format() });
  }
  const userId = req.userId as string;
  const updated = await users.updateUser(userId, parse.data);
  const tokens = makeTokens(userId);
  await tokensDb.createRefreshToken(userId, tokens.refreshToken);
  if (!updated) {
    return res
      .status(400)
      .json({ error: 'Bad Request', msg: 'User not found' });
  }
  try {
    const profile = await mapUserRowToProfile(updated);
    return res.json({ user: profile, tokens });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return res.status(400).json({ error: 'Bad Request', msg: error.message });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
