import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn } from 'class-validator';

export class WechatAuthDto {
  @ApiProperty({
    description: 'WeChat OAuth scope',
    enum: ['snsapi_base', 'snsapi_userinfo'],
    default: 'snsapi_userinfo',
    required: false,
  })
  @IsOptional()
  @IsIn(['snsapi_base', 'snsapi_userinfo'])
  scope?: 'snsapi_base' | 'snsapi_userinfo';

  @ApiProperty({
    description: 'State parameter for OAuth',
    required: false,
    example: 'login_from_qr',
  })
  @IsOptional()
  @IsString()
  state?: string;
}

export class WechatCallbackDto {
  @ApiProperty({
    description: 'Authorization code from WeChat',
    example: 'CODE_FROM_WECHAT',
  })
  @IsString()
  code: string;

  @ApiProperty({
    description: 'State parameter returned from WeChat',
    required: false,
    example: 'login_from_qr',
  })
  @IsOptional()
  @IsString()
  state?: string;
}

export class WechatUserInfoDto {
  @ApiProperty({
    description: 'WeChat OpenID',
    example: 'o6_bmjrPTlm6_2sgVt7hMZOPfL2M',
  })
  openid: string;

  @ApiProperty({
    description: 'User nickname',
    required: false,
    example: '张三',
  })
  nickname?: string;

  @ApiProperty({
    description: 'User gender (1: male, 2: female, 0: unknown)',
    required: false,
    example: 1,
  })
  sex?: number;

  @ApiProperty({
    description: 'User province',
    required: false,
    example: '广东',
  })
  province?: string;

  @ApiProperty({
    description: 'User city',
    required: false,
    example: '深圳',
  })
  city?: string;

  @ApiProperty({
    description: 'User country',
    required: false,
    example: '中国',
  })
  country?: string;

  @ApiProperty({
    description: 'User avatar URL',
    required: false,
    example: 'https://thirdwx.qlogo.cn/mmopen/...',
  })
  headimgurl?: string;

  @ApiProperty({
    description: 'User privileges',
    required: false,
    type: [String],
  })
  privilege?: string[];

  @ApiProperty({
    description: 'WeChat UnionID',
    required: false,
    example: 'o6_bmasdasdsad6_2sgVt7hMZOPfL',
  })
  unionid?: string;

  @ApiProperty({
    description: 'Whether user subscribed to the official account',
    required: false,
    example: 1,
  })
  subscribe?: number;

  @ApiProperty({
    description: 'Subscribe timestamp',
    required: false,
    example: 1382694957,
  })
  subscribe_time?: number;

  @ApiProperty({
    description: 'Subscribe scene',
    required: false,
    example: 'ADD_SCENE_QR_CODE',
  })
  subscribe_scene?: string;

  @ApiProperty({
    description: 'QR scene value',
    required: false,
    example: 98765,
  })
  qr_scene?: number;

  @ApiProperty({
    description: 'QR scene string',
    required: false,
    example: 'qr_scene_str_value',
  })
  qr_scene_str?: string;

  @ApiProperty({
    description: 'User language',
    required: false,
    example: 'zh_CN',
  })
  language?: string;

  @ApiProperty({
    description: 'User remark',
    required: false,
    example: 'VIP用户',
  })
  remark?: string;

  @ApiProperty({
    description: 'User group ID',
    required: false,
    example: 0,
  })
  groupid?: number;

  @ApiProperty({
    description: 'User tag IDs',
    required: false,
    type: [Number],
    example: [128, 2],
  })
  tagid_list?: number[];
}
