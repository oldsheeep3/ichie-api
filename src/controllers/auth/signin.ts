import { Request, Response } from 'express';
import { AuthSigninRequestSchema } from '../../types/auth';
import * as oauth from '../../db/oauth';
import * as users from '../../db/users';
import { verifyGoogleIdToken } from '../../utils/oauth/google';
import { makeTokens } from '../../utils/jwt';
import * as tokensDb from '../../db/refreshTokens';
import mapUserRowToProfile from '../../utils/mapUserRowToProfile';

export default async function signinHandler(req: Request, res: Response) {
  const parse = AuthSigninRequestSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: parse.error.format() });
  }
  const body = parse.data;

  let providerAccountId = body.token;
  if (body.provider === 'google') {
    try {
      const payload = await verifyGoogleIdToken(body.token);
      providerAccountId = payload.sub;
    } catch (e) {
      return res.status(401).json({ error: 'Invalid Google token' });
    }
  }

  const oauthRow = await oauth.getOauthByProviderAccount(
    body.provider,
    providerAccountId
  );
  if (!oauthRow) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const tokens = makeTokens(oauthRow.user_id);
  await tokensDb.createRefreshToken(oauthRow.user_id, tokens.refreshToken);
  const user = await users.getUserById(oauthRow.user_id);
  try {
    const profile = await mapUserRowToProfile(user);
    return res.json({ user: profile, tokens });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return res.status(400).json({ error: 'Bad Request', msg: error.message });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
