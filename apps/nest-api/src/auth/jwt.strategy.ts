import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findOne(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    // 注释掉邮箱验证检查，允许未验证用户访问基本功能
    // 在前端显示验证提醒即可
    // if (!user.isVerified) {
    //   throw new UnauthorizedException('Email not verified');
    // }

    if (!user.isVerified) {
      throw new ForbiddenException('Email verification required');
    }

    return {
      id: payload.sub,
      email: payload.email,
      isVerified: user.isVerified,
    };
  }
}
