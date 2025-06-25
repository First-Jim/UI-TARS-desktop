import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Environment
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  // Server
  PORT: Joi.number().default(3000),
  API_PREFIX: Joi.string()
    .default('api')
    .description('Global API prefix for all routes'),

  // Database
  DATABASE_URL: Joi.string().required(),

  // JWT Authentication
  JWT_SECRET: Joi.string()
    .required()
    .min(32)
    .description('JWT secret key - should be at least 32 characters long'),
  JWT_ACCESS_EXPIRATION: Joi.string()
    .default('15m')
    .description('JWT access token expiration (e.g., 15m, 1h)'),
  JWT_REFRESH_EXPIRATION: Joi.string()
    .default('7d')
    .description('JWT refresh token expiration (e.g., 7d, 30d)'),

  // WeChat Configuration
  WECHAT_APP_ID: Joi.string()
    .allow('')
    .optional()
    .description('WeChat Official Account App ID'),
  WECHAT_APP_SECRET: Joi.string()
    .allow('')
    .optional()
    .description('WeChat Official Account App Secret'),
  WECHAT_TOKEN: Joi.string()
    .allow('')
    .optional()
    .description('WeChat Official Account Token for webhook verification'),
  WECHAT_ENCODING_AES_KEY: Joi.string()
    .allow('')
    .optional()
    .description(
      'WeChat Official Account EncodingAESKey for message encryption',
    ),
  WECHAT_REDIRECT_URI: Joi.string()
    .allow('')
    .optional()
    .description('WeChat OAuth redirect URI'),

  // Email (for verification)
  EMAIL_HOST: Joi.string().allow('').optional(),
  EMAIL_PORT: Joi.number().allow('').optional(),
  EMAIL_USER: Joi.string().allow('').optional(),
  EMAIL_PASSWORD: Joi.string().allow('').optional(),
  // .when('NODE_ENV', { is: 'production', then: Joi.empty() }),
  // EMAIL_FROM: Joi.string()
  //   .when('NODE_ENV', { is: 'production', then: Joi.required() }),
  EMAIL_FROM: Joi.string().allow('').optional(),
  FRONTEND_URL: Joi.string()
    .default('http://localhost:3000')
    .description('Frontend URL for email verification links'),

  // Rate limiting
  THROTTLE_TTL: Joi.number()
    .default(60)
    .description('Rate limit window in seconds'),
  THROTTLE_LIMIT: Joi.number()
    .default(10)
    .description('Maximum requests per TTL window'),

  // Security
  BCRYPT_SALT_ROUNDS: Joi.number()
    .default(10)
    .description('Number of salt rounds for password hashing'),

  // Account lockout
  MAX_LOGIN_ATTEMPTS: Joi.number()
    .default(5)
    .description('Maximum failed login attempts before account lockout'),
  ACCOUNT_LOCKOUT_TIME: Joi.number()
    .default(15)
    .description('Account lockout time in minutes'),

  // Logging
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'log', 'debug', 'verbose')
    .default('log')
    .description('Application log level'),
  LOG_TO_FILE: Joi.boolean()
    .default(false)
    .description('Whether to log to files in production'),
  LOG_DIR: Joi.string()
    .default('./logs')
    .description('Directory for log files'),

  // Development
  ENABLE_NGROK_HEADERS: Joi.boolean()
    .default(true)
    .description('Enable ngrok compatibility headers in development'),
});
