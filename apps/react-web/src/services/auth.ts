import GlobalStore from '@/store';
import http from '@/utils/http';

// 类型定义
export interface LoginDto {
  email: string;
  password: string;
}

export interface SignupDto {
  name: string;
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: number;
    name: string;
    email: string;
    isVerified: boolean;
    twoFactorEnabled: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

export interface TwoFactorResponse {
  tempToken: string;
  requiresTwoFactor: true;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  password: string;
}

export interface TwoFactorLoginDto {
  code: string;
  tempToken: string;
}

export interface TwoFactorSetupResponse {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

// Auth API 方法
export const authApi = {
  // 登录
  login: async (data: LoginDto): Promise<TokenResponse | TwoFactorResponse> => {
    const response = await http.post('/auth/login', data, {
      // 不显示详细错误对话框，只显示 message 提示
      showDetailError: false,
      // 忽略通用错误处理，让业务代码自己处理
      ignoreError: false,
    });

    // 如果是普通登录成功，保存 token 和用户信息
    if (response.access_token) {
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      GlobalStore.setUserInfo(response.user);
    }

    return response;
  },

  // 注册
  signup: async (data: SignupDto): Promise<TokenResponse> => {
    const response = await http.post('/auth/signup', data);

    // 保存 token 和用户信息
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('refresh_token', response.refresh_token);
    GlobalStore.setUserInfo(response.user);

    return response;
  },

  // 刷新 token
  refreshToken: async (refreshToken: string): Promise<TokenResponse> => {
    console.log('🔄 Refreshing access token...');

    const response = await http.post('/auth/refresh', {
      refresh_token: refreshToken,
    });

    // 更新 token
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('refresh_token', response.refresh_token);

    // 更新用户信息（如果有的话）
    if (response.user) {
      GlobalStore.setUserInfo(response.user);
    }

    console.log('✅ Token refreshed successfully');
    return response;
  },

  // 登出
  logout: async (allDevices: boolean = false): Promise<void> => {
    try {
      await http.post('/auth/logout', { all_devices: allDevices });
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      // 清除本地存储
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      GlobalStore.clearUserInfo();
    }
  },

  // 获取用户信息
  getProfile: async () => {
    const response = await http.get('/auth/profile');
    console.log('🚀 ~ getProfile: ~ response:', response);
    GlobalStore.setUserInfo(response);
    return response;
  },

  // 忘记密码
  forgotPassword: async (
    data: ForgotPasswordDto,
  ): Promise<{ message: string }> => {
    return await http.post('/auth/forgot-password', data);
  },

  // 重置密码
  resetPassword: async (
    data: ResetPasswordDto,
  ): Promise<{ message: string }> => {
    return await http.post('/auth/reset-password', data);
  },

  // 验证邮箱
  verifyEmail: async (token: string): Promise<{ message: string }> => {
    return await http.get(`/auth/verify-email?token=${token}`);
  },

  // 重发验证邮件
  resendVerification: async (email: string): Promise<{ message: string }> => {
    return await http.post('/auth/resend-verification', { email });
  },

  // 2FA 相关
  twoFactor: {
    // 生成 2FA 密钥和二维码
    generate: async (): Promise<TwoFactorSetupResponse> => {
      return await http.post('/auth/2fa/generate');
    },

    // 验证并启用 2FA
    verify: async (code: string): Promise<{ message: string }> => {
      return await http.post('/auth/2fa/verify', { code });
    },

    // 禁用 2FA
    disable: async (password: string): Promise<{ message: string }> => {
      return await http.post('/auth/2fa/disable', { password });
    },

    // 2FA 登录
    authenticate: async (data: TwoFactorLoginDto): Promise<TokenResponse> => {
      const response = await http.post('/auth/2fa/authenticate', data);

      // 保存 token 和用户信息
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      GlobalStore.setUserInfo(response.user);

      return response;
    },
  },

  // 获取 CSRF token
  getCsrfToken: async (): Promise<{ csrfToken: string }> => {
    return await http.get('/auth/csrf-token');
  },
};

// Token 管理工具函数
export const tokenUtils = {
  // 检查是否有有效的 access token
  hasValidToken: (): boolean => {
    const accessToken = localStorage.getItem('access_token');
    return !!accessToken;
  },

  // 检查是否有 refresh token
  hasRefreshToken: (): boolean => {
    const refreshToken = localStorage.getItem('refresh_token');
    return !!refreshToken;
  },

  // 获取 access token
  getAccessToken: (): string | null => {
    return localStorage.getItem('access_token');
  },

  // 获取 refresh token
  getRefreshToken: (): string | null => {
    return localStorage.getItem('refresh_token');
  },

  // 清除所有 token
  clearTokens: (): void => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    GlobalStore.clearUserInfo();
  },

  // 设置 token
  setTokens: (accessToken: string, refreshToken: string): void => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  },

  // 检查用户是否已登录
  isLoggedIn: (): boolean => {
    return tokenUtils.hasValidToken() && !!GlobalStore.userInfo?.id;
  },
};

// 兼容旧的导出
export const login = authApi.login;
export const logout = authApi.logout;
export const getUserInfo = authApi.getProfile;
