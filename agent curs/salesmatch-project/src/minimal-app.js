require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

class MinimalSalesMatchApp {
  constructor() {
    this.app = express();
    this.setupExpress();
    this.setupRoutes();
  }
  
  setupExpress() {
    // CORS
    this.app.use(cors({
      origin: true,
      credentials: true
    }));
    
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // Static files
    this.app.use('/css', express.static(path.join(process.cwd(), 'public', 'css')));
    this.app.use('/js', express.static(path.join(process.cwd(), 'public', 'js')));
    this.app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  }
  
  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    });
    
    // Main routes
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
    });
    
    this.app.get('/app', (req, res) => {
      res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
    });
    
    // API test
    this.app.get('/api/test', (req, res) => {
      res.json({
        success: true,
        message: 'SalesMatch Pro API работает!',
        data: {
          platform: 'Telegram Bot + Mini App',
          features: ['B2B Matching', 'AI Assistant', 'Analytics'],
          status: 'active'
        }
      });
    });
  }
  
  start() {
    const port = process.env.PORT || 3000;
    
    this.app.listen(port, () => {
      console.log(`🚀 SalesMatch Pro запущен на порту ${port}`);
      console.log(`📱 Локальный URL: http://localhost:${port}`);
      console.log(`🔗 HTTPS URL: ${process.env.WEBAPP_URL || 'https://clean-plums-nail.loca.lt'}`);
      console.log(`⏰ Время запуска: ${new Date().toLocaleString()}`);
    });
  }
}

// Start immediately
const app = new MinimalSalesMatchApp();
app.start();

// Start bot in background without blocking
setTimeout(async () => {
  try {
    console.log('🤖 Инициализация Telegram Bot...');
    const TelegramBotCore = require('./bot/core/TelegramBot');
    const bot = await TelegramBotCore.initialize();
    await bot.bot.launch();
    console.log('✅ Telegram Bot запущен');
  } catch (error) {
    console.log('⚠️ Telegram Bot не удалось запустить, но веб-интерфейс работает');
  }
}, 1000);

module.exports = MinimalSalesMatchApp;