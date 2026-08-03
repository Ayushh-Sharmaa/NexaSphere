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

// Define log levels

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
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  correlationFormat(),
  winston.format.json()
);

// Define transports
// 1. Define the base format WITHOUT colorize
const baseFileFormat = winston.format.combine(
const textFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...args } = info;
    const ts = typeof timestamp === 'string' ? timestamp : new Date().toISOString();

    // Strip out internal Winston symbol keys so they don't print as empty objects
    const cleanArgs = Object.keys(args).reduce((acc, key) => {
      if (typeof key === 'string' || typeof key === 'number') {
        acc[key] = args[key];
      }
      return acc;
    }, {});

    return `${ts} [${level}]: ${message} ${
      Object.keys(cleanArgs).length ? JSON.stringify(cleanArgs, null, 2) : ''
    }`;
  })
// Define log format
// Define base log layout template
const logLayout = winston.format.printf((info) => {
  const { timestamp, level, message, ...args } = info;
  let ts = '';
  if (timestamp) {
    if (typeof timestamp === 'string') {
      ts = timestamp.slice(0, 19).replace('T', ' ');
    } else if (timestamp instanceof Date) {
      ts = timestamp.toISOString().slice(0, 19).replace('T', ' ');
    } else if (typeof timestamp.toISOString === 'function') {
      ts = timestamp.toISOString().slice(0, 19).replace('T', ' ');
    } else {
      ts = String(timestamp);
    }
  }
  return `${ts} [${level}]: ${message} ${
    Object.keys(args).length ? JSON.stringify(args, null, 2) : ''
  }`;
});

const textFormat = winston.format.combine(
// Define transports
// 1. Define the base format WITHOUT colorize
const baseFileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...args } = info;
    const ts = typeof timestamp === 'string' ? timestamp : new Date().toISOString();

    // Strip out internal Winston symbol keys so they don't print as empty objects
    const cleanArgs = Object.keys(args).reduce((acc, key) => {
      if (typeof key === 'string' || typeof key === 'number') {
        acc[key] = args[key];
      }
      return acc;
    }, {});

    return `${ts} [${level}]: ${message} ${
      Object.keys(cleanArgs).length ? JSON.stringify(cleanArgs) : ''
    const ts = timestamp.slice(0, 19).replace('T', ' ');
    return `${ts} [${level}]: ${message} ${
    return `${timestamp} [${level}]: ${message} ${
      Object.keys(args).length ? JSON.stringify(args, null, 2) : ''
      Object.keys(cleanArgs).length ? JSON.stringify(cleanArgs, null, 2) : ''
    }`;
  })
);

const baseFileFormat = LOG_FORMAT === 'json' ? jsonFormat : textFormat;
const apiRequestOnlyFormat = winston.format((info) => {
  return info.event === 'api_request' ? info : false;
});
const apiRequestFileFormat = winston.format.combine(apiRequestOnlyFormat(), jsonFormat);

// Determine runtime levels: Console is dynamic, historical files maintain info baseline
const consoleLevel = process.env.LOG_LEVEL || 'info';
const fileBaselineLevel = 'info';

const consoleLevel = process.env.LOG_LEVEL_CONSOLE || process.env.LOG_LEVEL || 'info';
const fileBaselineLevel = process.env.LOG_LEVEL_FILE || 'info';
const globalGatekeeperLevel = process.env.LOG_LEVEL_GLOBAL || 'debug';

const activeTransports = [
  new winston.transports.Console({
    level: consoleLevel,
    format:
      LOG_FORMAT === 'json'
        ? baseFileFormat
        : winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
            winston.format.errors({ stack: true }),
            winston.format.colorize({ all: true }),
            correlationFormat(),
            logLayout
          ),
    format: winston.format.combine(winston.format.colorize({ all: true }), baseFileFormat),
        : winston.format.combine(winston.format.colorize({ all: true }), baseFileFormat),
  }),
];

if (process.env.SENTRY_DSN) {
  activeTransports.push(
    new SentryTransport({
      level: 'warn', // This will process warn and error levels
      level: 'warn' // This will process warn and error levels
    })
  );
}

