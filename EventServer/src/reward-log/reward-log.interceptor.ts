import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, Observable, tap } from 'rxjs';

import { InjectModel } from '@nestjs/mongoose';
import { RewardLogEntity } from './reward-log.schema';
import { RewardLogService } from './reward-log.service';

/**
 * 보상 지급 요청 결과를 DB에 저장하는 인터셉터 입니다.
 */
@Injectable()
export class RewardLogger implements NestInterceptor {
  constructor(
    @InjectModel(RewardLogEntity.name)
    private readonly rewardLogService: RewardLogService,
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();

    return next.handle().pipe(
      tap(async () => {
        await this.rewardLogService.createLog({
          userId: req.params.userId,
          success: true,
          data: {
            body: req.body,
            params: req.params,
          },
        });
      }),
      catchError(async (err) => {
        await this.rewardLogService.createLog({
          userId: req.params.userId,
          success: false,
          message: err.message,
          data: {
            body: req.body,
            params: req.params,
          },
        });

        throw err;
      }),
    );
  }
}
