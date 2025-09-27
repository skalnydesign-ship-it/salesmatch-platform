const axios = require('axios');
const Logger = require('../core/utils/logger');
const ErrorHandler = require('../core/utils/errorHandler');

class AIAssistant {
  constructor(subscriptionManager) {
    this.subscriptionManager = subscriptionManager;
    this.logger = Logger;
    this.errorHandler = ErrorHandler;
    
    this.apiKey = process.env.DEEPSEEK_API_KEY;
    this.baseURL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
    this.timeout = parseInt(process.env.AI_REQUEST_TIMEOUT) || 30000;
    
    if (!this.apiKey) {
      this.logger.warn('DeepSeek API key not configured. AI features will be disabled.');
    }
    
    // AI request limits per plan
    this.usageLimits = {
      free: 5,      // 5 requests per day
      pro: 50,      // 50 requests per day
      business: -1  // Unlimited
    };
    
    // Configure axios instance
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'SalesMatch-Pro/1.0'
      }
    });
    
    // Setup request/response interceptors
    this.setupInterceptors();
  }
  
  setupInterceptors() {
    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        this.logger.info('AI API Request', {
          url: config.url,
          method: config.method
        });
        return config;
      },
      (error) => {
        this.logger.error('AI API Request Error', error);
        return Promise.reject(error);
      }
    );
    
    // Response interceptor for logging and error handling
    this.client.interceptors.response.use(
      (response) => {
        this.logger.info('AI API Response', {
          status: response.status,
          tokensUsed: response.data?.usage?.total_tokens || 0
        });
        return response;
      },
      (error) => {
        this.logger.error('AI API Response Error', {
          status: error.response?.status,
          message: error.response?.data?.error?.message || error.message
        });
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Generate profile optimization suggestions
   * @param {number} userId - User ID
   * @param {Object} profileData - User's profile data
   * @param {string} requestType - Type of optimization request
   * @returns {Object} - AI-generated suggestions
   */
  async generateProfileSuggestions(userId, profileData, requestType = 'optimization') {
    try {
      // Check usage limits
      if (!await this.checkUsageLimit(userId)) {
        throw new ErrorHandler.AIError('Daily AI request limit exceeded');
      }
      
      if (!this.apiKey) {
        throw new ErrorHandler.AIError('AI service not configured');
      }
      
      // Prepare prompt based on request type and profile data
      const prompt = this.buildProfilePrompt(profileData, requestType);
      
      // Make API request
      const response = await this.client.post('/v1/chat/completions', {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt('profile_optimization')
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
        stream: false
      });
      
      // Track usage
      await this.trackUsage(userId, 'profile_optimization', response.data.usage?.total_tokens || 0);
      
      // Parse and format response
      const suggestions = this.parseProfileSuggestions(response.data.choices[0].message.content);
      
      this.logger.businessInfo('AI', 'Profile suggestions generated', {
        userId,
        requestType,
        tokensUsed: response.data.usage?.total_tokens || 0
      });
      
      return suggestions;
      
    } catch (error) {
      throw this.errorHandler.handleAIError(error, 'generateProfileSuggestions');
    }
  }
  
  /**
   * Generate message templates for conversations
   * @param {number} userId - User ID
   * @param {string} matchId - Match ID
   * @param {string} templateType - Type of template needed
   * @param {Object} context - Additional context for template generation
   * @returns {Object} - Generated message templates
   */
  async generateMessageTemplates(userId, matchId, templateType, context = {}) {
    try {
      // Check usage limits
      if (!await this.checkUsageLimit(userId)) {
        throw new ErrorHandler.AIError('Daily AI request limit exceeded');
      }
      
      if (!this.apiKey) {
        throw new ErrorHandler.AIError('AI service not configured');
      }
      
      // Build context-aware prompt
      const prompt = this.buildMessagePrompt(templateType, context);
      
      // Make API request
      const response = await this.client.post('/v1/chat/completions', {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt('message_generation')
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.8,
        stream: false
      });
      
      // Track usage
      await this.trackUsage(userId, 'message_template', response.data.usage?.total_tokens || 0);
      
      // Parse and format templates
      const templates = this.parseMessageTemplates(response.data.choices[0].message.content);
      
      this.logger.businessInfo('AI', 'Message templates generated', {
        userId,
        matchId,
        templateType,
        tokensUsed: response.data.usage?.total_tokens || 0
      });
      
      return templates;
      
    } catch (error) {
      throw this.errorHandler.handleAIError(error, 'generateMessageTemplates');
    }
  }
  
  /**
   * Analyze match compatibility and provide insights
   * @param {number} userId - User ID
   * @param {Object} userProfile - User's profile
   * @param {Object} partnerProfile - Partner's profile
   * @returns {Object} - Compatibility analysis and insights
   */
  async analyzeMatchCompatibility(userId, userProfile, partnerProfile) {
    try {
      // Check usage limits
      if (!await this.checkUsageLimit(userId)) {
        throw new ErrorHandler.AIError('Daily AI request limit exceeded');
      }
      
      if (!this.apiKey) {
        throw new ErrorHandler.AIError('AI service not configured');
      }
      
      // Build compatibility analysis prompt
      const prompt = this.buildCompatibilityPrompt(userProfile, partnerProfile);
      
      // Make API request
      const response = await this.client.post('/v1/chat/completions', {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt('compatibility_analysis')
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.6,
        stream: false
      });
      
      // Track usage
      await this.trackUsage(userId, 'compatibility_analysis', response.data.usage?.total_tokens || 0);
      
      // Parse and format insights
      const insights = this.parseCompatibilityInsights(response.data.choices[0].message.content);
      
      this.logger.businessInfo('AI', 'Compatibility analysis generated', {
        userId,
        tokensUsed: response.data.usage?.total_tokens || 0
      });
      
      return insights;
      
    } catch (error) {
      throw this.errorHandler.handleAIError(error, 'analyzeMatchCompatibility');
    }
  }
  
  /**
   * Generate industry-specific insights and market analysis
   * @param {number} userId - User ID
   * @param {string} industry - Industry to analyze
   * @param {Object} context - Additional context
   * @returns {Object} - Market insights and trends
   */
  async generateMarketInsights(userId, industry, context = {}) {
    try {
      // Check usage limits
      if (!await this.checkUsageLimit(userId)) {
        throw new ErrorHandler.AIError('Daily AI request limit exceeded');
      }
      
      if (!this.apiKey) {
        throw new ErrorHandler.AIError('AI service not configured');
      }
      
      // Build market analysis prompt
      const prompt = this.buildMarketPrompt(industry, context);
      
      // Make API request
      const response = await this.client.post('/v1/chat/completions', {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt('market_analysis')
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1200,
        temperature: 0.5,
        stream: false
      });
      
      // Track usage
      await this.trackUsage(userId, 'market_insights', response.data.usage?.total_tokens || 0);
      
      // Parse and format insights
      const insights = this.parseMarketInsights(response.data.choices[0].message.content);
      
      this.logger.businessInfo('AI', 'Market insights generated', {
        userId,
        industry,
        tokensUsed: response.data.usage?.total_tokens || 0
      });
      
      return insights;
      
    } catch (error) {
      throw this.errorHandler.handleAIError(error, 'generateMarketInsights');
    }
  }
  
  // System prompts for different AI functions
  
  getSystemPrompt(type) {
    const prompts = {
      profile_optimization: `You are an expert B2B sales consultant helping users optimize their profiles for better matching. 
      Analyze the provided profile data and give specific, actionable suggestions to improve:
      1. Profile completeness and appeal
      2. Industry-specific positioning
      3. Communication effectiveness
      4. Competitive advantages
      
      Respond in JSON format with specific suggestions categorized by priority (high, medium, low).`,
      
      message_generation: `You are a professional communication expert specializing in B2B sales conversations. 
      Generate appropriate, professional message templates that:
      1. Are contextually relevant
      2. Encourage engagement
      3. Maintain professional tone
      4. Are culturally appropriate
      
      Provide multiple template options in JSON format with different approaches (formal, casual, direct).`,
      
      compatibility_analysis: `You are a B2B relationship analyst. Analyze the compatibility between two business profiles and provide:
      1. Strengths of the potential partnership
      2. Potential challenges or misalignments
      3. Specific collaboration opportunities
      4. Success probability and key factors
      
      Focus on business synergies, market alignment, and operational compatibility. Respond in structured JSON format.`,
      
      market_analysis: `You are a market research analyst providing insights for B2B sales professionals. Analyze the given industry and provide:
      1. Current market trends and opportunities
      2. Key challenges and competitive landscape
      3. Success factors for sales partnerships
      4. Actionable recommendations
      
      Focus on practical, actionable insights that help sales professionals succeed. Respond in structured format.`
    };
    
    return prompts[type] || prompts.profile_optimization;
  }
  
  // Prompt builders
  
  buildProfilePrompt(profileData, requestType) {
    const profile = typeof profileData === 'string' ? JSON.parse(profileData) : profileData;
    
    if (profile.type === 'company') {
      return `Analyze this company profile and provide optimization suggestions:
      
      Company: ${profile.companyName || 'Not specified'}
      Country: ${profile.country || 'Not specified'}
      Website: ${profile.website || 'Not provided'}
      Industries: ${Array.isArray(profile.industries) ? profile.industries.join(', ') : 'Not specified'}
      Description: ${JSON.stringify(profile.description) || 'Not provided'}
      Commission Structure: ${JSON.stringify(profile.commissionStructure) || 'Not specified'}
      Escrow Available: ${profile.escrowAvailable ? 'Yes' : 'No'}
      
      Request Type: ${requestType}
      
      Please provide specific suggestions to improve this profile for attracting quality sales agents.`;
    } else {
      return `Analyze this sales agent profile and provide optimization suggestions:
      
      Agent: ${profile.fullName || 'Not specified'}
      Countries: ${Array.isArray(profile.countries) ? profile.countries.join(', ') : 'Not specified'}
      Languages: ${Array.isArray(profile.languages) ? profile.languages.join(', ') : 'Not specified'}
      Experience: ${profile.experienceYears || 0} years
      Specializations: ${Array.isArray(profile.specializations) ? profile.specializations.join(', ') : 'Not specified'}
      Portfolio: ${profile.portfolio || 'Not provided'}
      
      Request Type: ${requestType}
      
      Please provide specific suggestions to improve this profile for attracting quality companies.`;
    }
  }
  
  buildMessagePrompt(templateType, context) {
    return `Generate ${templateType} message templates for B2B sales matching platform:
    
    Context:
    - User Type: ${context.userType || 'Unknown'}
    - Partner Type: ${context.partnerType || 'Unknown'}
    - Industry: ${context.industry || 'General'}
    - Stage: ${templateType}
    - Cultural Context: ${context.culture || 'Professional/International'}
    
    Please provide 3-5 different message templates varying in tone and approach.`;
  }
  
  buildCompatibilityPrompt(userProfile, partnerProfile) {
    return `Analyze the compatibility between these two business profiles:
    
    Profile 1 (${userProfile.type}):
    ${JSON.stringify(userProfile, null, 2)}
    
    Profile 2 (${partnerProfile.type}):
    ${JSON.stringify(partnerProfile, null, 2)}
    
    Provide detailed compatibility analysis including strengths, challenges, and recommendations.`;
  }
  
  buildMarketPrompt(industry, context) {
    return `Provide market insights and analysis for the ${industry} industry in the context of B2B sales partnerships:
    
    Context:
    - Geographic Focus: ${context.geography || 'Global'}
    - Company Size: ${context.companySize || 'All sizes'}
    - Time Period: ${context.timeframe || 'Current'}
    
    Focus on opportunities for sales agent partnerships and market entry strategies.`;
  }
  
  // Response parsers
  
  parseProfileSuggestions(content) {
    try {
      // Try to parse JSON response
      const parsed = JSON.parse(content);
      return parsed;
    } catch (error) {
      // Fallback: parse structured text response
      return {
        suggestions: [
          {
            category: 'general',
            priority: 'medium',
            text: content,
            actionable: true
          }
        ],
        summary: 'AI-generated profile optimization suggestions'
      };
    }
  }
  
  parseMessageTemplates(content) {
    try {
      const parsed = JSON.parse(content);
      return parsed;
    } catch (error) {
      // Fallback: split content into templates
      const templates = content.split('\n\n').filter(t => t.trim().length > 0);
      return {
        templates: templates.map((template, index) => ({
          id: `template_${index + 1}`,
          content: template.trim(),
          tone: index === 0 ? 'professional' : index === 1 ? 'casual' : 'direct'
        }))
      };
    }
  }
  
  parseCompatibilityInsights(content) {
    try {
      const parsed = JSON.parse(content);
      return parsed;
    } catch (error) {
      return {
        compatibility_score: 75,
        strengths: ['AI analysis provided'],
        challenges: ['Further analysis recommended'],
        recommendations: [content],
        summary: content.substring(0, 200) + '...'
      };
    }
  }
  
  parseMarketInsights(content) {
    try {
      const parsed = JSON.parse(content);
      return parsed;
    } catch (error) {
      return {
        trends: ['Market analysis provided'],
        opportunities: ['Partnership opportunities available'],
        challenges: ['Competitive landscape considerations'],
        recommendations: [content],
        summary: content.substring(0, 200) + '...'
      };
    }
  }
  
  // Usage tracking and limits
  
  async checkUsageLimit(userId) {
    try {
      const subscription = await this.subscriptionManager.checkSubscription(userId);
      const planType = subscription?.plan_type || 'free';
      const limit = this.usageLimits[planType];
      
      if (limit === -1) return true; // Unlimited
      
      // Check current usage from database
      const query = `
        SELECT COUNT(*) as usage_count 
        FROM ai_usage_logs 
        WHERE user_id = $1 
        AND created_at > NOW() - INTERVAL '24 hours'
      `;
      
      const result = await this.subscriptionManager.db.query(query, [userId]);
      const currentUsage = parseInt(result.rows[0].usage_count) || 0;
      
      return currentUsage < limit;
      
    } catch (error) {
      this.logger.error('Error checking AI usage limit:', error);
      return false;
    }
  }
  
  async trackUsage(userId, requestType, tokensUsed = 0) {
    try {
      const query = `
        INSERT INTO ai_usage_logs (user_id, request_type, tokens_used, created_at)
        VALUES ($1, $2, $3, NOW())
      `;
      
      await this.subscriptionManager.db.query(query, [userId, requestType, tokensUsed]);
      
      this.logger.aiUsage(userId, requestType, tokensUsed);
      
    } catch (error) {
      this.logger.error('Error tracking AI usage:', error);
    }
  }
  
  async getUsageStats(userId) {
    try {
      const query = `
        SELECT 
          request_type,
          COUNT(*) as request_count,
          SUM(tokens_used) as total_tokens,
          MAX(created_at) as last_request
        FROM ai_usage_logs 
        WHERE user_id = $1 
        AND created_at > NOW() - INTERVAL '30 days'
        GROUP BY request_type
      `;
      
      const result = await this.subscriptionManager.db.query(query, [userId]);
      
      // Get current day usage
      const todayQuery = `
        SELECT COUNT(*) as today_usage
        FROM ai_usage_logs 
        WHERE user_id = $1 
        AND created_at > NOW() - INTERVAL '24 hours'
      `;
      
      const todayResult = await this.subscriptionManager.db.query(todayQuery, [userId]);
      
      const subscription = await this.subscriptionManager.checkSubscription(userId);
      const planType = subscription?.plan_type || 'free';
      const dailyLimit = this.usageLimits[planType];
      
      return {
        usage_by_type: result.rows,
        today_usage: parseInt(todayResult.rows[0].today_usage) || 0,
        daily_limit: dailyLimit,
        remaining_today: dailyLimit === -1 ? -1 : Math.max(0, dailyLimit - (parseInt(todayResult.rows[0].today_usage) || 0))
      };
      
    } catch (error) {
      this.logger.error('Error getting AI usage stats:', error);
      return {
        usage_by_type: [],
        today_usage: 0,
        daily_limit: 0,
        remaining_today: 0
      };
    }
  }
  
  // Health check
  
  async healthCheck() {
    try {
      if (!this.apiKey) {
        return { status: 'disabled', message: 'AI service not configured' };
      }
      
      // Simple API health check
      const response = await this.client.get('/v1/models', {
        timeout: 5000
      });
      
      return {
        status: 'healthy',
        models_available: response.data?.data?.length || 0,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = AIAssistant;