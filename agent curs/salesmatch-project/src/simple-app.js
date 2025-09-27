require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

// Core modules
const MockDatabaseConnection = require('./database/mockConnection');
const Logger = require('./core/utils/logger');

// Bot module
const TelegramBotCore = require('./bot/core/TelegramBot');
const UserManager = require('./bot/modules/UserManager');
const SSLManager = require('./bot/modules/SSLManager');

class SimpleSalesMatchApp {
  constructor() {
    this.app = express();
    this.server = null;
    this.bot = null;
    this.userManager = null;
    
    this.logger = Logger;
    this.setupExpress();
  }
  
  setupExpress() {
    // CORS configuration
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || [
        'https://web.telegram.org',
        'https://telegram.org',
        'http://localhost:3000',
        'https://clean-plums-nail.loca.lt'
      ],
      credentials: true
    }));
    
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // Static files
    this.app.use('/css', express.static(path.join(process.cwd(), 'public', 'css')));
    this.app.use('/js', express.static(path.join(process.cwd(), 'public', 'js')));
    this.app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
    
    // Routes
    this.setupRoutes();
  }
  
  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      });
    });
    
    // Main app route
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
    });
    
    // Telegram Mini App route
    this.app.get('/app', (req, res) => {
      res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
    });
    
    // Simple API endpoints for the interface
    this.app.get('/api/test', (req, res) => {
      res.json({
        success: true,
        message: 'SalesMatch Pro API работает!',
        data: {
          platform: 'Telegram Bot + Mini App',
          features: ['B2B Matching', 'AI Assistant', 'Analytics'],
          status: 'active'
        }
      });
    });
    
    // Mock API endpoints for the frontend
    this.app.get('/api/v1/profiles/profile', (req, res) => {
      res.json({
        success: true,
        data: {
          id: 1,
          name: 'ООО "Инновационные решения"',
          type: 'company',
          industry: 'IT',
          description: 'Разрабатываем и внедряем корпоративные IT-решения'
        }
      });
    });
    
    this.app.get('/api/v1/matching/recommendations', (req, res) => {
      res.json({
        success: true,
        data: [
          {
            id: 1,
            name: 'ООО "ТехИнновации"',
            type: 'Компания • IT Services',
            compatibility: 87,
            tags: ['IT', 'B2B', 'Москва']
          }
        ]
      });
    });
    
    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found'
      });
    });
  }
  
  async initialize() {
    try {
      this.logger.info('🚀 Initializing Simple SalesMatch Pro...');
      
      // Initialize database
      this.db = await new MockDatabaseConnection().initialize();
      this.logger.info('✅ Mock database connected');
      
      // Initialize User Manager
      this.userManager = new UserManager(this.db);
      
      // Initialize Telegram Bot
      await this.initializeTelegramBot();
      
      // Start web server
      await this.startServer();
      
      this.logger.info('✅ Simple SalesMatch Pro initialized successfully');
      
    } catch (error) {
      this.logger.error('❌ Failed to initialize:', error);
      process.exit(1);
    }
  }
  
  async initializeTelegramBot() {
    this.logger.info('🤖 Initializing Telegram Bot...');
    
    this.bot = await TelegramBotCore.initialize();
    
    // Inject UserManager
    this.bot.checkUserExists = async (userId) => {
      try {
        const user = await this.userManager.getUser(userId);
        return user;
      } catch (error) {
        if (error.message.includes('not found')) {
          return null;
        }
        throw error;
      }
    };
    
    this.bot.userManager = this.userManager;
    
    // Initialize SSL Manager
    new SSLManager(this.bot);
    
    // Start bot
    await this.bot.bot.launch();
    this.logger.info('✅ Telegram Bot started successfully');
  }
  
  async startServer() {
    const port = process.env.PORT || 3000;
    
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(port, () => {
        this.logger.info(`🌐 Web Server running on port ${port}`);
        this.logger.info(`📱 Local URL: http://localhost:${port}`);
        this.logger.info(`🔗 HTTPS URL: ${process.env.WEBAPP_URL}`);
        resolve();
      });
      
      this.server.on('error', reject);
    });
  }
  
  async stop() {
    this.logger.info('🛑 Stopping application...');
    
    if (this.server) {
      this.server.close();
    }
    
    if (this.bot && this.bot.bot) {
      await this.bot.bot.stop();
    }
    
    this.logger.info('✅ Application stopped');
  }
}

// Start the application
if (require.main === module) {
  const app = new SimpleSalesMatchApp();
  
  // Graceful shutdown
  process.on('SIGTERM', () => app.stop());
  process.on('SIGINT', () => app.stop());
  
  app.initialize();
}

module.exports = SimpleSalesMatchApp;