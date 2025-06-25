import { Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';
import {
  CustomLoggerConfig,
  LoggerConfig,
  RequestLogData,
  ErrorLogData,
} from './logger.config';

@Injectable()
export class CustomLoggerService implements LoggerService {
  private readonly winston: winston.Logger;
  private readonly config: LoggerConfig;
  private context?: string;

  constructor(private readonly configService: ConfigService) {
    this.config = CustomLoggerConfig.getConfig(configService);
    this.winston = this.createWinstonLogger();
  }

  setContext(context: string) {
    this.context = context;
  }

  log(message: any, context?: string) {
    this.winston.info(this.formatMessage(message, context || this.context));
  }

  error(message: any, trace?: string, context?: string) {
    this.winston.error(this.formatMessage(message, context || this.context), {
      trace,
      stack: trace,
    });
  }

  warn(message: any, context?: string) {
    this.winston.warn(this.formatMessage(message, context || this.context));
  }

  debug(message: any, context?: string) {
    this.winston.debug(this.formatMessage(message, context || this.context));
  }

  verbose(message: any, context?: string) {
    this.winston.verbose(this.formatMessage(message, context || this.context));
  }

  // 专门的请求日志方法
  logRequest(data: RequestLogData) {
    this.winston.info('HTTP Request', {
      type: 'request',
      ...data,
    });
  }

  // 专门的响应日志方法
  logResponse(data: RequestLogData) {
    this.winston.info('HTTP Response', {
      type: 'response',
      ...data,
    });
  }

  // 专门的错误日志方法
  logError(data: ErrorLogData) {
    this.winston.error('Application Error', {
      type: 'error',
      message: data.error.message,
      stack: data.error.stack,
      ...data,
    });
  }

  // 业务日志方法
  logBusiness(action: string, data: any, context?: string) {
    this.winston.info('Business Action', {
      type: 'business',
      action,
      context: context || this.context,
      data: this.sanitizeData(data),
      timestamp: new Date().toISOString(),
    });
  }

  // 数据库操作日志
  logDatabase(operation: string, table: string, data?: any, context?: string) {
    this.winston.debug('Database Operation', {
      type: 'database',
      operation,
      table,
      context: context || this.context,
      data: this.sanitizeData(data),
      timestamp: new Date().toISOString(),
    });
  }

  // 外部API调用日志
  logExternalApi(
    url: string,
    method: string,
    data?: any,
    response?: any,
    context?: string,
  ) {
    this.winston.info('External API Call', {
      type: 'external_api',
      url,
      method,
      context: context || this.context,
      requestData: this.sanitizeData(data),
      responseData: this.sanitizeData(response),
      timestamp: new Date().toISOString(),
    });
  }

  private createWinstonLogger(): winston.Logger {
    const transports: winston.transport[] = [
      new winston.transports.Console({
        format: this.config.prettyPrint
          ? winston.format.combine(
              winston.format.colorize(),
              winston.format.timestamp(),
              winston.format.printf(
                ({ timestamp, level, message, context, ...meta }) => {
                  const ctx = context ? `[${context}]` : '';
                  const metaStr = Object.keys(meta).length
                    ? JSON.stringify(meta, null, 2)
                    : '';
                  return `${timestamp} ${level} ${ctx} ${message} ${metaStr}`;
                },
              ),
            )
          : winston.format.combine(
              winston.format.timestamp(),
              winston.format.json(),
            ),
      }),
    ];

    // 生产环境添加文件日志（如果启用且有权限）
    if (this.config.logToFile) {
      try {
        // 错误日志文件
        transports.push(
          new DailyRotateFile({
            filename: `${this.config.logDir}/error-%DATE%.log`,
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            maxFiles: this.config.maxFiles,
            maxSize: this.config.maxSize,
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.json(),
            ),
          }),
        );

        // 所有日志文件
        transports.push(
          new DailyRotateFile({
            filename: `${this.config.logDir}/combined-%DATE%.log`,
            datePattern: 'YYYY-MM-DD',
            maxFiles: this.config.maxFiles,
            maxSize: this.config.maxSize,
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.json(),
            ),
          }),
        );

        // 请求日志文件
        transports.push(
          new DailyRotateFile({
            filename: `${this.config.logDir}/requests-%DATE%.log`,
            datePattern: 'YYYY-MM-DD',
            maxFiles: this.config.maxFiles,
            maxSize: this.config.maxSize,
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.json(),
              winston.format((info) => {
                return info.type === 'request' || info.type === 'response'
                  ? info
                  : false;
              })(),
            ),
          }),
        );
      } catch (error) {
        // 如果文件日志创建失败，只输出到控制台
        console.warn(
          'Failed to create file logger, falling back to console only:',
          error.message,
        );
      }
    }

    return winston.createLogger({
      level: 'verbose',
      transports,
      exitOnError: false,
    });
  }

  private formatMessage(message: any, context?: string): string {
    const timestamp = new Date().toISOString();
    const ctx = context ? `[${context}]` : '';

    if (typeof message === 'object') {
      return `${ctx} ${JSON.stringify(message)}`;
    }

    return `${ctx} ${message}`;
  }

  private sanitizeData(data: any): any {
    if (!data) return data;

    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'key',
      'authorization',
    ];

    if (typeof data === 'object') {
      const sanitized = { ...data };

      for (const field of sensitiveFields) {
        if (sanitized[field]) {
          sanitized[field] = '***REDACTED***';
        }
      }

      return sanitized;
    }

    return data;
  }
}
