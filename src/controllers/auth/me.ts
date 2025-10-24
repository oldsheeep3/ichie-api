import { Request, Response } from 'express';
import * as users from '../../db/users';
import { getIbeaconByUser } from '../../db/ibeacon';

export default async function meHandler(req: Request, res: Response) {
  const userId = req.userId as string;
  const user = await users.getUserById(userId);
  if (!user) {
    return res
      .status(401)
      .json({ error: 'Unauthorized', msg: 'User not found' });
  }
  const ibeacon = await getIbeaconByUser(userId);
  if (!ibeacon || !ibeacon.major || !ibeacon.minor) {
    return res
      .status(400)
      .json({ error: 'Bad Request', msg: 'iBeaconData not found' });
  }
  const profile = {
    id: user.id,
    major: ibeacon.major,
    minor: ibeacon.minor,
    name: user.name,
    mail: user.mail ?? undefined,
    github: user.github ?? undefined,
    x: user.x ?? undefined,
    icon: user.icon,
    createdAt: user.created_at ?? undefined
  };
  return res.json(profile);
}
