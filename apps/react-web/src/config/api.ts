// API 配置
export const API_CONFIG = {
  // 基础 URL
  BASE_URL: import.meta.env.VITE_API_BASE_URL || '/api',

  // 环境
  ENV: import.meta.env.VITE_APP_ENV || 'development',

  // 超时时间
  TIMEOUT: 10000,

  // 是否为生产环境
  IS_PRODUCTION: import.meta.env.VITE_APP_ENV === 'production',

  // 是否为开发环境
  IS_DEVELOPMENT: import.meta.env.VITE_APP_ENV === 'development',
};

// 打印配置信息（仅开发环境）
if (API_CONFIG.IS_DEVELOPMENT) {
  console.log('🔧 API Configuration:', {
    BASE_URL: API_CONFIG.BASE_URL,
    ENV: API_CONFIG.ENV,
    IS_PRODUCTION: API_CONFIG.IS_PRODUCTION,
  });
}
