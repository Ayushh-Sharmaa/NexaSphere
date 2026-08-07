/**
 * Winston Logger Configuration
 * Structured logging for all backend operations
 */

import winston from "winston";
import path from "path";
import DailyRotateFile from "winston-daily-rotate-file";
import { getLogContext } from "./logContext.js";

// Create logs directory if it doesn't exist (with permission handling)
import fs from "fs";
const logsDir = path.join(process.cwd(), "logs");

function ensureLogsDirectory() {
  try {
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    return true;
  } catch (error) {
    const fallbackCodes = ["EACCES", "EROFS", "EPERM"];
    if (fallbackCodes.includes(error.code)) {
      console.warn(
        `[Logger Warning]: Storage is read-only or restricted (${error.code}). ` +
          `Falling back gracefully to console logging.`
      );
    } else {
      console.error(
        `[Logger Error]: Unexpected filesystem failure: ${error.message}`
      );
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

// Define colors for console output
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

winston.addColors(colors);

const LOG_FORMAT = (process.env.LOG_FORMAT || "text").toLowerCase();

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

const logLayout = winston.format.printf((info) => {
  const { timestamp, level, message, ...args } = info;
  let ts = "";
  if (timestamp) {
    if (typeof timestamp === "string") {
      ts = timestamp.slice(0, 19).replace("T", " ");
    } else if (timestamp instanceof Date) {
      ts = timestamp.toISOString().slice(0, 19).replace("T", " ");
    } else if (typeof timestamp.toISOString === "function") {
      ts = timestamp.toISOString().slice(0, 19).replace("T", " ");
    } else {
      ts = String(timestamp);
    }
  }
  return `${ts} [${level}]: ${message} ${
    Object.keys(args).length ? JSON.stringify(args, null, 2) : ""
  }`;
});

const textFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...args } = info;
    const ts =
      typeof timestamp === "string" ? timestamp : new Date().toISOString();

    // Strip out internal Winston symbol keys so they don't print as empty objects
    const cleanArgs = Object.keys(args).reduce((acc, key) => {
      if (typeof key === "string" || typeof key === "number") {
        acc[key] = args[key];
      }
      return acc;
    }, {});

    return `${ts} [${level}]: ${message} ${
      Object.keys(cleanArgs).length ? JSON.stringify(cleanArgs) : ""
    }`;
  })
);

const baseFileFormat = LOG_FORMAT === "json" ? jsonFormat : textFormat;

const consoleLevel =
  process.env.LOG_LEVEL_CONSOLE || process.env.LOG_LEVEL || "info";
const fileBaselineLevel = process.env.LOG_LEVEL_FILE || "info";
const globalGatekeeperLevel = process.env.LOG_LEVEL_GLOBAL || "debug";

const activeTransports = [
  new winston.transports.Console({
    level: consoleLevel,
    format:
      LOG_FORMAT === "json"
        ? baseFileFormat
        : winston.format.combine(
            winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
            winston.format.errors({ stack: true }),
            winston.format.colorize({ all: true }),
            correlationFormat(),
            logLayout
          ),
  }),
];

if (isStorageWritable) {
  activeTransports.push(
    // Error logs
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
      format: winston.format.uncolorize(),
    }),

    new winston.transports.File({
      filename: path.join(logsDir, "combined.log"),
      level: fileBaselineLevel,
      format: winston.format.uncolorize(),
    }),

    // Daily rotate logs (requires winston-daily-rotate-file)
    new DailyRotateFile({
      filename: path.join(logsDir, "application-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      level: fileBaselineLevel,
      maxSize: "20m",
      maxFiles: "14d",
      format: winston.format.uncolorize(),
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
          filename: path.join(logsDir, "exceptions-%DATE%.log"),
          datePattern: "YYYY-MM-DD",
          maxSize: "20m",
          maxFiles: "14d",
          format: baseFileFormat,
          utc: true,
        }),
      ]
    : undefined,
  rejectionHandlers: isStorageWritable
    ? [
        new DailyRotateFile({
          filename: path.join(logsDir, "rejections-%DATE%.log"),
          datePattern: "YYYY-MM-DD",
          maxSize: "20m",
          maxFiles: "14d",
          format: baseFileFormat,
          utc: true,
        }),
      ]
    : undefined,
});

export default logger;
