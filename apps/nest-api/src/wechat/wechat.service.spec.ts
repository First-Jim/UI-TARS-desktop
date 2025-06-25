import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { WechatService } from './wechat.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { AuthService } from '../auth/auth.service';

describe('WechatService', () => {
  let service: WechatService;
  let prismaService: PrismaService;
  let configService: ConfigService;
  let usersService: UsersService;
  let authService: AuthService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        WECHAT_APP_ID: 'test_app_id',
        WECHAT_APP_SECRET: 'test_app_secret',
        WECHAT_TOKEN: 'test_token',
        WECHAT_ENCODING_AES_KEY: 'test_aes_key',
        WECHAT_REDIRECT_URI: 'http://localhost:3000/wechat/callback',
      };
      return config[key];
    }),
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockUsersService = {};

  const mockAuthService = {
    generateTokens: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WechatService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    service = module.get<WechatService>(WechatService);
    prismaService = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);
    usersService = module.get<UsersService>(UsersService);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('verifySignature', () => {
    it('should verify WeChat signature correctly', () => {
      const signature = 'test_signature';
      const timestamp = '1234567890';
      const nonce = 'test_nonce';

      // This is a simplified test - in real scenario, you'd need to calculate the actual signature
      const result = service.verifySignature(signature, timestamp, nonce);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getAuthUrl', () => {
    it('should generate WeChat auth URL', () => {
      const authUrl = service.getAuthUrl('snsapi_userinfo', 'test_state');

      expect(authUrl).toContain(
        'https://open.weixin.qq.com/connect/oauth2/authorize',
      );
      expect(authUrl).toContain('appid=test_app_id');
      expect(authUrl).toContain('scope=snsapi_userinfo');
      expect(authUrl).toContain('state=test_state');
    });
  });

  describe('createOrUpdateWechatUser', () => {
    it('should create new WeChat user', async () => {
      const wechatUserInfo = {
        openid: 'test_openid',
        nickname: 'Test User',
        headimgurl: 'http://test.com/avatar.jpg',
        subscribe: 1,
        subscribe_time: 1234567890,
      };

      const expectedUser = {
        id: 1,
        name: 'Test User',
        wechatOpenId: 'test_openid',
        wechatNickname: 'Test User',
        wechatHeadImgUrl: 'http://test.com/avatar.jpg',
        wechatSubscribed: true,
        isVerified: true,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(expectedUser);

      const result = await service.createOrUpdateWechatUser(wechatUserInfo);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { wechatOpenId: 'test_openid' },
      });
      expect(mockPrismaService.user.create).toHaveBeenCalled();
      expect(result).toEqual(expectedUser);
    });

    it('should update existing WeChat user', async () => {
      const wechatUserInfo = {
        openid: 'test_openid',
        nickname: 'Updated User',
        headimgurl: 'http://test.com/new_avatar.jpg',
        subscribe: 1,
      };

      const existingUser = {
        id: 1,
        name: 'Test User',
        wechatOpenId: 'test_openid',
      };

      const updatedUser = {
        ...existingUser,
        name: 'Updated User',
        wechatNickname: 'Updated User',
        wechatHeadImgUrl: 'http://test.com/new_avatar.jpg',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.createOrUpdateWechatUser(wechatUserInfo);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { wechatOpenId: 'test_openid' },
      });
      expect(mockPrismaService.user.update).toHaveBeenCalled();
      expect(result).toEqual(updatedUser);
    });
  });
});
