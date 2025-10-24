import pool from './client';
import type { RefreshTokenRow } from '../types/db';

export async function createRefreshToken(
  userId: string,
  token: string,
  expiresAt?: string
) {
  const res = await pool.query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1,$2,$3) RETURNING *',
    [userId, token, expiresAt ?? null]
  );
  return res.rows[0] as RefreshTokenRow;
}

export async function findRefreshToken(token: string) {
  const res = await pool.query(
    'SELECT * FROM refresh_tokens WHERE token = $1 LIMIT 1',
    [token]
  );
  return res.rows[0] as RefreshTokenRow | undefined;
}

export async function deleteRefreshToken(token: string) {
  await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
}
