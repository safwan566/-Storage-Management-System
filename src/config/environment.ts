import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  APP_NAME: z.string().default('Storage Management System'),
  
  MONGODB_URI: z.string(),
  MONGODB_URI_TEST: z.string().optional(),
  
  JWT_SECRET: z.string(),
  JWT_EXPIRE: z.string().default('7d'),
  JWT_REFRESH_SECRET: z.string(),
  JWT_REFRESH_EXPIRE: z.string().default('30d'),
  
  BCRYPT_SALT_ROUNDS: z.string().default('10'),
  
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),
  
  MAX_FILE_SIZE: z.string().default('5242880'),
  UPLOAD_PATH: z.string().default('./public/uploads'),
  
  LOG_LEVEL: z.string().default('info'),
});

const envVars = envSchema.parse(process.env);

export const config = {
  env: envVars.NODE_ENV,
  port: parseInt(envVars.PORT, 10),
  appName: envVars.APP_NAME,
  
  mongodb: {
    uri: envVars.NODE_ENV === 'test' && envVars.MONGODB_URI_TEST 
      ? envVars.MONGODB_URI_TEST 
      : envVars.MONGODB_URI,
  },
  
  jwt: {
    secret: envVars.JWT_SECRET,
    expire: envVars.JWT_EXPIRE,
    refreshSecret: envVars.JWT_REFRESH_SECRET,
    refreshExpire: envVars.JWT_REFRESH_EXPIRE,
  },
  
  bcrypt: {
    saltRounds: parseInt(envVars.BCRYPT_SALT_ROUNDS, 10),
  },
  
  rateLimit: {
    windowMs: parseInt(envVars.RATE_LIMIT_WINDOW_MS, 10),
    maxRequests: parseInt(envVars.RATE_LIMIT_MAX_REQUESTS, 10),
  },
  
  upload: {
    maxFileSize: parseInt(envVars.MAX_FILE_SIZE, 10),
    path: envVars.UPLOAD_PATH,
  },
  
  log: {
    level: envVars.LOG_LEVEL,
  },
} as const;

