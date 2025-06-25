import http from '@/utils/http';
import GlobalStore from '@/store';

// 微信二维码相关接口
export interface QrCodeResponse {
  success: boolean;
  data: {
    ticket: string;
    expire_seconds: number;
    url: string;
    qr_code_url: string;
  };
}

// 微信用户信息接口
export interface WechatUserInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
  wechatNickname: string;
  wechatHeadImgUrl: string;
  wechatOpenid: string;
  wechatUnionid?: string;
}

// 微信登录响应接口
export interface WechatLoginResponse {
  success: boolean;
  message: string;
  data: {
    user: WechatUserInfo;
    access_token: string;
    refresh_token: string;
  };
}

/**
 * 创建临时二维码（个人订阅号适配版本）
 * @param sceneValue 场景值，用于标识不同的二维码用途
 * @param expireSeconds 过期时间（秒），默认5分钟（适合登录场景）
 */
export const createTempQrCode = async (
  sceneValue?: string,
  expireSeconds: number = 300,
): Promise<any> => {
  const scene = sceneValue || `login_${Date.now()}`;

  console.log('🔍 Creating WeChat QR code for personal subscription account:', {
    sceneValue: scene,
    expireSeconds,
  });

  try {
    const response = await http.post('/wechat/qr-code/temp', {
      sceneValue: scene,
      expireSeconds,
    });

    console.log('📥 QR code creation response:', response);

    // 检查是否是个人订阅号的模拟响应
    if (response?.is_mock || response?.is_personal_subscription) {
      console.warn(
        '⚠️ Personal subscription account detected, using adapted response',
      );

      return {
        ...response,
        scene_value: scene,
        personal_subscription_guide: {
          title: '个人订阅号登录指南',
          description: '由于个人订阅号API限制，请按以下步骤完成登录：',
          steps: [
            '1. 扫描下方二维码关注公众号',
            '2. 关注后发送任意消息（如"登录"）',
            '3. 系统将自动识别并完成登录',
            '4. 返回此页面查看登录状态',
          ],
          tips: [
            '如果已关注公众号，直接发送消息即可',
            '登录通常在几秒内完成',
            '如有问题请重新发送消息',
          ],
        },
      };
    }

    return response;
  } catch (error: any) {
    console.error('❌ 创建微信二维码失败:', error);

    // 检查是否是个人订阅号API权限问题
    const errorData = error.response?.data;
    if (
      errorData?.error === 'API_UNAUTHORIZED' ||
      error.message?.includes('48001') ||
      error.message?.includes('unauthorized')
    ) {
      console.warn('⚠️ Personal subscription account API limitation detected');

      // 返回个人订阅号的替代方案
      return {
        is_personal_subscription: true,
        scene_value: scene,
        expire_seconds: expireSeconds,
        qr_code_url: `https://mp.weixin.qq.com/mp/qrcode?scene=${encodeURIComponent(scene)}&size=L`,
        personal_subscription_guide: {
          title: '个人订阅号登录方案',
          description: '检测到个人订阅号API限制，请使用以下方式登录：',
          steps: [
            '扫描下方二维码关注公众号',
            '关注成功后发送任意消息',
            '系统自动识别并完成登录',
            '返回此页面查看登录状态',
          ],
          alternative: '也可以直接在微信中搜索公众号名称进行关注',
          note: '个人订阅号无法使用高级API，但仍可通过消息推送实现登录功能',
        },
      };
    }

    throw error;
  }
};

/**
 * 创建永久二维码
 * @param sceneValue 场景值
 */
export const createPermanentQrCode = async (
  sceneValue: string,
): Promise<QrCodeResponse> => {
  return await http.post('/wechat/qr-code/permanent', {
    sceneValue,
  });
};

/**
 * 获取微信授权URL
 * @param scope 授权作用域
 * @param state 状态参数
 */
export const getAuthUrl = async (
  scope: 'snsapi_base' | 'snsapi_userinfo' = 'snsapi_userinfo',
  state?: string,
) => {
  return await http.get('/wechat/auth-url', {
    params: { scope, state },
  });
};

