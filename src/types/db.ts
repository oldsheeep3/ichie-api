// DB row shapes (snake_case) reflecting tables in db/create_tables.sql
export type UserRow = {
  id: string;
  name: string;
  mail?: string | null;
  github?: string | null;
  x?: string | null;
  icon: string;
  created_at: string;
};

export type OauthAccountRow = {
  id: string;
  user_id: string;
  provider: string;
  provider_account_id: string;
  provider_token?: string | null;
  created_at: string;
};

export type RefreshTokenRow = {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at?: string | null;
};

export type IbeaconDataRow = {
  user_id: string;
  major: number;
  minor: number;
};

export type MessageRow = {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  deleted_at?: string | null;
};
