import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'secret';

export function makeTokens(userId: string) {
  const accessToken = jwt.sign({ userId }, SECRET, { expiresIn: '1h' });
  const refreshToken = jwt.sign({ userId }, SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}
