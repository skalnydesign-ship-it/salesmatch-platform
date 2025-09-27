// Core configuration and utilities
const Config = require('./core/config');
const Logger = require('./core/utils/logger');
const ResourceManager = require('./core/managers/ResourceManager');
const ErrorHandler = require('./core/utils/errorHandler');

// Express setup
const express = require('express');
const path = require('path');

// Database connection
const MockDatabaseConnection = require('./database/mockConnection');

class SalesMatchApp {
  constructor() {
    // Validate configuration
    Config.validate();
    
    this.config = Config;
    this.logger = Logger;
    this.resourceManager = ResourceManager;
    this.errorHandler = ErrorHandler;
    
    // Core components - initialized on demand
    this.app = null;
    this.server = null;
    this.bot = null;
    this.db = null;
    this.cache = null;
    
    // Manager registry for lazy loading
    this.managers = new Map();
    this.lazyModules = new Map();
    
    // Application state
    this.isInitialized = false;
    this.isShuttingDown = false;
    
    this.setupExpress();
  }
  setupExpress() {
    this.app = express();
    
    // Basic middleware setup
    this.app.use(express.json({ limit: this.config.server.maxRequestSize }));
    this.app.use(express.urlencoded({ extended: true, limit: this.config.server.maxRequestSize }));
    
    // CORS middleware
    const cors = require('cors');
    this.app.use(cors(this.config.cors));
    
    // Static files
    this.app.use('/css', express.static(path.join(process.cwd(), 'public', 'css')));
    this.app.use('/js', express.static(path.join(process.cwd(), 'public', 'js')));
    this.app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
    
    this.logger.info('Express application configured');
  }

  async initialize() {
    try {
      if (this.isInitialized) {
        this.logger.warn('Application already initialized');
        return;
      }

      this.logger.info('🚀 Initializing SalesMatch Pro Platform...');
      const startTime = Date.now();
      
      // Initialize core components in optimal order
      await this.initializeDatabase();
      await this.initializeCache();
      await this.initializeManagers();
      
      // Setup routes before starting server
      this.registerAPIRoutes();
      
      // Start server
      await this.startServer();
      
      // Initialize Telegram Bot asynchronously (non-blocking)
      this.initializeTelegramBotAsync();
      
      // Setup error handling
      this.setupErrorHandling();
      
      const duration = Date.now() - startTime;
      this.isInitialized = true;
      
      this.logger.info('✅ SalesMatch Pro Platform initialized successfully', {
        duration: `${duration}ms`,
        mode: this.config.isTestMode() ? 'TEST' : 'PRODUCTION',
        features: this.config.features
      });
      
    } catch (error) {
      this.logger.error('❌ Failed to initialize platform:', error);
      process.exit(1);
    }
  }
  
  async initializeDatabase() {
    this.logger.info('📊 Connecting to database...');
    
    const dbStartTime = Date.now();
    this.db = await new MockDatabaseConnection().initialize();
    
    // Register database connection with resource manager
    this.resourceManager.addConnection('database', this.db);
    
    const dbDuration = Date.now() - dbStartTime;
    this.logger.performance('Database initialization', dbDuration);
    
    this.logger.info('✅ Database connected successfully', {
      type: this.config.isTestMode() ? 'mock' : 'postgres',
      duration: `${dbDuration}ms`
    });
  }
  
  async initializeCache() {
    this.logger.info('🗋 Initializing cache system...');
    
    // Get default cache from resource manager
    this.cache = this.resourceManager.getCache('default');
    
    // Create specialized caches
    this.resourceManager.createCache('users', { ttl: 600, maxSize: 500 }); // 10 minutes
    this.resourceManager.createCache('profiles', { ttl: 300, maxSize: 1000 }); // 5 minutes
    this.resourceManager.createCache('matches', { ttl: 60, maxSize: 100 }); // 1 minute
    
    this.logger.info('✅ Cache system initialized', {
      enabled: this.config.cache.enabled,
      caches: ['default', 'users', 'profiles', 'matches']
    });
  }

