const express = require('express');
const TelegramAuth = require('../../miniapp/auth/TelegramAuth');
const Logger = require('../../core/utils/logger');
const ErrorHandler = require('../../core/utils/errorHandler');
const Validator = require('../../core/utils/validator');

class MatchingAPI {
  constructor(managers) {
    this.swipeEngine = managers.swipe;
    this.userManager = managers.user;
    this.telegramAuth = new TelegramAuth();
    this.logger = Logger;
    this.errorHandler = ErrorHandler;
    this.validator = Validator;
    this.router = express.Router();
    
    this.setupRoutes();
  }
  
  setupRoutes() {
    // Get profiles to swipe
    this.router.get('/swipe/next',
      this.telegramAuth.requireAuth(),
      this.getSwipeProfiles.bind(this)
    );
    
    // Process swipe action
    this.router.post('/swipe',
      this.telegramAuth.requireAuth(),
      this.processSwipe.bind(this)
    );
    
    // Get user's matches
    this.router.get('/matches',
      this.telegramAuth.requireAuth(),
      this.getMatches.bind(this)
    );
    
    // Get specific match details
    this.router.get('/matches/:matchId',
      this.telegramAuth.requireAuth(),
      this.getMatchDetails.bind(this)
    );
    
    // Get swipe history
    this.router.get('/swipe/history',
      this.telegramAuth.requireAuth(),
      this.getSwipeHistory.bind(this)
    );
    
    // Get compatibility score with another user
    this.router.get('/compatibility/:userId',
      this.telegramAuth.requireAuth(),
      this.getCompatibilityScore.bind(this)
    );
    
    // Get matching statistics
    this.router.get('/stats',
      this.telegramAuth.requireAuth(),
      this.getMatchingStats.bind(this)
    );
  }
  
