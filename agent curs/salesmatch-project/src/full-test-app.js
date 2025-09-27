require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

// Core modules
const MockDatabaseConnection = require('./database/mockConnection');
const Logger = require('./core/utils/logger');

// Bot and API modules
const TelegramBotCore = require('./bot/core/TelegramBot');

// Business logic modules
const UserManager = require('./bot/modules/UserManager');
const ProfileManager = require('./models/ProfileManager');
const SwipeEngine = require('./matching/SwipeEngine');
const MessageManager = require('./messaging/MessageManager');
const SubscriptionManager = require('./payments/SubscriptionManager');
const AIAssistant = require('./ai/AIAssistant');

class FullTestApp {
  constructor() {
    this.app = express();
    this.server = null;
    this.bot = null;
    this.managers = {};
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
    
    this.setupRoutes();
  }
  
  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0 FULL TEST',
        mode: 'COMPLETE_TESTING_MODE',
        environment: process.env.NODE_ENV || 'development'
      });
    });
    
    // Main routes
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
    });
    
    this.app.get('/app', (req, res) => {
      res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
    });
    
    // Test API endpoints
    this.app.get('/api/test', (req, res) => {
      res.json({
        success: true,
        message: 'SalesMatch Pro FULL TEST API работает!',
        data: {
          platform: 'Telegram Bot + Mini App',
          features: ['B2B Matching', 'AI Assistant', 'Analytics', 'Full Testing', 'Real-time Messaging'],
          status: 'active',
          managers: Object.keys(this.managers),
          bot_status: this.bot ? 'active' : 'inactive',
          testing_mode: 'FULL_FUNCTIONALITY'
        }
      });
    });
    
    // COMPLETE API ENDPOINTS FOR FULL TESTING
    
    // Profile APIs
    this.app.get('/api/v1/profiles/profile', async (req, res) => {
      try {
        const profile = await this.managers.profile?.getProfile(1) || {
          id: 1,
          name: 'ООО "Инновационные решения"',
          type: 'company',
          industry: 'IT',
          description: 'Разрабатываем и внедряем корпоративные IT-решения для крупного бизнеса',
          location: 'Москва',
          employees: '50-100',
          founded: 2018,
          revenue: '10-50 млн руб',
          website: 'https://innovsolutions.ru',
          email: 'contact@innovsolutions.ru',
          phone: '+7 495 123-45-67'
        };
        res.json({ success: true, data: profile });
      } catch (error) {
        res.json({ success: false, error: error.message });
      }
    });
    
    this.app.post('/api/v1/profiles/profile', async (req, res) => {
      try {
        const updatedProfile = await this.managers.profile?.updateProfile(req.body) || {
          ...req.body,
          id: 1,
          updated_at: new Date().toISOString()
        };
        res.json({ success: true, data: updatedProfile });
      } catch (error) {
        res.json({ success: false, error: error.message });
      }
    });

    // Matching/Swipe APIs  
    this.app.get('/api/v1/matching/swipe/next', async (req, res) => {
      try {
        const profiles = await this.managers.swipe?.getNextProfiles(3) || [
          {
            id: 1,
            name: 'ООО "ТехИнновации"',
            type: 'Компания • IT Services',
            compatibility: 87,
            tags: ['IT', 'B2B', 'Москва'],
            description: 'Разработка корпоративного ПО и цифровая трансформация',
            employees: '100-200',
            industry: 'Software Development'
          },
          {
            id: 2,
            name: 'ПАО "Цифровые Решения"',
            type: 'Корпорация • Software',
            compatibility: 92,
            tags: ['Разработка', 'Digital', 'Enterprise'],
            description: 'Лидер в области цифровых решений для крупного бизнеса',
            employees: '500+',
            industry: 'Digital Solutions'
          },
          {
            id: 3,
            name: 'ООО "Бизнес Партнеры"',
            type: 'Компания • Консалтинг',
            compatibility: 78,
            tags: ['B2B', 'Консалтинг', 'Партнерство'],
            description: 'Бизнес-консалтинг и стратегическое партнерство',
            employees: '50-100',
            industry: 'Business Consulting'
          }
        ];
        res.json({ success: true, data: profiles });
      } catch (error) {
        res.json({ success: false, error: error.message });
      }
    });
    
    this.app.post('/api/v1/matching/swipe', async (req, res) => {
      try {
        const result = await this.managers.swipe?.processSwipe(req.body) || {
          match: Math.random() > 0.7,
          profile_id: req.body.profile_id,
          action: req.body.action,
          message: req.body.action === 'like' ? 'Взаимная симпатия! Теперь вы можете начать общение.' : 'Профиль добавлен в отклоненные',
          timestamp: new Date().toISOString()
        };
        res.json({ success: true, data: result });
      } catch (error) {
        res.json({ success: false, error: error.message });
      }
    });

    this.app.get('/api/v1/matching/matches', async (req, res) => {
      try {
        const matches = await this.managers.swipe?.getMatches() || [
          {
            id: 1,
            name: 'ООО "ТехИнновации"',
            compatibility: 87,
            matched_at: new Date().toISOString(),
            status: 'active'
          },
          {
            id: 2,
            name: 'ПАО "Цифровые Решения"',
            compatibility: 92,
            matched_at: new Date(Date.now() - 86400000).toISOString(),
            status: 'contacted'
          }
        ];
        res.json({ success: true, data: matches });
      } catch (error) {
        res.json({ success: false, error: error.message });
      }
    });
    
    // Messaging APIs
    this.app.get('/api/v1/messages/conversations', async (req, res) => {
      try {
        const conversations = await this.managers.message?.getConversations() || [
          {
            id: 1,
            name: 'ООО "ТехИнновации"',
            lastMessage: 'Отлично! Давайте обсудим детали сотрудничества на следующей неделе.',
            timestamp: new Date().toISOString(),
            unread: 2,
            avatar: '/uploads/avatars/tech-innovations.jpg'
          },
          {
            id: 2,
            name: 'ПАО "Цифровые Решения"',
            lastMessage: 'Интересное предложение, рассмотрим варианты интеграции.',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            unread: 0,
            avatar: '/uploads/avatars/digital-solutions.jpg'
          },
          {
            id: 3,
            name: 'ООО "Бизнес Партнеры"',
            lastMessage: 'Спасибо за презентацию, готовы к следующему этапу.',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            unread: 1,
            avatar: '/uploads/avatars/business-partners.jpg'
          }
        ];
        res.json({ success: true, data: conversations });
      } catch (error) {
        res.json({ success: false, error: error.message });
      }
    });
    
    this.app.get('/api/v1/messages/:conversationId', async (req, res) => {
      try {
        const messages = await this.managers.message?.getMessages(req.params.conversationId) || [
          {
            id: 1,
            senderId: 1,
            text: 'Здравствуйте! Заинтересованы в сотрудничестве по разработке корпоративных решений.',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            type: 'text'
          },
          {
            id: 2,
            senderId: 2,
            text: 'Добро пожаловать! Расскажите больше о ваших потребностях и целевых рынках.',
            timestamp: new Date(Date.now() - 5400000).toISOString(),
            type: 'text'
          },
          {
            id: 3,
            senderId: 1,
            text: 'Нам нужна CRM-система для управления клиентской базой. Бюджет до 2 млн рублей.',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            type: 'text'
          },
          {
            id: 4,
            senderId: 2,
            text: 'Отлично! У нас есть готовые решения в этом сегменте. Можем провести презентацию.',
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            type: 'text'
          }
        ];
        res.json({ success: true, data: messages });
      } catch (error) {
        res.json({ success: false, error: error.message });
      }
    });
    
    this.app.post('/api/v1/messages', async (req, res) => {
      try {
        const message = await this.managers.message?.sendMessage(req.body) || {
          id: Date.now(),
          senderId: req.body.senderId,
          conversationId: req.body.conversationId,
          text: req.body.text,
          timestamp: new Date().toISOString(),
          type: req.body.type || 'text',
          status: 'sent'
        };
        res.json({ success: true, data: message });
      } catch (error) {
        res.json({ success: false, error: error.message });
      }
    });

    // AI Assistant APIs
    this.app.get('/api/v1/ai/profile-suggestions', async (req, res) => {
      try {
        const suggestions = await this.managers.ai?.getProfileSuggestions() || {
          score: 72,
          suggestions: [
            'Добавьте больше ключевых слов в описание компании',
            'Обновите фотографии и логотип в профиле',
            'Укажите конкретные достижения и проекты',
            'Добавьте контактную информацию и социальные сети',
            'Обновите информацию о текущих потребностях'
          ],
          improvements: {
            description: 'Расширьте описание деятельности компании',
            keywords: 'Добавьте отраслевые ключевые слова',
            media: 'Загрузите качественные изображения',
            contact: 'Укажите предпочтительные способы связи'
          }
        };
        res.json({ success: true, data: suggestions });
      } catch (error) {
        res.json({ success: false, error: error.message });
      }
    });

    this.app.post('/api/v1/ai/analyze-compatibility', async (req, res) => {
      try {
        const analysis = await this.managers.ai?.analyzeCompatibility(req.body) || {
          score: Math.floor(Math.random() * 30) + 70,
          factors: [
            { name: 'Отраслевое соответствие', score: 85, weight: 0.3 },
            { name: 'Географическая близость', score: 90, weight: 0.2 },
            { name: 'Размер компании', score: 75, weight: 0.2 },
            { name: 'Бюджетная совместимость', score: 80, weight: 0.3 }
          ],
          recommendations: [
            'Высокая совместимость в IT-сегменте',
            'Географическое расположение способствует сотрудничеству',
            'Размеры компаний подходят для партнерства'
          ]
        };
        res.json({ success: true, data: analysis });
      } catch (error) {
        res.json({ success: false, error: error.message });
      }
    });

    // Subscription & Analytics APIs
    this.app.get('/api/v1/subscription/status', async (req, res) => {
      try {
        const status = await this.managers.subscription?.getStatus() || {
          plan: 'premium',
          active: true,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          features: ['unlimited_swipes', 'ai_assistant', 'analytics', 'priority_support'],
          usage: {
            swipes_used: 45,
            swipes_limit: 1000,
            matches_count: 12,
            messages_sent: 89
          }
        };
        res.json({ success: true, data: status });
      } catch (error) {
        res.json({ success: false, error: error.message });
      }
    });

    this.app.get('/api/v1/analytics/dashboard', async (req, res) => {
      try {
        const analytics = {
          overview: {
            total_views: 156,
            total_likes: 45,
            total_matches: 12,
            total_conversations: 8,
            conversion_rate: 26.7
          },
          recent_activity: [
            { type: 'match', company: 'ТехИнновации', timestamp: new Date().toISOString() },
            { type: 'message', company: 'Цифровые Решения', timestamp: new Date(Date.now() - 3600000).toISOString() },
            { type: 'like', company: 'Бизнес Партнеры', timestamp: new Date(Date.now() - 7200000).toISOString() }
          ],
          performance: {
            week: [12, 18, 23, 15, 28, 32, 25],
            month: [145, 189, 178, 156, 203, 234, 187, 156]
          }
        };
        res.json({ success: true, data: analytics });
      } catch (error) {
        res.json({ success: false, error: error.message });
      }
    });

    // Search & Filter APIs
    this.app.get('/api/v1/search/companies', async (req, res) => {
      try {
        const { query, industry, location, size } = req.query;
        const results = [
          {
            id: 1,
            name: 'ООО "ТехСтарт"',
            industry: 'IT',
            location: 'Москва',
            size: '10-50',
            compatibility: 89
          },
          {
            id: 2,
            name: 'ЗАО "ИнноваТех"',
            industry: 'Software',
            location: 'СПб',
            size: '50-100',
            compatibility: 76
          }
        ];
        res.json({ success: true, data: results, total: results.length });
      } catch (error) {
        res.json({ success: false, error: error.message });
      }
    });

    // Settings APIs
    this.app.get('/api/v1/settings/preferences', async (req, res) => {
      try {
        const preferences = {
          notifications: {
            email: true,
            push: true,
            telegram: true
          },
          matching: {
            auto_like: false,
            industry_filter: ['IT', 'Software'],
            location_radius: 50,
            company_size: ['50-100', '100-500']
          },
          privacy: {
            profile_visibility: 'public',
            contact_info_visible: true,
            activity_status: true
          }
        };
        res.json({ success: true, data: preferences });
      } catch (error) {
        res.json({ success: false, error: error.message });
      }
    });

    this.app.post('/api/v1/settings/preferences', async (req, res) => {
      try {
        const updatedPreferences = { ...req.body, updated_at: new Date().toISOString() };
        res.json({ success: true, data: updatedPreferences });
      } catch (error) {
        res.json({ success: false, error: error.message });
      }
    });
    
    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        available_endpoints: [
          '/api/test',
          '/api/v1/profiles/*',
          '/api/v1/matching/*',
          '/api/v1/messages/*',
          '/api/v1/ai/*',
          '/api/v1/subscription/*',
          '/api/v1/analytics/*',
          '/api/v1/search/*',
          '/api/v1/settings/*'
        ]
      });
    });
  }
  
  async initialize() {
    try {
      this.logger.info('🚀 Initializing SalesMatch Pro FULL TEST Platform...');
      
      // Initialize database
      this.db = await new MockDatabaseConnection().initialize();
      this.logger.info('✅ Mock database connected');
      
      // Initialize managers with full functionality
      await this.initializeManagers();
      
      // Start web server first
      await this.startServer();
      
      // Initialize Telegram Bot in background
      this.initializeTelegramBotAsync();
      
      this.logger.info('✅ SalesMatch Pro FULL TEST Platform initialized successfully');
      this.logger.info('🧪 ALL FEATURES AVAILABLE FOR TESTING');
      
    } catch (error) {
      this.logger.error('❌ Failed to initialize:', error);
      process.exit(1);
    }
  }
  
  async initializeManagers() {
    this.logger.info('🔧 Initializing all business logic managers...');
    
    try {
      // Initialize all managers with dependency injection
      this.managers.user = new UserManager(this.db);
      this.managers.profile = new ProfileManager(this.db);
      this.managers.swipe = new SwipeEngine(this.db);
      this.managers.subscription = new SubscriptionManager(this.db, null); // Bot will be injected later
      this.managers.message = new MessageManager(this.db, this.managers.subscription);
      this.managers.ai = new AIAssistant(this.managers.subscription);
      
      this.logger.info('✅ All managers initialized with full functionality');
    } catch (error) {
      this.logger.warn('⚠️ Some managers failed to initialize, using mock implementations');
      this.logger.info('📱 Web interface remains fully functional with mock data');
    }
  }
  
  async initializeTelegramBotAsync() {
    setTimeout(async () => {
      try {
        this.logger.info('🤖 Initializing Telegram Bot (async)...');
        
        this.bot = await TelegramBotCore.initialize();
        
        // Properly inject UserManager
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
        
        this.bot.userManager = this.managers.user;
        
        // Inject bot into subscription manager
        this.managers.subscription.bot = this.bot;
        
        // Start bot
        await this.bot.bot.launch();
        this.logger.info('✅ Telegram Bot started successfully with full integration');
        
      } catch (error) {
        this.logger.error('⚠️ Telegram Bot failed to start:', error.message);
        this.logger.info('📱 Web interface remains fully functional');
      }
    }, 2000);
  }
  
  async startServer() {
    const port = process.env.PORT || 3000;
    
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(port, () => {
        this.logger.info(`🌐 FULL TEST Web Server running on port ${port}`);
        this.logger.info(`📱 Local URL: http://localhost:${port}`);
        this.logger.info(`🔗 HTTPS URL: ${process.env.WEBAPP_URL}`);
        this.logger.info(`🧪 Mode: COMPLETE TESTING WITH ALL FEATURES`);
        this.logger.info(`🎯 Ready for comprehensive functionality testing!`);
        resolve();
      });
      
      this.server.on('error', reject);
    });
  }
  
  async stop() {
    this.logger.info('🛑 Stopping FULL TEST application...');
    
    if (this.server) {
      this.server.close();
    }
    
    if (this.bot && this.bot.bot) {
      await this.bot.bot.stop();
    }
    
    this.logger.info('✅ FULL TEST application stopped');
  }
}

// Start the full test application
if (require.main === module) {
  const app = new FullTestApp();
  
  // Graceful shutdown
  process.on('SIGTERM', () => app.stop());
  process.on('SIGINT', () => app.stop());
  
  app.initialize();
}

module.exports = FullTestApp;