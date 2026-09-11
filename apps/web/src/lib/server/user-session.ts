import 'server-only';

import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';

const COOKIE_NAME = 'weather_uid';
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export interface UserSession {
  userId: string;
  /** True when this request minted the id — the caller must persist it. */
  isNew: boolean;
}

/**
 * Anonymous identity for favourites, so the feature works before there is a
 * login screen.
 *
 * httpOnly means page scripts cannot read or spoof it; the id only ever travels
 * from this server to the API as the `x-user-id` header. Signing in later is an
 * UPDATE on the existing user row, so nobody loses their saved cities.
 */
export async function getUserSession(): Promise<UserSession> {
  const store = await cookies();
  const existing = store.get(COOKIE_NAME)?.value;

  if (existing) {
    return { userId: existing, isNew: false };
  }
  return { userId: crypto.randomUUID(), isNew: true };
}

/** Attaches a freshly minted id to the outgoing response. No-op for known users. */
export function persistUserSession(response: NextResponse, session: UserSession): NextResponse {
  if (!session.isNew) return response;

  response.cookies.set(COOKIE_NAME, session.userId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ONE_YEAR_SECONDS,
  });
  return response;
}
