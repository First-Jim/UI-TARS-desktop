import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WechatService } from './wechat.service';
import { WechatEventService } from './wechat-event.service';
import { WechatController } from './wechat.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ConfigModule, PrismaModule, UsersModule, AuthModule],
  controllers: [WechatController],
  providers: [WechatService, WechatEventService],
  exports: [WechatService, WechatEventService],
})
export class WechatModule {}
