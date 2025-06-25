import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { AuthService } from '../auth/auth.service';
import * as crypto from 'crypto';
import axios from 'axios';

export interface WechatUserInfo {
  openid: string;
  nickname?: string;
  sex?: number;
  province?: string;
  city?: string;
  country?: string;
  headimgurl?: string;
  privilege?: string[];
  unionid?: string;
  subscribe?: number;
  subscribe_time?: number;
  subscribe_scene?: string;
  qr_scene?: number;
  qr_scene_str?: string;
  language?: string;
  remark?: string;
  groupid?: number;
  tagid_list?: number[];
}

export interface WechatAccessTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  openid: string;
  scope: string;
  unionid?: string;
  is_snapshotuser?: number;
}

@Injectable()
export class WechatService {
  private readonly logger = new Logger(WechatService.name);
  private readonly appId: string;
  private readonly appSecret: string;
  private readonly token: string;
  private readonly encodingAESKey: string;
  private readonly redirectUri: string;

  // 二维码状态现在存储在数据库中

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private usersService: UsersService,
    private authService: AuthService,
  ) {
    this.appId = this.configService.get<string>('WECHAT_APP_ID');
    this.appSecret = this.configService.get<string>('WECHAT_APP_SECRET');
    this.token = this.configService.get<string>('WECHAT_TOKEN');
    this.encodingAESKey = this.configService.get<string>(
      'WECHAT_ENCODING_AES_KEY',
    );
    this.redirectUri = this.configService.get<string>('WECHAT_REDIRECT_URI');
  }

  /**
   * 验证微信服务器签名
   */
  verifySignature(
    signature: string,
    timestamp: string,
    nonce: string,
  ): boolean {
    const startTime = Date.now();

    if (!this.token) {
      this.logger.warn('WeChat token not configured');
      return false;
    }

    this.logger.log('🔍 WeChat Signature Verification Started');

    try {
      // 按照微信文档：将token、timestamp、nonce三个参数进行字典序排序
      const tmpArr = [this.token, timestamp, nonce].sort();
      const tmpStr = tmpArr.join('');

      // 使用 SHA1 加密
      const hash = crypto
        .createHash('sha1')
        .update(tmpStr, 'utf8')
        .digest('hex');

      const isValid = hash === signature;
      const duration = Date.now() - startTime;

      this.logger.log(`✅ Signature verification completed in ${duration}ms:`, {
        isValid,
        expectedHash: hash,
        receivedSignature: signature,
        sortedParams: tmpArr,
      });

      // 确保在 5 秒内完成（实际应该在几毫秒内）
      if (duration > 5000) {
        this.logger.warn(
          `⚠️ Signature verification took too long: ${duration}ms`,
        );
      }

      return isValid;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `❌ Signature verification failed in ${duration}ms:`,
        error,
      );
      return false;
    }
  }

  /**
   * 获取微信公众号授权URL
   */
  getAuthUrl(
    scope: 'snsapi_base' | 'snsapi_userinfo' = 'snsapi_userinfo',
    state?: string,
  ): string {
    if (!this.appId || !this.redirectUri) {
      throw new BadRequestException('WeChat configuration not complete');
    }

    const params = new URLSearchParams({
      appid: this.appId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope,
      state: state || 'STATE',
    });

    return `https://open.weixin.qq.com/connect/oauth2/authorize?${params.toString()}#wechat_redirect`;
  }

  /**
   * 通过code获取access_token
   */
  async getAccessToken(code: string): Promise<WechatAccessTokenResponse> {
    if (!this.appId || !this.appSecret) {
      throw new BadRequestException('WeChat configuration not complete');
    }

    try {
      const response = await axios.get(
        'https://api.weixin.qq.com/sns/oauth2/access_token',
        {
          params: {
            appid: this.appId,
            secret: this.appSecret,
            code,
            grant_type: 'authorization_code',
          },
        },
      );

      if (response.data.errcode) {
        throw new BadRequestException(
          `WeChat API error: ${response.data.errmsg}`,
        );
      }

      return response.data;
    } catch (error) {
      this.logger.error('Failed to get WeChat access token', error);
      throw new InternalServerErrorException(
        'Failed to get WeChat access token',
      );
    }
  }

  /**
   * 获取用户基本信息
   */
  async getUserInfo(
    accessToken: string,
    openid: string,
  ): Promise<WechatUserInfo> {
    try {
      const response = await axios.get(
        'https://api.weixin.qq.com/sns/userinfo',
        {
          params: {
            access_token: accessToken,
            openid,
            lang: 'zh_CN',
          },
        },
      );

      if (response.data.errcode) {
        throw new BadRequestException(
          `WeChat API error: ${response.data.errmsg}`,
        );
      }

      return response.data;
    } catch (error) {
      this.logger.error('Failed to get WeChat user info', error);
      throw new InternalServerErrorException('Failed to get WeChat user info');
    }
  }

  /**
   * 获取公众号access_token（用于调用其他微信API）
   */
  async getPublicAccessToken(): Promise<string> {
    this.logger.log('🔍 Getting WeChat public access token...');

    if (!this.appId || !this.appSecret) {
      this.logger.error('❌ WeChat configuration incomplete:', {
        hasAppId: !!this.appId,
        hasAppSecret: !!this.appSecret,
        appId: this.appId ? `${this.appId.substring(0, 6)}***` : 'undefined',
      });
      throw new BadRequestException('WeChat configuration not complete');
    }

    this.logger.log('✅ WeChat config check passed:', {
      appId: `${this.appId.substring(0, 6)}***`,
      appSecretLength: this.appSecret.length,
    });

    try {
      const requestUrl = 'https://api.weixin.qq.com/cgi-bin/token';
      const requestParams = {
        grant_type: 'client_credential',
        appid: this.appId,
        secret: this.appSecret,
      };

      this.logger.log('📡 Making request to WeChat API:', {
        url: requestUrl,
        params: {
          grant_type: requestParams.grant_type,
          appid: requestParams.appid,
          secret: `${requestParams.secret.substring(0, 6)}***`,
        },
      });

      const response = await axios.get(requestUrl, {
        params: requestParams,
        timeout: 10000, // 10秒超时
      });

      this.logger.log('📥 WeChat API response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
      });

      if (response.data.errcode) {
        this.logger.error('❌ WeChat API returned error:', {
          errcode: response.data.errcode,
          errmsg: response.data.errmsg,
        });
        throw new BadRequestException(
          `WeChat API error: ${response.data.errmsg} (code: ${response.data.errcode})`,
        );
      }

      if (!response.data.access_token) {
        this.logger.error('❌ No access_token in response:', response.data);
        throw new BadRequestException(
          'No access_token received from WeChat API',
        );
      }

      this.logger.log('✅ Successfully got WeChat access token:', {
        tokenLength: response.data.access_token.length,
        expiresIn: response.data.expires_in,
      });

      return response.data.access_token;
    } catch (error) {
      this.logger.error('❌ Failed to get WeChat public access token:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
      });

      // 提供更具体的错误信息
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        throw new InternalServerErrorException(
          'Network error: Cannot connect to WeChat API',
        );
      } else if (error.code === 'ETIMEDOUT') {
        throw new InternalServerErrorException(
          'Timeout error: WeChat API request timed out',
        );
      } else if (error.response?.status === 403) {
        throw new InternalServerErrorException(
          'Access denied: Check WeChat app credentials and IP whitelist',
        );
      } else {
        throw new InternalServerErrorException(
          `Failed to get WeChat public access token: ${error.message}`,
        );
      }
    }
  }

  /**
   * 通过openid获取用户基本信息（需要用户已关注公众号）
   */
  async getSubscriberInfo(openid: string): Promise<WechatUserInfo> {
    const accessToken = await this.getPublicAccessToken();

    try {
      const response = await axios.get(
        'https://api.weixin.qq.com/cgi-bin/user/info',
        {
          params: {
            access_token: accessToken,
            openid,
            lang: 'zh_CN',
          },
        },
      );

      if (response.data.errcode) {
        throw new BadRequestException(
          `WeChat API error: ${response.data.errmsg}`,
        );
      }

      return response.data;
    } catch (error) {
      this.logger.error('Failed to get WeChat subscriber info', error);
      throw new InternalServerErrorException(
        'Failed to get WeChat subscriber info',
      );
    }
  }

  /**
   * 创建或更新微信用户
   */
  async createOrUpdateWechatUser(wechatUserInfo: WechatUserInfo): Promise<any> {
    try {
      // 首先尝试通过openid查找用户
      let user = await this.prisma.user.findUnique({
        where: { wechatOpenId: wechatUserInfo.openid },
      });

      // 如果有unionid，也尝试通过unionid查找
      if (!user && wechatUserInfo.unionid) {
        user = await this.prisma.user.findUnique({
          where: { wechatUnionId: wechatUserInfo.unionid },
        });
      }

      const userData = {
        name:
          wechatUserInfo.nickname ||
          `微信用户_${wechatUserInfo.openid.slice(-6)}`,
        wechatOpenId: wechatUserInfo.openid,
        wechatUnionId: wechatUserInfo.unionid,
        wechatNickname: wechatUserInfo.nickname,
        wechatHeadImgUrl: wechatUserInfo.headimgurl,
        wechatSubscribed: wechatUserInfo.subscribe === 1,
        wechatSubscribeTime: wechatUserInfo.subscribe_time
          ? new Date(wechatUserInfo.subscribe_time * 1000)
          : null,
        wechatSubscribeScene: wechatUserInfo.subscribe_scene,
        wechatQrScene: wechatUserInfo.qr_scene?.toString(),
        wechatQrSceneStr: wechatUserInfo.qr_scene_str,
        wechatLanguage: wechatUserInfo.language,
        wechatProvince: wechatUserInfo.province,
        wechatCity: wechatUserInfo.city,
        wechatCountry: wechatUserInfo.country,
        wechatRemark: wechatUserInfo.remark,
        wechatGroupId: wechatUserInfo.groupid,
        wechatTagIds: wechatUserInfo.tagid_list
          ? JSON.stringify(wechatUserInfo.tagid_list)
          : null,
        isVerified: true, // 微信用户默认已验证
      };

      if (user) {
        // 更新现有用户
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: userData,
        });
      } else {
        // 创建新用户
        user = await this.prisma.user.create({
          data: userData,
        });
      }

      this.logger.log(`WeChat user created/updated: ${user.id}`);
      return user;
    } catch (error) {
      this.logger.error('Failed to create/update WeChat user', error);
      throw new InternalServerErrorException(
        'Failed to create/update WeChat user',
      );
    }
  }

  /**
   * 创建临时二维码
   */
  async createTempQrCode(
    sceneValue: string | number,
    expireSeconds: number = 604800,
  ): Promise<any> {
    this.logger.log('🔍 Creating WeChat temporary QR code...', {
      sceneValue,
      expireSeconds,
      sceneType: typeof sceneValue,
    });

    let accessToken: string;
    try {
      accessToken = await this.getPublicAccessToken();
      this.logger.log('✅ Got access token for QR code creation');
    } catch (error) {
      this.logger.error(
        '❌ Failed to get access token for QR code creation:',
        error,
      );
      throw new InternalServerErrorException(
        'Failed to get WeChat access token for QR code creation',
      );
    }

    try {
      const requestUrl = `https://api.weixin.qq.com/cgi-bin/qrcode/create?access_token=${accessToken}`;
      const requestData = {
        expire_seconds: expireSeconds,
        action_name:
          typeof sceneValue === 'string' ? 'QR_STR_SCENE' : 'QR_SCENE',
        action_info: {
          scene:
            typeof sceneValue === 'string'
              ? { scene_str: sceneValue }
              : { scene_id: sceneValue },
        },
      };

      this.logger.log('📡 Making QR code creation request:', {
        url: requestUrl.replace(accessToken, 'ACCESS_TOKEN_HIDDEN'),
        data: requestData,
      });

      const response = await axios.post(requestUrl, requestData, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      this.logger.log('📥 WeChat QR code API response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
      });

      if (response.data.errcode) {
        this.logger.error('❌ WeChat QR code API returned error:', {
          errcode: response.data.errcode,
          errmsg: response.data.errmsg,
        });

        // 特殊处理权限错误 48001
        if (response.data.errcode === 48001) {
          this.logger.warn(
            '⚠️ QR code API unauthorized (48001) - this may be due to:',
          );
          this.logger.warn(
            '   1. Using test account (测试号) which has limited API access',
          );
          this.logger.warn(
            '   2. Subscription account (订阅号) without QR code permission',
          );
          this.logger.warn(
            '   3. Interface permission not enabled in WeChat admin panel',
          );
          this.logger.warn(
            '   4. Need to upgrade to Service account (服务号) for full API access',
          );

          // 返回一个模拟的二维码响应，用于开发测试
          const mockTicket = `mock_ticket_${Date.now()}_${sceneValue}`;
          const mockQrCodeUrl = `https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=${encodeURIComponent(mockTicket)}`;

          this.logger.warn(
            '🔄 Returning mock QR code for development/testing purposes',
          );

          // 仍然保存到数据库以便状态跟踪
          const sceneKey = String(sceneValue);
          const expiresAt = new Date(Date.now() + expireSeconds * 1000);

          try {
            await this.prisma.wechatQrCode.create({
              data: {
                sceneValue: sceneKey,
                status: 'pending',
                expiresAt,
              },
            });
            this.logger.log('✅ Mock QR code saved to database');
          } catch (dbError) {
            this.logger.error(
              '❌ Failed to save mock QR code to database:',
              dbError,
            );
          }

          return {
            ticket: mockTicket,
            expire_seconds: expireSeconds,
            url: `https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=${mockTicket}`,
            qr_code_url: mockQrCodeUrl,
            is_mock: true, // 标识这是模拟的二维码
            error_info: {
              code: 48001,
              message: 'API unauthorized - using mock QR code for testing',
              suggestions: [
                'Upgrade to WeChat Service Account (服务号)',
                'Enable QR code interface in WeChat admin panel',
                'Check account type and permissions',
              ],
            },
          };
        }

        throw new BadRequestException(
          `WeChat QR code API error: ${response.data.errmsg} (code: ${response.data.errcode})`,
        );
      }

      if (!response.data.ticket) {
        this.logger.error('❌ No ticket in QR code response:', response.data);
        throw new BadRequestException(
          'No ticket received from WeChat QR code API',
        );
      }

      // 存储二维码状态到数据库
      const sceneKey = String(sceneValue);
      const expiresAt = new Date(Date.now() + expireSeconds * 1000);

      this.logger.log('💾 Saving QR code to database...', {
        sceneValue: sceneKey,
        expiresAt: expiresAt.toISOString(),
      });

      try {
        await this.prisma.wechatQrCode.create({
          data: {
            sceneValue: sceneKey,
            status: 'pending',
            expiresAt,
          },
        });
        this.logger.log('✅ QR code saved to database successfully');
      } catch (dbError) {
        this.logger.error('❌ Failed to save QR code to database:', dbError);
        // 不抛出错误，因为二维码已经创建成功
        this.logger.warn(
          '⚠️ QR code created but not saved to database, continuing...',
        );
      }

      const result = {
        ticket: response.data.ticket,
        expire_seconds: response.data.expire_seconds,
        url: response.data.url,
        qr_code_url: `https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=${encodeURIComponent(response.data.ticket)}`,
      };

      this.logger.log('✅ QR code created successfully:', {
        sceneValue: sceneKey,
        ticketLength: response.data.ticket.length,
        expiresIn: response.data.expire_seconds,
      });

      return result;
    } catch (error) {
      this.logger.error('❌ Failed to create WeChat QR code:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        stack: error.stack,
      });

      // 提供更具体的错误信息
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        throw new InternalServerErrorException(
          'Network error: Cannot connect to WeChat QR code API',
        );
      } else if (error.code === 'ETIMEDOUT') {
        throw new InternalServerErrorException(
          'Timeout error: WeChat QR code API request timed out',
        );
      } else if (error.response?.status === 403) {
        throw new InternalServerErrorException(
          'Access denied: Check WeChat app credentials and IP whitelist for QR code API',
        );
      } else if (error.response?.status === 401) {
        throw new InternalServerErrorException(
          'Unauthorized: WeChat access token may be invalid or expired',
        );
      } else {
        throw new InternalServerErrorException(
          `Failed to create WeChat QR code: ${error.message}`,
        );
      }
    }
  }

  /**
   * 创建永久二维码
   */
  async createPermanentQrCode(sceneValue: string | number): Promise<any> {
    const accessToken = await this.getPublicAccessToken();

    try {
      const response = await axios.post(
        `https://api.weixin.qq.com/cgi-bin/qrcode/create?access_token=${accessToken}`,
        {
          action_name:
            typeof sceneValue === 'string'
              ? 'QR_LIMIT_STR_SCENE'
              : 'QR_LIMIT_SCENE',
          action_info: {
            scene:
              typeof sceneValue === 'string'
                ? { scene_str: sceneValue }
                : { scene_id: sceneValue },
          },
        },
      );

      if (response.data.errcode) {
        throw new BadRequestException(
          `WeChat API error: ${response.data.errmsg}`,
        );
      }

      return {
        ticket: response.data.ticket,
        url: response.data.url,
        qr_code_url: `https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=${encodeURIComponent(response.data.ticket)}`,
      };
    } catch (error) {
      this.logger.error('Failed to create WeChat permanent QR code', error);
      throw new InternalServerErrorException(
        'Failed to create WeChat permanent QR code',
      );
    }
  }

  /**
   * 获取二维码扫描状态
   */
  async getQrCodeStatus(sceneValue: string): Promise<any> {
    this.logger.log(`Checking QR code status for scene: ${sceneValue}`);

    // 从数据库查询二维码状态
    const qrCode = await this.prisma.wechatQrCode.findUnique({
      where: { sceneValue },
    });

    if (!qrCode) {
      this.logger.warn(`QR code not found in database: ${sceneValue}`);
      throw new NotFoundException('QR code not found or expired');
    }

    // 检查是否过期
    if (new Date() > qrCode.expiresAt) {
      this.logger.warn(`QR code expired: ${sceneValue}`);
      // 删除过期的二维码
      await this.prisma.wechatQrCode.delete({
        where: { sceneValue },
      });
      throw new NotFoundException('QR code not found or expired');
    }

    this.logger.log(
      `QR code status: ${qrCode.status}, created at: ${qrCode.createdAt}`,
    );

    return {
      status: qrCode.status,
      userInfo: qrCode.userInfo,
      tokens: qrCode.tokens,
      createdAt: qrCode.createdAt,
      scannedAt: qrCode.scannedAt,
    };
  }

  /**
   * 设置二维码扫描状态
   */
  async setQrCodeScanned(
    sceneValue: string,
    userInfo: any,
    tokens?: any,
  ): Promise<void> {
    // 更新数据库中的二维码状态
    const updated = await this.prisma.wechatQrCode.updateMany({
      where: {
        sceneValue,
        status: 'pending', // 只更新待扫描状态的二维码
      },
      data: {
        status: 'scanned',
        userInfo,
        tokens,
        scannedAt: new Date(),
      },
    });

    if (updated.count > 0) {
      this.logger.log(
        `QR code ${sceneValue} marked as scanned by user ${userInfo.id}`,
      );
    } else {
      this.logger.warn(`QR code ${sceneValue} not found or already scanned`);
    }
  }

  /**
   * 微信授权登录
   */
  async wechatLogin(code: string, state?: string): Promise<any> {
    // 1. 通过code获取access_token
    const tokenResponse = await this.getAccessToken(code);

    // 2. 获取用户信息
    const userInfo = await this.getUserInfo(
      tokenResponse.access_token,
      tokenResponse.openid,
    );

    // 3. 创建或更新用户
    const user = await this.createOrUpdateWechatUser(userInfo);

    // 4. 生成JWT token
    const tokens = await this.authService.generateTokens(user);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        wechatNickname: user.wechatNickname,
        wechatHeadImgUrl: user.wechatHeadImgUrl,
      },
      ...tokens,
    };
  }
}
