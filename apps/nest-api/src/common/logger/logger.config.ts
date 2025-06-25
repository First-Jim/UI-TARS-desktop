import { LoggerService, LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface LoggerConfig {
  level: LogLevel[];
  timestamp: boolean;
  context: boolean;
  prettyPrint: boolean;
  logToFile: boolean;
  logDir: string;
  maxFiles: number;
  maxSize: string;
}

export class CustomLoggerConfig {
  static getConfig(configService: ConfigService): LoggerConfig {
    const nodeEnv = configService.get<string>('NODE_ENV', 'development');

    return {
      level: this.getLogLevels(nodeEnv),
      timestamp: true,
      context: true,
      prettyPrint: nodeEnv === 'development',
      // 在云部署环境中禁用文件日志，避免权限问题
      logToFile: configService.get<boolean>('LOG_TO_FILE', false),
      logDir: configService.get<string>('LOG_DIR', '/tmp/logs'),
      maxFiles: 30,
      maxSize: '10m',
    };
  }

  private static getLogLevels(nodeEnv: string): LogLevel[] {
    switch (nodeEnv) {
      case 'production':
        return ['error', 'warn', 'log'];
      case 'test':
        return ['error', 'warn'];
      case 'development':
      default:
        return ['error', 'warn', 'log', 'debug', 'verbose'];
    }
  }
}

export interface RequestLogData {
  method: string;
  url: string;
  userAgent?: string;
  ip: string;
  userId?: number;
  requestId: string;
  body?: any;
  query?: any;
  params?: any;
  headers?: Record<string, string>;
  timestamp: string;
  duration?: number;
  statusCode?: number;
  responseSize?: number;
}

export interface ErrorLogData {
  error: Error;
  stack?: string;
  context?: string;
  requestId?: string;
  userId?: number;
  additionalData?: any;
  timestamp: string;
}
