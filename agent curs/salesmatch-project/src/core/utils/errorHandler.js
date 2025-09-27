const Logger = require('./logger');

class ErrorHandler {
  constructor() {
    this.logger = Logger;
  }

  // Standard API error response
  sendErrorResponse(res, error, statusCode = 500) {
    const response = {
      success: false,
      error: {
        message: error.message || 'Internal server error',
        code: error.code || 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      }
    };

    // Don't send stack trace in production
    if (process.env.NODE_ENV === 'development') {
      response.error.stack = error.stack;
    }

    // Log error details
    this.logger.apiError('API Error occurred', error);

    res.status(statusCode).json(response);
  }

  // Telegram bot error handling
  handleTelegramError(ctx, error, operation = 'Unknown operation') {
    this.logger.telegramError(`Error in ${operation}`, error, ctx);

    // Send user-friendly error message
    const errorMessages = {
      en: '❌ Something went wrong. Please try again later.',
      ru: '❌ Что-то пошло не так. Попробуйте позже.',
      hi: '❌ कुछ गलत हुआ। कृपया बाद में पुनः प्रयास करें।',
      fa: '❌ مشکلی پیش آمد. لطفاً بعداً امتحان کنید.',
      zh: '❌ 出了点问题。请稍后再试。'
    };

    const userLang = ctx.session?.language || 'en';
    const message = errorMessages[userLang] || errorMessages.en;

    return ctx.reply(message).catch(err => {
      this.logger.telegramError('Failed to send error message', err, ctx);
    });
  }

  // Database error handling
  handleDatabaseError(error, operation = 'Database operation') {
    this.logger.dbError(`Error in ${operation}`, error);

    // Classify database errors
    if (error.code) {
      switch (error.code) {
        case '23505': // Unique violation
          return new DatabaseError('Duplicate entry', 'DUPLICATE_ENTRY');
        case '23503': // Foreign key violation
          return new DatabaseError('Referenced record not found', 'FOREIGN_KEY_VIOLATION');
        case '23502': // Not null violation
          return new DatabaseError('Required field missing', 'REQUIRED_FIELD_MISSING');
        case '42P01': // Undefined table
          return new DatabaseError('Table not found', 'TABLE_NOT_FOUND');
        default:
          return new DatabaseError('Database operation failed', 'DATABASE_ERROR');
      }
    }

    return new DatabaseError('Unknown database error', 'DATABASE_ERROR');
  }

  // Business logic error handling
  handleBusinessError(error, module, operation) {
    this.logger.businessError(module, `Error in ${operation}`, error);

    if (error instanceof ValidationError) {
      return error;
    }

    if (error instanceof AuthorizationError) {
      return error;
    }

    if (error instanceof NotFoundError) {
      return error;
    }

    // Wrap unknown errors
    return new BusinessError(`${operation} failed`, 'OPERATION_FAILED');
  }

  // AI service error handling
  handleAIError(error, operation = 'AI operation') {
    this.logger.error(`AI Service Error in ${operation}:`, error);

    if (error.response?.status === 429) {
      return new AIError('AI service rate limit exceeded', 'RATE_LIMIT_EXCEEDED');
    }

    if (error.response?.status === 401) {
      return new AIError('AI service authentication failed', 'AUTH_FAILED');
    }

    if (error.response?.status >= 500) {
      return new AIError('AI service temporarily unavailable', 'SERVICE_UNAVAILABLE');
    }

    return new AIError('AI processing failed', 'AI_ERROR');
  }

  // Payment error handling
  handlePaymentError(error, operation = 'Payment operation') {
    this.logger.error(`Payment Error in ${operation}:`, error);

    if (error.code === 'INSUFFICIENT_FUNDS') {
      return new PaymentError('Insufficient funds', 'INSUFFICIENT_FUNDS');
    }

    if (error.code === 'PAYMENT_DECLINED') {
      return new PaymentError('Payment declined', 'PAYMENT_DECLINED');
    }

    return new PaymentError('Payment processing failed', 'PAYMENT_ERROR');
  }

  // Validation error handler
  handleValidationError(error) {
    if (error.details) {
      const messages = error.details.map(detail => detail.message);
      return new ValidationError(messages.join(', '), 'VALIDATION_ERROR');
    }

    return new ValidationError('Validation failed', 'VALIDATION_ERROR');
  }

  // Express error middleware
  expressErrorHandler() {
    return (error, req, res, next) => {
      // If response already sent, delegate to default Express error handler
      if (res.headersSent) {
        return next(error);
      }

      let statusCode = 500;
      let formattedError = error;

      // Handle different error types
      if (error instanceof ValidationError) {
        statusCode = 400;
      } else if (error instanceof AuthorizationError) {
        statusCode = 403;
      } else if (error instanceof NotFoundError) {
        statusCode = 404;
      } else if (error instanceof BusinessError) {
        statusCode = 422;
      } else if (error instanceof AIError || error instanceof PaymentError) {
        statusCode = 503;
      } else if (error instanceof DatabaseError) {
        statusCode = 500;
        formattedError = this.handleDatabaseError(error);
      }

      this.sendErrorResponse(res, formattedError, statusCode);
    };
  }

  // Async route wrapper
  asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  // Security event handler
  handleSecurityEvent(event, details, req = null) {
    this.logger.security(event, {
      ...details,
      ip: req?.ip,
      userAgent: req?.get('User-Agent'),
      timestamp: new Date().toISOString()
    });

    // Could integrate with security monitoring services here
  }
}

// Custom error classes
class BaseError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
    this.timestamp = new Date().toISOString();
  }
}

class ValidationError extends BaseError {
  constructor(message, code = 'VALIDATION_ERROR') {
    super(message, code);
    this.name = 'ValidationError';
  }
}

class AuthorizationError extends BaseError {
  constructor(message, code = 'AUTHORIZATION_ERROR') {
    super(message, code);
    this.name = 'AuthorizationError';
  }
}

class NotFoundError extends BaseError {
  constructor(message, code = 'NOT_FOUND') {
    super(message, code);
    this.name = 'NotFoundError';
  }
}

class BusinessError extends BaseError {
  constructor(message, code = 'BUSINESS_ERROR') {
    super(message, code);
    this.name = 'BusinessError';
  }
}

class DatabaseError extends BaseError {
  constructor(message, code = 'DATABASE_ERROR') {
    super(message, code);
    this.name = 'DatabaseError';
  }
}

class AIError extends BaseError {
  constructor(message, code = 'AI_ERROR') {
    super(message, code);
    this.name = 'AIError';
  }
}

class PaymentError extends BaseError {
  constructor(message, code = 'PAYMENT_ERROR') {
    super(message, code);
    this.name = 'PaymentError';
  }
}

// Export error handler instance and error classes
module.exports = new ErrorHandler();
module.exports.ValidationError = ValidationError;
module.exports.AuthorizationError = AuthorizationError;
module.exports.NotFoundError = NotFoundError;
module.exports.BusinessError = BusinessError;
module.exports.DatabaseError = DatabaseError;
module.exports.AIError = AIError;
module.exports.PaymentError = PaymentError;