import 'server-only';

import { NextResponse } from 'next/server';

/**
 * Server-only proxy to the NestJS API.
 *
 * The browser never learns API_BASE_URL, and the weather key lives one hop
 * further in. This is also the seam where the session id is attached: the
 * `x-user-id` header is set here and here only, from an httpOnly cookie.
 */
const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:4000';

interface ProxyOptions {
  method?: 'GET' | 'POST' | 'DELETE' | 'PATCH';
  searchParams?: URLSearchParams;
  body?: unknown;
  /** Forwarded as `x-user-id`. Omit for anonymous, unauthenticated resources. */
  userId?: string;
}

export async function proxy(path: string, options: ProxyOptions = {}): Promise<NextResponse> {
  const { method = 'GET', searchParams, body, userId } = options;

  const url = new URL(`/api${path}`, API_BASE_URL);
  searchParams?.forEach((value, key) => url.searchParams.set(key, value));

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (userId) headers['x-user-id'] = userId;

  try {
    const upstream = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      // Caching is the API's job — it knows the correct TTL per resource.
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });

    // 204 and other empty bodies must not go through .json().
    if (upstream.status === 204 || upstream.headers.get('content-length') === '0') {
      return new NextResponse(null, { status: upstream.status });
    }

    const payload = await upstream
      .json()
      .catch(() => ({ message: 'Malformed upstream response' }));
    return NextResponse.json(payload, { status: upstream.status });
  } catch (error) {
    // Distinguish "our own API isn't running" from "the weather vendor is down" —
    // in dev these look identical from the browser and cost an hour of guessing.
    const isConnectionRefused =
      error instanceof Error && /ECONNREFUSED|fetch failed/i.test(error.message);

    const message =
      isConnectionRefused && process.env.NODE_ENV !== 'production'
        ? `Cannot reach the API at ${API_BASE_URL}. Is it running? Try: npm run dev:api`
        : 'Weather service is unavailable.';

    console.error(`[api-proxy] ${method} ${path} failed:`, (error as Error).message);
    return NextResponse.json({ message }, { status: 503 });
  }
}

/** Convenience wrapper for the read-only weather routes. */
export function proxyGet(path: string, searchParams?: URLSearchParams): Promise<NextResponse> {
  return proxy(path, { searchParams });
}
