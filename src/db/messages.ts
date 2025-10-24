import pool from './client';
import type { MessageRow } from '../types/db';

export async function createMessage(userId: string, message: string) {
  const res = await pool.query(
    'INSERT INTO messages (user_id, message) VALUES ($1,$2) RETURNING *',
    [userId, message]
  );
  return res.rows[0] as MessageRow;
}

export async function getLatestMessageByUser(
  userId: string,
  timestamp?: string
) {
  if (timestamp) {
    const res = await pool.query(
      'SELECT * FROM messages WHERE user_id = $1 AND deleted_at IS NULL ' +
        'AND created_at < $2 ORDER BY created_at DESC LIMIT 1',
      [userId, timestamp]
    );
    return res.rows[0] as MessageRow | undefined;
  }
  const res = await pool.query(
    'SELECT * FROM messages WHERE user_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 1',
    [userId]
  );
  return res.rows[0] as MessageRow | undefined;
}
