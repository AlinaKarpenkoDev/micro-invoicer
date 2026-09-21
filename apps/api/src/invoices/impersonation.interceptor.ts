import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthUserPayload } from '../auth/user.decorator';
import { Request } from 'express';

@Injectable()
export class ImpersonationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthUserPayload }>();
    const user = request.user;

    return next.handle().pipe(
      map((response: { data?: any[] } | undefined) => {
        if (!user?.is_impersonating || !response?.data) {
          return response;
        }

        const maskedData = response.data.map(
          (inv: {
            client_name: string;
            amount: number;
            [key: string]: unknown;
          }) => {
            return {
              ...inv,
              client_name: '***',
              amount: 0,
            };
          },
        );

        return { ...response, data: maskedData };
      }),
    );
  }
}
