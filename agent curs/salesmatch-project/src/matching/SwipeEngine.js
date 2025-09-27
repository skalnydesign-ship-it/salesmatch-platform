const Logger = require('../core/utils/logger');
const ErrorHandler = require('../core/utils/errorHandler');
const Validator = require('../core/utils/validator');

class SwipeEngine {
  constructor(db) {
    this.db = db;
    this.logger = Logger;
    this.errorHandler = ErrorHandler;
    this.validator = Validator;
    this.compatibilityWeights = {
      geographic: 0.25,    // Geographic proximity
      industry: 0.30,      // Industry/specialization match
      language: 0.20,      // Language compatibility
      experience: 0.15,    // Experience level match
      rating: 0.10         // User rating
    };
  }
  
  /**
   * Get next profile to swipe for a user
   * @param {number} userId - User requesting profiles
   * @param {Object} filters - Optional filters
   * @param {number} limit - Number of profiles to return
   * @returns {Array} - Array of profiles to swipe
   */
  async getNextProfiles(userId, filters = {}, limit = 10) {
    try {
      // Get user's account type and profile
      const user = await this.getUserWithProfile(userId);
      
      if (!user || !user.account_type || !user.profile_complete) {
        throw new ErrorHandler.ValidationError('Complete profile required for matching');
      }
      
      const targetType = user.account_type === 'company' ? 'agent' : 'company';
      
      // Get profiles that haven't been swiped yet
      const profiles = await this.getUnswipedProfiles(userId, targetType, filters, limit * 3);
      
      // Score and sort profiles by compatibility
      const scoredProfiles = await this.scoreProfiles(user, profiles);
      
      // Add some randomization to prevent algorithm bias
      const diversifiedProfiles = this.addDiversification(scoredProfiles, limit);
      
      // Log swipe request for analytics
      this.logger.businessInfo('SWIPE_ENGINE', 'Profiles requested', {
        userId,
        targetType,
        requestedCount: limit,
        returnedCount: diversifiedProfiles.length
      });
      
      return diversifiedProfiles;
      
    } catch (error) {
      throw this.errorHandler.handleBusinessError(
        error, 
        'SWIPE_ENGINE', 
        'getNextProfiles'
      );
    }
  }
  
  /**
   * Process a swipe action
   * @param {number} fromUserId - User who swiped
   * @param {number} toUserId - User who was swiped
   * @param {string} action - 'like' or 'pass'
   * @returns {Object} - Result with match status
   */
  async processSwipe(fromUserId, toUserId, action) {
    try {
      // Validate action
      const validatedData = this.validator.validate({
        targetUserId: toUserId,
        action
      }, 'swipeRequest');
      
      // Get both users
      const fromUser = await this.getUserWithProfile(fromUserId);
      const toUser = await this.getUserWithProfile(toUserId);
      
      if (!fromUser || !toUser) {
        throw new ErrorHandler.NotFoundError('User not found');
      }
      
      if (fromUser.account_type === toUser.account_type) {
        throw new ErrorHandler.ValidationError('Cannot swipe users of same account type');
      }
      
      // Determine company and agent IDs
      const companyId = fromUser.account_type === 'company' ? fromUserId : toUserId;
      const agentId = fromUser.account_type === 'agent' ? fromUserId : toUserId;
      
      // Record swipe in history
      await this.recordSwipeHistory(fromUserId, toUserId, action);
      
      if (action === 'like') {
        // Check for existing match or create new one
        const matchResult = await this.handleLike(companyId, agentId, fromUserId);
        
        if (matchResult.matched) {
          // Send notifications about the match
          await this.sendMatchNotifications(companyId, agentId);
        }
        
        return matchResult;
      } else {
        // Record rejection for learning
        await this.recordRejection(companyId, agentId);
        
        return {
          matched: false,
          action: 'pass',
          message: 'Profile passed'
        };
      }
      
    } catch (error) {
      throw this.errorHandler.handleBusinessError(
        error, 
        'SWIPE_ENGINE', 
        'processSwipe'
      );
    }
  }
  
