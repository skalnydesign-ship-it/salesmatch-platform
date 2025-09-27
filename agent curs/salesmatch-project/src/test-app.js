require('dotenv').config();
const express = require('express');
const path = require('path');

// Core modules
const MockDatabaseConnection = require('./database/mockConnection');
const Logger = require('./core/utils/logger');
const ErrorHandler = require('./core/utils/errorHandler');

// Bot and API modules
const TelegramBotCore = require('./bot/core/TelegramBot');
const MiniAppServer = require('./miniapp/server');

// Business logic modules
const UserManager = require('./bot/modules/UserManager');
const ProfileManager = require('./models/ProfileManager');
const SwipeEngine = require('./matching/SwipeEngine');
const MessageManager = require('./messaging/MessageManager');
const SubscriptionManager = require('./payments/SubscriptionManager');
const AIAssistant = require('./ai/AIAssistant');

class SalesMatchTestApp {
  constructor() {
    this.app = express();
    this.server = null;
    this.bot = null;
    this.managers = {};
    
    this.logger = Logger;
    this.errorHandler = ErrorHandler;
  }
  
  async initialize() {
    try {
      this.logger.info('🚀 Initializing SalesMatch Pro Platform (TEST MODE)...');
      
      // Initialize mock database connection
      await this.initializeDatabase();
      
      // Initialize managers
      await this.initializeManagers();
      
      // Initialize Telegram Bot (if BOT_TOKEN is provided)
      if (process.env.BOT_TOKEN && process.env.BOT_TOKEN !== 'test_bot_token_here') {
        await this.initializeTelegramBot();
      } else {
        this.logger.info('⚠️  Skipping Telegram Bot initialization - no valid token provided');
      }
      
      // Initialize Mini App Server
      await this.initializeMiniApp();
      
      // Setup error handling
      this.setupErrorHandling();
      
      this.logger.info('✅ SalesMatch Pro Platform (TEST MODE) initialized successfully');
      
    } catch (error) {
      this.logger.error('❌ Failed to initialize platform:', error);
      process.exit(1);
    }
  }
  
  async initializeDatabase() {
    this.logger.info('📊 Connecting to mock database...');
    this.db = await new MockDatabaseConnection().initialize();
    this.logger.info('✅ Mock database connected successfully');
  }
  
  async initializeManagers() {
    this.logger.info('🔧 Initializing business logic managers...');
    
    // Initialize all managers with dependency injection
    this.managers.user = new UserManager(this.db);
    this.managers.profile = new ProfileManager(this.db);
    this.managers.swipe = new SwipeEngine(this.db);
    this.managers.subscription = new SubscriptionManager(this.db, null); // Bot will be injected later
    this.managers.message = new MessageManager(this.db, this.managers.subscription);
    this.managers.ai = new AIAssistant(this.managers.subscription);
    
    this.logger.info('✅ All managers initialized');
  }
  
  async initializeTelegramBot() {
    this.logger.info('🤖 Initializing Telegram Bot...');
    
    try {
      this.bot = await TelegramBotCore.initialize();
      
      // Inject UserManager into bot for user operations
      this.bot.checkUserExists = async (userId) => {
        try {
          const user = await this.managers.user.getUser(userId);
          return user;
        } catch (error) {
          if (error.message.includes('not found')) {
            return null;
          }
          throw error;
        }
      };
      
      // Inject UserManager for direct access
      this.bot.userManager = this.managers.user;
      
      // Inject bot into subscription manager
      this.managers.subscription.bot = this.bot;
      
      // Start bot
      await this.bot.bot.launch();
      this.logger.info('✅ Telegram Bot started successfully');
    } catch (error) {
      this.logger.error('❌ Failed to start Telegram Bot:', error.message);
      this.logger.info('🔄 Continuing without Telegram Bot...');
    }
  }
  
  async initializeMiniApp() {
    this.logger.info('🌐 Initializing Mini App Server...');
    
    // Register API routes
    this.registerAPIRoutes();
    
    // Start Mini App server
    const port = process.env.PORT || 3000;
    this.server = await MiniAppServer.start(port);
    
    this.logger.info(`✅ Mini App Server running on port ${port}`);
    this.logger.info(`🌍 Test URL: http://localhost:${port}`);
  }
  
  registerAPIRoutes() {
    // Import and register existing API modules
    const AuthAPI = require('./api/v1/auth');
    const ProfileAPI = require('./api/v1/profiles');
    const MatchingAPI = require('./api/v1/matching');
    const MessagingAPI = require('./api/v1/messaging');
    
    // Register API routes with version control
    MiniAppServer.registerAPIVersion('v1', [
      { method: 'use', path: '/auth', handlers: [new AuthAPI(this.managers).router] },
      { method: 'use', path: '/profiles', handlers: [new ProfileAPI(this.managers).router] },
      { method: 'use', path: '/matching', handlers: [new MatchingAPI(this.managers).router] },
      { method: 'use', path: '/messages', handlers: [new MessagingAPI(this.managers).router] }
    ]);
  }
  
  setupErrorHandling() {
    // Global error handlers
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught Exception:', error);
      this.gracefulShutdown();
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      this.gracefulShutdown();
    });
    
    // Graceful shutdown signals
    process.on('SIGTERM', () => {
      this.logger.info('SIGTERM received, starting graceful shutdown');
      this.gracefulShutdown();
    });
    
    process.on('SIGINT', () => {
      this.logger.info('SIGINT received, starting graceful shutdown');
      this.gracefulShutdown();
    });
  }
  
  async gracefulShutdown() {
    this.logger.info('🛑 Starting graceful shutdown...');
    
    try {
      // Stop accepting new requests
      if (this.server) {
        this.server.close();
      }
      
      // Stop Telegram Bot
      if (this.bot && this.bot.bot) {
        await this.bot.bot.stop('SIGTERM');
      }
      
      // Close database connections
      if (this.db && this.db.pool) {
        await this.db.pool.end();
      }
      
      this.logger.info('✅ Graceful shutdown completed');
      process.exit(0);
      
    } catch (error) {
      this.logger.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// Initialize and start the application
if (require.main === module) {
  const app = new SalesMatchTestApp();
  app.initialize();
}

module.exports = SalesMatchTestApp;