  async getSwipeProfiles(req, res) {
    try {
      const userId = req.telegramUser.id;
      const {
        country,
        industries,
        languages,
        experienceMin,
        experienceMax,
        ratingMin,
        limit = 10
      } = req.query;
      
      // Validate user has complete profile
      const user = await this.userManager.getUser(userId);
      
      if (!user || !user.account_type) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Account type must be set before matching',
            code: 'ACCOUNT_TYPE_REQUIRED'
          }
        });
      }
      
      // Build filters object
      const filters = {};
      
      if (country) filters.country = country;
      if (industries) {
        filters.industries = Array.isArray(industries) ? 
          industries : industries.split(',');
      }
      if (languages) {
        filters.languages = Array.isArray(languages) ? 
          languages : languages.split(',');
      }
      if (experienceMin) filters.experienceMin = parseInt(experienceMin);
      if (experienceMax) filters.experienceMax = parseInt(experienceMax);
      if (ratingMin) filters.ratingMin = parseFloat(ratingMin);
      
      // Validate limit
      const profileLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 20);
      
      // Get profiles from swipe engine
      const profiles = await this.swipeEngine.getNextProfiles(
        userId, 
        filters, 
        profileLimit
      );
      
      // Remove internal fields and format response
      const formattedProfiles = profiles.map(profile => ({
        userId: profile.telegram_id,
        username: profile.username,
        rating: profile.rating,
        reviewCount: profile.review_count,
        profile: profile.profile,
        compatibilityScore: profile.compatibilityScore
      }));
      
      res.json({
        success: true,
        profiles: formattedProfiles,
        count: formattedProfiles.length,
        filters,
        hasMore: formattedProfiles.length === profileLimit
      });
      
    } catch (error) {
      this.logger.apiError('Get swipe profiles error', error, req);
      
      if (error.message?.includes('Complete profile required')) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Please complete your profile before starting to swipe',
            code: 'PROFILE_INCOMPLETE'
          }
        });
      }
      
      this.errorHandler.sendErrorResponse(res, error);
    }
  }
  
  async processSwipe(req, res) {
    try {
      const userId = req.telegramUser.id;
      
      // Validate request body
      const validatedData = this.validator.validate(req.body, 'swipeRequest');
      const { targetUserId, action } = validatedData;
      
      // Prevent self-swiping
      if (targetUserId === userId) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Cannot swipe on your own profile',
            code: 'SELF_SWIPE_NOT_ALLOWED'
          }
        });
      }
      
      // Process the swipe
      const result = await this.swipeEngine.processSwipe(userId, targetUserId, action);
      
      // Log swipe for analytics
      this.logger.businessInfo('MATCHING', 'Swipe processed', {
        userId,
        targetUserId,
        action,
        matched: result.matched
      });
      
      // Format response based on action and result
      const response = {
        success: true,
        action,
        matched: result.matched,
        message: result.message
      };
      
      if (result.matched) {
        response.match = {
          matchId: result.matchId,
          partnerId: targetUserId
        };
      }
      
      res.json(response);
      
    } catch (error) {
      this.logger.apiError('Process swipe error', error, req);
      this.errorHandler.sendErrorResponse(res, error);
    }
  }
  
  async getMatches(req, res) {
    try {
      const userId = req.telegramUser.id;
      const { 
        status = 'matched',
        limit = 50,
        offset = 0
      } = req.query;
      
      // Validate status
      const validStatuses = ['matched', 'pending_agent', 'pending_company'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid status. Must be: matched, pending_agent, or pending_company',
            code: 'INVALID_STATUS'
          }
        });
      }
      
      // Get matches from swipe engine
      const matches = await this.swipeEngine.getMatches(
        userId, 
        status, 
        Math.min(parseInt(limit), 100)
      );
      
      // Add additional match metadata
      const enrichedMatches = matches.map(match => ({
        ...match,
        isNewMatch: this.isRecentMatch(match.createdAt),
        canMessage: status === 'matched' // Only matched users can message
      }));
      
      res.json({
        success: true,
        matches: enrichedMatches,
        count: enrichedMatches.length,
        status,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: enrichedMatches.length === parseInt(limit)
        }
      });
      
    } catch (error) {
      this.logger.apiError('Get matches error', error, req);
      this.errorHandler.sendErrorResponse(res, error);
    }
  }
  
  async getMatchDetails(req, res) {
    try {
      const userId = req.telegramUser.id;
      const { matchId } = req.params;
      
      if (!matchId || !this.isValidUUID(matchId)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid match ID',
            code: 'INVALID_MATCH_ID'
          }
        });
      }
      
      // Get match details
      const query = `
        SELECT 
          m.*,
          cu.username as company_username,
          cu.rating as company_rating,
          cp.company_name,
          cp.country,
          cp.website,
          cp.description,
          cp.photos,
          cp.industries,
          cp.commission_structure,
          cp.escrow_available,
          au.username as agent_username,
          au.rating as agent_rating,
          ap.full_name,
          ap.countries,
          ap.languages,
          ap.experience_years,
          ap.specializations,
          ap.portfolio
        FROM matches m
        JOIN users cu ON m.company_id = cu.telegram_id
        JOIN company_profiles cp ON m.company_id = cp.user_id
        JOIN users au ON m.agent_id = au.telegram_id
        JOIN agent_profiles ap ON m.agent_id = ap.user_id
        WHERE m.id = $1
        AND (m.company_id = $2 OR m.agent_id = $2)
      `;
      
      const result = await this.db.query(query, [matchId, userId]);
      
      if (!result.rows[0]) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Match not found',
            code: 'MATCH_NOT_FOUND'
          }
        });
      }
      
      const match = result.rows[0];
      const userIsCompany = match.company_id === userId;
      
      const matchDetails = {
        matchId: match.id,
        status: match.status,
        createdAt: match.created_at,
        matchedAt: match.matched_at,
        company: {
          id: match.company_id,
          username: match.company_username,
          rating: match.company_rating,
          profile: {
            companyName: match.company_name,
            country: match.country,
            website: match.website,
            description: typeof match.description === 'string' ? 
              JSON.parse(match.description) : match.description,
            photos: typeof match.photos === 'string' ? 
              JSON.parse(match.photos) : match.photos,
            industries: typeof match.industries === 'string' ? 
              JSON.parse(match.industries) : match.industries,
            commissionStructure: typeof match.commission_structure === 'string' ? 
              JSON.parse(match.commission_structure) : match.commission_structure,
            escrowAvailable: match.escrow_available
          }
        },
        agent: {
          id: match.agent_id,
          username: match.agent_username,
          rating: match.agent_rating,
          profile: {
            fullName: match.full_name,
            countries: typeof match.countries === 'string' ? 
              JSON.parse(match.countries) : match.countries,
            languages: typeof match.languages === 'string' ? 
              JSON.parse(match.languages) : match.languages,
            experienceYears: match.experience_years,
            specializations: typeof match.specializations === 'string' ? 
              JSON.parse(match.specializations) : match.specializations,
            portfolio: match.portfolio
          }
        },
        userRole: userIsCompany ? 'company' : 'agent',
        canMessage: match.status === 'matched'
      };
      
      res.json({
        success: true,
        match: matchDetails
      });
      
    } catch (error) {
      this.logger.apiError('Get match details error', error, req);
      this.errorHandler.sendErrorResponse(res, error);
    }
  }
  
  async getSwipeHistory(req, res) {
    try {
      const userId = req.telegramUser.id;
      const { limit = 50 } = req.query;
      
      const history = await this.swipeEngine.getSwipeHistory(
        userId, 
        Math.min(parseInt(limit), 100)
      );
      
      res.json({
        success: true,
        history: history.map(item => ({
          targetUserId: item.target_id,
          targetUsername: item.username,
          targetAccountType: item.account_type,
          targetDisplayName: item.display_name,
          action: item.action,
          createdAt: item.created_at
        })),
        count: history.length
      });
      
    } catch (error) {
      this.logger.apiError('Get swipe history error', error, req);
      this.errorHandler.sendErrorResponse(res, error);
    }
  }
  
  async getCompatibilityScore(req, res) {
    try {
      const userId = req.telegramUser.id;
      const { userId: targetUserId } = req.params;
      
      if (!targetUserId || isNaN(parseInt(targetUserId))) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid target user ID',
            code: 'INVALID_USER_ID'
          }
        });
      }
      
      const targetUserIdInt = parseInt(targetUserId);
      
      if (targetUserIdInt === userId) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Cannot calculate compatibility with yourself',
            code: 'SELF_COMPATIBILITY_NOT_ALLOWED'
          }
        });
      }
      
      // Get both user profiles
      const user = await this.swipeEngine.getUserWithProfile(userId);
      const targetUser = await this.swipeEngine.getUserWithProfile(targetUserIdInt);
      
      if (!user || !targetUser) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'One or both users not found',
            code: 'USER_NOT_FOUND'
          }
        });
      }
      
      if (!user.profile_complete || !targetUser.profile_complete) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Both users must have complete profiles',
            code: 'INCOMPLETE_PROFILES'
          }
        });
      }
      
      if (user.account_type === targetUser.account_type) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Users must have different account types',
            code: 'SAME_ACCOUNT_TYPE'
          }
        });
      }
      
      // Calculate compatibility score
      const compatibilityScore = this.swipeEngine.calculateCompatibilityScore(user, targetUser);
      
      res.json({
        success: true,
        compatibility: {
          score: compatibilityScore,
          level: this.getCompatibilityLevel(compatibilityScore),
          factors: this.getCompatibilityFactors(user, targetUser)
        }
      });
      
    } catch (error) {
      this.logger.apiError('Get compatibility score error', error, req);
      this.errorHandler.sendErrorResponse(res, error);
    }
  }
  
  async getMatchingStats(req, res) {
    try {
      const userId = req.telegramUser.id;
      
      // Get various statistics
      const stats = await Promise.all([
        this.getSwipeStats(userId),
        this.getMatchStats(userId),
        this.getActivityStats(userId)
      ]);
      
      res.json({
        success: true,
        stats: {
          swipes: stats[0],
          matches: stats[1],
          activity: stats[2]
        }
      });
      
    } catch (error) {
      this.logger.apiError('Get matching stats error', error, req);
      this.errorHandler.sendErrorResponse(res, error);
    }
  }
  
  // Helper methods
  
  isRecentMatch(createdAt) {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return new Date(createdAt) > twentyFourHoursAgo;
  }
  
  isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
  
  getCompatibilityLevel(score) {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'low';
  }
  
  getCompatibilityFactors(user1, user2) {
    return {
      geographic: this.swipeEngine.calculateGeographicScore(user1, user2) * 100,
      industry: this.swipeEngine.calculateIndustryScore(user1, user2) * 100,
      language: this.swipeEngine.calculateLanguageScore(user1, user2) * 100,
      experience: this.swipeEngine.calculateExperienceScore(user1, user2) * 100,
      rating: this.swipeEngine.calculateRatingScore(user1, user2) * 100
    };
  }
  
  async getSwipeStats(userId) {
    const query = `
      SELECT 
        COUNT(*) as total_swipes,
        COUNT(CASE WHEN action = 'like' THEN 1 END) as likes_sent,
        COUNT(CASE WHEN action = 'pass' THEN 1 END) as passes_sent
      FROM swipe_history 
      WHERE user_id = $1
    `;
    
    const result = await this.db.query(query, [userId]);
    return result.rows[0];
  }
  
  async getMatchStats(userId) {
    const query = `
      SELECT 
        COUNT(*) as total_matches,
        COUNT(CASE WHEN status = 'matched' THEN 1 END) as active_matches,
        COUNT(CASE WHEN status LIKE 'pending_%' THEN 1 END) as pending_matches
      FROM matches 
      WHERE company_id = $1 OR agent_id = $1
    `;
    
    const result = await this.db.query(query, [userId]);
    return result.rows[0];
  }
  
  async getActivityStats(userId) {
    const query = `
      SELECT 
        COUNT(CASE WHEN sh.created_at > NOW() - INTERVAL '7 days' THEN 1 END) as swipes_this_week,
        COUNT(CASE WHEN m.created_at > NOW() - INTERVAL '7 days' THEN 1 END) as matches_this_week
      FROM swipe_history sh
      FULL OUTER JOIN matches m ON (m.company_id = $1 OR m.agent_id = $1)
      WHERE sh.user_id = $1 OR m.company_id = $1 OR m.agent_id = $1
    `;
    
    const result = await this.db.query(query, [userId]);
    return result.rows[0];
  }
}

module.exports = MatchingAPI;