  async initializeManagers() {
    this.logger.info('🔧 Initializing business logic managers...');
    
    const managersToInit = [
      { name: 'user', class: 'UserManager', deps: [this.db] },
      { name: 'profile', class: 'ProfileManager', deps: [this.db] },
      { name: 'swipe', class: 'SwipeEngine', deps: [this.db] },
      { name: 'subscription', class: 'SubscriptionManager', deps: [this.db, null] },
    ];
    
    // Initialize core managers
    for (const manager of managersToInit) {
      const startTime = Date.now();
      
      try {
        const ManagerClass = this.getManagerClass(manager.class);
        const instance = new ManagerClass(...manager.deps);
        
        // Inject cache if manager supports it
        if (instance.setCache && typeof instance.setCache === 'function') {
          instance.setCache(this.resourceManager.getCache(manager.name) || this.cache);
        }
        
        this.managers.set(manager.name, instance);
        
        const duration = Date.now() - startTime;
        this.logger.performance(`${manager.class} initialization`, duration);
        
      } catch (error) {
        this.logger.warn(`Failed to initialize ${manager.class}, using mock implementation:`, error.message);
        this.managers.set(manager.name, this.createMockManager(manager.name));
      }
    }
    
    // Initialize dependent managers
    await this.initializeDependentManagers();
    
    this.logger.info('✅ All managers initialized', {
      count: this.managers.size,
      managers: Array.from(this.managers.keys())
    });
  }
  
  async initializeDependentManagers() {
    // Message manager depends on subscription manager
    try {
      const MessageManager = this.getManagerClass('MessageManager');
      const messageManager = new MessageManager(this.db, this.managers.get('subscription'));
      
      if (messageManager.setCache) {
        messageManager.setCache(this.resourceManager.getCache('messages') || this.cache);
      }
      
      this.managers.set('message', messageManager);
    } catch (error) {
      this.logger.warn('Failed to initialize MessageManager:', error.message);
      this.managers.set('message', this.createMockManager('message'));
    }
    
    // AI Assistant depends on subscription manager
    try {
      if (this.config.features.enableAI) {
        const AIAssistant = this.getManagerClass('AIAssistant');
        const aiAssistant = new AIAssistant(this.managers.get('subscription'));
        this.managers.set('ai', aiAssistant);
      }
    } catch (error) {
      this.logger.warn('Failed to initialize AIAssistant:', error.message);
      if (this.config.features.enableAI) {
        this.managers.set('ai', this.createMockManager('ai'));
      }
    }
  }
  
  // Helper methods for manager initialization
  getManagerClass(className) {
    // Lazy load manager classes
    if (this.lazyModules.has(className)) {
      return this.lazyModules.get(className);
    }
    
    let ModuleClass;
    switch (className) {
      case 'UserManager':
        ModuleClass = require('./bot/modules/UserManager');
        break;
      case 'ProfileManager':
        ModuleClass = require('./models/ProfileManager');
        break;
      case 'SwipeEngine':
        ModuleClass = require('./matching/SwipeEngine');
        break;
      case 'MessageManager':
        ModuleClass = require('./messaging/MessageManager');
        break;
      case 'SubscriptionManager':
        ModuleClass = require('./payments/SubscriptionManager');
        break;
      case 'AIAssistant':
        ModuleClass = require('./ai/AIAssistant');
        break;
      default:
        throw new Error(`Unknown manager class: ${className}`);
    }
    
    this.lazyModules.set(className, ModuleClass);
    return ModuleClass;
  }
  
  createMockManager(name) {
    return {
      name: `Mock${name}Manager`,
      initialized: true,
      mock: true,
      setCache: () => {},
      // Add basic mock methods based on manager type
      ...(name === 'user' && {
        getUser: async () => ({ id: 1, mock: true }),
        createUser: async () => ({ id: 1, mock: true })
      }),
      ...(name === 'profile' && {
        getProfile: async () => ({ id: 1, mock: true }),
        updateProfile: async () => ({ id: 1, mock: true })
      })
    };
  }
  
