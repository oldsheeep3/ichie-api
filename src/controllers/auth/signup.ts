import { Request, Response } from 'express';
import { AuthSignupRequestSchema } from '../../types/auth';
import * as users from '../../db/users';
import * as oauth from '../../db/oauth';
import * as tokensDb from '../../db/refreshTokens';
import { createOauthAccount } from '../../db/oauth';
import { makeTokens } from '../../utils/jwt';
import { verifyGoogleIdToken } from '../../utils/oauth/google';
import mapUserRowToProfile from '../../utils/mapUserRowToProfile';

export default async function signupHandler(req: Request, res: Response) {
  const parse = AuthSignupRequestSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: parse.error.format() });
  }
  const body = parse.data;

  // determine provider_account_id (for google we verify token and use `sub`)
  let providerAccountId = body.token;
  switch (body.provider) {
  case 'google':
    try {
      const payload = await verifyGoogleIdToken(body.token);
      providerAccountId = payload.sub;
    } catch (e) {
      return res.status(401).json({ error: 'Invalid Google token' });
    }
    break;
  default:
    return res.status(400).json({ error: 'Unsupported provider' });
  }

  // check existing oauth account
  const existingOauth = await oauth.getOauthByProviderAccount(
    body.provider,
    providerAccountId
  );
  if (existingOauth) {
    const user = await users.getUserById(existingOauth.user_id);
    if (!user) {
      return res
        .status(401)
        .json({ error: 'Unauthorized', msg: 'User not found' });
    }
    try {
      const profile = await mapUserRowToProfile(user);
      const tokens = makeTokens(existingOauth.user_id);
      await tokensDb.createRefreshToken(
        existingOauth.user_id,
        tokens.refreshToken
      );
      return res.status(201).json({ user: profile, tokens });
    } catch (error: unknown) {
      if (error instanceof Error) {
        return res
          .status(400)
          .json({ error: 'Bad Request', msg: error.message });
      }
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  const user = await users.createUser({
    name: body.name,
    icon: body.icon,
    github: body.github,
    x: body.x,
    mail: body.mail
  });
  await createOauthAccount({
    user_id: user.id,
    provider: body.provider,
    provider_account_id: providerAccountId,
    provider_token: body.token
  });
  const tokens = makeTokens(user.id);
  try {
    await tokensDb.createRefreshToken(user.id, tokens.refreshToken);
    const profile = await mapUserRowToProfile(user);
    return res.status(201).json({ user: profile, tokens });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return res.status(400).json({ error: 'Bad Request', msg: error.message });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
