const express = require('express');
const TelegramAuth = require('../miniapp/auth/TelegramAuth');
const Logger = require('../core/utils/logger');
const ErrorHandler = require('../core/utils/errorHandler');
const Validator = require('../core/utils/validator');

class AIAssistantAPI {
  constructor(managers) {
    this.aiAssistant = managers.ai;
    this.userManager = managers.user;
    this.profileManager = managers.profile;
    this.subscriptionManager = managers.subscription;
    this.telegramAuth = new TelegramAuth();
    this.logger = Logger;
    this.errorHandler = ErrorHandler;
    this.validator = Validator;
    this.router = express.Router();
    
    this.setupRoutes();
  }
  
  setupRoutes() {
    // Get profile optimization suggestions
    this.router.post('/profile-suggestions',
      this.telegramAuth.requireAuth(),
      this.getProfileSuggestions.bind(this)
    );
    
    // Generate message templates
    this.router.post('/message-templates',
      this.telegramAuth.requireAuth(),
      this.generateMessageTemplates.bind(this)
    );
    
    // Analyze match compatibility
    this.router.post('/compatibility-analysis',
      this.telegramAuth.requireAuth(),
      this.analyzeCompatibility.bind(this)
    );
    
    // Get market insights
    this.router.post('/market-insights',
      this.telegramAuth.requireAuth(),
      this.getMarketInsights.bind(this)
    );
    
    // Get AI usage statistics
    this.router.get('/usage-stats',
      this.telegramAuth.requireAuth(),
      this.getUsageStats.bind(this)
    );
    
    // AI service health check
    this.router.get('/health',
      this.getHealthStatus.bind(this)
    );
    
    // Get AI capabilities and limits
    this.router.get('/capabilities',
      this.telegramAuth.requireAuth(),
      this.getCapabilities.bind(this)
    );
  }
  
