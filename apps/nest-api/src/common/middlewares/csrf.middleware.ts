import * as csurf from 'csurf';
import { RequestHandler } from 'express';

// 创建 CSRF 保护中间件，排除不需要保护的公开端点
export const csrfMiddleware: RequestHandler = (req, res, next) => {
  const path = req.path || req.url;

  console.log('🔍 CSRF Middleware - Processing request:', {
    method: req.method,
    path: path,
    url: req.url,
    headers: {
      'x-csrf-token': req.headers['x-csrf-token'],
      'csrf-token': req.headers['csrf-token'],
    },
  });

  // 排除不需要 CSRF 保护的公开端点
  const publicEndpoints = [
    '/api/auth/login', // 用户登录
    '/api/auth/signup', // 用户注册
    '/api/auth/forgot-password', // 忘记密码
    '/api/auth/reset-password', // 重置密码
    '/api/auth/verify-email', // 邮箱验证
    '/api/wechat/qr-code/', // 微信二维码相关（创建、查询状态）
    '/api/wechat/login', // 微信登录
    '/api/wechat/callback', // 微信回调
    '/api/wechat/webhook', // 微信 webhook
    '/api/wechat/verify', // 微信服务器验证
    '/api/wechat/auth-url', // 微信授权 URL
    '/health', // 健康检查
    '/docs', // API 文档
  ];

  // 检查是否是公开端点 - 使用更精确的匹配
  let isPublicEndpoint = false;
  let matchedEndpoint = '';

  for (const endpoint of publicEndpoints) {
    const matches = path.includes(endpoint);
    console.log(
      `🔍 CSRF Middleware - Checking endpoint "${endpoint}" against "${path}": ${matches}`,
    );
    if (matches) {
      isPublicEndpoint = true;
      matchedEndpoint = endpoint;
      break;
    }
  }

  // 特别处理微信二维码相关的路径
  if (
    path.includes('/wechat/qr-code/') ||
    path.includes('/api/wechat/qr-code/')
  ) {
    console.log(
      '✅ CSRF Middleware - Special handling for WeChat QR code endpoint:',
      path,
    );
    isPublicEndpoint = true;
    matchedEndpoint = 'wechat-qr-code';
  }

  if (isPublicEndpoint) {
    console.log(
      '✅ CSRF Middleware - Skipping CSRF protection for public endpoint:',
      {
        path,
        matchedEndpoint,
      },
    );
    return next();
  }

  console.log('🔒 CSRF Middleware - Applying CSRF protection for:', path);

  // 对需要保护的端点应用 CSRF 保护
  const csrfProtection = csurf({
    cookie: {
      httpOnly: false, // 允许前端 JavaScript 读取 cookie 中的 token
      secure: process.env.NODE_ENV === 'production', // 生产环境使用 HTTPS
      sameSite: 'strict', // 防止 CSRF 攻击
    },
    ignoreMethods: ['GET', 'HEAD', 'OPTIONS'], // 这些方法不需要 CSRF 保护
    value: (req) => {
      // 优先从 header 中获取 token，然后从 body 中获取
      return (
        req.headers['x-csrf-token'] ||
        req.headers['csrf-token'] ||
        req.body._csrf
      );
    },
  });

  return csrfProtection(req, res, next);
};
