import pool from './client';

import type { UserRow } from '../types/db';
export type UserProfile = UserRow;

export async function createUser(data: {
  name: string;
  mail?: string | null;
  github?: string | null;
  x?: string | null;
  icon: string;
}) {
  const res = await pool.query(
    'INSERT INTO users (name, mail, github, x, icon) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [
      data.name,
      data.mail ?? null,
      data.github ?? null,
      data.x ?? null,
      data.icon
    ]
  );
  return res.rows[0] as UserRow;
}

export async function getUserById(id: string) {
  const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return res.rows[0] as UserRow | undefined;
}

export async function updateUser(id: string, data: Partial<UserProfile>) {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;
  for (const k of Object.keys(data)) {
    fields.push(`${k} = $${idx}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    values.push((data as any)[k]);
    idx += 1;
  }
  if (fields.length === 0) {
    return getUserById(id);
  }
  const q = `UPDATE users SET ${fields.join(',')} WHERE id = $${idx} RETURNING *`;
  values.push(id);
  const res = await pool.query(q, values);
  return res.rows[0] as UserRow;
}

export async function findUserByProvider(
  provider: string,
  providerAccountId: string
) {
  const res = await pool.query(
    'SELECT u.* FROM users u JOIN oauth_accounts o ON o.user_id = u.id ' +
      'WHERE o.provider = $1 AND o.provider_account_id = $2 LIMIT 1',
    [provider, providerAccountId]
  );
  return res.rows[0] as UserRow | undefined;
}
