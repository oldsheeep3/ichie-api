import pool from './client';

import type { IbeaconDataRow } from '../types/db';

export async function upsertIbeacon(
  userId: string,
  major: number,
  minor: number
) {
  const res = await pool.query(
    `INSERT INTO ibeacon_datas (user_id, major, minor) VALUES ($1,$2,$3)
     ON CONFLICT (user_id) DO UPDATE SET major = EXCLUDED.major, minor = EXCLUDED.minor
     RETURNING *`,
    [userId, major, minor]
  );
  return res.rows[0] as IbeaconDataRow;
}

export async function getUserByBeacon(major: number, minor: number) {
  const res = await pool.query(
    'SELECT user_id FROM ibeacon_datas WHERE major = $1 AND minor = $2 LIMIT 1',
    [major, minor]
  );
  return res.rows[0]?.user_id;
}

export async function listBeaconsInRange(
  majorMin: number,
  majorMax: number,
  minorMin: number,
  minorMax: number
) {
  const res = await pool.query(
    'SELECT major, minor FROM ibeacon_datas WHERE major BETWEEN $1 AND $2 AND minor BETWEEN $3 AND $4',
    [majorMin, majorMax, minorMin, minorMax]
  );
  return res.rows as Array<{ major: number; minor: number }>;
}

export async function getIbeaconByUser(userId: string) {
  const res = await pool.query(
    'SELECT user_id, major, minor FROM ibeacon_datas WHERE user_id = $1 LIMIT 1',
    [userId]
  );
  return res.rows[0] as IbeaconDataRow | undefined;
}
