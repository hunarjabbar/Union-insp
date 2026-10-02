// FILE: src/lib/logger.ts
// STAGE: 3
// UPDATED: 2026-10-01
import pino from 'pino';

const validLevels = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'];
const rawLevel = process.env.LOG_LEVEL || 'info';
const logLevel = validLevels.includes(rawLevel.toLowerCase()) ? rawLevel.toLowerCase() : 'info';
const isDev = process.env.NODE_ENV !== 'production';

export const logger = pino({
  level: logLevel,
  redact: {
    paths: [
      'password',
      'passwordHash',
      'token',
      'refreshToken',
      'cookie',
      'authorization',
      'mfaSecret',
    ],
    censor: '[REDACTED]',
  },
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname',
          translateTime: 'yyyy-mm-dd HH:MM:ss',
        },
      }
    : undefined,
});

export default logger;