  async startServer() {
    const port = this.config.server.port;
    const host = this.config.server.host;
    
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      this.server = this.app.listen(port, host, () => {
        const duration = Date.now() - startTime;
        
        this.logger.info(`🌐 Server running on ${host}:${port}`, {
          environment: this.config.server.environment,
          duration: `${duration}ms`,
          webAppUrl: this.config.telegram.webAppUrl
        });
        
        // Register server with resource manager
        this.resourceManager.addConnection('server', this.server);
        
        resolve();
      });
      
      this.server.on('error', (error) => {
        this.logger.error('Server start error:', error);
        reject(error);
      });
    });
  }

  initializeTelegramBotAsync() {
    // Initialize bot in background to avoid blocking server startup
    setTimeout(async () => {
      try {
        await this.initializeTelegramBot();
      } catch (error) {
        this.logger.warn('Telegram Bot initialization failed, running in web-only mode:', error.message);
      }
    }, 1000); // 1 second delay to let server start first
  }

  async initializeTelegramBot() {
    this.logger.info('🤖 Initializing Enhanced Telegram Bot...');
    const startTime = Date.now();
    
    try {
      // Используем расширенный бот вместо стандартного
      const EnhancedTelegramBot = require('./bot/handlers/EnhancedTelegramBot');
      this.bot = new EnhancedTelegramBot();
      
      await this.bot.initialize();
      await this.bot.start();
      
      // Register bot with resource manager
      this.resourceManager.addConnection('telegram-bot', this.bot);
      
      const duration = Date.now() - startTime;
      this.logger.info('✅ Enhanced Telegram Bot started successfully', {
        duration: `${duration}ms`,
        features: ['профиль', 'поиск', 'матчинг', 'сообщения', 'аналитика']
      });
      
      this.logger.info('📱 Бот поддерживает полную структуру Mini App без фото');
      
    } catch (error) {
      this.logger.error('Failed to initialize Enhanced Telegram Bot:', error);
      throw error;
    }
  }
  
  injectBotDependencies() {
    // Расширенный бот сам управляет своими данными
    this.logger.info('✅ Enhanced bot is self-contained, no dependency injection needed');
  }
  
  registerBotModules() {
    // Расширенный бот уже содержит все модули
    this.logger.info('✅ Enhanced bot modules are built-in');
  }

  registerAPIRoutes() {
    this.logger.info('🙏 Registering API routes...');
    
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      const healthData = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.0.0 OPTIMIZED',
        environment: this.config.server.environment,
        features: this.config.features,
        resources: this.resourceManager.getHealthStatus()
      };
      
      res.json(healthData);
    });
    
    // Main routes
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
    });
    
    this.app.get('/app', (req, res) => {
      res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
    });
    
    // Admin Analytics Dashboard
    this.app.get('/admin/analytics', (req, res) => {
      res.sendFile(path.join(process.cwd(), 'public', 'admin-analytics.html'));
    });
    
    // API routes with lazy loading
    this.registerAPIEndpoints();
    
    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        timestamp: new Date().toISOString()
      });
    });
    
    this.logger.info('✅ API routes registered');
  }
  
  registerAPIEndpoints() {
    // Register API endpoints with caching and manager integration
    const managersObj = this.getManagersObject();
    
    try {
      // Auth API
      const AuthAPI = require('./api/v1/auth');
      const authAPI = new AuthAPI(managersObj);
      this.app.use('/api/v1/auth', authAPI.router);
      
      // Profile API
      const ProfileAPI = require('./api/v1/profiles');
      const profileAPI = new ProfileAPI(managersObj);
      this.app.use('/api/v1/profiles', profileAPI.router);
      
      // Matching API
      const MatchingAPI = require('./api/v1/matching');
      const matchingAPI = new MatchingAPI(managersObj);
      this.app.use('/api/v1/matching', matchingAPI.router);
      
      // Messaging API
      const MessagingAPI = require('./api/v1/messaging');
      const messagingAPI = new MessagingAPI(managersObj);
      this.app.use('/api/v1/messages', messagingAPI.router);
      
      // Surveys API
      const SurveyAPI = require('./api/v1/surveys');
      const surveyAPI = new SurveyAPI(managersObj);
      this.app.use('/api/v1/surveys', surveyAPI.router);
      
      // Analytics API - Простая аналитика
      const AnalyticsAPI = require('./api/v1/analytics');
      this.app.use('/api/v1/analytics', AnalyticsAPI);
      
    } catch (error) {
      this.logger.warn('Some API modules failed to load, using fallback endpoints:', error.message);
      this.registerFallbackEndpoints();
    }
  }
  
  getManagersObject() {
    // Convert Map to object for backward compatibility
    const managersObj = {};
    for (const [key, value] of this.managers.entries()) {
      managersObj[key] = value;
    }
    return managersObj;
  }
  
  registerFallbackEndpoints() {
    // Fallback endpoints when API modules fail to load
    
    // Аналитика работает отдельно
    try {
      const AnalyticsAPI = require('./api/v1/analytics');
      this.app.use('/api/v1/analytics', AnalyticsAPI);
      this.logger.info('✅ Analytics API loaded successfully');
    } catch (error) {
      this.logger.warn('Failed to load Analytics API:', error.message);
    }
    
    this.app.get('/api/v1/*', (req, res) => {
      res.json({
        success: true,
        message: 'Fallback API endpoint',
        data: { mock: true, timestamp: new Date().toISOString() }
      });
    });
    
    this.app.post('/api/v1/*', (req, res) => {
      res.json({
        success: true,
        message: 'Fallback API endpoint - data received',
        data: { ...req.body, mock: true, timestamp: new Date().toISOString() }
      });
    });
  }
  
  setupErrorHandling() {
    // Application-level error handling
    this.app.use((error, req, res, next) => {
      this.logger.apiError('Unhandled API error', error, req);
      
      const isDevelopment = this.config.isDevelopment();
      res.status(error.status || 500).json({
        success: false,
        error: isDevelopment ? error.message : 'Internal server error',
        ...(isDevelopment && { stack: error.stack })
      });
    });
    
    // Global process error handlers
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught Exception:', error);
      if (!this.isShuttingDown) {
        this.gracefulShutdown('uncaughtException');
      }
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled Rejection:', { reason, promise });
      if (!this.isShuttingDown) {
        this.gracefulShutdown('unhandledRejection');
      }
    });
    
    // Graceful shutdown signals
    process.on('SIGTERM', () => {
      this.logger.info('SIGTERM received, starting graceful shutdown');
      this.gracefulShutdown('SIGTERM');
    });
    
    process.on('SIGINT', () => {
      this.logger.info('SIGINT received, starting graceful shutdown');
      this.gracefulShutdown('SIGINT');
    });
    
    this.logger.info('✅ Error handling configured');
  }

  async gracefulShutdown(reason = 'unknown') {
    if (this.isShuttingDown) {
      this.logger.warn('Shutdown already in progress');
      return;
    }
    
    this.isShuttingDown = true;
    this.logger.info(`🛑 Starting graceful shutdown (reason: ${reason})...`);
    
    const shutdownTimeout = setTimeout(() => {
      this.logger.error('Forced shutdown due to timeout');
      process.exit(1);
    }, 30000); // 30 seconds timeout
    
    try {
      // Stop accepting new requests
      if (this.server) {
        this.logger.info('Closing HTTP server...');
        await new Promise((resolve) => {
          this.server.close(resolve);
        });
      }
      
      // Stop Telegram Bot
      if (this.bot && this.bot.bot) {
        this.logger.info('Stopping Telegram Bot...');
        await this.bot.bot.stop('SIGTERM');
      }
      
      // Shutdown resource manager (handles caches, connections, timers)
      this.logger.info('Shutting down resource manager...');
      await this.resourceManager.shutdown();
      
      // Final cleanup
      clearTimeout(shutdownTimeout);
      
      const finalStats = this.resourceManager.getHealthStatus();
      this.logger.info('✅ Graceful shutdown completed', {
        reason,
        finalStats: {
          memoryUsage: finalStats.memory?.usage,
          cacheHits: finalStats.caches?.default?.hitRate
        }
      });
      
      process.exit(0);
      
    } catch (error) {
      clearTimeout(shutdownTimeout);
      this.logger.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  }
  
  // Utility methods
  getApplicationStats() {
    return {
      uptime: process.uptime(),
      initialized: this.isInitialized,
      managers: {
        count: this.managers.size,
        list: Array.from(this.managers.keys())
      },
      resources: this.resourceManager.getHealthStatus(),
      config: {
        environment: this.config.server.environment,
        features: this.config.features
      }
    };
  }
}

// Initialize and start the application
if (require.main === module) {
  const app = new SalesMatchApp();
  app.initialize();
}

module.exports = SalesMatchApp;