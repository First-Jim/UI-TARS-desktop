import { Injectable, Logger } from '@nestjs/common';
import { WechatService } from './wechat.service';
import { AuthService } from '../auth/auth.service';
import * as xml2js from 'xml2js';

export interface WechatMessage {
  ToUserName: string;
  FromUserName: string;
  CreateTime: string;
  MsgType: string;
  Event?: string;
  EventKey?: string;
  Ticket?: string;
  Content?: string;
  MsgId?: string;
}

@Injectable()
export class WechatEventService {
  private readonly logger = new Logger(WechatEventService.name);

  constructor(
    private readonly wechatService: WechatService,
    private readonly authService: AuthService,
  ) {}

  /**
   * 解析微信XML消息
   */
  async parseXmlMessage(xmlData: string): Promise<WechatMessage> {
    try {
      const parser = new xml2js.Parser({ explicitArray: false });
      const result = await parser.parseStringPromise(xmlData);
      return result.xml;
    } catch (error) {
      this.logger.error('Failed to parse WeChat XML message', error);
      throw error;
    }
  }

  /**
   * 处理微信事件消息
   */
  async handleEvent(message: WechatMessage): Promise<string> {
    const { Event, FromUserName, EventKey, Ticket } = message;

    this.logger.log(`Received WeChat event: ${Event} from ${FromUserName}`);

    switch (Event) {
      case 'subscribe':
        return this.handleSubscribeEvent(FromUserName, EventKey, Ticket);

      case 'unsubscribe':
        return this.handleUnsubscribeEvent(FromUserName);

      case 'SCAN':
        return this.handleScanEvent(FromUserName, EventKey, Ticket);

      case 'CLICK':
        return this.handleClickEvent(FromUserName, EventKey);

      default:
        this.logger.warn(`Unhandled WeChat event: ${Event}`);
        return 'success';
    }
  }

  /**
   * 处理用户关注事件
   */
  private async handleSubscribeEvent(
    openid: string,
    eventKey?: string,
    ticket?: string,
  ): Promise<string> {
    try {
      this.logger.log(
        `User subscribed: ${openid}, EventKey: ${eventKey}, Ticket: ${ticket}`,
      );

      // 获取用户信息
      const userInfo = await this.wechatService.getSubscriberInfo(openid);

      // 创建或更新用户
      await this.wechatService.createOrUpdateWechatUser(userInfo);

      // 如果是扫码关注，记录扫码场景
      if (eventKey && eventKey.startsWith('qrscene_')) {
        const sceneValue = eventKey.replace('qrscene_', '');
        this.logger.log(`User subscribed via QR code, scene: ${sceneValue}`);

        // 如果是登录场景，生成token并更新二维码状态
        if (sceneValue.startsWith('login_')) {
          try {
            // 创建或更新用户
            const user =
              await this.wechatService.createOrUpdateWechatUser(userInfo);

            // 生成JWT token
            const tokens = await this.authService.generateTokens(user);

            // 更新二维码状态
            await this.wechatService.setQrCodeScanned(
              sceneValue,
              {
                id: user.id,
                name: user.name,
                email: user.email,
                wechatNickname: user.wechatNickname,
                wechatHeadImgUrl: user.wechatHeadImgUrl,
              },
              tokens,
            );

            this.logger.log(
              `Login QR code ${sceneValue} processed for user ${user.id}`,
            );
          } catch (error) {
            this.logger.error(
              `Failed to process login QR code ${sceneValue}`,
              error,
            );
          }
        }
      }

      // 返回欢迎消息
      return this.createTextResponse(
        userInfo.openid,
        openid,
        '欢迎关注我们的公众号！感谢您的支持！',
      );
    } catch (error) {
      this.logger.error('Failed to handle subscribe event', error);
      return 'success';
    }
  }

  /**
   * 处理用户取消关注事件
   */
  private async handleUnsubscribeEvent(openid: string): Promise<string> {
    try {
      this.logger.log(`User unsubscribed: ${openid}`);

      // 更新用户订阅状态
      await this.wechatService.createOrUpdateWechatUser({
        openid,
        subscribe: 0,
      });

      return 'success';
    } catch (error) {
      this.logger.error('Failed to handle unsubscribe event', error);
      return 'success';
    }
  }

