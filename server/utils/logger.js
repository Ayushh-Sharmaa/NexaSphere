import winston from 'winston';
import path from 'path';
import fs from 'fs';
import DailyRotateFile from 'winston-daily-rotate-file';
import { getLogContext } from './logContext.js';
import SentryTransport from './sentryTransport.js';

const logsDir = path.join(process.cwd(), 'logs');

function ensureLogsDirectory() {
  try {
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    return true;
  } catch (error) {
    const fallbackCodes = ['EACCES', 'EROFS', 'EPERM'];
    if (fallbackCodes.includes(error.code)) {
      console.warn(
        `[Logger Warning]: Storage is read-only or restricted (${error.code}). ` +
          `Falling back gracefully to console logging.`
      );
    } else {
      console.error(`[Logger Error]: Unexpected filesystem failure: ${error.message}`);
    }
    return false;
  }
}

const isStorageWritable = ensureLogsDirectory();

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

const LOG_FORMAT = (process.env.LOG_FORMAT || 'text').toLowerCase();

const correlationFormat = winston.format((info) => {
  const ctx = getLogContext();
  Object.assign(info, ctx);
  return info;
});

const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  correlationFormat(),
  winston.format.json()
);

const textFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  correlationFormat(),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...args } = info;
    const cleanArgs = Object.keys(args).reduce((acc, key) => {
      if (typeof key === 'string' || typeof key === 'number') {
        acc[key] = args[key];
      }
      return acc;
    }, {});
    return `${timestamp} [${level}]: ${message} ${
      Object.keys(cleanArgs).length ? JSON.stringify(cleanArgs, null, 2) : ''
    }`;
  })
);

const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  textFormat
);

const format = LOG_FORMAT === 'json' ? jsonFormat : textFormat;

const transports = [
  new winston.transports.Console({
    format: LOG_FORMAT === 'json' ? jsonFormat : consoleFormat,
  }),
];

if (isStorageWritable) {
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      level: 'error',
      format,
    }),
    new DailyRotateFile({
      filename: path.join(logsDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format,
    })
  );
}

if (process.env.SENTRY_DSN) {
  transports.push(new SentryTransport({ level: 'error' }));
}

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  levels,
  format,
  transports,
  exitOnError: false,
});

export default logger;
