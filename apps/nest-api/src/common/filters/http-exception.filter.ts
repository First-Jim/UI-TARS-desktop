import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

export interface ApiErrorResponse {
  code: number;
  data: null;
  message: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status: number;
    let message: string;
    let code: number;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || responseObj.error || exception.message;

        // 如果是数组，取第一个元素（通常是验证错误）
        if (Array.isArray(message)) {
          message = message[0];
        }
      } else {
        message = exception.message;
      }

      code = status;
    } else {
      // 处理非 HTTP 异常
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      code = HttpStatus.INTERNAL_SERVER_ERROR;

      // 记录未知错误
      console.error('Unhandled exception:', exception);
    }

    const errorResponse: ApiErrorResponse = {
      code,
      data: null,
      message,
    };

    response.status(status).json(errorResponse);
  }
}
