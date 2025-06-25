import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class VerifiedUserGuard implements CanActivate {
  constructor(private usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new UnauthorizedException('User not authenticated');
    }

    // 获取完整的用户信息
    const fullUser = await this.usersService.findOne(user.id);

    if (!fullUser) {
      throw new UnauthorizedException('User not found');
    }

    if (!fullUser.isVerified) {
      throw new UnauthorizedException('Email verification required');
    }

    return true;
  }
}
