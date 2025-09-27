require('dotenv').config();

class Config {
  constructor() {
    // Server Configuration
    this.server = {
      port: parseInt(process.env.PORT) || 3000,
      host: process.env.HOST || 'localhost',
      environment: process.env.NODE_ENV || 'development',
      maxRequestSize: process.env.MAX_REQUEST_SIZE || '10mb'
    };

    // Database Configuration  
    this.database = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      name: process.env.DB_NAME || 'salesmatch',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      ssl: process.env.DB_SSL === 'true',
      maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS) || 10,
      idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT) || 10000
    };

    // Telegram Configuration
    this.telegram = {
      botToken: process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN,
      webAppUrl: process.env.WEBAPP_URL,
      webhookUrl: process.env.WEBHOOK_URL,
      secretToken: process.env.TELEGRAM_SECRET_TOKEN
    };

    // CORS Configuration
    this.cors = {
      origins: process.env.ALLOWED_ORIGINS?.split(',') || [
        'https://web.telegram.org',
        'https://telegram.org',
        'http://localhost:3000',
        'https://clean-plums-nail.loca.lt'
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    };

    // Logging Configuration
    this.logging = {
      level: process.env.LOG_LEVEL || 'info',
      maxFileSize: parseInt(process.env.LOG_MAX_FILE_SIZE) || 5242880, // 5MB
      maxFiles: parseInt(process.env.LOG_MAX_FILES) || 10
    };

    // Cache Configuration
    this.cache = {
      enabled: process.env.CACHE_ENABLED !== 'false',
      ttl: parseInt(process.env.CACHE_TTL) || 300, // 5 minutes
      maxSize: parseInt(process.env.CACHE_MAX_SIZE) || 1000
    };

    // AI Configuration
    this.ai = {
      provider: process.env.AI_PROVIDER || 'deepseek',
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
      model: process.env.AI_MODEL || 'deepseek-chat',
      maxTokens: parseInt(process.env.AI_MAX_TOKENS) || 2000
    };

    // Security Configuration
    this.security = {
      jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
      jwtExpiry: process.env.JWT_EXPIRY || '24h',
      rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000, // 15 minutes
      rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100
    };

    // Feature Flags
    this.features = {
      enableAI: process.env.ENABLE_AI !== 'false',
      enableNotifications: process.env.ENABLE_NOTIFICATIONS !== 'false',
      enableAnalytics: process.env.ENABLE_ANALYTICS !== 'false',
      mockMode: process.env.MOCK_MODE === 'true'
    };
  }

  // Validation methods
  validate() {
    const errors = [];

    // В тестовом режиме токен бота не обязателен
    if (!this.isTestMode() && !this.telegram.botToken) {
      errors.push('TELEGRAM_BOT_TOKEN or BOT_TOKEN is required (set MOCK_MODE=true for testing)');
    }

    if (this.features.enableAI && !this.ai.apiKey) {
      errors.push('DEEPSEEK_API_KEY is required when AI is enabled');
    }

    if (errors.length > 0) {
      throw new Error(`Configuration errors: ${errors.join(', ')}`);
    }
  }

  // Environment helpers
  isDevelopment() {
    return this.server.environment === 'development';
  }

  isProduction() {
    return this.server.environment === 'production';
  }

  isTestMode() {
    return this.server.environment === 'test' || this.features.mockMode;
  }
}

module.exports = new Config();