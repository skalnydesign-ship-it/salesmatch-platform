const express = require('express');
const TelegramAuth = require('../../miniapp/auth/TelegramAuth');
const Logger = require('../../core/utils/logger');
const ErrorHandler = require('../../core/utils/errorHandler');

class AuthAPI {
  constructor(managers) {
    this.userManager = managers.user;
    this.telegramAuth = new TelegramAuth();
    this.logger = Logger;
    this.errorHandler = ErrorHandler;
    this.router = express.Router();
    
    this.setupRoutes();
  }
  
  setupRoutes() {
    // Validate Telegram WebApp init data
    this.router.post('/validate', this.validateUser.bind(this));
    
    // Get current user info
    this.router.get('/me', 
      this.telegramAuth.requireAuth(),
      this.getCurrentUser.bind(this)
    );
    
    // Update user language
    this.router.post('/language',
      this.telegramAuth.requireAuth(),
      this.updateLanguage.bind(this)
    );
    
    // Set account type
    this.router.post('/account-type',
      this.telegramAuth.requireAuth(),
      this.setAccountType.bind(this)
    );
    
    // Get auth status
    this.router.get('/status',
      this.telegramAuth.optionalAuth(),
      this.getAuthStatus.bind(this)
    );
    
    // Logout (invalidate session)
    this.router.post('/logout',
      this.telegramAuth.requireAuth(),
      this.logout.bind(this)
    );
  }
  
