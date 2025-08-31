// backend/config/logger.js
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define which level to log based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'info';
};

// Define format for logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Define format for file logs (without colors)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(
    (info) => {
      if (info.stack) {
        return `${info.timestamp} ${info.level}: ${info.message}\n${info.stack}`;
      }
      return `${info.timestamp} ${info.level}: ${info.message}`;
    },
  ),
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }),
  
  // Error log file
  new DailyRotateFile({
    filename: path.join(process.cwd(), 'logs', 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    format: fileFormat,
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    maxFiles: process.env.LOG_MAX_FILES || '14',
    zippedArchive: true
  }),
  
  // Combined log file
  new DailyRotateFile({
    filename: path.join(process.cwd(), 'logs', 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    format: fileFormat,
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    maxFiles: process.env.LOG_MAX_FILES || '14',
    zippedArchive: true
  }),
  
  // HTTP requests log file
  new DailyRotateFile({
    filename: path.join(process.cwd(), 'logs', 'http-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'http',
    format: fileFormat,
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    maxFiles: process.env.LOG_MAX_FILES || '14',
    zippedArchive: true
  })
];

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format: fileFormat,
  transports,
  exitOnError: false
});

// Create a stream object for Morgan HTTP logging
export const stream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

// Log uncaught exceptions
logger.exceptions.handle(
  new DailyRotateFile({
    filename: path.join(process.cwd(), 'logs', 'exceptions-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    format: fileFormat,
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    maxFiles: process.env.LOG_MAX_FILES || '14',
    zippedArchive: true
  })
);

// Log unhandled promise rejections
logger.rejections.handle(
  new DailyRotateFile({
    filename: path.join(process.cwd(), 'logs', 'rejections-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    format: fileFormat,
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    maxFiles: process.env.LOG_MAX_FILES || '14',
    zippedArchive: true
  })
);

// Helper functions for structured logging
export const logRequest = (req, res, duration) => {
  const logData = {
    method: req.method,
    url: req.url,
    status: res.statusCode,
    duration: `${duration}ms`,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id || null,
    userRole: req.user?.role || null,
    timestamp: new Date().toISOString()
  };
  
  if (res.statusCode >= 400) {
    logger.warn('HTTP Request', logData);
  } else {
    logger.http('HTTP Request', logData);
  }
};

export const logError = (error, req = null, additionalData = {}) => {
  const logData = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    timestamp: new Date().toISOString(),
    ...additionalData
  };
  
  if (req) {
    logData.request = {
      method: req.method,
      url: req.url,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id || null,
      userRole: req.user?.role || null
    };
  }
  
  logger.error('Application Error', logData);
};

export const logSecurityEvent = (event, req, additionalData = {}) => {
  const logData = {
    event,
    timestamp: new Date().toISOString(),
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id || null,
      userRole: req.user?.role || null
    },
    ...additionalData
  };
  
  logger.warn('Security Event', logData);
};

export const logAdminAction = (adminId, action, entityType, entityId, req, additionalData = {}) => {
  const logData = {
    adminId,
    action,
    entityType,
    entityId,
    timestamp: new Date().toISOString(),
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    },
    ...additionalData
  };
  
  logger.info('Admin Action', logData);
};

export const logDatabaseQuery = (query, params, duration, success = true) => {
  const logData = {
    query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
    params: params ? params.slice(0, 5) : [], // Log only first 5 params for security
    duration: `${duration}ms`,
    success,
    timestamp: new Date().toISOString()
  };
  
  if (duration > 1000) { // Log slow queries
    logger.warn('Slow Database Query', logData);
  } else if (success) {
    logger.debug('Database Query', logData);
  } else {
    logger.error('Database Query Error', logData);
  }
};

// Export the main logger
export default logger;




