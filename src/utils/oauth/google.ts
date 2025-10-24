type GoogleTokenPayload = {
  sub: string;
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  picture?: string;
  aud?: string;
  iss?: string;
  exp?: string;
};

export async function verifyGoogleIdToken(
  idToken: string
): Promise<GoogleTokenPayload> {
  const g = globalThis as unknown as { fetch?: typeof fetch };
  if (typeof g.fetch !== 'function') {
    throw new Error(
      'Global fetch is not available in this environment. Run on Node 18+ or install `node-fetch`.'
    );
  }

  const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
  const res = await g.fetch(url);
  if (!res.ok) {
    throw new Error(`Google token verification failed: ${res.status}`);
  }

  const data = await res.json();

  // Audience check (if GOOGLE_CLIENT_ID is set)
  const expectedAud = process.env.GOOGLE_CLIENT_ID;
  if (expectedAud && data.aud !== expectedAud) {
    throw new Error('Token audience (aud) does not match GOOGLE_CLIENT_ID');
  }

  // Email verified check (if present)
  if (data.email_verified !== undefined) {
    const emailVerified =
      data.email_verified === true || data.email_verified === 'true';
    if (!emailVerified) {
      throw new Error('Google account email is not verified');
    }
  }

  return data as GoogleTokenPayload;
}
