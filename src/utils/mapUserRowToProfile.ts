import * as users from '../db/users';
import { getIbeaconByUser } from '../db/ibeacon';
import { UserProfile } from '../types';

export default async function mapUserRowToProfile(
  row: Awaited<ReturnType<typeof users.getUserById>>
): Promise<UserProfile> {
  if (!row) {
    throw new Error('User not found');
  }
  const ibeacon = await getIbeaconByUser(row.id);
  if (!ibeacon || !ibeacon.major || !ibeacon.minor) {
    throw new Error('iBeaconData not found');
  }
  return {
    id: row.id,
    major: ibeacon.major,
    minor: ibeacon.minor,
    name: row.name,
    mail: row.mail ?? undefined,
    github: row.github ?? undefined,
    x: row.x ?? undefined,
    icon: row.icon,
    createdAt: row.created_at ?? undefined
  };
}