  async getProfileSuggestions(req, res) {
    try {
      const userId = req.telegramUser.id;
      const { requestType = 'optimization' } = req.body;
      
      // Validate request type
      const validTypes = ['optimization', 'completion', 'enhancement', 'industry_specific'];
      if (!validTypes.includes(requestType)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid request type. Must be one of: ' + validTypes.join(', '),
            code: 'INVALID_REQUEST_TYPE'
          }
        });
      }
      
      // Get user's profile
      const user = await this.userManager.getUser(userId);
      
      if (!user || !user.account_type) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Complete your account setup first',
            code: 'ACCOUNT_SETUP_REQUIRED'
          }
        });
      }
      
      const profile = await this.profileManager.getProfile(userId, user.account_type);
      
      if (!profile) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Create your profile first to get AI suggestions',
            code: 'PROFILE_REQUIRED'
          }
        });
      }
      
      // Check AI usage permissions
      const canUseAI = await this.aiAssistant.checkUsageLimit(userId);
      
      if (!canUseAI) {
        return res.status(402).json({
          success: false,
          error: {
            message: 'Daily AI request limit exceeded. Upgrade your plan for more requests.',
            code: 'AI_LIMIT_EXCEEDED'
          }
        });
      }
      
      // Generate suggestions
      const suggestions = await this.aiAssistant.generateProfileSuggestions(
        userId,
        profile,
        requestType
      );
      
      // Get updated usage stats
      const usageStats = await this.aiAssistant.getUsageStats(userId);
      
      this.logger.apiInfo('AI profile suggestions generated', {
        userId,
        requestType,
        accountType: user.account_type
      });
      
      res.json({
        success: true,
        suggestions,
        requestType,
        usage: {
          remaining_today: usageStats.remaining_today,
          daily_limit: usageStats.daily_limit
        }
      });
      
    } catch (error) {
      this.logger.apiError('Get profile suggestions error', error, req);
      
      if (error.message?.includes('AI service not configured')) {
        return res.status(503).json({
          success: false,
          error: {
            message: 'AI service temporarily unavailable',
            code: 'AI_SERVICE_UNAVAILABLE'
          }
        });
      }
      
      this.errorHandler.sendErrorResponse(res, error);
    }
  }
  
  async generateMessageTemplates(req, res) {
    try {
      const userId = req.telegramUser.id;
      const { matchId, templateType = 'introduction' } = req.body;
      
      // Validate template type
      const validTypes = ['introduction', 'follow_up', 'negotiation', 'meeting_request', 'closing'];
      if (!validTypes.includes(templateType)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid template type. Must be one of: ' + validTypes.join(', '),
            code: 'INVALID_TEMPLATE_TYPE'
          }
        });
      }
      
      if (!matchId || !this.isValidUUID(matchId)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Valid match ID is required',
            code: 'INVALID_MATCH_ID'
          }
        });
      }
      
      // Check AI usage permissions
      const canUseAI = await this.aiAssistant.checkUsageLimit(userId);
      
      if (!canUseAI) {
        return res.status(402).json({
          success: false,
          error: {
            message: 'Daily AI request limit exceeded. Upgrade your plan for more requests.',
            code: 'AI_LIMIT_EXCEEDED'
          }
        });
      }
      
      // Get context for template generation
      const context = await this.getTemplateContext(userId, matchId);
      
      // Generate templates
      const templates = await this.aiAssistant.generateMessageTemplates(
        userId,
        matchId,
        templateType,
        context
      );
      
      // Get updated usage stats
      const usageStats = await this.aiAssistant.getUsageStats(userId);
      
      this.logger.apiInfo('AI message templates generated', {
        userId,
        matchId,
        templateType
      });
      
      res.json({
        success: true,
        templates,
        templateType,
        context,
        usage: {
          remaining_today: usageStats.remaining_today,
          daily_limit: usageStats.daily_limit
        }
      });
      
    } catch (error) {
      this.logger.apiError('Generate message templates error', error, req);
      this.errorHandler.sendErrorResponse(res, error);
    }
  }
  
  async analyzeCompatibility(req, res) {
    try {
      const userId = req.telegramUser.id;
      const { partnerId } = req.body;
      
      if (!partnerId || isNaN(parseInt(partnerId))) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Valid partner user ID is required',
            code: 'INVALID_PARTNER_ID'
          }
        });
      }
      
      const partnerIdInt = parseInt(partnerId);
      
      if (partnerIdInt === userId) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Cannot analyze compatibility with yourself',
            code: 'SELF_ANALYSIS_NOT_ALLOWED'
          }
        });
      }
      
      // Check AI usage permissions
      const canUseAI = await this.aiAssistant.checkUsageLimit(userId);
      
      if (!canUseAI) {
        return res.status(402).json({
          success: false,
          error: {
            message: 'Daily AI request limit exceeded. Upgrade your plan for more requests.',
            code: 'AI_LIMIT_EXCEEDED'
          }
        });
      }
      
      // Get both user profiles
      const user = await this.userManager.getUser(userId);
      const partner = await this.userManager.getUser(partnerIdInt);
      
      if (!user || !partner) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'One or both users not found',
            code: 'USER_NOT_FOUND'
          }
        });
      }
      
      if (!user.account_type || !partner.account_type) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Both users must have complete account setup',
            code: 'INCOMPLETE_ACCOUNT_SETUP'
          }
        });
      }
      
      if (user.account_type === partner.account_type) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Cannot analyze compatibility between same account types',
            code: 'SAME_ACCOUNT_TYPE'
          }
        });
      }
      
      // Get profiles
      const userProfile = await this.profileManager.getProfile(userId, user.account_type);
      const partnerProfile = await this.profileManager.getProfile(partnerIdInt, partner.account_type);
      
      if (!userProfile || !partnerProfile) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Both users must have complete profiles',
            code: 'PROFILES_INCOMPLETE'
          }
        });
      }
      
      // Analyze compatibility
      const analysis = await this.aiAssistant.analyzeMatchCompatibility(
        userId,
        userProfile,
        partnerProfile
      );
      
      // Get updated usage stats
      const usageStats = await this.aiAssistant.getUsageStats(userId);
      
      this.logger.apiInfo('AI compatibility analysis generated', {
        userId,
        partnerId: partnerIdInt
      });
      
      res.json({
        success: true,
        analysis,
        userType: user.account_type,
        partnerType: partner.account_type,
        usage: {
          remaining_today: usageStats.remaining_today,
          daily_limit: usageStats.daily_limit
        }
      });
      
    } catch (error) {
      this.logger.apiError('Analyze compatibility error', error, req);
      this.errorHandler.sendErrorResponse(res, error);
    }
  }
  
  async getMarketInsights(req, res) {
    try {
      const userId = req.telegramUser.id;
      const { industry, geography = 'global', companySize = 'all' } = req.body;
      
      if (!industry || industry.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Industry is required for market insights',
            code: 'INDUSTRY_REQUIRED'
          }
        });
      }
      
      // Check AI usage permissions
      const canUseAI = await this.aiAssistant.checkUsageLimit(userId);
      
      if (!canUseAI) {
        return res.status(402).json({
          success: false,
          error: {
            message: 'Daily AI request limit exceeded. Upgrade your plan for more requests.',
            code: 'AI_LIMIT_EXCEEDED'
          }
        });
      }
      
      // Prepare context
      const context = {
        geography: geography.trim(),
        companySize: companySize.trim(),
        timeframe: 'current',
        requestedBy: await this.getRequesterContext(userId)
      };
      
      // Generate market insights
      const insights = await this.aiAssistant.generateMarketInsights(
        userId,
        industry.trim(),
        context
      );
      
      // Get updated usage stats
      const usageStats = await this.aiAssistant.getUsageStats(userId);
      
      this.logger.apiInfo('AI market insights generated', {
        userId,
        industry: industry.trim(),
        geography
      });
      
      res.json({
        success: true,
        insights,
        industry: industry.trim(),
        context,
        usage: {
          remaining_today: usageStats.remaining_today,
          daily_limit: usageStats.daily_limit
        }
      });
      
    } catch (error) {
      this.logger.apiError('Get market insights error', error, req);
      this.errorHandler.sendErrorResponse(res, error);
    }
  }
  
  async getUsageStats(req, res) {
    try {
      const userId = req.telegramUser.id;
      
      const stats = await this.aiAssistant.getUsageStats(userId);
      
      // Get subscription info
      const subscription = await this.subscriptionManager.checkSubscription(userId);
      
      res.json({
        success: true,
        stats,
        subscription: {
          plan: subscription?.plan_type || 'free',
          expires_at: subscription?.expires_at || null
        },
        limits: {
          free: 5,
          pro: 50,
          business: 'unlimited'
        }
      });
      
    } catch (error) {
      this.logger.apiError('Get AI usage stats error', error, req);
      this.errorHandler.sendErrorResponse(res, error);
    }
  }
  
  async getHealthStatus(req, res) {
    try {
      const health = await this.aiAssistant.healthCheck();
      
      res.json({
        success: true,
        ai_service: health
      });
      
    } catch (error) {
      this.logger.apiError('AI health check error', error, req);
      res.status(503).json({
        success: false,
        ai_service: {
          status: 'error',
          message: error.message
        }
      });
    }
  }
  
  async getCapabilities(req, res) {
    try {
      const userId = req.telegramUser.id;
      
      // Get subscription info
      const subscription = await this.subscriptionManager.checkSubscription(userId);
      const planType = subscription?.plan_type || 'free';
      
      // Get current usage
      const usageStats = await this.aiAssistant.getUsageStats(userId);
      
      const capabilities = {
        available_features: [
          'profile_optimization',
          'message_templates',
          'compatibility_analysis',
          'market_insights'
        ],
        current_plan: planType,
        daily_limit: usageStats.daily_limit,
        remaining_today: usageStats.remaining_today,
        features_by_plan: {
          free: {
            requests_per_day: 5,
            features: ['profile_optimization', 'message_templates']
          },
          pro: {
            requests_per_day: 50,
            features: ['profile_optimization', 'message_templates', 'compatibility_analysis']
          },
          business: {
            requests_per_day: 'unlimited',
            features: ['profile_optimization', 'message_templates', 'compatibility_analysis', 'market_insights']
          }
        },
        ai_service_status: (await this.aiAssistant.healthCheck()).status
      };
      
      res.json({
        success: true,
        capabilities
      });
      
    } catch (error) {
      this.logger.apiError('Get AI capabilities error', error, req);
      this.errorHandler.sendErrorResponse(res, error);
    }
  }
  
  // Helper methods
  
  isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
  
  async getTemplateContext(userId, matchId) {
    try {
      // Get match details for context
      const query = `
        SELECT 
          m.*,
          cu.account_type as company_type,
          au.account_type as agent_type,
          cp.company_name,
          cp.industries,
          ap.full_name,
          ap.specializations
        FROM matches m
        JOIN users cu ON m.company_id = cu.telegram_id
        JOIN users au ON m.agent_id = au.telegram_id
        LEFT JOIN company_profiles cp ON m.company_id = cp.user_id
        LEFT JOIN agent_profiles ap ON m.agent_id = ap.user_id
        WHERE m.id = $1
        AND (m.company_id = $2 OR m.agent_id = $2)
      `;
      
      const result = await this.subscriptionManager.db.query(query, [matchId, userId]);
      
      if (!result.rows[0]) {
        return { error: 'Match not found' };
      }
      
      const match = result.rows[0];
      const userIsCompany = match.company_id === userId;
      
      return {
        userType: userIsCompany ? 'company' : 'agent',
        partnerType: userIsCompany ? 'agent' : 'company',
        industry: userIsCompany ? 
          (typeof match.industries === 'string' ? JSON.parse(match.industries) : match.industries) :
          (typeof match.specializations === 'string' ? JSON.parse(match.specializations) : match.specializations),
        matchStatus: match.status,
        matchAge: Math.floor((Date.now() - new Date(match.created_at).getTime()) / (1000 * 60 * 60 * 24)) // days
      };
      
    } catch (error) {
      this.logger.error('Error getting template context:', error);
      return { error: 'Context unavailable' };
    }
  }
  
  async getRequesterContext(userId) {
    try {
      const user = await this.userManager.getUser(userId);
      return {
        accountType: user?.account_type,
        language: user?.language || 'en',
        rating: user?.rating || 0
      };
    } catch (error) {
      return { accountType: 'unknown' };
    }
  }
}

module.exports = AIAssistantAPI;