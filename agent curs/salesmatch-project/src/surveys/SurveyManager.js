const Logger = require('../core/utils/logger');

class SurveyManager {
  constructor() {
    this.logger = Logger;
    this.surveys = new Map();
  }

  /**
   * Get survey prompt templates for different use cases
   * @param {string} surveyType - Type of survey
   * @param {Object} context - Context for the survey
   * @returns {Object} - Survey prompt template
   */
  getSurveyPrompt(surveyType, context = {}) {
    const prompts = {
      profile_completion: this.buildProfileCompletionSurvey(context),
      user_satisfaction: this.buildSatisfactionSurvey(context),
      feature_feedback: this.buildFeatureFeedbackSurvey(context),
      market_research: this.buildMarketResearchSurvey(context),
      onboarding_experience: this.buildOnboardingSurvey(context)
    };

    return prompts[surveyType] || prompts.profile_completion;
  }

  /**
   * Build profile completion survey prompt
   */
  buildProfileCompletionSurvey(context) {
    return {
      system: `You are a B2B sales platform expert helping to improve user profile completion.
      Generate a survey to understand what information users find most important to include in their profiles.
      Focus on business-relevant data that would help with matching and partnerships.`,
      user: `Create a survey for B2B sales professionals to assess their profile completion needs.
      
      Context:
      - Platform: SalesMatch Pro B2B matching platform
      - User Type: ${context.userType || 'B2B professional'}
      - Current Profile Status: ${context.profileStatus || 'Partially completed'}
      - Industry Focus: ${context.industry || 'General B2B'}
      
      Please provide:
      1. 5-7 survey questions focusing on profile information priorities
      2. Multiple choice options where appropriate
      3. Open-ended questions for detailed feedback
      4. Questions should be relevant to B2B sales matching`
    };
  }

  /**
   * Build user satisfaction survey prompt
   */
  buildSatisfactionSurvey(context) {
    return {
      system: `You are a customer experience expert for B2B platforms.
      Create a satisfaction survey that measures user experience with the platform's core features.
      Focus on actionable insights that can improve user retention and engagement.`,
      user: `Design a user satisfaction survey for SalesMatch Pro platform.
      
      Context:
      - Platform: SalesMatch Pro B2B matching platform
      - User Tenure: ${context.tenure || 'Active user'}
      - Key Features Used: ${context.featuresUsed || 'Core platform features'}
      - Recent Activity: ${context.recentActivity || 'Regular usage'}
      
      Please provide:
      1. 6-8 questions measuring satisfaction with key platform features
      2. Net Promoter Score (NPS) question
      3. Usability and experience rating questions
      4. Open-ended feedback opportunities
      5. Questions should focus on business value and professional networking`
    };
  }

  /**
   * Build feature feedback survey prompt
   */
  buildFeatureFeedbackSurvey(context) {
    return {
      system: `You are a product manager for a B2B sales matching platform.
      Create targeted questions to gather feedback on specific platform features.
      Focus on understanding user needs and identifying improvement opportunities.`,
      user: `Create a feature feedback survey for SalesMatch Pro platform.
      
      Target Feature: ${context.featureName || 'Platform feature'}
      Feature Description: ${context.featureDescription || 'B2B matching functionality'}
      User Role: ${context.userRole || 'Platform user'}
      
      Please provide:
      1. 4-6 questions specifically about the target feature
      2. Usability and effectiveness rating questions
      3. Suggestions for improvement
      4. Comparison to similar features in other platforms
      5. Willingness to pay for enhanced versions`
    };
  }

  /**
   * Build market research survey prompt
   */
  buildMarketResearchSurvey(context) {
    return {
      system: `You are a B2B market research specialist.
      Create questions that help understand market trends, challenges, and opportunities in B2B sales partnerships.
      Focus on insights that can inform platform development and user value proposition.`,
      user: `Design a market research survey for B2B sales professionals.
      
      Industry Focus: ${context.industry || 'General B2B'}
      Geographic Focus: ${context.geography || 'Global'}
      Participant Role: ${context.role || 'Sales professional'}
      
      Please provide:
      1. 8-10 questions about market trends and challenges
      2. Current partnership and collaboration practices
      3. Technology adoption in sales processes
      4. Pain points in finding quality business partners
      5. Future expectations and preferences`
    };
  }

  /**
   * Build onboarding experience survey prompt
   */
  buildOnboardingSurvey(context) {
    return {
      system: `You are a user experience specialist focused on onboarding processes.
      Create questions that assess how well new users understand and can use the platform.
      Focus on identifying friction points and opportunities to improve first-time user experience.`,
      user: `Create an onboarding experience survey for new SalesMatch Pro users.
      
      Onboarding Stage: ${context.stage || 'Post-registration'}
      User Type: ${context.userType || 'New B2B professional'}
      Time Since Registration: ${context.registrationTime || 'Less than 1 week'}
      
      Please provide:
      1. 5-7 questions about onboarding clarity and ease of use
      2. Understanding of platform value proposition
      3. Ease of profile setup and completion
      4. First impressions and initial experience
      5. Suggestions for improving the onboarding process`
    };
  }

  /**
   * Parse survey response from AI
   * @param {string} content - AI response content
   * @returns {Object} - Parsed survey structure
   */
  parseSurveyResponse(content) {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(content);
      return parsed;
    } catch (error) {
      // If JSON parsing fails, create structured response from text
      return this.createStructuredSurveyFromText(content);
    }
  }

  /**
   * Create structured survey from text response
   * @param {string} content - Text content from AI
   * @returns {Object} - Structured survey object
   */
  createStructuredSurveyFromText(content) {
    // Simple parsing logic - in practice, this would be more sophisticated
    return {
      questions: [
        {
          id: 'q1',
          type: 'multiple_choice',
          text: 'How would you rate your overall experience with the platform?',
          options: ['Excellent', 'Good', 'Average', 'Poor', 'Very Poor']
        }
      ],
      metadata: {
        generated_from: 'AI_response',
        timestamp: new Date().toISOString()
      },
      raw_response: content
    };
  }

  /**
   * Generate survey questions using AI
   * @param {string} surveyType - Type of survey to generate
   * @param {Object} context - Context for survey generation
   * @param {Object} aiAssistant - AI assistant instance
   * @returns {Promise<Object>} - Generated survey
   */
  async generateSurvey(surveyType, context = {}, aiAssistant) {
    try {
      const prompt = this.getSurveyPrompt(surveyType, context);
      
      // Use AI assistant to generate survey content
      const response = await aiAssistant.client.post('/v1/chat/completions', {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: prompt.system
          },
          {
            role: 'user',
            content: prompt.user
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      });

      const surveyContent = response.data.choices[0].message.content;
      const parsedSurvey = this.parseSurveyResponse(surveyContent);

      // Store survey in memory
      const surveyId = `${surveyType}_${Date.now()}`;
      this.surveys.set(surveyId, parsedSurvey);

      this.logger.businessInfo('Survey', 'Survey generated', {
        surveyType,
        surveyId,
        context
      });

      return {
        surveyId,
        survey: parsedSurvey
      };

    } catch (error) {
      this.logger.error('Error generating survey:', error);
      throw error;
    }
  }
}

module.exports = SurveyManager;