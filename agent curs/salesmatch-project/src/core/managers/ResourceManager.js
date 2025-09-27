const Logger = require('../utils/logger');
const MemoryCache = require('../cache/MemoryCache');
const Config = require('../config');

class ResourceManager {
  constructor() {
    this.logger = Logger;
    this.config = Config;
    
    // Resource pools
    this.connections = new Map();
    this.caches = new Map();
    this.timers = new Map();
    
    // Statistics
    this.stats = {
      connectionsCreated: 0,
      cachesCreated: 0,
      memoryUsage: 0
    };

    // Initialize default cache
    this.initializeDefaultCache();
    
    // Cleanup interval
    this.startCleanupTimer();
  }

  // Cache Management
  initializeDefaultCache() {
    const defaultCache = new MemoryCache({
      maxSize: this.config.cache.maxSize,
      ttl: this.config.cache.ttl * 1000, // Convert to milliseconds
      enabled: this.config.cache.enabled
    });

    this.caches.set('default', defaultCache);
    this.stats.cachesCreated++;
    
    this.logger.info('Default cache initialized', {
      maxSize: this.config.cache.maxSize,
      ttl: this.config.cache.ttl,
      enabled: this.config.cache.enabled
    });
  }

  getCache(name = 'default') {
    return this.caches.get(name);
  }

  createCache(name, options = {}) {
    if (this.caches.has(name)) {
      this.logger.warn(`Cache '${name}' already exists, returning existing instance`);
      return this.caches.get(name);
    }

    const cache = new MemoryCache({
      maxSize: options.maxSize || this.config.cache.maxSize,
      ttl: (options.ttl || this.config.cache.ttl) * 1000,
      enabled: options.enabled !== false && this.config.cache.enabled
    });

    this.caches.set(name, cache);
    this.stats.cachesCreated++;
    
    this.logger.info(`Cache '${name}' created`, options);
    return cache;
  }

  // Connection Management
  addConnection(name, connection) {
    if (this.connections.has(name)) {
      this.logger.warn(`Connection '${name}' already exists, replacing`);
    }

    this.connections.set(name, {
      connection,
      createdAt: Date.now(),
      lastUsed: Date.now()
    });

    this.stats.connectionsCreated++;
    this.logger.info(`Connection '${name}' registered`);
  }

  getConnection(name) {
    const conn = this.connections.get(name);
    if (conn) {
      conn.lastUsed = Date.now();
      return conn.connection;
    }
    return null;
  }

  // Timer Management
  setTimer(name, callback, interval) {
    // Clear existing timer
    this.clearTimer(name);

    const timer = setInterval(callback, interval);
    this.timers.set(name, timer);
    
    this.logger.debug(`Timer '${name}' set with ${interval}ms interval`);
    return timer;
  }

  clearTimer(name) {
    const timer = this.timers.get(name);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(name);
      this.logger.debug(`Timer '${name}' cleared`);
    }
  }

  // Cleanup Operations
  startCleanupTimer() {
    const cleanupInterval = 300000; // 5 minutes

    this.setTimer('cleanup', () => {
      this.performCleanup();
    }, cleanupInterval);

    this.logger.info(`Cleanup timer started with ${cleanupInterval}ms interval`);
  }

  performCleanup() {
    this.logger.info('Starting resource cleanup...');
    
    let totalCleaned = 0;

    // Clean up all caches
    for (const [name, cache] of this.caches.entries()) {
      const cleaned = cache.cleanup();
      totalCleaned += cleaned;
    }

    // Update memory stats
    this.updateMemoryStats();

    this.logger.info(`Cleanup completed: ${totalCleaned} items removed`, {
      memoryUsage: this.stats.memoryUsage,
      cacheCount: this.caches.size,
      connectionCount: this.connections.size
    });
  }

  updateMemoryStats() {
    if (process.memoryUsage) {
      const usage = process.memoryUsage();
      this.stats.memoryUsage = Math.round(usage.heapUsed / 1024 / 1024); // MB
    }
  }

  // Health Check
  getHealthStatus() {
    this.updateMemoryStats();
    
    const cacheStats = {};
    for (const [name, cache] of this.caches.entries()) {
      cacheStats[name] = cache.getStats();
    }

    return {
      status: 'healthy',
      resources: {
        connections: this.connections.size,
        caches: this.caches.size,
        timers: this.timers.size
      },
      statistics: this.stats,
      caches: cacheStats,
      memory: {
        usage: this.stats.memoryUsage,
        limit: process.env.NODE_OPTIONS?.includes('--max-old-space-size') ? 
          parseInt(process.env.NODE_OPTIONS.match(/--max-old-space-size=(\d+)/)?.[1]) : null
      }
    };
  }

  // Graceful Shutdown
  async shutdown() {
    this.logger.info('ResourceManager shutdown started...');

    // Clear all timers
    for (const [name] of this.timers.entries()) {
      this.clearTimer(name);
    }

    // Clear all caches
    for (const [name, cache] of this.caches.entries()) {
      cache.clear();
      this.logger.info(`Cache '${name}' cleared`);
    }

    // Close connections
    for (const [name, connData] of this.connections.entries()) {
      try {
        if (connData.connection && typeof connData.connection.end === 'function') {
          await connData.connection.end();
        }
        this.logger.info(`Connection '${name}' closed`);
      } catch (error) {
        this.logger.error(`Error closing connection '${name}':`, error);
      }
    }

    this.connections.clear();
    this.caches.clear();
    this.timers.clear();

    this.logger.info('ResourceManager shutdown completed');
  }

  // Utility Methods
  getCacheHitRate(cacheName = 'default') {
    const cache = this.caches.get(cacheName);
    return cache ? cache.calculateHitRate() : 0;
  }

  getTotalCacheSize() {
    let total = 0;
    for (const cache of this.caches.values()) {
      total += cache.size();
    }
    return total;
  }
}

module.exports = new ResourceManager();