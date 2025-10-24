import { Request, Response } from 'express';
import { EncountKeyArraySchema, EncountResponse } from '../../types/encount';
import { getUserByBeacon } from '../../db/ibeacon';
import { getUserById } from '../../db/users';
import { getLatestMessageByUser } from '../../db/messages';
import type { UserRow, MessageRow } from '../../types/db';

function mapToResponse(user: UserRow, message: MessageRow): EncountResponse {
  return {
    id: message.id,
    userId: user.id,
    createAt: message.created_at,
    deleteAt: message.deleted_at ?? undefined,
    name: user.name,
    icon: user.icon,
    x: user.x ?? undefined,
    github: user.github ?? undefined,
    mail: user.mail ?? undefined,
    message: message.message ?? undefined
  };
}

export default async function encountHandler(req: Request, res: Response) {
  const parse = EncountKeyArraySchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: parse.error.format() });
  }

  const keys = parse.data;
  const results: EncountResponse[] = [];

  for (const k of keys) {
    const userId = await getUserByBeacon(k.major, k.minor);
    if (!userId) {
      continue;
    }
    const user = await getUserById(userId);
    if (!user) {
      continue;
    }
    try {
      const message = await getLatestMessageByUser(userId, k.timestamp);
      if (!message) {
        throw new Error('No message found');
      }
      results.push(mapToResponse(user, message));
    } catch (error) {
      continue;
    }
  }

  return res.status(200).json(results);
}
