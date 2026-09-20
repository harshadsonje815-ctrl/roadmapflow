import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/feature_portal',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'dev_jwt_access_secret_super_secure_key_123!',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev_jwt_refresh_secret_super_secure_key_456!',
  COOKIE_SECRET: process.env.COOKIE_SECRET || 'dev_cookie_signing_secret_super_secure_789!',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '',
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY_DAYS: 7,
};
