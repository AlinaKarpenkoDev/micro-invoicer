import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthUserPayload } from '../auth/user.decorator';

@Injectable()
export class ImpersonationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthUserPayload;

    return next.handle().pipe(
      map((response) => {
        if (!user.is_impersonating) {
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
