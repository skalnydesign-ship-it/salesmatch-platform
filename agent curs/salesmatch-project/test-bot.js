// Быстрый тест расширенного Telegram бота
require('dotenv').config();

const Logger = require('./src/core/utils/logger');
const EnhancedTelegramBot = require('./src/bot/handlers/EnhancedTelegramBot');

async function testBot() {
  try {
    Logger.info('🧪 Тестирование Enhanced Telegram Bot...');
    
    if (!process.env.BOT_TOKEN) {
      Logger.error('❌ BOT_TOKEN не найден в .env файле');
      Logger.info('💡 Добавьте BOT_TOKEN=your_bot_token в .env файл');
      process.exit(1);
    }
    
    const bot = new EnhancedTelegramBot();
    await bot.initialize();
    await bot.start();
    
    Logger.info('✅ Enhanced Telegram Bot успешно запущен и готов к работе!');
    Logger.info('📱 Доступные функции:');
    Logger.info('   • /start - Начать работу');
    Logger.info('   • /menu - Главное меню');
    Logger.info('   • /profile - Управление профилем');
    Logger.info('   • /search - Поиск партнеров');
    Logger.info('   • /matches - Просмотр совпадений');
    Logger.info('   • /messages - Сообщения');
    Logger.info('   • /analytics - Аналитика');
    Logger.info('');
    Logger.info('🔥 Telegram бот содержит ту же структуру что и Mini App, но без фотографий!');
    Logger.info('');
    Logger.info('⏹️  Нажмите Ctrl+C для остановки');
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      Logger.info('🛑 Остановка бота...');
      await bot.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      Logger.info('🛑 Остановка бота...');
      await bot.stop();
      process.exit(0);
    });
    
  } catch (error) {
    Logger.error('❌ Ошибка запуска бота:', error);
    process.exit(1);
  }
}

// Запуск теста
testBot();