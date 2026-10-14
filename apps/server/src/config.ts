import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'neochess_ultra_secure_jwt_secret_dev_2025_long_key_xyz',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  isProduction: process.env.NODE_ENV === 'production',
};
