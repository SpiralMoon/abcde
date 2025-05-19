import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiException, ErrorCode } from './common/exceptions';

@Catch(ApiException, Error)
export class ApiFilter implements ExceptionFilter {
  catch(exception: ApiException | Error, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();

    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    const message = exception.message;
    const code =
      exception instanceof ApiException ? exception.code : ErrorCode.Undefined;

    const body: any = {
      message: {
        code: code,
        message: message,
      },
      success: false,
      timestamp: Date.now(),
    };

    response.status(status).json(body);
  }
}
