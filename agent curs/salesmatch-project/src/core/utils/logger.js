const winston = require('winston');
const path = require('path');

class Logger {
  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }),
        winston.format.printf(({ level, message, timestamp, stack }) => {
          return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
        })
      ),
      defaultMeta: { service: 'salesmatch-pro' },
      transports: [
        // Console transport
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }),
        // File transport for errors
        new winston.transports.File({
          filename: path.join(process.cwd(), 'logs', 'error.log'),
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5
        }),
        // File transport for all logs
        new winston.transports.File({
          filename: path.join(process.cwd(), 'logs', 'combined.log'),
          maxsize: 5242880, // 5MB
          maxFiles: 10
        })
      ]
    });

    // Create logs directory if it doesn't exist
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    const fs = require('fs');
    const logsDir = path.join(process.cwd(), 'logs');
    
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  }

  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  error(message, meta = {}) {
    this.logger.error(message, meta);
  }

  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }

  // Telegram-specific logging
  telegramInfo(message, ctx = null) {
    const meta = ctx ? {
      userId: ctx.from?.id,
      username: ctx.from?.username,
      chatType: ctx.chat?.type
    } : {};
    
    this.logger.info(`[TELEGRAM] ${message}`, meta);
  }

  telegramError(message, error, ctx = null) {
    const meta = {
      error: error.message,
      stack: error.stack,
      ...(ctx ? {
        userId: ctx.from?.id,
        username: ctx.from?.username,
        chatType: ctx.chat?.type
      } : {})
    };
    
    this.logger.error(`[TELEGRAM] ${message}`, meta);
  }

  // API-specific logging
  apiInfo(message, req = null) {
    const meta = req ? {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    } : {};
    
    this.logger.info(`[API] ${message}`, meta);
  }

  apiError(message, error, req = null) {
    const meta = {
      error: error.message,
      stack: error.stack,
      ...(req ? {
        method: req.method,
        url: req.url,
        body: req.body,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      } : {})
    };
    
    this.logger.error(`[API] ${message}`, meta);
  }

  // Database-specific logging
  dbInfo(message, query = null) {
    const meta = query ? {
      query: query.substring(0, 200) + (query.length > 200 ? '...' : '')
    } : {};
    
    this.logger.info(`[DATABASE] ${message}`, meta);
  }

  dbError(message, error, query = null) {
    const meta = {
      error: error.message,
      ...(query ? {
        query: query.substring(0, 200) + (query.length > 200 ? '...' : '')
      } : {})
    };
    
    this.logger.error(`[DATABASE] ${message}`, meta);
  }

  // Business logic logging
  businessInfo(module, message, data = {}) {
    this.logger.info(`[${module.toUpperCase()}] ${message}`, data);
  }

  businessError(module, message, error, data = {}) {
    const meta = {
      error: error.message,
      stack: error.stack,
      ...data
    };
    
    this.logger.error(`[${module.toUpperCase()}] ${message}`, meta);
  }

  // Performance logging
  performance(operation, duration, details = {}) {
    const level = duration > 1000 ? 'warn' : 'info';
    this.logger[level](`[PERFORMANCE] ${operation} took ${duration}ms`, details);
  }

  // Security logging
  security(event, details = {}) {
    this.logger.warn(`[SECURITY] ${event}`, details);
  }

  // AI usage logging
  aiUsage(userId, operation, tokens = 0, cost = 0) {
    this.logger.info(`[AI] User ${userId} used ${operation}`, {
      tokens,
      cost,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = new Logger();