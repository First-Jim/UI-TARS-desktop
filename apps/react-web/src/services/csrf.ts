import axios from 'axios';
import { API_CONFIG } from '@/config/api';

/**
 * CSRF Token 管理服务
 */
class CSRFService {
  private csrfToken: string | null = null;
  private tokenPromise: Promise<string> | null = null;

  /**
   * 从 cookie 中获取 CSRF token
   */
  private getTokenFromCookie(): string | null {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === '_csrf') {
        return decodeURIComponent(value);
      }
    }
    return null;
  }

  /**
   * 获取 CSRF token
   * 优先从 cookie 获取，如果没有则从服务器获取
   */
  async getToken(): Promise<string> {
    // 如果已经有 token，直接返回
    if (this.csrfToken) {
      return this.csrfToken;
    }

    // 尝试从 cookie 获取
    const cookieToken = this.getTokenFromCookie();
    if (cookieToken) {
      this.csrfToken = cookieToken;
      return cookieToken;
    }

    // 如果正在获取 token，等待结果
    if (this.tokenPromise) {
      return this.tokenPromise;
    }

    // 从服务器获取新的 token
    this.tokenPromise = this.fetchTokenFromServer();

    try {
      const token = await this.tokenPromise;
      this.csrfToken = token;
      return token;
    } finally {
      this.tokenPromise = null;
    }
  }

  /**
   * 从服务器获取 CSRF token
   */
  private async fetchTokenFromServer(): Promise<string> {
    try {
      const response = await axios.get(
        `${API_CONFIG.BASE_URL}/auth/csrf-token`,
        {
          withCredentials: true, // 确保发送 cookies
        },
      );
      console.log(
        '🚀 ~ CSRFService ~ fetchTokenFromServer ~ response:',
        response,
      );

      if (response.data?.csrfToken) {
        return response.data.csrfToken;
      }

      throw new Error('No CSRF token in response');
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
      throw error;
    }
  }

  /**
   * 清除缓存的 token（用于登出或 token 失效时）
   */
  clearToken(): void {
    this.csrfToken = null;
    this.tokenPromise = null;
  }

  /**
   * 为请求添加 CSRF token
   */
  async addTokenToRequest(config: any): Promise<any> {
    console.log('🔍 CSRF Service - Processing request:', {
      method: config.method,
      url: config.url,
      headers: config.headers,
    });

    const url = config.url || '';
    try {
      const token = await this.getToken();
      config.headers = config.headers || {};
      config.headers['X-CSRF-Token'] = token;
      console.log('✅ CSRF Service - Successfully added CSRF token:', {
        url,
        tokenLength: token.length,
        headers: config.headers,
      });
    } catch (error) {
      console.warn(
        '❌ CSRF Service - Failed to add CSRF token to request:',
        error,
      );
      // 不阻止请求，让服务器返回 403 错误
    }

    return config;
  }

  /**
   * 处理 CSRF token 错误
   */
  handleTokenError(error: any): boolean {
    // 检查是否是 CSRF token 相关错误
    if (
      error.response?.status === 403 &&
      (error.response?.data?.message?.includes('CSRF') ||
        error.response?.data?.message?.includes('csrf'))
    ) {
      console.log('CSRF token error detected, clearing token cache');
      this.clearToken();
      return true;
    }

    return false;
  }
}

// 导出单例实例
export const csrfService = new CSRFService();

// 导出类型定义
export type { CSRFService };
