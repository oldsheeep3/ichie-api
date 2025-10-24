import { Request, Response } from 'express';
import { EncountResponse } from '../../types/encount';
import { getLatestMessageByUser } from '../../db/messages';
import { getUserById } from '../../db/users';

export default async function encountMeGetHandler(req: Request, res: Response) {
  const userId = req.userId as string;
  try {
    const msg = await getLatestMessageByUser(userId);
    const user = await getUserById(userId);
    if (!msg || !user || user.id !== userId) {
      throw new Error('Could not retrieve message or user');
    }
    const response: EncountResponse[] = [
      {
        id: msg.id,
        userId: userId,
        createAt: msg.created_at,
        deleteAt: msg.deleted_at ?? undefined,
        name: user.name,
        icon: user.icon,
        x: user.x ?? undefined,
        github: user.github ?? undefined,
        mail: user.mail ?? undefined,
        message: msg.message ?? undefined
      }
    ];
    return res.json(response);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return res.status(400).json({ error: 'Bad Request', msg: error.message });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
