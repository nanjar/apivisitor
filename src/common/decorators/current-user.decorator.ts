import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentVisitor {
  guestsId: number;
  eventsId: number;
  ticketId: number;
  email: string;
  fullname: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentVisitor => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
