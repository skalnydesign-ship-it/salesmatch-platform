const Logger = require('../../core/utils/logger');
const ErrorHandler = require('../../core/utils/errorHandler');
const Validator = require('../../core/utils/validator');

class UserManager {
  constructor(db) {
    this.db = db;
    this.cache = null; // Will be injected by ResourceManager
    this.logger = Logger;
    this.errorHandler = ErrorHandler;
    this.validator = Validator;
    
    // Performance metrics
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      dbQueries: 0
    };
  }
  
  // Cache injection method
  setCache(cache) {
    this.cache = cache;
    this.logger.info('UserManager: Cache injected', {
      cacheEnabled: !!cache,
      type: cache?.constructor?.name
    });
  }
  
  async createOrUpdateUser(telegramId, data) {
    try {
      // Validate input data
      const validatedData = this.validator.validate({
        telegramId,
        username: data.username,
        language: data.language,
        accountType: data.accountType
      }, 'userRegistration');
      
      const query = `
        INSERT INTO users (telegram_id, username, language, account_type, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (telegram_id) 
        DO UPDATE SET 
          username = COALESCE(EXCLUDED.username, users.username),
          language = COALESCE(EXCLUDED.language, users.language),
          account_type = COALESCE(EXCLUDED.account_type, users.account_type),
          updated_at = NOW()
        RETURNING *
      `;
      
      const result = await this.db.query(query, [
        validatedData.telegramId,
        validatedData.username,
        validatedData.language,
        validatedData.accountType
      ]);
      
      const user = result.rows[0];
      
      // Update cache with new approach
      if (this.cache) {
        this.cache.setUser(telegramId, user);
      }
      
      this.logger.businessInfo('USER_MANAGER', 'User created/updated', {
        userId: telegramId,
        accountType: user.account_type,
        cached: !!this.cache
      });
      
      return user;
      
    } catch (error) {
      throw this.errorHandler.handleBusinessError(
        error, 
        'USER_MANAGER', 
        'createOrUpdateUser'
      );
    }
  }
  
  async getUser(telegramId) {
    try {
      const startTime = Date.now();
      
      // Check cache first
      if (this.cache) {
        const cachedUser = this.cache.getUser(telegramId);
        if (cachedUser) {
          this.metrics.cacheHits++;
          this.logger.debug(`User ${telegramId} found in cache`);
          return cachedUser;
        }
        this.metrics.cacheMisses++;
      }
      
      this.metrics.dbQueries++;
      const query = `
        SELECT u.*, 
               CASE 
                 WHEN u.account_type = 'company' THEN cp.company_name
                 WHEN u.account_type = 'agent' THEN ap.full_name
                 ELSE null
               END as display_name,
               CASE 
                 WHEN u.account_type = 'company' THEN (cp.company_name IS NOT NULL)
                 WHEN u.account_type = 'agent' THEN (ap.full_name IS NOT NULL)
                 ELSE false
               END as profile_complete
        FROM users u
        LEFT JOIN company_profiles cp ON u.telegram_id = cp.user_id
        LEFT JOIN agent_profiles ap ON u.telegram_id = ap.user_id
        WHERE u.telegram_id = $1
      `;
      
      const result = await this.db.query(query, [telegramId]);
      const duration = Date.now() - startTime;
      
      if (result.rows[0]) {
        const user = result.rows[0];
        
        // Cache the result
        if (this.cache) {
          this.cache.setUser(telegramId, user);
        }
        
        this.logger.performance('UserManager.getUser', duration, {
          userId: telegramId,
          cached: false
        });
        
        return user;
      }
      
      return null;
      
    } catch (error) {
      throw this.errorHandler.handleBusinessError(
        error, 
        'USER_MANAGER', 
        'getUser'
      );
    }
  }
  
  async getUserByUsername(username) {
    try {
      const query = 'SELECT * FROM users WHERE username = $1';
      const result = await this.db.query(query, [username]);
      return result.rows[0] || null;
      
    } catch (error) {
      throw this.errorHandler.handleBusinessError(
        error, 
        'USER_MANAGER', 
        'getUserByUsername'
      );
    }
  }
  
  async setAccountType(telegramId, accountType) {
    try {
      const validTypes = ['company', 'agent'];
      if (!validTypes.includes(accountType)) {
        throw new ErrorHandler.ValidationError('Invalid account type');
      }
      
      const query = `
        UPDATE users 
        SET account_type = $2, updated_at = NOW() 
        WHERE telegram_id = $1 
        RETURNING *
      `;
      
      const result = await this.db.query(query, [telegramId, accountType]);
      
      if (!result.rows[0]) {
        throw new ErrorHandler.NotFoundError('User not found');
      }
      
      const user = result.rows[0];
      
      // Update cache with new approach
      if (this.cache) {
        this.cache.setUser(telegramId, user);
      }
      
      this.logger.businessInfo('USER_MANAGER', 'Account type set', {
        userId: telegramId,
        accountType
      });
      
      return user;
      
    } catch (error) {
      throw this.errorHandler.handleBusinessError(
        error, 
        'USER_MANAGER', 
        'setAccountType'
      );
    }
  }
  
  async updateLanguage(telegramId, language) {
    try {
      const validatedData = this.validator.validate({
        language
      }, 'userUpdate');
      
      const query = `
        UPDATE users 
        SET language = $2, updated_at = NOW() 
        WHERE telegram_id = $1 
        RETURNING *
      `;
      
      const result = await this.db.query(query, [telegramId, validatedData.language]);
      
      if (!result.rows[0]) {
        throw new ErrorHandler.NotFoundError('User not found');
      }
      
      const user = result.rows[0];
      
      // Update cache with new approach
      if (this.cache) {
        this.cache.setUser(telegramId, user);
      }
      
      this.logger.businessInfo('USER_MANAGER', 'Language updated', {
        userId: telegramId,
        language: validatedData.language
      });
      
      return user;
      
    } catch (error) {
      throw this.errorHandler.handleBusinessError(
        error, 
        'USER_MANAGER', 
        'updateLanguage'
      );
    }
  }
  
  async updateRating(telegramId, newRating, reviewCount) {
    try {
      const query = `
        UPDATE users 
        SET rating = $2, review_count = $3, updated_at = NOW() 
        WHERE telegram_id = $1 
        RETURNING *
      `;
      
      const result = await this.db.query(query, [telegramId, newRating, reviewCount]);
      
      if (!result.rows[0]) {
        throw new ErrorHandler.NotFoundError('User not found');
      }
      
      const user = result.rows[0];
      
      // Update cache with new approach
      if (this.cache) {
        this.cache.setUser(telegramId, user);
      }
      
      this.logger.businessInfo('USER_MANAGER', 'Rating updated', {
        userId: telegramId,
        newRating,
        reviewCount
      });
      
      return user;
      
    } catch (error) {
      throw this.errorHandler.handleBusinessError(
        error, 
        'USER_MANAGER', 
        'updateRating'
      );
    }
  }
  
  async getUsersWithProfiles(accountType = null, limit = 50, offset = 0) {
    try {
      let query = `
        SELECT u.*, 
               CASE 
                 WHEN u.account_type = 'company' THEN cp.company_name
                 WHEN u.account_type = 'agent' THEN ap.full_name
               END as display_name,
               CASE 
                 WHEN u.account_type = 'company' THEN cp.country
                 WHEN u.account_type = 'agent' THEN ap.countries
               END as location_info
        FROM users u
        LEFT JOIN company_profiles cp ON u.telegram_id = cp.user_id
        LEFT JOIN agent_profiles ap ON u.telegram_id = ap.user_id
        WHERE (
          (u.account_type = 'company' AND cp.company_name IS NOT NULL) OR
          (u.account_type = 'agent' AND ap.full_name IS NOT NULL)
        )
      `;
      
      const params = [];
      
      if (accountType) {
        query += ' AND u.account_type = $1';
        params.push(accountType);
      }
      
      query += ` ORDER BY u.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);
      
      const result = await this.db.query(query, params);
      return result.rows;
      
    } catch (error) {
      throw this.errorHandler.handleBusinessError(
        error, 
        'USER_MANAGER', 
        'getUsersWithProfiles'
      );
    }
  }
  
  async searchUsers(searchTerm, accountType = null, limit = 20) {
    try {
      let query = `
        SELECT u.*, 
               CASE 
                 WHEN u.account_type = 'company' THEN cp.company_name
                 WHEN u.account_type = 'agent' THEN ap.full_name
               END as display_name,
               CASE 
                 WHEN u.account_type = 'company' THEN cp.country
                 WHEN u.account_type = 'agent' THEN ap.countries
               END as location_info
        FROM users u
        LEFT JOIN company_profiles cp ON u.telegram_id = cp.user_id
        LEFT JOIN agent_profiles ap ON u.telegram_id = ap.user_id
        WHERE (
          u.username ILIKE $1 OR
          (u.account_type = 'company' AND cp.company_name ILIKE $1) OR
          (u.account_type = 'agent' AND ap.full_name ILIKE $1)
        )
      `;
      
      const params = [`%${searchTerm}%`];
      
      if (accountType) {
        query += ' AND u.account_type = $2';
        params.push(accountType);
      }
      
      query += ` ORDER BY u.rating DESC, u.created_at DESC LIMIT $${params.length + 1}`;
      params.push(limit);
      
      const result = await this.db.query(query, params);
      return result.rows;
      
    } catch (error) {
      throw this.errorHandler.handleBusinessError(
        error, 
        'USER_MANAGER', 
        'searchUsers'
      );
    }
  }
  
  async getUserStats(telegramId) {
    try {
      const query = `
        SELECT 
          u.rating,
          u.review_count,
          COUNT(DISTINCT m.id) as total_matches,
          COUNT(DISTINCT CASE WHEN m.status = 'matched' THEN m.id END) as active_matches,
          COUNT(DISTINCT msg.id) as total_messages,
          u.created_at as joined_date
        FROM users u
        LEFT JOIN matches m ON (m.company_id = u.telegram_id OR m.agent_id = u.telegram_id)
        LEFT JOIN messages msg ON msg.sender_id = u.telegram_id
        WHERE u.telegram_id = $1
        GROUP BY u.telegram_id, u.rating, u.review_count, u.created_at
      `;
      
      const result = await this.db.query(query, [telegramId]);
      return result.rows[0] || null;
      
    } catch (error) {
      throw this.errorHandler.handleBusinessError(
        error, 
        'USER_MANAGER', 
        'getUserStats'
      );
    }
  }
  
  async getRecentlyActiveUsers(hours = 24, limit = 100) {
    try {
      const query = `
        SELECT u.*, 
               CASE 
                 WHEN u.account_type = 'company' THEN cp.company_name
                 WHEN u.account_type = 'agent' THEN ap.full_name
               END as display_name
        FROM users u
        LEFT JOIN company_profiles cp ON u.telegram_id = cp.user_id
        LEFT JOIN agent_profiles ap ON u.telegram_id = ap.user_id
        WHERE u.updated_at > NOW() - INTERVAL '${hours} hours'
        ORDER BY u.updated_at DESC
        LIMIT $1
      `;
      
      const result = await this.db.query(query, [limit]);
      return result.rows;
      
    } catch (error) {
      throw this.errorHandler.handleBusinessError(
        error, 
        'USER_MANAGER', 
        'getRecentlyActiveUsers'
      );
    }
  }
  
  async deleteUser(telegramId) {
    try {
      // This will cascade delete all related data due to foreign key constraints
      const query = 'DELETE FROM users WHERE telegram_id = $1 RETURNING *';
      const result = await this.db.query(query, [telegramId]);
      
      if (!result.rows[0]) {
        throw new ErrorHandler.NotFoundError('User not found');
      }
      
      // Remove from cache
      if (this.cache) {
        this.cache.delete(`user:${telegramId}`);
      }
      
      this.logger.businessInfo('USER_MANAGER', 'User deleted', {
        userId: telegramId
      });
      
      return result.rows[0];
      
    } catch (error) {
      throw this.errorHandler.handleBusinessError(
        error, 
        'USER_MANAGER', 
        'deleteUser'
      );
    }
  }
  
  // Cache management
  invalidateCache(telegramId) {
    if (this.cache) {
      this.cache.delete(`user:${telegramId}`);
    }
  }
  
  clearCache() {
    if (this.cache && typeof this.cache.clear === 'function') {
      // Only clear user-related entries if cache supports patterns
      this.cache.clear();
    }
  }
  
  getCacheStats() {
    return {
      enabled: !!this.cache,
      size: this.cache?.size() || 0,
      metrics: this.metrics,
      hitRate: this.metrics.cacheHits + this.metrics.cacheMisses > 0 ? 
        (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)) : 0
    };
  }
  
  // Performance metrics
  getPerformanceMetrics() {
    return {
      ...this.metrics,
      cacheHitRate: this.metrics.cacheHits + this.metrics.cacheMisses > 0 ? 
        (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)) * 100 : 0,
      avgDbQueries: this.metrics.dbQueries
    };
  }
  
  resetMetrics() {
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      dbQueries: 0
    };
  }
  
  // Bulk operations
  async createBulkUsers(usersData) {
    try {
      const results = [];
      
      for (const userData of usersData) {
        const user = await this.createOrUpdateUser(
          userData.telegramId, 
          userData
        );
        results.push(user);
      }
      
      this.logger.businessInfo('USER_MANAGER', 'Bulk users created', {
        count: results.length
      });
      
      return results;
      
    } catch (error) {
      throw this.errorHandler.handleBusinessError(
        error, 
        'USER_MANAGER', 
        'createBulkUsers'
      );
    }
  }
  
  // Analytics methods
  async getUserCountByType() {
    try {
      const query = `
        SELECT 
          account_type,
          COUNT(*) as count
        FROM users 
        WHERE account_type IS NOT NULL
        GROUP BY account_type
      `;
      
      const result = await this.db.query(query);
      return result.rows.reduce((acc, row) => {
        acc[row.account_type] = parseInt(row.count);
        return acc;
      }, {});
      
    } catch (error) {
      throw this.errorHandler.handleBusinessError(
        error, 
        'USER_MANAGER', 
        'getUserCountByType'
      );
    }
  }
  
  async getActiveUsersCount(days = 7) {
    try {
      const query = `
        SELECT COUNT(DISTINCT telegram_id) as active_users
        FROM users 
        WHERE updated_at > NOW() - INTERVAL '${days} days'
      `;
      
      const result = await this.db.query(query);
      return parseInt(result.rows[0].active_users) || 0;
      
    } catch (error) {
      throw this.errorHandler.handleBusinessError(
        error, 
        'USER_MANAGER', 
        'getActiveUsersCount'
      );
    }
  }
}

module.exports = UserManager;