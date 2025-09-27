const Logger = require('../core/utils/logger');

class MockDatabaseConnection {
  constructor() {
    // In-memory storage for testing
    this.users = new Map();
    this.companyProfiles = new Map();
    this.agentProfiles = new Map();
    this.matches = new Map();
    this.messages = new Map();
    
    this.pool = {
      query: this.query.bind(this),
      end: async () => {
        Logger.info('Mock database connection closed');
      }
    };
    this.logger = Logger;
  }

  async initialize() {
    this.logger.info('Mock database connection initialized for testing');
    return this;
  }

  async query(sql, params = []) {
    this.logger.info(`Mock DB Query: ${sql.substring(0, 100)}...`);
    
    // Parse SQL to understand the operation
    const sqlLower = sql.toLowerCase().trim();
    
    if (sqlLower.includes('select') && sqlLower.includes('users')) {
      return this.handleUserSelect(sql, params);
    }
    
    if (sqlLower.includes('insert') && sqlLower.includes('users')) {
      return this.handleUserInsert(sql, params);
    }
    
    if (sqlLower.includes('update') && sqlLower.includes('users')) {
      return this.handleUserUpdate(sql, params);
    }
    
    // Default empty response
    return { rows: [], rowCount: 0 };
  }
  
  handleUserSelect(sql, params) {
    const userId = params[0];
    if (!userId) return { rows: [], rowCount: 0 };
    
    const user = this.users.get(userId);
    if (!user) return { rows: [], rowCount: 0 };
    
    // Simulate the complex query with joins
    const result = {
      telegram_id: user.telegram_id,
      username: user.username,
      language: user.language,
      account_type: user.account_type,
      rating: user.rating || 0,
      review_count: user.review_count || 0,
      created_at: user.created_at,
      updated_at: user.updated_at,
      display_name: user.account_type === 'company' ? 'Test Company' : 'Test Agent',
      profile_complete: !!user.account_type
    };
    
    return { rows: [result], rowCount: 1 };
  }
  
  handleUserInsert(sql, params) {
    const [telegramId, username, language, accountType] = params;
    
    const user = {
      telegram_id: telegramId,
      username: username,
      language: language || 'en',
      account_type: accountType,
      rating: 0,
      review_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    this.users.set(telegramId, user);
    this.logger.info(`Mock DB: Created user ${telegramId} with account_type: ${accountType}`);
    
    return { rows: [user], rowCount: 1 };
  }
  
  handleUserUpdate(sql, params) {
    // Handle different update scenarios
    if (sql.includes('account_type')) {
      const [telegramId, accountType] = params;
      const user = this.users.get(telegramId);
      
      if (user) {
        user.account_type = accountType;
        user.updated_at = new Date().toISOString();
        this.users.set(telegramId, user);
        this.logger.info(`Mock DB: Updated user ${telegramId} account_type to: ${accountType}`);
        return { rows: [user], rowCount: 1 };
      }
    }
    
    if (sql.includes('language')) {
      const [telegramId, language] = params;
      const user = this.users.get(telegramId);
      
      if (user) {
        user.language = language;
        user.updated_at = new Date().toISOString();
        this.users.set(telegramId, user);
        this.logger.info(`Mock DB: Updated user ${telegramId} language to: ${language}`);
        return { rows: [user], rowCount: 1 };
      }
    }
    
    return { rows: [], rowCount: 0 };
  }

  async healthCheck() {
    return {
      status: 'healthy',
      message: 'Mock database is always healthy',
      timestamp: new Date().toISOString(),
      users_count: this.users.size
    };
  }

  async close() {
    this.logger.info('Mock database connection closed');
  }
}

module.exports = MockDatabaseConnection;