  /**
   * Get matches for a user
   * @param {number} userId - User ID
   * @param {string} status - Match status filter
   * @param {number} limit - Number of matches to return
   * @returns {Array} - Array of matches
   */
  async getMatches(userId, status = 'matched', limit = 50) {
    try {
      const user = await this.getUserWithProfile(userId);
      
      if (!user) {
        throw new ErrorHandler.NotFoundError('User not found');
      }
      
      const query = user.account_type === 'company' ?
        `SELECT 
          m.*,
          u.username,
          u.rating,
          u.review_count,
          ap.full_name,
          ap.countries,
          ap.languages,
          ap.experience_years,
          ap.specializations,
          ap.portfolio
        FROM matches m
        JOIN users u ON m.agent_id = u.telegram_id
        JOIN agent_profiles ap ON m.agent_id = ap.user_id
        WHERE m.company_id = $1 AND m.status = $2
        ORDER BY m.created_at DESC
        LIMIT $3` :
        `SELECT 
          m.*,
          u.username,
          u.rating,
          u.review_count,
          cp.company_name,
          cp.country,
          cp.website,
          cp.description,
          cp.photos,
          cp.industries,
          cp.commission_structure,
          cp.escrow_available
        FROM matches m
        JOIN users u ON m.company_id = u.telegram_id
        JOIN company_profiles cp ON m.company_id = cp.user_id
        WHERE m.agent_id = $1 AND m.status = $2
        ORDER BY m.created_at DESC
        LIMIT $3`;
      
      const result = await this.db.query(query, [userId, status, limit]);
      
      return result.rows.map(match => this.formatMatch(match, user.account_type));
      
    } catch (error) {
      throw this.errorHandler.handleBusinessError(
        error, 
        'SWIPE_ENGINE', 
        'getMatches'
      );
    }
  }
  
  /**
   * Get swipe history for a user
   * @param {number} userId - User ID
   * @param {number} limit - Number of records to return
   * @returns {Array} - Array of swipe history
   */
  async getSwipeHistory(userId, limit = 50) {
    try {
      const query = `
        SELECT 
          sh.*,
          u.username,
          u.account_type,
          CASE 
            WHEN u.account_type = 'company' THEN cp.company_name
            WHEN u.account_type = 'agent' THEN ap.full_name
          END as display_name
        FROM swipe_history sh
        JOIN users u ON sh.target_id = u.telegram_id
        LEFT JOIN company_profiles cp ON sh.target_id = cp.user_id
        LEFT JOIN agent_profiles ap ON sh.target_id = ap.user_id
        WHERE sh.user_id = $1
        ORDER BY sh.created_at DESC
        LIMIT $2
      `;
      
      const result = await this.db.query(query, [userId, limit]);
      return result.rows;
      
    } catch (error) {
      throw this.errorHandler.handleBusinessError(
        error, 
        'SWIPE_ENGINE', 
        'getSwipeHistory'
      );
    }
  }
  
  /**
   * Calculate compatibility score between two users
   * @param {Object} user1 - First user with profile
   * @param {Object} user2 - Second user with profile
   * @returns {number} - Compatibility score (0-100)
   */
  calculateCompatibilityScore(user1, user2) {
    try {
      let totalScore = 0;
      
      // Geographic compatibility
      const geoScore = this.calculateGeographicScore(user1, user2);
      totalScore += geoScore * this.compatibilityWeights.geographic;
      
      // Industry/specialization compatibility
      const industryScore = this.calculateIndustryScore(user1, user2);
      totalScore += industryScore * this.compatibilityWeights.industry;
      
      // Language compatibility
      const languageScore = this.calculateLanguageScore(user1, user2);
      totalScore += languageScore * this.compatibilityWeights.language;
      
      // Experience compatibility
      const experienceScore = this.calculateExperienceScore(user1, user2);
      totalScore += experienceScore * this.compatibilityWeights.experience;
      
      // Rating compatibility
      const ratingScore = this.calculateRatingScore(user1, user2);
      totalScore += ratingScore * this.compatibilityWeights.rating;
      
      return Math.round(totalScore * 100);
      
    } catch (error) {
      this.logger.error('Error calculating compatibility score:', error);
      return 50; // Default score on error
    }
  }
  
  // Private helper methods
  