  async validateUser(req, res) {
    try {
      const { initData } = req.body;
      
      if (!initData) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Init data is required',
            code: 'MISSING_INIT_DATA'
          }
        });
      }
      
      // Validate Telegram data
      if (!this.telegramAuth.validateWebAppData(initData)) {
        this.logger.security('Invalid Telegram init data in validation', {
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        
        return res.status(401).json({
          success: false,
          error: {
            message: 'Invalid Telegram authentication data',
            code: 'INVALID_TELEGRAM_DATA'
          }
        });
      }
      
      // Parse user data
      const parsedData = this.telegramAuth.parseInitData(initData);
      const telegramUser = parsedData.user;
      
      if (!telegramUser || !telegramUser.id) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid user data in init data',
            code: 'INVALID_USER_DATA'
          }
        });
      }
      
      // Create or update user in database
      const user = await this.userManager.createOrUpdateUser(telegramUser.id, {
        username: telegramUser.username,
        language: telegramUser.language_code || 'en'
      });
      
      // Generate API token
      const apiToken = this.telegramAuth.generateApiToken(telegramUser);
      
      this.logger.apiInfo('User validated successfully', {
        userId: user.telegram_id,
        username: user.username
      });
      
      res.json({
        success: true,
        user: {
          id: user.telegram_id,
          username: user.username,
          language: user.language,
          accountType: user.account_type,
          rating: user.rating,
          reviewCount: user.review_count,
          profileComplete: !!user.account_type,
          createdAt: user.created_at
        },
        token: apiToken,
        authMethod: 'telegram_webapp'
      });
      
    } catch (error) {
      this.logger.apiError('User validation error', error, req);
      this.errorHandler.sendErrorResponse(res, error);
    }
  }
  
  async getCurrentUser(req, res) {
    try {
      const telegramUserId = req.telegramUser.id;
      
      // Get user from database
      const user = await this.userManager.getUser(telegramUserId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'User not found',
            code: 'USER_NOT_FOUND'
          }
        });
      }
      
      // Get user statistics
      const stats = await this.userManager.getUserStats(telegramUserId);
      
      res.json({
        success: true,
        user: {
          id: user.telegram_id,
          username: user.username,
          language: user.language,
          accountType: user.account_type,
          rating: user.rating,
          reviewCount: user.review_count,
          displayName: user.display_name,
          profileComplete: user.profile_complete,
          createdAt: user.created_at,
          updatedAt: user.updated_at
        },
        stats: stats || {
          totalMatches: 0,
          activeMatches: 0,
          totalMessages: 0,
          joinedDate: user.created_at
        }
      });
      
    } catch (error) {
      this.logger.apiError('Get current user error', error, req);
      this.errorHandler.sendErrorResponse(res, error);
    }
  }
  
  async updateLanguage(req, res) {
    try {
      const telegramUserId = req.telegramUser.id;
      const { language } = req.body;
      
      if (!language) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Language is required',
            code: 'MISSING_LANGUAGE'
          }
        });
      }
      
      // Validate language code
      const supportedLanguages = [
        'en', 'ru', 'hi', 'fa', 'zh', 'ar', 'es', 
        'fr', 'de', 'pt', 'it', 'ja', 'ko', 'tr', 'pl'
      ];
      
      if (!supportedLanguages.includes(language)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Unsupported language',
            code: 'UNSUPPORTED_LANGUAGE'
          }
        });
      }
      
      // Update user language
      const updatedUser = await this.userManager.updateLanguage(
        telegramUserId, 
        language
      );
      
      this.logger.apiInfo('User language updated', {
        userId: telegramUserId,
        language
      });
      
      res.json({
        success: true,
        message: 'Language updated successfully',
        user: {
          id: updatedUser.telegram_id,
          username: updatedUser.username,
          language: updatedUser.language,
          accountType: updatedUser.account_type
        }
      });
      
    } catch (error) {
      this.logger.apiError('Update language error', error, req);
      this.errorHandler.sendErrorResponse(res, error);
    }
  }
  
  async setAccountType(req, res) {
    try {
      const telegramUserId = req.telegramUser.id;
      const { accountType } = req.body;
      
      if (!accountType) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Account type is required',
            code: 'MISSING_ACCOUNT_TYPE'
          }
        });
      }
      
      if (!['company', 'agent'].includes(accountType)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid account type. Must be "company" or "agent"',
            code: 'INVALID_ACCOUNT_TYPE'
          }
        });
      }
      
      // Set account type
      const updatedUser = await this.userManager.setAccountType(
        telegramUserId, 
        accountType
      );
      
      this.logger.apiInfo('User account type set', {
        userId: telegramUserId,
        accountType
      });
      
      res.json({
        success: true,
        message: 'Account type set successfully',
        user: {
          id: updatedUser.telegram_id,
          username: updatedUser.username,
          language: updatedUser.language,
          accountType: updatedUser.account_type,
          profileComplete: false // They still need to complete their profile
        }
      });
      
    } catch (error) {
      this.logger.apiError('Set account type error', error, req);
      this.errorHandler.sendErrorResponse(res, error);
    }
  }
  
  async getAuthStatus(req, res) {
    try {
      const authStatus = this.telegramAuth.getAuthStatus(req);
      
      let user = null;
      if (authStatus.authenticated) {
        const dbUser = await this.userManager.getUser(req.telegramUser.id);
        user = dbUser ? {
          id: dbUser.telegram_id,
          username: dbUser.username,
          language: dbUser.language,
          accountType: dbUser.account_type,
          profileComplete: dbUser.profile_complete,
          displayName: dbUser.display_name
        } : null;
      }
      
      res.json({
        success: true,
        authenticated: authStatus.authenticated,
        user,
        authMethod: authStatus.authMethod,
        timestamp: authStatus.timestamp
      });
      
    } catch (error) {
      this.logger.apiError('Get auth status error', error, req);
      this.errorHandler.sendErrorResponse(res, error);
    }
  }
  
  async logout(req, res) {
    try {
      const telegramUserId = req.telegramUser.id;
      
      // Clear any server-side session data if needed
      // For Telegram WebApp, logout is mainly client-side
      
      this.logger.apiInfo('User logged out', {
        userId: telegramUserId
      });
      
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
      
    } catch (error) {
      this.logger.apiError('Logout error', error, req);
      this.errorHandler.sendErrorResponse(res, error);
    }
  }
}

module.exports = AuthAPI;