import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { CustomLoggerService } from '../logger/custom-logger.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: CustomLoggerService) {
    this.logger.setContext('LoggingInterceptor');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    // 生成请求ID
    const requestId = uuidv4();
    request['requestId'] = requestId;

    // 获取用户信息（如果已认证）
    const user = request['user'];
    const userId = user?.id || user?.sub;

    // 记录请求日志
    this.logRequest(request, requestId, userId);

    return next.handle().pipe(
      tap((data) => {
        // 记录成功响应日志
        this.logResponse(request, response, data, startTime, requestId, userId);
      }),
      catchError((error) => {
        // 记录错误响应日志
        this.logErrorResponse(
          request,
          response,
          error,
          startTime,
          requestId,
          userId,
        );
        throw error;
      }),
    );
  }

  private logRequest(request: Request, requestId: string, userId?: number) {
    const { method, url, headers, body, query, params, ip } = request;

    // 过滤敏感头信息
    const filteredHeaders = this.filterSensitiveHeaders(headers);

    this.logger.logRequest({
      method,
      url,
      userAgent: headers['user-agent'],
      ip: this.getClientIp(request),
      userId,
      requestId,
      body: this.sanitizeBody(body),
      query,
      params,
      headers: filteredHeaders,
      timestamp: new Date().toISOString(),
    });
  }

  private logResponse(
    request: Request,
    response: Response,
    data: any,
    startTime: number,
    requestId: string,
    userId?: number,
  ) {
    const duration = Date.now() - startTime;
    const { method, url } = request;

    this.logger.logResponse({
      method,
      url,
      ip: this.getClientIp(request),
      userId,
      requestId,
      timestamp: new Date().toISOString(),
      duration,
      statusCode: response.statusCode,
      responseSize: this.getResponseSize(data),
    });

    // 记录性能警告
    if (duration > 5000) {
      this.logger.warn(
        `Slow request detected: ${method} ${url} took ${duration}ms`,
        'Performance',
      );
    }
  }

  private logErrorResponse(
    request: Request,
    response: Response,
    error: any,
    startTime: number,
    requestId: string,
    userId?: number,
  ) {
    const duration = Date.now() - startTime;
    const { method, url } = request;

    this.logger.logError({
      error,
      context: 'HTTP Request',
      requestId,
      userId,
      timestamp: new Date().toISOString(),
      additionalData: {
        method,
        url,
        duration,
        statusCode: error.status || 500,
        ip: this.getClientIp(request),
      },
    });
  }

  private getClientIp(request: Request): string {
    return (
      (request.headers['x-forwarded-for'] as string) ||
      (request.headers['x-real-ip'] as string) ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      request.ip ||
      'unknown'
    );
  }

  private filterSensitiveHeaders(headers: any): Record<string, string> {
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    const filtered: Record<string, string> = {};

    Object.keys(headers).forEach((key) => {
      if (sensitiveHeaders.includes(key.toLowerCase())) {
        filtered[key] = '***REDACTED***';
      } else {
        filtered[key] = headers[key];
      }
    });

    return filtered;
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;

    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'key',
      'currentPassword',
      'newPassword',
    ];

    if (typeof body === 'object') {
      const sanitized = { ...body };

      for (const field of sensitiveFields) {
        if (sanitized[field]) {
          sanitized[field] = '***REDACTED***';
        }
      }

      return sanitized;
    }

    return body;
  }

  private getResponseSize(data: any): number {
    if (!data) return 0;

    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }
}

// 装饰器用于跳过日志记录
export const SkipLogging = () => {
  return (
    target: any,
    propertyKey?: string,
    descriptor?: PropertyDescriptor,
  ) => {
    if (descriptor) {
      descriptor.value.skipLogging = true;
    }
    return descriptor;
  };
};
