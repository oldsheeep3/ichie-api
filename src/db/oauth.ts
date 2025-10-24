import pool from './client';
import type { OauthAccountRow } from '../types/db';

export async function createOauthAccount(params: {
  user_id: string;
  provider: string;
  provider_account_id: string;
  provider_token?: string | null;
}) {
  const res = await pool.query(
    'INSERT INTO oauth_accounts ' +
      '(user_id, provider, provider_account_id, provider_token) ' +
      'VALUES ($1,$2,$3,$4) RETURNING *',
    [
      params.user_id,
      params.provider,
      params.provider_account_id,
      params.provider_token ?? null
    ]
  );
  return res.rows[0] as OauthAccountRow;
}

export async function getOauthByProviderAccount(
  provider: string,
  providerAccountId: string
) {
  const res = await pool.query(
    'SELECT * FROM oauth_accounts WHERE provider = $1 AND provider_account_id = $2 LIMIT 1',
    [provider, providerAccountId]
  );
  return res.rows[0] as OauthAccountRow | undefined;
}

export async function getOauthByUser(userId: string) {
  const res = await pool.query(
    'SELECT * FROM oauth_accounts WHERE user_id = $1',
    [userId]
  );
  return res.rows as OauthAccountRow[];
}
