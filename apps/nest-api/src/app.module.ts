import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { validationSchema } from './config/validation.schema';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { TasksModule } from './tasks/tasks.module';
import { WechatModule } from './wechat/wechat.module';
import { MailModule } from './mail/mail.module';
import { LoggerModule } from './common/logger/logger.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ThrottlerModule } from '@nestjs/throttler';
import { csrfMiddleware } from './common/middlewares/csrf.middleware';
import { TodosModule } from './todos/todos.module';
import * as cookieParser from 'cookie-parser';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        '.env.production', // 优先加载生产环境配置
        '.env.local',
        '.env',
      ],
      cache: true,
      validationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),
    LoggerModule,
    PrismaModule,
    UsersModule,
    AuthModule,
    MailModule,
    TasksModule,
    WechatModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 秒
        limit: 50, // 增加到 50 次请求
      },
    ]),
    TodosModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  constructor(private readonly configService: ConfigService) {}

  configure(consumer: MiddlewareConsumer) {
    // Always apply cookie parser
    const middlewares = [cookieParser()];

    // Only apply CSRF in non-development environments
    // const nodeEnv = this.configService.get('NODE_ENV', 'development');
    // if (nodeEnv !== 'development') {
    //   middlewares.push(csrfMiddleware);
    // }

    consumer.apply(...middlewares).forRoutes('*path');
  }
}
