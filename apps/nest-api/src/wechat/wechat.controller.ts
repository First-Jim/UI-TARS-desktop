import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Res,
  Req,
  HttpStatus,
  Logger,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { WechatService } from './wechat.service';
import { WechatEventService } from './wechat-event.service';
import { WechatAuthDto, WechatCallbackDto } from './dto/wechat.dto';

@ApiTags('WeChat')
@Controller('wechat')
export class WechatController {
  private readonly logger = new Logger(WechatController.name);

  constructor(
    private readonly wechatService: WechatService,
    private readonly wechatEventService: WechatEventService,
  ) {}

  /**
   * 调试端点 - 检查微信配置
   */
  @Get('debug/config')
  @ApiOperation({ summary: 'Debug WeChat configuration' })
  debugConfig() {
    return {
      hasAppId: !!process.env.WECHAT_APP_ID,
      hasAppSecret: !!process.env.WECHAT_APP_SECRET,
      hasToken: !!process.env.WECHAT_TOKEN,
      appIdLength: process.env.WECHAT_APP_ID?.length || 0,
      tokenLength: process.env.WECHAT_TOKEN?.length || 0,
      // 只显示 token 的前3位和后3位，用于调试
      tokenPreview: process.env.WECHAT_TOKEN
        ? `${process.env.WECHAT_TOKEN}...${process.env.WECHAT_TOKEN.substring(process.env.WECHAT_TOKEN.length - 3)}`
        : 'NOT_SET',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 获取服务器IP地址 - 用于设置微信IP白名单
   */
  @Get('debug/ip')
  @ApiOperation({ summary: 'Get server IP address for WeChat whitelist' })
  async getServerIP() {
    try {
      const axios = require('axios');

      const ipServices = [
        {
          name: 'ipify',
          url: 'https://api.ipify.org?format=json',
          field: 'ip',
        },
        { name: 'httpbin', url: 'https://httpbin.org/ip', field: 'origin' },
        { name: 'ipapi', url: 'https://ipapi.co/json/', field: 'ip' },
      ];

      const results = [];
      const uniqueIPs = new Set();

      for (const service of ipServices) {
        try {
          const response = await axios.get(service.url, { timeout: 3000 });
          const ip = response.data[service.field];
          if (ip) {
            uniqueIPs.add(ip);
            results.push({
              service: service.name,
              ip: ip,
              success: true,
            });
          }
        } catch (error) {
          results.push({
            service: service.name,
            error: error.message,
            success: false,
          });
        }
      }

      const ipArray = Array.from(uniqueIPs);

      return {
        success: true,
        message: 'Server outbound IP addresses detected',
        outboundIPs: ipArray,
        allResults: results,
        instructions: {
          step1: 'Copy the IP addresses below',
          step2:
            'Go to WeChat Public Platform → Development → Basic Configuration',
          step3: 'Find "IP Whitelist" section',
          step4: 'Add these IP addresses to the whitelist',
          step5: 'Save the configuration',
        },
        ipsToCopy: ipArray.join('\n'),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to get server IP:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 微信服务器验证接口
   */
  @Get('verify')
  @ApiOperation({ summary: 'WeChat server verification' })
  @ApiQuery({ name: 'signature', description: 'WeChat signature' })
  @ApiQuery({ name: 'timestamp', description: 'Timestamp' })
  @ApiQuery({ name: 'nonce', description: 'Random nonce' })
  @ApiQuery({ name: 'echostr', description: 'Echo string' })
  verifyServer(
    @Query('signature') signature: string,
    @Query('timestamp') timestamp: string,
    @Query('nonce') nonce: string,
    @Query('echostr') echostr: string,
    @Res() res: Response,
  ) {
    if (!signature || !timestamp || !nonce || !echostr) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .send('Missing required parameters');
    }

    const isValid = this.wechatService.verifySignature(
      signature,
      timestamp,
      nonce,
    );

    if (isValid) {
      this.logger.log('WeChat server verification successful');
      return res.status(HttpStatus.OK).send(echostr);
    } else {
      this.logger.warn('WeChat server verification failed');
      return res.status(HttpStatus.FORBIDDEN).send('Verification failed');
    }
  }

  /**
   * 获取微信授权URL
   */
  @Get('auth-url')
  @ApiOperation({ summary: 'Get WeChat OAuth authorization URL' })
  @ApiResponse({ status: 200, description: 'Returns authorization URL' })
  getAuthUrl(@Query() query: WechatAuthDto) {
    const { scope = 'snsapi_userinfo', state } = query;

    const authUrl = this.wechatService.getAuthUrl(scope, state);

    return {
      success: true,
      data: {
        authUrl,
        scope,
        state,
      },
    };
  }

  /**
   * 微信授权回调处理
   */
  @Get('callback')
  @ApiOperation({ summary: 'WeChat OAuth callback handler' })
  @ApiResponse({ status: 200, description: 'Returns user info and tokens' })
  async handleCallback(@Query() query: WechatCallbackDto) {
    const { code, state } = query;

    if (!code) {
      throw new BadRequestException('Authorization code is required');
    }

    try {
      const result = await this.wechatService.wechatLogin(code, state);

      return {
        success: true,
        message: 'WeChat login successful',
        data: result,
      };
    } catch (error) {
      this.logger.error('WeChat callback error:', error);
      throw error;
    }
  }

  /**
   * 微信授权登录（POST方式）
   */
  @Post('login')
  @ApiOperation({ summary: 'WeChat OAuth login' })
  @ApiResponse({ status: 200, description: 'Returns user info and tokens' })
  async wechatLogin(@Body() body: WechatCallbackDto) {
    const { code, state } = body;

    if (!code) {
      throw new BadRequestException('Authorization code is required');
    }

    try {
      const result = await this.wechatService.wechatLogin(code, state);

      return {
        success: true,
        message: 'WeChat login successful',
        data: result,
      };
    } catch (error) {
      this.logger.error('WeChat login error:', error);
      throw error;
    }
  }

  /**
   * 获取用户微信信息（需要已关注公众号）
   */
  @Get('user-info')
  @ApiOperation({ summary: 'Get WeChat subscriber info by openid' })
  @ApiQuery({ name: 'openid', description: 'WeChat OpenID' })
  @ApiResponse({ status: 200, description: 'Returns WeChat user info' })
  async getUserInfo(@Query('openid') openid: string) {
    if (!openid) {
      throw new BadRequestException('OpenID is required');
    }

    try {
      const userInfo = await this.wechatService.getSubscriberInfo(openid);

      return {
        success: true,
        data: userInfo,
      };
    } catch (error) {
      this.logger.error('Get WeChat user info error:', error);
      throw error;
    }
  }

  /**
   * 创建临时二维码（个人订阅号适配版本）
   */
  @Post('qr-code/temp')
  @ApiOperation({
    summary: 'Create temporary QR code (Personal Subscription Account)',
    description:
      'Creates QR code for personal subscription account with fallback for API limitations',
  })
  @ApiResponse({
    status: 200,
    description:
      'Returns QR code info with personal subscription account adaptations',
  })
  async createTempQrCode(
    @Body() body: { sceneValue: string | number; expireSeconds?: number },
  ) {
    const { sceneValue, expireSeconds = 300 } = body; // 默认5分钟，适合登录场景

    this.logger.log('🔍 Creating QR code for personal subscription account:', {
      sceneValue,
      expireSeconds,
      accountType: 'Personal Subscription',
    });

    try {
      const qrCodeInfo = await this.wechatService.createTempQrCode(
        sceneValue,
        expireSeconds,
      );

      // 全局拦截器会自动包装成统一格式
      return qrCodeInfo;
    } catch (error) {
      this.logger.error('Create temp QR code error:', error);

      // 为个人订阅号提供友好的错误信息
      if (
        error.message?.includes('48001') ||
        error.message?.includes('unauthorized')
      ) {
        // 抛出自定义异常，让异常过滤器处理
        throw new BadRequestException({
          message: '个人订阅号不支持二维码 API，建议升级为企业服务号',
          error: 'API_UNAUTHORIZED',
          suggestions: [
            '升级为企业认证的服务号以获得完整 API 权限',
            '使用公众号关注二维码作为替代方案',
            '通过菜单引导用户进行登录验证',
          ],
          fallback: {
            type: 'subscription_qr',
            description: '使用公众号关注二维码',
            url: `https://mp.weixin.qq.com/mp/qrcode?scene=${encodeURIComponent(String(sceneValue))}&size=L`,
          },
        });
      }

      throw error;
    }
  }

  /**
   * 创建永久二维码
   */
  @Post('qr-code/permanent')
  @ApiOperation({ summary: 'Create permanent QR code' })
  @ApiResponse({ status: 200, description: 'Returns QR code info' })
  async createPermanentQrCode(@Body() body: { sceneValue: string | number }) {
    const { sceneValue } = body;

    try {
      const qrCodeInfo =
        await this.wechatService.createPermanentQrCode(sceneValue);

      return qrCodeInfo;
    } catch (error) {
      this.logger.error('Create permanent QR code error:', error);
      throw error;
    }
  }

  /**
   * 查询二维码扫描状态
   */
  @Get('qr-code/status')
  @ApiOperation({ summary: 'Check QR code scan status' })
  @ApiQuery({ name: 'sceneValue', description: 'QR code scene value' })
  @ApiResponse({ status: 200, description: 'Returns QR code scan status' })
  async checkQrCodeStatus(@Query('sceneValue') sceneValue: string) {
    if (!sceneValue) {
      throw new BadRequestException('Scene value is required');
    }

    try {
      const status = await this.wechatService.getQrCodeStatus(sceneValue);
      return status;
    } catch (error) {
      this.logger.error('Check QR code status error:', error);

      // 如果是二维码不存在或过期，返回正常的业务状态
      if (error instanceof NotFoundException) {
        return {
          status: 'expired',
          message: 'QR code not found or expired',
        };
      }

      // 其他错误仍然抛出
      throw error;
    }
  }

  /**
   * 微信 Webhook 统一处理接口
   * GET 请求：处理微信服务器验证（带 echostr 参数）
   * POST 请求：处理微信消息推送（XML 消息体）
   *
   * 参考文档：https://developers.weixin.qq.com/doc/oplatform/Website_App/WeChat_Login/message_push.html
   */
  @Get('webhook')
  @Post('webhook')
  @ApiOperation({
    summary: 'WeChat webhook unified handler',
    description:
      'Handles both WeChat server verification (GET) and message push (POST)',
  })
  @ApiQuery({
    name: 'signature',
    required: false,
    description: 'WeChat signature',
  })
  @ApiQuery({
    name: 'timestamp',
    required: false,
    description: 'WeChat timestamp',
  })
  @ApiQuery({ name: 'nonce', required: false, description: 'WeChat nonce' })
  @ApiQuery({
    name: 'echostr',
    required: false,
    description: 'WeChat echostr for verification',
  })
  async handleWebhook(
    @Query() query: any,
    @Body() body: any,
    @Res() res: Response,
    @Req() req: any,
  ) {
    const startTime = Date.now();
    const method = req.method;

    this.logger.log(`🔔 WeChat Webhook ${method} Request Started`);
    this.logger.log(`📅 Time: ${new Date().toISOString()}`);
    this.logger.log(`🌐 URL: ${req.url}`);
    this.logger.log(`👤 User-Agent: ${req.headers['user-agent'] || 'Unknown'}`);

    // 提取查询参数
    const { signature, timestamp, nonce, echostr } = query;

    // 处理 GET 请求（微信服务器验证）
    if (method === 'GET') {
      this.logger.log('🔍 Processing WeChat server verification (GET request)');

      // 验证必需参数
      if (!signature || !timestamp || !nonce || !echostr) {
        const missing = [];
        if (!signature) missing.push('signature');
        if (!timestamp) missing.push('timestamp');
        if (!nonce) missing.push('nonce');
        if (!echostr) missing.push('echostr');

        this.logger.error(
          `❌ Missing required parameters: ${missing.join(', ')}`,
        );
        return res.status(400).send('Bad Request');
      }

      // 验证签名
      try {
        const isValid = this.wechatService.verifySignature(
          signature,
          timestamp,
          nonce,
        );
        const duration = Date.now() - startTime;

        if (!isValid) {
          this.logger.warn(`❌ Signature verification failed (${duration}ms)`);
          return res.status(403).send('Forbidden');
        }

        this.logger.log(`✅ WeChat verification successful (${duration}ms)`);
        this.logger.log(`📤 Returning echostr: "${echostr}"`);

        // 按照微信官方文档要求：原样返回 echostr 参数内容
        res.set({
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
        });

        return res.status(200).send(echostr);
      } catch (error) {
        const duration = Date.now() - startTime;
        this.logger.error(
          `❌ Verification error (${duration}ms):`,
          error.message,
        );
        return res.status(500).send('Internal Server Error');
      }
    }

    // 处理 POST 请求（消息推送）
    if (method === 'POST') {
      this.logger.log('📨 Processing WeChat message push (POST request)');

      // 验证必需参数
      if (!signature || !timestamp || !nonce) {
        this.logger.error('❌ Missing required parameters for message push');
        return res.send('fail');
      }

      // 验证签名
      try {
        const isValid = this.wechatService.verifySignature(
          signature,
          timestamp,
          nonce,
        );

        if (!isValid) {
          this.logger.warn('❌ Message push signature verification failed');
          return res.send('fail');
        }

        // 处理微信消息/事件
        const response = await this.wechatEventService.processMessage(body);
        const duration = Date.now() - startTime;

        this.logger.log(`✅ Message processed successfully (${duration}ms)`);

        // 设置正确的 Content-Type
        if (response && response.startsWith('<xml>')) {
          res.set('Content-Type', 'application/xml; charset=utf-8');
        } else {
          res.set('Content-Type', 'text/plain; charset=utf-8');
        }

        return res.send(response || 'success');
      } catch (error) {
        const duration = Date.now() - startTime;
        this.logger.error(
          `❌ Message processing error (${duration}ms):`,
          error,
        );
        return res.send('fail');
      }
    }

    // 处理 POST 请求（消息推送）
    if (method === 'POST') {
      this.logger.log('📨 Processing WeChat message push');

      try {
        // 处理微信消息/事件
        const response = await this.wechatEventService.processMessage(body);

        // 设置正确的 Content-Type
        if (response && response.startsWith('<xml>')) {
          res.set('Content-Type', 'application/xml');
        }

        this.logger.log('✅ WeChat message processed successfully');
        this.logger.log('Response:', response);
        return res.send(response || 'success');
      } catch (error) {
        this.logger.error('❌ Error processing WeChat message:', error);
        return res.send('fail');
      }
    }

    // 不应该到达这里
    this.logger.error('❌ Unsupported HTTP method:', method);
    return res.status(HttpStatus.METHOD_NOT_ALLOWED).send('Method not allowed');
  }

  /**
   * 测试接口：模拟微信扫码事件（仅开发环境使用）
   */
  @Post('test/scan-event')
  @ApiOperation({ summary: 'Simulate WeChat scan event for testing' })
  async simulateScanEvent(
    @Body() body: { sceneValue: string; openid?: string },
  ) {
    if (process.env.NODE_ENV === 'production') {
      throw new BadRequestException(
        'This endpoint is only available in development',
      );
    }

    const { sceneValue, openid = 'test_openid_123' } = body;

    try {
      // 模拟已关注用户扫码事件
      await this.wechatEventService.simulateScanEvent(openid, sceneValue);

      return {
        success: true,
        message: 'Scan event simulated successfully',
        data: { sceneValue, openid },
      };
    } catch (error) {
      this.logger.error('Failed to simulate scan event', error);
      throw new InternalServerErrorException('Failed to simulate scan event');
    }
  }
}