/**
 * 微信授权登录
 * @param code 微信授权码
 * @param state 状态参数
 */
export const wechatLogin = async (
  code: string,
  state?: string,
): Promise<WechatLoginResponse> => {
  return await http.post('/wechat/login', {
    code,
    state,
  });
};

/**
 * 获取微信用户信息（通过openid）
 * @param openid 微信openid
 */
export const getWechatUserInfo = async (openid: string) => {
  return await http.get('/wechat/user-info', {
    params: { openid },
  });
};

/**
 * 检查二维码扫描状态
 * 通过场景值检查是否有用户扫码登录
 * @param sceneValue 二维码场景值
 */
export const checkQrCodeStatus = async (sceneValue: string) => {
  return await http.get('/wechat/qr-code/status', {
    params: { sceneValue },
  });
};

/**
 * 模拟扫码事件（仅开发环境使用）
 * @param sceneValue 二维码场景值
 * @param openid 模拟的用户openid
 */
export const simulateScanEvent = async (
  sceneValue: string,
  openid?: string,
) => {
  return await http.post('/wechat/test/scan-event', {
    sceneValue,
    openid: openid || 'test_user_openid_123',
  });
};

/**
 * 获取当前用户信息
 */
export const getUserInfo = async () => {
  return await http.get('/auth/profile');
};

/**
 * 轮询检查二维码扫描状态
 * 这个函数会持续检查用户是否已经扫码并完成登录
 * @param sceneValue 二维码场景值
 * @param onSuccess 登录成功回调
 * @param onError 错误回调
 * @param interval 轮询间隔（毫秒），默认2秒
 * @param maxAttempts 最大尝试次数，默认150次（5分钟）
 */
export const pollQrCodeStatus = (
  sceneValue: string,
  onSuccess: (userInfo: WechatUserInfo) => void,
  onError: (error: any) => void,
  interval: number = 2000,
  maxAttempts: number = 150,
) => {
  let attempts = 0;

  const poll = async () => {
    try {
      attempts++;

      // 检查是否超过最大尝试次数
      if (attempts > maxAttempts) {
        onError(new Error('二维码已过期，请重新获取'));
        return;
      }

      // 检查二维码扫描状态
      const result = await checkQrCodeStatus(sceneValue);

      if (result) {
        const { status, userInfo, tokens } = result;

        if (status === 'scanned' && userInfo) {
          // 扫码成功，保存token和用户信息
          if (tokens?.access_token) {
            localStorage.setItem('access_token', tokens.access_token);
          }
          if (tokens?.refresh_token) {
            localStorage.setItem('refresh_token', tokens.refresh_token);
          }

          // 更新全局状态
          GlobalStore.setUserInfo(userInfo);
          onSuccess(userInfo);
          return;
        } else if (status === 'expired') {
          // 二维码过期或不存在，继续轮询
          setTimeout(poll, interval);
          return;
        }
        // status === 'pending' 或其他状态，继续轮询
      }

      // 继续轮询
      setTimeout(poll, interval);
    } catch (error: any) {
      // 网络错误或其他异常，停止轮询
      console.error('轮询检查二维码状态失败:', error);
      onError(error);
    }
  };

  // 开始轮询
  poll();
};

/**
 * 处理微信授权回调
 * 通常在微信授权页面跳转回来时调用
 */
export const handleWechatCallback = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');

  if (!code) {
    throw new Error('未获取到微信授权码');
  }

  try {
    const result = await wechatLogin(code, state || undefined);

    if (result?.user) {
      // 保存用户信息到全局状态
      GlobalStore.setUserInfo(result.user);

      // 保存token到localStorage或cookie
      if (result.access_token) {
        localStorage.setItem('access_token', result.access_token);
      }
      if (result.refresh_token) {
        localStorage.setItem('refresh_token', result.refresh_token);
      }

      return result.user;
    } else {
      throw new Error('微信登录失败');
    }
  } catch (error) {
    console.error('微信登录处理失败:', error);
    throw error;
  }
};
