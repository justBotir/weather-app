import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

export const USER_ID_HEADER = 'x-user-id';

/**
 * Reads the caller's id from the `x-user-id` header.
 *
 * The header is set by the Next.js BFF from an httpOnly cookie the browser can
 * neither read nor forge a path around — the API is never exposed publicly, so
 * this header is trusted exactly as far as the network boundary is.
 *
 * When real auth arrives, this decorator is where a verified JWT subject
 * replaces the header; no controller or service changes.
 */
export const CurrentUserId = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<Request>();
  const userId = request.header(USER_ID_HEADER);

  if (!userId) {
    throw new UnauthorizedException('Missing user identity.');
  }
  return userId;
});
