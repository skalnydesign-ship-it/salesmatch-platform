// Demo script to showcase all functionality
require('dotenv').config();

const Logger = require('./src/core/utils/logger');
const SurveyManager = require('./src/surveys/SurveyManager');
const EnhancedTelegramBot = require('./src/bot/handlers/EnhancedTelegramBot');

async function runDemo() {
  try {
    Logger.info('🚀 Запуск демонстрации SalesMatch Pro Platform');
    Logger.info('==========================================');
    
    // 1. Demo Survey Manager
    Logger.info('📋 1. Демонстрация Survey Manager...');
    const surveyManager = new SurveyManager();
    
    // Generate different types of surveys
    const surveys = [
      {
        type: 'profile_completion',
        context: { userType: 'Company', profileStatus: 'Partially completed', industry: 'IT Services' },
        name: 'Завершение профиля'
      },
      {
        type: 'user_satisfaction',
        context: { tenure: '6 months', featuresUsed: 'Profile matching, Messaging', recentActivity: 'Weekly usage' },
        name: 'Удовлетворенность пользователей'
      },
      {
        type: 'feature_feedback',
        context: { featureName: 'AI Assistant', featureDescription: 'Generates message templates', userRole: 'Company representative' },
        name: 'Обратная связь по функциям'
      },
      {
        type: 'market_research',
        context: { industry: 'IT Services', geography: 'Russia and CIS', role: 'Sales Director' },
        name: 'Маркетинговые исследования'
      }
    ];
    
    for (const survey of surveys) {
      const prompt = surveyManager.getSurveyPrompt(survey.type, survey.context);
      Logger.info(`   ✅ Создан промт для опроса: ${survey.name}`);
      Logger.info(`      Системный промт: ${prompt.system.substring(0, 50)}...`);
      Logger.info(`      Пользовательский промт: ${prompt.user.substring(0, 50)}...`);
    }
    
    Logger.info('');
    
    // 2. Demo API Endpoints
    Logger.info('🌐 2. Доступные API endpoints:');
    Logger.info('   • GET  /health - Статус приложения');
    Logger.info('   • GET  /api/v1/profiles/health - Статус профилей');
    Logger.info('   • POST /api/v1/surveys/generate - Генерация опросов');
    Logger.info('   • GET  /api/v1/analytics/admin/metrics - Аналитика');
    Logger.info('   • POST /api/v1/messages/templates - Шаблоны сообщений');
    Logger.info('');
    
    // 3. Demo Web Interface
    Logger.info('📱 3. Веб-интерфейс доступен по адресу:');
    Logger.info('   • http://localhost:3000 - Главная страница');
    Logger.info('   • http://localhost:3000/health - Статус системы');
    Logger.info('');
    
    // 4. Demo Telegram Bot Features
    Logger.info('🤖 4. Функции Telegram бота:');
    Logger.info('   • /start - Начало работы');
    Logger.info('   • /menu - Главное меню');
    Logger.info('   • /profile - Управление профилем');
    Logger.info('   • /search - Поиск партнеров');
    Logger.info('   • /matches - Совпадения');
    Logger.info('   • /messages - Сообщения');
    Logger.info('   • /analytics - Аналитика');
    Logger.info('   • /ai - AI-помощник');
    Logger.info('');
    
    // 5. Demo Survey API
    Logger.info('📊 5. Survey API endpoints:');
    Logger.info('   • POST /api/v1/surveys/generate - Генерация опросов');
    Logger.info('   • GET  /api/v1/surveys/:surveyId - Получение опроса');
    Logger.info('   • POST /api/v1/surveys/:surveyId/responses - Отправка ответов');
    Logger.info('   • GET  /api/v1/surveys/:surveyId/results - Результаты опроса');
    Logger.info('');
    
    // 6. Summary
    Logger.info('✅ Демонстрация завершена успешно!');
    Logger.info('');
    Logger.info('💡 Чтобы протестировать систему:');
    Logger.info('   1. Откройте http://localhost:3000 в браузере');
    Logger.info('   2. Используйте curl для тестирования API');
    Logger.info('   3. Запустите Telegram бот с действительным токеном');
    Logger.info('');
    Logger.info('🔧 Для запуска Telegram бота:');
    Logger.info('   BOT_TOKEN=your_token_here node test-bot.js');
    
  } catch (error) {
    Logger.error('❌ Ошибка демонстрации:', error);
    process.exit(1);
  }
}

// Run the demo
runDemo();