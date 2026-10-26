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

interface InvoiceTable {
  client_name: string;
  amount: number;
  [key: string]: unknown;
}

@Injectable()
export class ImpersonationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthUserPayload }>();
    const user = request.user;

    return next.handle().pipe(
      map(
        (
          response:
            { data?: InvoiceTable[]; archived?: InvoiceTable[] } | undefined,
        ) => {
          if (
            !user?.is_impersonating ||
            !response?.data ||
            !response?.archived
          ) {
            return response;
          }

          const maskItem = (inv: InvoiceTable): InvoiceTable => ({
            ...inv,
            client_name: '***',
            amount: 0,
          });

          const maskedData = response.data.map(maskItem);
          const maskedArchived = response.archived.map(maskItem);

          return { ...response, data: maskedData, archived: maskedArchived };
        },
      ),
    );
  }
}
