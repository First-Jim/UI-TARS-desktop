import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CSPMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const nodeEnv = this.configService.get('NODE_ENV', 'development');

    // Override response headers after they are set
    const originalSend = res.send;
    const originalJson = res.json;
    const originalEnd = res.end;

    // Override send method
    res.send = function (body) {
      overrideHeaders(res, nodeEnv);
      return originalSend.call(this, body);
    };

    // Override json method
    res.json = function (obj) {
      overrideHeaders(res, nodeEnv);
      return originalJson.call(this, obj);
    };

    // Override end method
    res.end = function (chunk?, encoding?) {
      overrideHeaders(res, nodeEnv);
      return originalEnd.call(this, chunk, encoding);
    };

    next();
  }
}

function overrideHeaders(res: Response, nodeEnv: string) {
  if (nodeEnv === 'development') {
    // Remove ngrok's restrictive CSP
    res.removeHeader('content-security-policy');
    res.removeHeader('Content-Security-Policy');

    // Set a permissive CSP for development
    res.header(
      'Content-Security-Policy',
      "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: *; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' *; " +
        "style-src 'self' 'unsafe-inline' *; " +
        "img-src 'self' data: blob: *; " +
        "font-src 'self' data: *; " +
        "connect-src 'self' *; " +
        "media-src 'self' *; " +
        "object-src 'none'; " +
        "child-src 'self' *; " +
        "frame-src 'self' *; " +
        "worker-src 'self' blob: *; " +
        "frame-ancestors 'self' *; " +
        "form-action 'self' *;",
    );

    // Add ngrok bypass headers
    res.header('ngrok-skip-browser-warning', 'true');

    // Remove conflicting headers
    res.removeHeader('X-Frame-Options');
    res.removeHeader('x-frame-options');
  }
}
