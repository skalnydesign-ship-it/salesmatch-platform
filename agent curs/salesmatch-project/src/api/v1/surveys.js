const express = require('express');
const Logger = require('../../core/utils/logger');
const ErrorHandler = require('../../core/utils/errorHandler');

class SurveyAPI {
  constructor(managers) {
    this.router = express.Router();
    this.logger = Logger;
    this.errorHandler = ErrorHandler;
    this.managers = managers;
    
    this.setupRoutes();
  }
  
  setupRoutes() {
    // Generate survey endpoint
    this.router.post('/generate', this.generateSurvey.bind(this));
    
    // Get survey by ID
    this.router.get('/:surveyId', this.getSurvey.bind(this));
    
    // Submit survey responses
    this.router.post('/:surveyId/responses', this.submitSurveyResponse.bind(this));
    
    // Get survey results
    this.router.get('/:surveyId/results', this.getSurveyResults.bind(this));
  }
  
  /**
   * Generate a new survey
   */
  async generateSurvey(req, res) {
    try {
      const { surveyType, context = {} } = req.body;
      const userId = req.telegramUser?.id || req.user?.id;
      
      if (!surveyType) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Survey type is required',
            code: 'MISSING_SURVEY_TYPE'
          }
        });
      }
      
      // Initialize SurveyManager if not already done
      if (!this.managers.surveyManager) {
        const SurveyManager = require('../../surveys/SurveyManager');
        this.managers.surveyManager = new SurveyManager();
      }
      
      // Generate survey using AI if available
      let surveyData;
      if (this.managers.aiAssistant) {
        surveyData = await this.managers.surveyManager.generateSurvey(
          surveyType, 
          { ...context, userId },
          this.managers.aiAssistant
        );
      } else {
        // Fallback to template-based survey
        const prompt = this.managers.surveyManager.getSurveyPrompt(surveyType, { ...context, userId });
        surveyData = {
          surveyId: `${surveyType}_${Date.now()}`,
          survey: {
            title: this.getSurveyTitle(surveyType),
            description: this.getSurveyDescription(surveyType),
            questions: this.getDefaultQuestions(surveyType),
            metadata: {
              type: surveyType,
              generated_at: new Date().toISOString(),
              generated_by: 'template'
            }
          }
        };
      }
      
      this.logger.businessInfo('Survey', 'Survey generated', {
        userId,
        surveyType,
        surveyId: surveyData.surveyId
      });
      
      res.json({
        success: true,
        data: surveyData
      });
      
    } catch (error) {
      this.logger.apiError('Generate survey error', error, req);
      this.errorHandler.sendErrorResponse(res, error);
    }
  }
  
  /**
   * Get a specific survey by ID
   */
  async getSurvey(req, res) {
    try {
      const { surveyId } = req.params;
      const userId = req.telegramUser?.id || req.user?.id;
      
      // Initialize SurveyManager if not already done
      if (!this.managers.surveyManager) {
        const SurveyManager = require('../../surveys/SurveyManager');
        this.managers.surveyManager = new SurveyManager();
      }
      
      // In a real implementation, this would fetch from database
      // For now, we'll return a default survey structure
      const survey = {
        id: surveyId,
        title: 'User Feedback Survey',
        description: 'Help us improve your experience on SalesMatch Pro',
        questions: [
          {
            id: 'satisfaction',
            type: 'rating',
            text: 'How satisfied are you with SalesMatch Pro?',
            required: true,
            options: [1, 2, 3, 4, 5]
          },
          {
            id: 'features',
            type: 'multiple_choice',
            text: 'Which features do you use most often?',
            required: false,
            options: ['Profile Matching', 'Messaging', 'AI Assistant', 'Analytics', 'All of the above']
          },
          {
            id: 'improvements',
            type: 'text',
            text: 'What improvements would you like to see?',
            required: false
          }
        ],
        metadata: {
          created_at: new Date().toISOString(),
          created_by: 'system'
        }
      };
      
      res.json({
        success: true,
        data: survey
      });
      
    } catch (error) {
      this.logger.apiError('Get survey error', error, req);
      this.errorHandler.sendErrorResponse(res, error);
    }
  }
  
  /**
   * Submit survey responses
   */
  async submitSurveyResponse(req, res) {
    try {
      const { surveyId } = req.params;
      const { responses } = req.body;
      const userId = req.telegramUser?.id || req.user?.id;
      
      if (!responses || !Array.isArray(responses)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Valid responses array is required',
            code: 'INVALID_RESPONSES'
          }
        });
      }
      
      // In a real implementation, this would save to database
      // For now, we'll just log the submission
      this.logger.businessInfo('Survey', 'Survey response submitted', {
        userId,
        surveyId,
        responseCount: responses.length
      });
      
      res.json({
        success: true,
        message: 'Survey response submitted successfully'
      });
      
    } catch (error) {
      this.logger.apiError('Submit survey response error', error, req);
      this.errorHandler.sendErrorResponse(res, error);
    }
  }
  
  /**
   * Get survey results
   */
  async getSurveyResults(req, res) {
    try {
      const { surveyId } = req.params;
      const userId = req.telegramUser?.id || req.user?.id;
      
      // In a real implementation, this would fetch results from database
      // For now, we'll return mock results
      const results = {
        surveyId,
        responseCount: 24,
        completionRate: 0.87,
        questions: [
          {
            id: 'satisfaction',
            type: 'rating',
            text: 'How satisfied are you with SalesMatch Pro?',
            responses: {
              '1': 2,
              '2': 1,
              '3': 3,
              '4': 8,
              '5': 10
            },
            average: 4.2
          },
          {
            id: 'features',
            type: 'multiple_choice',
            text: 'Which features do you use most often?',
            responses: {
              'Profile Matching': 15,
              'Messaging': 18,
              'AI Assistant': 12,
              'Analytics': 7,
              'All of the above': 8
            }
          }
        ]
      };
      
      res.json({
        success: true,
        data: results
      });
      
    } catch (error) {
      this.logger.apiError('Get survey results error', error, req);
      this.errorHandler.sendErrorResponse(res, error);
    }
  }
  
  /**
   * Get survey title based on type
   */
  getSurveyTitle(surveyType) {
    const titles = {
      profile_completion: 'Profile Completion Survey',
      user_satisfaction: 'User Satisfaction Survey',
      feature_feedback: 'Feature Feedback Survey',
      market_research: 'Market Research Survey',
      onboarding_experience: 'Onboarding Experience Survey'
    };
    
    return titles[surveyType] || 'User Feedback Survey';
  }
  
  /**
   * Get survey description based on type
   */
  getSurveyDescription(surveyType) {
    const descriptions = {
      profile_completion: 'Help us understand what information is most important for your professional profile',
      user_satisfaction: 'Share your experience with our platform to help us improve',
      feature_feedback: 'Provide feedback on specific platform features',
      market_research: 'Share insights about your industry and business practices',
      onboarding_experience: 'Tell us about your experience getting started with our platform'
    };
    
    return descriptions[surveyType] || 'Your feedback helps us improve the platform';
  }
  
  /**
   * Get default questions based on survey type
   */
  getDefaultQuestions(surveyType) {
    const questionSets = {
      profile_completion: [
        {
          id: 'importance_rating',
          type: 'rating',
          text: 'How important is it to have a complete professional profile?',
          required: true,
          options: [1, 2, 3, 4, 5]
        },
        {
          id: 'missing_info',
          type: 'multiple_choice',
          text: 'What information is missing from your profile that you would like to add?',
          required: false,
          options: [
            'Portfolio/Case Studies',
            'Certifications',
            'Languages',
            'Geographic Coverage',
            'Specializations',
            'Client Testimonials'
          ]
        }
      ],
      user_satisfaction: [
        {
          id: 'overall_satisfaction',
          type: 'rating',
          text: 'Overall, how satisfied are you with SalesMatch Pro?',
          required: true,
          options: [1, 2, 3, 4, 5]
        },
        {
          id: 'nps',
          type: 'rating',
          text: 'How likely are you to recommend SalesMatch Pro to a colleague or friend?',
          required: true,
          options: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
        }
      ],
      feature_feedback: [
        {
          id: 'feature_usefulness',
          type: 'rating',
          text: 'How useful is this feature for your business needs?',
          required: true,
          options: [1, 2, 3, 4, 5]
        },
        {
          id: 'improvement_suggestions',
          type: 'text',
          text: 'What improvements would you suggest for this feature?',
          required: false
        }
      ]
    };
    
    return questionSets[surveyType] || [
      {
        id: 'general_feedback',
        type: 'text',
        text: 'Please share any feedback you have about your experience',
        required: false
      }
    ];
  }
}

module.exports = SurveyAPI;