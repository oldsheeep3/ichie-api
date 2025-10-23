// API types generated from docs/swagger.yml

export interface EncountKey {
  major: number;
  minor: number;
  timestamp: string; // ISO 8601 date-time
}

export type EncountKeyArray = EncountKey[];

export interface EncountResponse {
  major: number;
  minor: number;
  timestamp: string; // ISO 8601
  id: string; // uuid
  name: string;
  icon: string; // url
  github?: string;
  x?: string;
  mail?: string;
  message?: string;
}

export type EncountResponseArray = EncountResponse[];

export interface EncountCreateRequest {
  major: number;
  minor: number;
  timestamp: string; // ISO 8601
  message?: string;
}

export interface UserProfile {
  id: string; // uuid
  major: number;
  minor: number;
  name: string;
  mail?: string;
  github?: string;
  x?: string;
  icon: string; // url
  createdAt: string; // ISO 8601
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface AuthSignupRequest {
  provider: string;
  token: string;
  icon: string;
  name: string;
  github?: string;
  x?: string;
  mail?: string;
}

export interface AuthSigninRequest {
  provider: string;
  token: string;
}

export interface AuthUpdateRequest {
  icon?: string;
  name?: string;
  github?: string;
  x?: string;
  mail?: string;
}

export interface AuthResponse {
  user: UserProfile;
  tokens: AuthTokens;
}
