import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const auth = req.headers.authorization;
  if (!auth) {
    return res.status(401).json({ error: 'Missing Authorization' });
  }
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Invalid Authorization' });
  }
  const token = parts[1];
  function isJwtPayload(p: unknown): p is { userId: string } {
    return (
      typeof p === 'object' &&
      p !== null &&
      typeof (p as Record<string, unknown>).userId === 'string'
    );
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET ?? 'secret');

    if (!isJwtPayload(payload)) {
      return res.status(401).json({ error: 'Invalid token payload' });
    }

    req.userId = payload.userId;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
