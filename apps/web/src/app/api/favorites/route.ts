import type { NextRequest } from 'next/server';

import { proxy } from '@/lib/server/api-proxy';
import { getUserSession, persistUserSession } from '@/lib/server/user-session';

export async function GET() {
  const session = await getUserSession();
  const response = await proxy('/favorites', { userId: session.userId });
  return persistUserSession(response, session);
}

export async function POST(request: NextRequest) {
  const session = await getUserSession();
  const body: unknown = await request.json().catch(() => null);

  const response = await proxy('/favorites', {
    method: 'POST',
    body,
    userId: session.userId,
  });
  // A brand-new visitor's very first action is often starring a city, so the
  // cookie has to be written on this response or the row is orphaned.
  return persistUserSession(response, session);
}
