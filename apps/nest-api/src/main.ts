import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { rateLimit } from 'express-rate-limit';

import { CustomLoggerService } from './common/logger/custom-logger.service';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set up custom logger
  const logger = app.get(CustomLoggerService);
  logger.setContext('Bootstrap');
  app.useLogger(logger);

  // Set global prefix for all routes
  const globalPrefix = process.env.API_PREFIX || 'api';
  app.setGlobalPrefix(globalPrefix);

  // Configure proxy trust based on environment
  const nodeEnv = process.env.NODE_ENV || 'development';
  if (nodeEnv === 'production') {
    // In production, trust specific proxy IPs or use a more restrictive setting
    app.getHttpAdapter().getInstance().set('trust proxy', 1); // Trust first proxy
  } else {
    // In development, trust proxy for ngrok/local development
    app.getHttpAdapter().getInstance().set('trust proxy', true);
  }

  // Enable CORS
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // 全局管道
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // 全局响应拦截器 - 统一数据格式
  app.useGlobalInterceptors(new ResponseInterceptor());

  // 全局异常过滤器 - 统一错误格式
  app.useGlobalFilters(new HttpExceptionFilter());

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
      // Disable validation to avoid proxy configuration warnings in development
      validate: false,
      // Use a more robust key generator
      keyGenerator: (req) => {
        // Use X-Forwarded-For if available, otherwise fall back to connection IP
        const forwarded = req.get('X-Forwarded-For');
        const ip = forwarded ? forwarded.split(',')[0].trim() : req.ip;
        return ip || 'unknown';
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('AI Meeting Notes API')
    .setDescription('API for managing meetings and generating AI meeting notes')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  // Log application startup
  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(
    `📚 API endpoints available at: http://localhost:${port}/${globalPrefix}`,
  );
  logger.log(
    `📖 Swagger documentation available at: http://localhost:${port}/docs`,
  );
  logger.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

  // Log application configuration
  logger.logBusiness('APPLICATION_STARTED', {
    port,
    globalPrefix,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
}
bootstrap();
