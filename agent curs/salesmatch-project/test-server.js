const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'SalesMatch Pro',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API работает!',
    data: {
      platform: 'Telegram Bot + Mini App',
      features: ['B2B Matching', 'SSL Management', 'Payment System'],
      status: 'active'
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Внутренняя ошибка сервера',
    message: err.message
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Маршрут не найден',
    path: req.originalUrl
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SalesMatch Pro тестовый сервер запущен`);
  console.log(`📱 URL: http://localhost:${PORT}`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
  console.log(`🧪 API Test: http://localhost:${PORT}/api/test`);
  console.log(`⏰ Время запуска: ${new Date().toLocaleString()}`);
});