const Logger = require('../utils/logger');

class MemoryCache {
  constructor(options = {}) {
    this.cache = new Map();
    this.timers = new Map();
    this.maxSize = options.maxSize || 1000;
    this.defaultTTL = options.ttl || 300000; // 5 minutes in ms
    this.logger = Logger;
    this.enabled = options.enabled !== false;
  }

  set(key, value, ttl = this.defaultTTL) {
    if (!this.enabled) return false;

    try {
      // Remove oldest entries if cache is full
      if (this.cache.size >= this.maxSize) {
        const oldestKey = this.cache.keys().next().value;
        this.delete(oldestKey);
      }

      // Clear existing timer for this key
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key));
      }

      // Set the value
      this.cache.set(key, {
        value,
        timestamp: Date.now(),
        ttl
      });

      // Set expiration timer
      if (ttl > 0) {
        const timer = setTimeout(() => {
          this.delete(key);
        }, ttl);
        this.timers.set(key, timer);
      }

      return true;
    } catch (error) {
      this.logger.error('Cache set error:', error);
      return false;
    }
  }

  get(key) {
    if (!this.enabled) return null;

    try {
      const item = this.cache.get(key);
      if (!item) return null;

      // Check if expired
      if (item.ttl > 0 && (Date.now() - item.timestamp) > item.ttl) {
        this.delete(key);
        return null;
      }

      return item.value;
    } catch (error) {
      this.logger.error('Cache get error:', error);
      return null;
    }
  }

  has(key) {
    if (!this.enabled) return false;
    return this.cache.has(key) && this.get(key) !== null;
  }

  delete(key) {
    try {
      // Clear timer
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key));
        this.timers.delete(key);
      }

      // Remove from cache
      return this.cache.delete(key);
    } catch (error) {
      this.logger.error('Cache delete error:', error);
      return false;
    }
  }

  clear() {
    try {
      // Clear all timers
      for (const timer of this.timers.values()) {
        clearTimeout(timer);
      }
      this.timers.clear();
      
      // Clear cache
      this.cache.clear();
      return true;
    } catch (error) {
      this.logger.error('Cache clear error:', error);
      return false;
    }
  }

  size() {
    return this.cache.size;
  }

  // Utility methods for specific use cases
  setUser(userId, userData, ttl = this.defaultTTL) {
    return this.set(`user:${userId}`, userData, ttl);
  }

  getUser(userId) {
    return this.get(`user:${userId}`);
  }

  setProfile(profileId, profileData, ttl = this.defaultTTL) {
    return this.set(`profile:${profileId}`, profileData, ttl);
  }

  getProfile(profileId) {
    return this.get(`profile:${profileId}`);
  }

  setMatches(userId, matches, ttl = 60000) { // Shorter TTL for dynamic data
    return this.set(`matches:${userId}`, matches, ttl);
  }

  getMatches(userId) {
    return this.get(`matches:${userId}`);
  }

  // Statistics
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      enabled: this.enabled,
      hitRate: this.calculateHitRate()
    };
  }

  calculateHitRate() {
    // This is a simplified version - in production you'd track hits/misses
    return this.cache.size > 0 ? 0.8 : 0;
  }

  // Clean up expired entries manually
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, item] of this.cache.entries()) {
      if (item.ttl > 0 && (now - item.timestamp) > item.ttl) {
        this.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.info(`Cache cleanup: removed ${cleaned} expired entries`);
    }

    return cleaned;
  }
}

module.exports = MemoryCache;