import { map, Observable } from 'rxjs';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';

/**
 * Controller의 응답 객체를 ResponseBody 형태로 래핑합니다.
 */
@Injectable()
export class DtoWrappingInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    return next.handle().pipe(
      map((message) => ({
        message: message,
        success: true,
        timestamp: Date.now(),
      })),
    );
  }
}