  async getUserWithProfile(userId) {
    const query = `
      SELECT 
        u.*,
        CASE 
          WHEN u.account_type = 'company' THEN cp.company_name IS NOT NULL
          WHEN u.account_type = 'agent' THEN ap.full_name IS NOT NULL
          ELSE false
        END as profile_complete,
        CASE 
          WHEN u.account_type = 'company' THEN 
            json_build_object(
              'companyName', cp.company_name,
              'country', cp.country,
              'industries', cp.industries,
              'commissionStructure', cp.commission_structure
            )
          WHEN u.account_type = 'agent' THEN
            json_build_object(
              'fullName', ap.full_name,
              'countries', ap.countries,
              'languages', ap.languages,
              'experienceYears', ap.experience_years,
              'specializations', ap.specializations
            )
          ELSE null
        END as profile_data
      FROM users u
      LEFT JOIN company_profiles cp ON u.telegram_id = cp.user_id
      LEFT JOIN agent_profiles ap ON u.telegram_id = ap.user_id
      WHERE u.telegram_id = $1
    `;
    
    const result = await this.db.query(query, [userId]);
    return result.rows[0];
  }
  
  async getUnswipedProfiles(userId, targetType, filters, limit) {
    let query = `
      SELECT 
        u.telegram_id,
        u.username,
        u.rating,
        u.review_count,
        CASE 
          WHEN u.account_type = 'company' THEN 
            json_build_object(
              'type', 'company',
              'companyName', cp.company_name,
              'country', cp.country,
              'website', cp.website,
              'description', cp.description,
              'photos', cp.photos,
              'industries', cp.industries,
              'commissionStructure', cp.commission_structure,
              'escrowAvailable', cp.escrow_available
            )
          WHEN u.account_type = 'agent' THEN
            json_build_object(
              'type', 'agent',
              'fullName', ap.full_name,
              'countries', ap.countries,
              'languages', ap.languages,
              'experienceYears', ap.experience_years,
              'specializations', ap.specializations,
              'portfolio', ap.portfolio
            )
        END as profile_data
      FROM users u
      LEFT JOIN company_profiles cp ON u.telegram_id = cp.user_id
      LEFT JOIN agent_profiles ap ON u.telegram_id = ap.user_id
      WHERE u.account_type = $1
      AND u.telegram_id != $2
      AND (
        (u.account_type = 'company' AND cp.company_name IS NOT NULL) OR
        (u.account_type = 'agent' AND ap.full_name IS NOT NULL)
      )
      AND NOT EXISTS (
        SELECT 1 FROM swipe_history sh 
        WHERE sh.user_id = $2 AND sh.target_id = u.telegram_id
      )
      AND NOT EXISTS (
        SELECT 1 FROM matches m 
        WHERE (m.company_id = $2 AND m.agent_id = u.telegram_id AND m.status = 'rejected')
        OR (m.agent_id = $2 AND m.company_id = u.telegram_id AND m.status = 'rejected')
      )
    `;
    
    const params = [targetType, userId];
    let paramIndex = 3;
    
    // Apply filters
    if (filters.country && targetType === 'company') {
      query += ` AND cp.country = $${paramIndex++}`;
      params.push(filters.country);
    }
    
    if (filters.countries && targetType === 'agent') {
      query += ` AND ap.countries::jsonb ?| $${paramIndex++}`;
      params.push(filters.countries);
    }
    
    if (filters.industries && targetType === 'company') {
      query += ` AND cp.industries::jsonb ?| $${paramIndex++}`;
      params.push(filters.industries);
    }
    
    if (filters.languages && targetType === 'agent') {
      query += ` AND ap.languages::jsonb ?| $${paramIndex++}`;
      params.push(filters.languages);
    }
    
    if (filters.experienceMin && targetType === 'agent') {
      query += ` AND ap.experience_years >= $${paramIndex++}`;
      params.push(filters.experienceMin);
    }
    
    if (filters.experienceMax && targetType === 'agent') {
      query += ` AND ap.experience_years <= $${paramIndex++}`;
      params.push(filters.experienceMax);
    }
    
    if (filters.ratingMin) {
      query += ` AND u.rating >= $${paramIndex++}`;
      params.push(filters.ratingMin);
    }
    
    query += ` ORDER BY RANDOM() LIMIT $${paramIndex}`;
    params.push(limit);
    
    const result = await this.db.query(query, params);
    return result.rows;
  }
  