if (isStorageWritable) {
  activeTransports.push(
    // Error logs
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: winston.format.uncolorize(),
    }),

    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      level: fileBaselineLevel,
      format: winston.format.uncolorize(),
    }),

    // Daily rotate logs (requires winston-daily-rotate-file)
    new DailyRotateFile({
      filename: path.join(logsDir, 'application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: fileBaselineLevel,
      maxSize: '20m',
      maxFiles: '90d',
      maxSize: '20m',
      maxFiles: '14d',
      format: winston.format.uncolorize(),
      utc: true,
    }),
    new DailyRotateFile({
      filename: path.join(logsDir, 'api-requests-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'http',
      maxSize: '20m',
      maxFiles: '90d',
      zippedArchive: true,
      format: apiRequestFileFormat,
      utc: true,
    })
  );
}

// Create logger instance
const logger = winston.createLogger({
  level: globalGatekeeperLevel,
  levels,
  format: baseFileFormat,
  transports: activeTransports,
  exceptionHandlers: isStorageWritable
    ? [
        new DailyRotateFile({
          filename: path.join(logsDir, 'exceptions-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '90d',
          format: baseFileFormat,
          utc: true,
        }),
      ]
    : undefined,
  rejectionHandlers: isStorageWritable
    ? [
        new DailyRotateFile({
          filename: path.join(logsDir, 'rejections-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '90d',
          format: baseFileFormat,
          utc: true,
        }),
      ]
    : undefined,
const transports = [
  new winston.transports.Console({
    format: winston.format.combine(winston.format.colorize({ all: true }), baseFileFormat),
// Define log format
// Define base log layout template
const logLayout = winston.format.printf((info) => {
  const { timestamp, level, message, ...args } = info;

  const ts = timestamp ? timestamp.slice(0, 19).replace("T", " ") : "";

  return `${ts} [${level}]: ${message} ${
    Object.keys(args).length ? JSON.stringify(args, null, 2) : ""
  }`;
});

// Define clean log format for file transports
const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.errors({ stack: true }),
  logLayout
);

// Define transports
const transports = [
  // Console transport (Colorizes exclusively for terminal output)
  new winston.transports.Console({
    level: consoleLevel, // <-- Add this line
    format: winston.format.combine(
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
      winston.format.errors({ stack: true }),
      winston.format.colorize({ all: true }),
      format
    ),
  }),
      logLayout
    ),
  }),

  // Error logs
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    format: winston.format.uncolorize(),
  }),
  new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    format: winston.format.uncolorize(),
  }),
  new winston.transports.File({
    filename: path.join(logsDir, 'application-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
    format: winston.format.uncolorize(),
  }),
];

if (isStorageWritable) {
  activeTransports.push(
    // Error logs
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: winston.format.uncolorize(),
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: winston.format.uncolorize(),
    }),
    new DailyRotateFile({
      filename: path.join(logsDir, 'application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',

    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      level: fileBaselineLevel,
      format: winston.format.uncolorize(),
    }),

    // Daily rotate logs (requires winston-daily-rotate-file)
    new DailyRotateFile({
      filename: path.join(logsDir, 'application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: fileBaselineLevel,
      maxSize: '20m',
      maxFiles: '14d',
      format: winston.format.uncolorize(),
      utc: true,
    })
  );
}

  new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    level: fileBaselineLevel, // <-- Add this line
    format: winston.format.uncolorize(),
  }),

  // Daily rotate logs (requires winston-daily-rotate-file)
  new DailyRotateFile({
    filename: path.join(logsDir, 'application-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: fileBaselineLevel, // <-- Add this line
    maxSize: '20m',
    maxFiles: '14d',
    format: winston.format.uncolorize(),
    utc: true,
  }),
];

// Create logger instance
const logger = winston.createLogger({
  level: globalGatekeeperLevel, // <-- Change this line
  levels,
  format,
  transports,
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
    }),
  ],
  format: baseFileFormat,
  transports: activeTransports,
  exceptionHandlers: isStorageWritable
    ? [
        new DailyRotateFile({
          filename: path.join(logsDir, 'exceptions-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d',
          maxFiles: '14d',
          format: baseFileFormat, //  FIX: Ensures clean exception dumps
          utc: true,
        }),
      ]
    : undefined,
  rejectionHandlers: isStorageWritable
    ? [
        new DailyRotateFile({
          filename: path.join(logsDir, 'rejections-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d',
          maxFiles: '14d',
          format: baseFileFormat, //  FIX: Ensures clean rejection dumps
          utc: true,
        }),
      ]
    : undefined,
});

export default logger;