  /**
   * 处理扫码事件（已关注用户扫码）
   */
  private async handleScanEvent(
    openid: string,
    eventKey?: string,
    ticket?: string,
  ): Promise<string> {
    try {
      this.logger.log(
        `User scanned QR code: ${openid}, EventKey: ${eventKey}, Ticket: ${ticket}`,
      );

      // 如果是登录场景，处理登录逻辑
      if (eventKey && eventKey.startsWith('login_')) {
        try {
          // 获取用户信息
          const userInfo = await this.wechatService.getSubscriberInfo(openid);

          // 创建或更新用户
          const user =
            await this.wechatService.createOrUpdateWechatUser(userInfo);

          // 生成JWT token
          const tokens = await this.authService.generateTokens(user);

          // 更新二维码状态
          await this.wechatService.setQrCodeScanned(
            eventKey,
            {
              id: user.id,
              name: user.name,
              email: user.email,
              wechatNickname: user.wechatNickname,
              wechatHeadImgUrl: user.wechatHeadImgUrl,
            },
            tokens,
          );

          this.logger.log(
            `Login QR code ${eventKey} processed for existing user ${user.id}`,
          );

          return this.createTextResponse(
            openid,
            openid,
            '登录成功！您可以关闭此页面。',
          );
        } catch (error) {
          this.logger.error(
            `Failed to process login QR code ${eventKey} for existing user`,
            error,
          );
          return this.createTextResponse(openid, openid, '登录失败，请重试。');
        }
      }

      // 其他场景的处理逻辑
      return this.createTextResponse(openid, openid, '扫码成功！');
    } catch (error) {
      this.logger.error('Failed to handle scan event', error);
      return 'success';
    }
  }

  /**
   * 处理菜单点击事件
   */
  private async handleClickEvent(
    openid: string,
    eventKey?: string,
  ): Promise<string> {
    try {
      this.logger.log(`User clicked menu: ${openid}, EventKey: ${eventKey}`);

      // 根据不同的菜单key执行不同的业务逻辑
      switch (eventKey) {
        case 'MENU_LOGIN':
          return this.createTextResponse(
            openid,
            openid,
            '请点击链接进行登录：' +
              this.wechatService.getAuthUrl('snsapi_userinfo', 'menu_login'),
          );

        default:
          return this.createTextResponse(openid, openid, '感谢您的操作！');
      }
    } catch (error) {
      this.logger.error('Failed to handle click event', error);
      return 'success';
    }
  }

  /**
   * 处理文本消息
   */
  async handleTextMessage(message: WechatMessage): Promise<string> {
    const { FromUserName, Content } = message;

    this.logger.log(`Received text message from ${FromUserName}: ${Content}`);

    // 简单的自动回复逻辑
    let replyContent = '感谢您的消息！';

    if (Content?.includes('登录')) {
      replyContent =
        '请点击链接进行登录：' +
        this.wechatService.getAuthUrl('snsapi_userinfo', 'text_login');
    } else if (Content?.includes('帮助')) {
      replyContent = '您可以发送"登录"获取登录链接，或者通过菜单进行操作。';
    }

    return this.createTextResponse(
      message.ToUserName,
      FromUserName,
      replyContent,
    );
  }

  /**
   * 创建文本回复消息
   */
  private createTextResponse(
    fromUser: string,
    toUser: string,
    content: string,
  ): string {
    const timestamp = Math.floor(Date.now() / 1000);

    return `<xml>
      <ToUserName><![CDATA[${toUser}]]></ToUserName>
      <FromUserName><![CDATA[${fromUser}]]></FromUserName>
      <CreateTime>${timestamp}</CreateTime>
      <MsgType><![CDATA[text]]></MsgType>
      <Content><![CDATA[${content}]]></Content>
    </xml>`;
  }

  /**
   * 公共方法：模拟扫码事件（用于测试）
   */
  async simulateScanEvent(openid: string, sceneValue: string): Promise<void> {
    this.logger.log(
      `Simulating scan event for openid: ${openid}, sceneValue: ${sceneValue}`,
    );

    try {
      // 检查是否是登录二维码
      if (sceneValue.startsWith('login_')) {
        // 模拟用户信息
        const mockUserInfo = {
          openid,
          nickname: '测试用户',
          headimgurl: 'https://via.placeholder.com/100',
          sex: 1,
          city: '北京',
          province: '北京',
          country: '中国',
          unionid: `union_${openid}`,
        };

        // 创建或更新用户
        const user =
          await this.wechatService.createOrUpdateWechatUser(mockUserInfo);

        // 生成JWT token
        const tokens = await this.authService.generateTokens(user);

        // 更新二维码状态
        await this.wechatService.setQrCodeScanned(
          sceneValue,
          {
            id: user.id,
            name: user.name,
            email: user.email,
            wechatNickname: user.wechatNickname,
            wechatHeadImgUrl: user.wechatHeadImgUrl,
          },
          tokens,
        );

        this.logger.log(
          `Simulated login QR code ${sceneValue} processed for user ${user.id}`,
        );
      } else {
        // 其他类型的二维码，直接标记为已扫描
        await this.wechatService.setQrCodeScanned(sceneValue, { openid }, null);
        this.logger.log(`Simulated QR code ${sceneValue} marked as scanned`);
      }
    } catch (error) {
      this.logger.error('Failed to simulate scan event', error);
      throw error;
    }
  }

  /**
   * 处理微信消息的主入口
   */
  async processMessage(xmlData: string): Promise<string> {
    try {
      const message = await this.parseXmlMessage(xmlData);

      switch (message.MsgType) {
        case 'event':
          return this.handleEvent(message);

        case 'text':
          return this.handleTextMessage(message);

        default:
          this.logger.warn(`Unhandled message type: ${message.MsgType}`);
          return 'success';
      }
    } catch (error) {
      this.logger.error('Failed to process WeChat message', error);
      return 'success';
    }
  }
}
