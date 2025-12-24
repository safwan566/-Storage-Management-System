import winston from 'winston';
import path from 'path';
import { config } from './environment';

const logDir = 'logs';

const stripTimestamp = winston.format((info) => {
  delete info.timestamp;
  return info;
});

const logFormat = winston.format.combine(
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  stripTimestamp(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.printf(({ level, message, ...meta }) => {
    const { timestamp, ...rest } = meta;
    let msg = `[${level}]: ${message}`;
    if (Object.keys(rest).length > 0) {
      msg += ` ${JSON.stringify(rest)}`;
    }
    return msg;
  })
);

export const logger = winston.createLogger({
  level: config.log.level,
  format: logFormat,
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: consoleFormat,
    }),
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Write all logs to combined.log
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log'),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log'),
    }),
  ],
});

// If we're in production, don't log to console
if (config.env === 'production') {
  logger.remove(logger.transports[0]);
}

