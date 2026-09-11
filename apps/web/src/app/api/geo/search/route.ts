import type { NextRequest } from 'next/server';

import { proxyGet } from '@/lib/server/api-proxy';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  return proxyGet('/geo/search', searchParams);
}
