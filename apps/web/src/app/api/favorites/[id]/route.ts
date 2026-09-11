import { proxy } from '@/lib/server/api-proxy';
import { getUserSession, persistUserSession } from '@/lib/server/user-session';

/** Next 15 hands route params as a promise. */
interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const session = await getUserSession();

  const response = await proxy(`/favorites/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    userId: session.userId,
  });
  return persistUserSession(response, session);
}
