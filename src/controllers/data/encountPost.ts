import { Request, Response } from 'express';
import {
  EncountCreateRequestSchema,
  EncountResponse
} from '../../types/encount';
import { createMessage } from '../../db/messages';
import { getUserById } from '../../db/users';

export default async function encountPostHandler(req: Request, res: Response) {
  const parse = EncountCreateRequestSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: parse.error.format() });
  }
  try {
    const userId = req.userId as string;
    const msg = await createMessage(userId, parse.data.message ?? '');
    const user = await getUserById(userId);
    if (!msg || !user || user.id !== userId) {
      return res
        .status(400)
        .json({ error: 'Bad Request', msg: 'Could not create message' });
    }
    const response: EncountResponse = {
      id: msg.id,
      userId: userId,
      createAt: msg.created_at,
      deleteAt: msg.deleted_at ?? undefined,
      name: user?.name ?? '',
      icon: user?.icon ?? '',
      x: user?.x ?? undefined,
      github: user?.github ?? undefined,
      mail: user?.mail ?? undefined,
      message: msg.message
    };
    return res.status(201).json(response);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return res.status(400).json({ error: 'Bad Request', msg: error.message });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
