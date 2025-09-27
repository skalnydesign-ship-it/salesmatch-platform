// Test script for survey functionality
require('dotenv').config();

const Logger = require('./src/core/utils/logger');
const SurveyManager = require('./src/surveys/SurveyManager');

async function testSurvey() {
  try {
    Logger.info('🧪 Testing Survey Manager...');
    
    const surveyManager = new SurveyManager();
    
    // Test getting survey prompts
    Logger.info('📋 Testing survey prompt generation...');
    
    const profileSurvey = surveyManager.getSurveyPrompt('profile_completion', {
      userType: 'Company',
      profileStatus: 'Partially completed',
      industry: 'IT Services'
    });
    
    Logger.info('✅ Profile completion survey prompt generated');
    Logger.info('System prompt:', profileSurvey.system.substring(0, 100) + '...');
    Logger.info('User prompt:', profileSurvey.user.substring(0, 100) + '...');
    
    const satisfactionSurvey = surveyManager.getSurveyPrompt('user_satisfaction', {
      tenure: '6 months',
      featuresUsed: 'Profile matching, Messaging',
      recentActivity: 'Weekly usage'
    });
    
    Logger.info('✅ User satisfaction survey prompt generated');
    
    const featureSurvey = surveyManager.getSurveyPrompt('feature_feedback', {
      featureName: 'AI Assistant',
      featureDescription: 'Generates message templates and business insights',
      userRole: 'Company representative'
    });
    
    Logger.info('✅ Feature feedback survey prompt generated');
    
    const marketSurvey = surveyManager.getSurveyPrompt('market_research', {
      industry: 'IT Services',
      geography: 'Russia and CIS',
      role: 'Sales Director'
    });
    
    Logger.info('✅ Market research survey prompt generated');
    
    const onboardingSurvey = surveyManager.getSurveyPrompt('onboarding_experience', {
      stage: 'First week',
      userType: 'New company user',
      registrationTime: '3 days'
    });
    
    Logger.info('✅ Onboarding experience survey prompt generated');
    
    // Test parsing functionality
    Logger.info('🔍 Testing survey response parsing...');
    
    const mockResponse = JSON.stringify({
      questions: [
        {
          id: 'q1',
          type: 'multiple_choice',
          text: 'How would you rate your experience?',
          options: ['Excellent', 'Good', 'Average', 'Poor']
        }
      ]
    });
    
    const parsed = surveyManager.parseSurveyResponse(mockResponse);
    Logger.info('✅ Survey response parsed successfully');
    
    Logger.info('🎉 All survey tests passed!');
    Logger.info('');
    Logger.info('📊 Survey Manager provides templates for:');
    Logger.info('   • Profile completion surveys');
    Logger.info('   • User satisfaction surveys');
    Logger.info('   • Feature feedback surveys');
    Logger.info('   • Market research surveys');
    Logger.info('   • Onboarding experience surveys');
    Logger.info('');
    Logger.info('🚀 Survey API endpoints available at /api/v1/surveys');
    
  } catch (error) {
    Logger.error('❌ Survey test failed:', error);
    process.exit(1);
  }
}

// Run the test
testSurvey();