  async scoreProfiles(user, profiles) {
    const scoredProfiles = profiles.map(profile => {
      const compatibilityScore = this.calculateCompatibilityScore(user, profile);
      return {
        ...profile,
        compatibilityScore,
        profile: typeof profile.profile_data === 'string' ? 
          JSON.parse(profile.profile_data) : profile.profile_data
      };
    });
    
    // Sort by compatibility score (descending)
    return scoredProfiles.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  }
  
  addDiversification(profiles, limit) {
    // Take top 70% by score, 30% random for diversity
    const topCount = Math.floor(limit * 0.7);
    const randomCount = limit - topCount;
    
    const topProfiles = profiles.slice(0, topCount);
    const remainingProfiles = profiles.slice(topCount);
    
    // Shuffle remaining profiles and take random selection
    const shuffled = remainingProfiles.sort(() => Math.random() - 0.5);
    const randomProfiles = shuffled.slice(0, randomCount);
    
    return [...topProfiles, ...randomProfiles].slice(0, limit);
  }
  
  async recordSwipeHistory(userId, targetId, action) {
    const query = `
      INSERT INTO swipe_history (user_id, target_id, action, created_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT DO NOTHING
    `;
    
    await this.db.query(query, [userId, targetId, action]);
  }
  
  async handleLike(companyId, agentId, fromUserId) {
    // Check for existing match
    const existingQuery = `
      SELECT * FROM matches 
      WHERE company_id = $1 AND agent_id = $2
    `;
    
    const existing = await this.db.query(existingQuery, [companyId, agentId]);
    
    if (existing.rows[0]) {
      const match = existing.rows[0];
      
      // Check if this completes a mutual like
      if ((match.status === 'pending_agent' && fromUserId === agentId) ||
          (match.status === 'pending_company' && fromUserId === companyId)) {
        
        // Update to matched status
        const updateQuery = `
          UPDATE matches 
          SET status = 'matched', matched_at = NOW()
          WHERE id = $1
          RETURNING *
        `;
        
        const updated = await this.db.query(updateQuery, [match.id]);
        
        this.logger.businessInfo('SWIPE_ENGINE', 'Match completed', {
          matchId: match.id,
          companyId,
          agentId
        });
        
        return {
          matched: true,
          matchId: match.id,
          message: 'It\'s a match!',
          match: updated.rows[0]
        };
      }
      
      return {
        matched: false,
        message: 'Like recorded, waiting for response'
      };
    } else {
      // Create new pending match
      const status = fromUserId === companyId ? 'pending_agent' : 'pending_company';
      
      const insertQuery = `
        INSERT INTO matches (company_id, agent_id, status, created_at)
        VALUES ($1, $2, $3, NOW())
        RETURNING *
      `;
      
      const newMatch = await this.db.query(insertQuery, [companyId, agentId, status]);
      
      this.logger.businessInfo('SWIPE_ENGINE', 'Like recorded', {
        matchId: newMatch.rows[0].id,
        companyId,
        agentId,
        status
      });
      
      return {
        matched: false,
        matchId: newMatch.rows[0].id,
        message: 'Like sent, waiting for response'
      };
    }
  }
  
  async recordRejection(companyId, agentId) {
    const query = `
      INSERT INTO matches (company_id, agent_id, status, created_at)
      VALUES ($1, $2, 'rejected', NOW())
      ON CONFLICT (company_id, agent_id) DO UPDATE SET
        status = 'rejected',
        updated_at = NOW()
    `;
    
    await this.db.query(query, [companyId, agentId]);
  }
  
  async sendMatchNotifications(companyId, agentId) {
    // This will be implemented when notification system is ready
    this.logger.businessInfo('SWIPE_ENGINE', 'Match notifications to be sent', {
      companyId,
      agentId
    });
  }
  
  formatMatch(match, userAccountType) {
    const partnerId = userAccountType === 'company' ? match.agent_id : match.company_id;
    
    const profile = userAccountType === 'company' ? {
      type: 'agent',
      fullName: match.full_name,
      countries: typeof match.countries === 'string' ? JSON.parse(match.countries) : match.countries,
      languages: typeof match.languages === 'string' ? JSON.parse(match.languages) : match.languages,
      experienceYears: match.experience_years,
      specializations: typeof match.specializations === 'string' ? JSON.parse(match.specializations) : match.specializations,
      portfolio: match.portfolio
    } : {
      type: 'company',
      companyName: match.company_name,
      country: match.country,
      website: match.website,
      description: typeof match.description === 'string' ? JSON.parse(match.description) : match.description,
      photos: typeof match.photos === 'string' ? JSON.parse(match.photos) : match.photos,
      industries: typeof match.industries === 'string' ? JSON.parse(match.industries) : match.industries,
      commissionStructure: typeof match.commission_structure === 'string' ? JSON.parse(match.commission_structure) : match.commission_structure,
      escrowAvailable: match.escrow_available
    };
    
    return {
      matchId: match.id,
      partnerId,
      partnerUsername: match.username,
      partnerRating: match.rating,
      partnerReviewCount: match.review_count,
      profile,
      status: match.status,
      createdAt: match.created_at,
      matchedAt: match.matched_at
    };
  }
  
