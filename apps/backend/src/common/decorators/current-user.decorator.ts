import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type JwtUserPayload = {
  sub: string;
  email: string | null;
  role: string;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtUserPayload => {
    const request = ctx.switchToHttp().getRequest<{ user?: JwtUserPayload }>();
    const user = request.user;
    if (!user) {
      throw new Error('CurrentUser used without JwtAuthGuard');
    }
    return user;
  },
);
