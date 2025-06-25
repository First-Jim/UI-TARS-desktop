import { ApiProperty } from '@nestjs/swagger';
import { User } from '@prisma/client';

export class UserEntity implements User {
  @ApiProperty({
    description: 'Unique identifier for the user',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'john.doe@example.com',
    required: false,
  })
  email: string | null;

  @ApiProperty({
    required: false,
    description: 'Hashed password',
    example: '$2a$10$Ew8ZS.../...',
  })
  password: string | null;

  @ApiProperty({
    description: 'Number of consecutive failed login attempts',
    example: 0,
  })
  loginAttempts: number;

  @ApiProperty({
    required: false,
    description:
      'Date until which the account is locked after multiple failed login attempts',
    example: '2023-10-15T14:30:00Z',
  })
  lockExpires: Date | null;

  @ApiProperty({
    description: 'Indicates whether the user has verified their email address',
    example: true,
  })
  isVerified: boolean;

  @ApiProperty({
    required: false,
    description: 'Token used for email verification',
    example: '7c9e6679f7ae8e421f3743b5ff54c00c',
  })
  verifyToken: string | null;

  @ApiProperty({
    description: 'Date and time when the user account was created',
    example: '2023-09-01T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    required: false,
    description: 'Token used for password reset requests',
    example: '3f7b5e12c8a9d2f4e6b8c1a3d5e7f9a2',
  })
  resetToken: string | null;

  @ApiProperty({
    required: false,
    description: 'Expiration date and time for the password reset token',
    example: '2023-10-15T14:30:00Z',
  })
  resetTokenExpiry: Date | null;

  @ApiProperty({
    required: false,
    description: 'Secret key for two-factor authentication',
    example: null,
  })
  twoFactorSecret: string | null;

  @ApiProperty({
    description:
      'Whether two-factor authentication is enabled for this account',
    example: false,
  })
  twoFactorEnabled: boolean;

  // WeChat related fields
  @ApiProperty({
    description: 'WeChat OpenID',
    required: false,
    example: 'o6_bmjrPTlm6_2sgVt7hMZOPfL2M',
  })
  wechatOpenId: string | null;

  @ApiProperty({
    description: 'WeChat UnionID',
    required: false,
    example: 'o6_bmasdasdsad6_2sgVt7hMZOPfL',
  })
  wechatUnionId: string | null;

  @ApiProperty({
    description: 'WeChat nickname',
    required: false,
    example: '张三',
  })
  wechatNickname: string | null;

  @ApiProperty({
    description: 'WeChat avatar URL',
    required: false,
    example: 'https://thirdwx.qlogo.cn/mmopen/...',
  })
  wechatHeadImgUrl: string | null;

  @ApiProperty({
    description: 'Whether user subscribed to WeChat official account',
    example: false,
  })
  wechatSubscribed: boolean;

  @ApiProperty({
    description: 'WeChat subscribe time',
    required: false,
    example: '2023-10-15T14:30:00Z',
  })
  wechatSubscribeTime: Date | null;

  @ApiProperty({
    description: 'WeChat subscribe scene',
    required: false,
    example: 'ADD_SCENE_QR_CODE',
  })
  wechatSubscribeScene: string | null;

  @ApiProperty({
    description: 'WeChat QR scene value',
    required: false,
    example: '98765',
  })
  wechatQrScene: string | null;

  @ApiProperty({
    description: 'WeChat QR scene string',
    required: false,
    example: 'qr_scene_str_value',
  })
  wechatQrSceneStr: string | null;

  @ApiProperty({
    description: 'WeChat user language',
    required: false,
    example: 'zh_CN',
  })
  wechatLanguage: string | null;

  @ApiProperty({
    description: 'WeChat user province',
    required: false,
    example: '广东',
  })
  wechatProvince: string | null;

  @ApiProperty({
    description: 'WeChat user city',
    required: false,
    example: '深圳',
  })
  wechatCity: string | null;

  @ApiProperty({
    description: 'WeChat user country',
    required: false,
    example: '中国',
  })
  wechatCountry: string | null;

  @ApiProperty({
    description: 'WeChat user remark',
    required: false,
    example: 'VIP用户',
  })
  wechatRemark: string | null;

  @ApiProperty({
    description: 'WeChat user group ID',
    required: false,
    example: 0,
  })
  wechatGroupId: number | null;

  @ApiProperty({
    description: 'WeChat user tag IDs (JSON string)',
    required: false,
    example: '[128, 2]',
  })
  wechatTagIds: string | null;
}