  // Compatibility scoring methods
  
  calculateGeographicScore(user1, user2) {
    const profile1 = typeof user1.profile_data === 'string' ? JSON.parse(user1.profile_data) : user1.profile_data;
    const profile2 = typeof user2.profile_data === 'string' ? JSON.parse(user2.profile_data) : user2.profile_data;
    
    if (user1.account_type === 'company' && user2.account_type === 'agent') {
      const companyCountry = profile1.country;
      const agentCountries = profile2.countries || [];
      return agentCountries.includes(companyCountry) ? 1.0 : 0.3;
    }
    
    if (user1.account_type === 'agent' && user2.account_type === 'company') {
      const agentCountries = profile1.countries || [];
      const companyCountry = profile2.country;
      return agentCountries.includes(companyCountry) ? 1.0 : 0.3;
    }
    
    return 0.5; // Default score
  }
  
  calculateIndustryScore(user1, user2) {
    const profile1 = typeof user1.profile_data === 'string' ? JSON.parse(user1.profile_data) : user1.profile_data;
    const profile2 = typeof user2.profile_data === 'string' ? JSON.parse(user2.profile_data) : user2.profile_data;
    
    let industries1, industries2;
    
    if (user1.account_type === 'company') {
      industries1 = profile1.industries || [];
      industries2 = profile2.specializations || [];
    } else {
      industries1 = profile1.specializations || [];
      industries2 = profile2.industries || [];
    }
    
    if (!industries1.length || !industries2.length) return 0.5;
    
    const overlap = industries1.filter(industry => industries2.includes(industry));
    return overlap.length / Math.max(industries1.length, industries2.length);
  }
  
  calculateLanguageScore(user1, user2) {
    const profile1 = typeof user1.profile_data === 'string' ? JSON.parse(user1.profile_data) : user1.profile_data;
    const profile2 = typeof user2.profile_data === 'string' ? JSON.parse(user2.profile_data) : user2.profile_data;
    
    // Extract languages from profiles
    let languages1 = [];
    let languages2 = [];
    
    if (user1.account_type === 'agent') {
      languages1 = profile1.languages || [];
    }
    if (user2.account_type === 'agent') {
      languages2 = profile2.languages || [];
    }
    
    // If only one has languages, use user languages
    if (!languages1.length) languages1 = [user1.language];
    if (!languages2.length) languages2 = [user2.language];
    
    const commonLanguages = languages1.filter(lang => languages2.includes(lang));
    return commonLanguages.length > 0 ? Math.min(commonLanguages.length / 2, 1.0) : 0.3;
  }
  
  calculateExperienceScore(user1, user2) {
    const profile1 = typeof user1.profile_data === 'string' ? JSON.parse(user1.profile_data) : user1.profile_data;
    const profile2 = typeof user2.profile_data === 'string' ? JSON.parse(user2.profile_data) : user2.profile_data;
    
    // Experience only applies to agents
    const agentProfile = user1.account_type === 'agent' ? profile1 : profile2;
    const experience = agentProfile.experienceYears || 0;
    
    // Score based on experience level (prefer 2-15 years)
    if (experience >= 2 && experience <= 15) return 1.0;
    if (experience >= 1 && experience <= 20) return 0.8;
    if (experience > 20) return 0.6;
    return 0.4; // New agents
  }
  
  calculateRatingScore(user1, user2) {
    const rating1 = user1.rating || 0;
    const rating2 = user2.rating || 0;
    
    // Prefer users with good ratings
    const avgRating = (rating1 + rating2) / 2;
    return Math.min(avgRating / 5, 1.0);
  }
}

module.exports = SwipeEngine;