const crypto = require('crypto');
const Logger = require('../../core/utils/logger');
const ErrorHandler = require('../../core/utils/errorHandler');

class TelegramAuth {
  constructor(botToken) {
    this.botToken = botToken || process.env.BOT_TOKEN;
    this.logger = Logger;
    this.errorHandler = ErrorHandler;
    
    if (!this.botToken || this.botToken === 'test_bot_token_here') {
      this.logger.warn('Using test bot token - Telegram auth validation will be skipped');
      this.isTestMode = true;
      this.botToken = this.botToken || 'test_bot_token_here';
    } else {
      this.isTestMode = false;
    }
  }
  
  /**
   * Validate Telegram WebApp init data
   * @param {string} initData - Raw init data from Telegram WebApp
   * @returns {boolean} - True if valid, false otherwise
   */
  validateWebAppData(initData) {
    try {
      // In test mode, always return true
      if (this.isTestMode) {
        this.logger.info('Skipping Telegram validation in test mode');
        return true;
      }
      const urlParams = new URLSearchParams(initData);
      const hash = urlParams.get('hash');
      
      if (!hash) {
        this.logger.security('Missing hash in Telegram init data');
        return false;
      }
      
      // Remove hash from params
      urlParams.delete('hash');
      
      // Create data check string
      const dataCheckString = Array.from(urlParams.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
      
      // Generate secret key
      const secretKey = crypto
        .createHmac('sha256', 'WebAppData')
        .update(this.botToken)
        .digest();
      
      // Calculate expected hash
      const calculatedHash = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');
      
      const isValid = calculatedHash === hash;
      
      if (!isValid) {
        this.logger.security('Invalid Telegram WebApp data hash', {
          expected: calculatedHash.substring(0, 8) + '...',
          received: hash.substring(0, 8) + '...'
        });
      }
      
      return isValid;
      
    } catch (error) {
      this.logger.error('Error validating Telegram WebApp data:', error);
      return false;
    }
  }
  
  /**
   * Parse Telegram WebApp init data
   * @param {string} initData - Raw init data from Telegram WebApp
   * @returns {Object} - Parsed data object
   */
  parseInitData(initData) {
    try {
      const urlParams = new URLSearchParams(initData);
      
      const user = urlParams.get('user') ? 
        JSON.parse(urlParams.get('user')) : null;
      
      const start_param = urlParams.get('start_param');
      const auth_date = urlParams.get('auth_date') ? 
        parseInt(urlParams.get('auth_date')) : null;
      const hash = urlParams.get('hash');
      
      return {
        user,
        start_param,
        auth_date,
        hash,
        query_id: urlParams.get('query_id'),
        receiver: urlParams.get('receiver') ? 
          JSON.parse(urlParams.get('receiver')) : null,
        chat: urlParams.get('chat') ? 
          JSON.parse(urlParams.get('chat')) : null,
        chat_type: urlParams.get('chat_type'),
        chat_instance: urlParams.get('chat_instance')
      };
      
    } catch (error) {
      this.logger.error('Error parsing Telegram init data:', error);
      throw new ErrorHandler.ValidationError('Invalid Telegram init data format');
    }
  }
  
  /**
   * Check if init data is not too old
   * @param {number} authDate - Auth date timestamp
   * @param {number} maxAge - Maximum age in seconds (default: 1 hour)
   * @returns {boolean} - True if not expired
   */
  isDataFresh(authDate, maxAge = 3600) {
    if (!authDate) return false;
    
    const currentTime = Math.floor(Date.now() / 1000);
    const age = currentTime - authDate;
    
    return age <= maxAge;
  }
  
  /**
   * Express middleware for protected routes
   * @param {Object} options - Middleware options
   * @returns {Function} - Express middleware function
   */
  requireAuth(options = {}) {
    const {
      maxAge = 3600, // 1 hour default
      required = true
    } = options;
    
    return async (req, res, next) => {
      try {
        const initData = req.headers['x-telegram-init-data'];
        
        if (!initData) {
          if (required) {
            this.logger.security('Missing Telegram init data', {
              ip: req.ip,
              userAgent: req.get('User-Agent'),
              url: req.url
            });
            
            return res.status(401).json({
              success: false,
              error: {
                message: 'Telegram authentication required',
                code: 'MISSING_AUTH_DATA'
              }
            });
          } else {
            return next();
          }
        }
        
        // Validate init data
        if (!this.validateWebAppData(initData)) {
          this.logger.security('Invalid Telegram init data', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            url: req.url
          });
          
          return res.status(401).json({
            success: false,
            error: {
              message: 'Invalid Telegram authentication',
              code: 'INVALID_AUTH_DATA'
            }
          });
        }
        
        // Parse and validate freshness
        const parsedData = this.parseInitData(initData);
        
        if (!this.isDataFresh(parsedData.auth_date, maxAge)) {
          this.logger.security('Expired Telegram init data', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            url: req.url,
            authDate: parsedData.auth_date
          });
          
          return res.status(401).json({
            success: false,
            error: {
              message: 'Authentication data expired',
              code: 'EXPIRED_AUTH_DATA'
            }
          });
        }
        
        // Add user data to request
        req.telegramUser = parsedData.user;
        req.telegramData = parsedData;
        
        // Log successful authentication
        this.logger.apiInfo('Telegram user authenticated', {
          userId: parsedData.user?.id,
          username: parsedData.user?.username
        });
        
        next();
        
      } catch (error) {
        this.logger.error('Authentication middleware error:', error);
        
        if (error instanceof ErrorHandler.ValidationError) {
          return res.status(400).json({
            success: false,
            error: {
              message: error.message,
              code: error.code
            }
          });
        }
        
        return res.status(500).json({
          success: false,
          error: {
            message: 'Authentication system error',
            code: 'AUTH_SYSTEM_ERROR'
          }
        });
      }
    };
  }
  
  /**
   * Optional authentication middleware
   * @param {Object} options - Middleware options
   * @returns {Function} - Express middleware function
   */
  optionalAuth(options = {}) {
    return this.requireAuth({ ...options, required: false });
  }
  
  /**
   * Generate a secure token for API access
   * @param {Object} userData - User data from Telegram
   * @returns {string} - JWT token or session token
   */
  generateApiToken(userData) {
    try {
      const payload = {
        userId: userData.id,
        username: userData.username,
        firstName: userData.first_name,
        lastName: userData.last_name,
        languageCode: userData.language_code,
        isPremium: userData.is_premium,
        timestamp: Date.now()
      };
      
      // Simple token generation (in production, use JWT)
      const token = crypto
        .createHmac('sha256', process.env.JWT_SECRET || 'fallback-secret')
        .update(JSON.stringify(payload))
        .digest('hex');
      
      return token;
      
    } catch (error) {
      this.logger.error('Error generating API token:', error);
      throw new ErrorHandler.BusinessError('Failed to generate authentication token');
    }
  }
  
  /**
   * Verify API token
   * @param {string} token - Token to verify
   * @param {Object} userData - Expected user data
   * @returns {boolean} - True if valid
   */
  verifyApiToken(token, userData) {
    try {
      const expectedToken = this.generateApiToken(userData);
      return crypto.timingSafeEqual(
        Buffer.from(token, 'hex'),
        Buffer.from(expectedToken, 'hex')
      );
    } catch (error) {
      this.logger.error('Error verifying API token:', error);
      return false;
    }
  }
  
  /**
   * Extract user ID from init data without full validation
   * @param {string} initData - Raw init data
   * @returns {number|null} - User ID or null
   */
  extractUserId(initData) {
    try {
      const urlParams = new URLSearchParams(initData);
      const userStr = urlParams.get('user');
      
      if (!userStr) return null;
      
      const user = JSON.parse(userStr);
      return user.id || null;
      
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Middleware to add CORS headers for Telegram WebApp
   * @returns {Function} - Express middleware function
   */
  telegramCorsMiddleware() {
    return (req, res, next) => {
      // Allow Telegram domains
      const telegramOrigins = [
        'https://web.telegram.org',
        'https://telegram.org'
      ];
      
      const origin = req.get('Origin');
      if (telegramOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
      }
      
      next();
    };
  }
  
  /**
   * Create auth status response
   * @param {Object} req - Express request object
   * @returns {Object} - Auth status object
   */
  getAuthStatus(req) {
    return {
      authenticated: !!req.telegramUser,
      user: req.telegramUser || null,
      authMethod: 'telegram_webapp',
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = TelegramAuth;