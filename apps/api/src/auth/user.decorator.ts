import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface AuthUserPayload {
  sub: string;
  email: string;
  role: string;
  is_impersonating?: boolean;
}

export const AuthUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user?: AuthUserPayload }>();

    return request.user as AuthUserPayload;
  },
);
