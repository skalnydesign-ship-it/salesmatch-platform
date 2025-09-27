const { Pool } = require('pg');
const path = require('path');
const fs = require('fs').promises;
const Logger = require('../core/utils/logger');

class DatabaseConnection {
  constructor() {
    this.pool = null;
    this.migrations = [];
    this.logger = Logger;
  }

  async initialize() {
    try {
      this.pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'salesmatch_pro',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
        max: parseInt(process.env.DB_MAX_CONNECTIONS) || 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
      });

      // Test connection
      await this.pool.query('SELECT NOW()');
      this.logger.info('Database connection established');

      // Load and run migrations
      await this.loadMigrations();
      await this.runMigrations();

      return this;
    } catch (error) {
      this.logger.error('Database connection failed:', error);
      throw error;
    }
  }

  async loadMigrations() {
    const migrationsDir = path.join(__dirname, 'migrations');
    
    try {
      const files = await fs.readdir(migrationsDir);
      const migrationFiles = files
        .filter(file => file.endsWith('.sql'))
        .sort();

      for (const file of migrationFiles) {
        const version = parseInt(file.split('_')[0]);
        const name = file.replace('.sql', '');
        const content = await fs.readFile(
          path.join(migrationsDir, file), 
          'utf8'
        );

        this.migrations.push({
          version,
          name,
          content,
          filename: file
        });
      }

      this.logger.info(`Loaded ${this.migrations.length} migrations`);
    } catch (error) {
      this.logger.warn('No migrations directory found, creating tables manually');
      this.loadDefaultMigrations();
    }
  }

  loadDefaultMigrations() {
    // Default schema for first-time setup
    this.migrations = [
      {
        version: 1,
        name: 'initial_schema',
        content: this.getInitialSchema()
      }
    ];
  }

  getInitialSchema() {
    return `
      -- Create extensions
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      CREATE EXTENSION IF NOT EXISTS "pg_trgm";

      -- Create enums
      CREATE TYPE user_type_enum AS ENUM ('company', 'agent');
      CREATE TYPE match_status_enum AS ENUM ('pending_agent', 'pending_company', 'matched', 'rejected');
      CREATE TYPE subscription_plan_enum AS ENUM ('free', 'pro', 'business');

      -- Create migrations tracking table
      CREATE TABLE IF NOT EXISTS migrations (
        version INTEGER PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP DEFAULT NOW()
      );

      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        telegram_id BIGINT PRIMARY KEY,
        username VARCHAR(255),
        language VARCHAR(10) DEFAULT 'en',
        account_type user_type_enum,
        rating DECIMAL(3,2) DEFAULT 0,
        review_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Company profiles
      CREATE TABLE IF NOT EXISTS company_profiles (
        user_id BIGINT PRIMARY KEY REFERENCES users(telegram_id) ON DELETE CASCADE,
        company_name VARCHAR(200),
        country VARCHAR(100),
        website VARCHAR(500),
        description JSONB DEFAULT '{}',
        photos JSONB DEFAULT '[]',
        industries JSONB DEFAULT '[]',
        commission_structure JSONB DEFAULT '{}',
        escrow_available BOOLEAN DEFAULT false,
        documents JSONB DEFAULT '{}',
        version INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Agent profiles
      CREATE TABLE IF NOT EXISTS agent_profiles (
        user_id BIGINT PRIMARY KEY REFERENCES users(telegram_id) ON DELETE CASCADE,
        full_name VARCHAR(200),
        countries JSONB DEFAULT '[]',
        languages JSONB DEFAULT '[]',
        experience_years INTEGER DEFAULT 0,
        specializations JSONB DEFAULT '[]',
        portfolio TEXT,
        version INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Matches table
      CREATE TABLE IF NOT EXISTS matches (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        company_id BIGINT REFERENCES users(telegram_id),
        agent_id BIGINT REFERENCES users(telegram_id),
        status match_status_enum DEFAULT 'pending_agent',
        created_at TIMESTAMP DEFAULT NOW(),
        matched_at TIMESTAMP,
        UNIQUE(company_id, agent_id)
      );

      -- Messages table
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
        sender_id BIGINT REFERENCES users(telegram_id),
        content TEXT NOT NULL,
        message_type VARCHAR(20) DEFAULT 'text',
        created_at TIMESTAMP DEFAULT NOW(),
        read_at TIMESTAMP
      );

      -- Subscriptions table
      CREATE TABLE IF NOT EXISTS subscriptions (
        user_id BIGINT PRIMARY KEY REFERENCES users(telegram_id) ON DELETE CASCADE,
        plan_type subscription_plan_enum DEFAULT 'free',
        status VARCHAR(20) DEFAULT 'active',
        starts_at TIMESTAMP,
        expires_at TIMESTAMP,
        payment_id VARCHAR(255),
        auto_renew BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Reviews table
      CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        author_id BIGINT REFERENCES users(telegram_id),
        target_id BIGINT REFERENCES users(telegram_id),
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        reply TEXT,
        reply_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(author_id, target_id)
      );

      -- AI usage logs
      CREATE TABLE IF NOT EXISTS ai_usage_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id BIGINT REFERENCES users(telegram_id),
        request_type VARCHAR(50),
        tokens_used INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Swipe history
      CREATE TABLE IF NOT EXISTS swipe_history (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id BIGINT REFERENCES users(telegram_id),
        target_id BIGINT REFERENCES users(telegram_id),
        action VARCHAR(10) CHECK (action IN ('like', 'pass')),
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_users_account_type ON users(account_type);
      CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
      CREATE INDEX IF NOT EXISTS idx_matches_company_id ON matches(company_id);
      CREATE INDEX IF NOT EXISTS idx_matches_agent_id ON matches(agent_id);
      CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
      CREATE INDEX IF NOT EXISTS idx_messages_match_id ON messages(match_id);
      CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
      CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_at ON subscriptions(expires_at);
      CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_created ON ai_usage_logs(user_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_swipe_history_user_created ON swipe_history(user_id, created_at);

      -- Create triggers for updated_at
      CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

      CREATE TRIGGER update_company_profiles_updated_at BEFORE UPDATE ON company_profiles
        FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

      CREATE TRIGGER update_agent_profiles_updated_at BEFORE UPDATE ON agent_profiles
        FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

      CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
        FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

      CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
        FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    `;
  }

  async runMigrations() {
    // Create migrations table if not exists
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        version INTEGER PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Get applied migrations
    const appliedResult = await this.pool.query(
      'SELECT version FROM migrations ORDER BY version'
    );
    const appliedVersions = appliedResult.rows.map(row => row.version);

    // Apply pending migrations
    for (const migration of this.migrations) {
      if (!appliedVersions.includes(migration.version)) {
        this.logger.info(`Applying migration ${migration.version}: ${migration.name}`);
        
        try {
          await this.pool.query('BEGIN');
          await this.pool.query(migration.content);
          await this.pool.query(
            'INSERT INTO migrations (version, name) VALUES ($1, $2)',
            [migration.version, migration.name]
          );
          await this.pool.query('COMMIT');
          
          this.logger.info(`✅ Migration ${migration.version} applied successfully`);
        } catch (error) {
          await this.pool.query('ROLLBACK');
          this.logger.error(`❌ Migration ${migration.version} failed:`, error);
          throw error;
        }
      }
    }
  }

  async query(text, params) {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      if (duration > 1000) {
        this.logger.warn(`Slow query (${duration}ms):`, text.substring(0, 100));
      }
      
      return result;
    } catch (error) {
      this.logger.error('Database query error:', error);
      this.logger.error('Query:', text);
      this.logger.error('Params:', params);
      throw error;
    }
  }

  async transaction(callback) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async healthCheck() {
    try {
      const result = await this.pool.query('SELECT NOW()');
      return {
        status: 'healthy',
        timestamp: result.rows[0].now,
        totalConnections: this.pool.totalCount,
        idleConnections: this.pool.idleCount,
        waitingClients: this.pool.waitingCount
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

module.exports = new DatabaseConnection();