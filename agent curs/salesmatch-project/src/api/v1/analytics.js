// API для простой аналитики SalesMatch Pro
const express = require('express');
const router = express.Router();
const AnalyticsManager = require('../../database/analytics');

// Инициализируем менеджер аналитики
const analytics = new AnalyticsManager();

// Генерируем тестовые данные при запуске
analytics.generateTestData();

// Middleware для проверки прав админа (упрощенная версия)
const requireAdmin = (req, res, next) => {
    // В реальности здесь проверка JWT токена и роли admin
    const isAdmin = req.headers['x-admin-key'] === 'admin123' || req.query.admin === 'true';
    
    if (!isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    
    next();
};

// Middleware для проверки Premium подписки
const requirePremium = (req, res, next) => {
    // В реальности проверка подписки пользователя
    const isPremium = req.headers['x-premium'] === 'true' || req.query.premium === 'true';
    
    if (!isPremium) {
        return res.status(403).json({ error: 'Premium subscription required' });
    }
    
    next();
};

// 📊 ADMIN ENDPOINTS

// Основные метрики для админ-дашборда
router.get('/admin/metrics', requireAdmin, async (req, res) => {
    try {
        const metrics = await analytics.getMetrics();
        
        res.json({
            success: true,
            data: {
                new_users_today: metrics.new_users,
                active_users_today: metrics.active_users,
                matches_today: metrics.matches_today,
                paid_users_total: metrics.paid_users,
                messages_today: metrics.messages_today,
                total_users: metrics.total_users,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error getting admin metrics:', error);
        res.status(500).json({ error: 'Failed to get metrics' });
    }
});

// Недельный отчет
router.get('/admin/weekly-report', requireAdmin, async (req, res) => {
    try {
        const report = await analytics.getWeeklyReport();
        
        // Формируем красивое сообщение для Telegram
        const message = `
📊 *Недельный отчет SalesMatch Pro*

👥 Новых пользователей: ${report.new_users}
🔥 Активных пользователей: ${report.active_users}
💕 Матчей: ${report.total_matches}
💬 Сообщений: ${report.total_messages}
💎 Новых подписок: ${report.new_subscriptions}

Дата: ${new Date().toLocaleDateString('ru-RU')}
        `;
        
        res.json({
            success: true,
            data: report,
            telegram_message: message
        });
    } catch (error) {
        console.error('Error getting weekly report:', error);
        res.status(500).json({ error: 'Failed to get weekly report' });
    }
});

// Проверка здоровья системы
router.get('/admin/health', requireAdmin, async (req, res) => {
    try {
        const health = await analytics.getHealthCheck();
        
        res.json({
            success: true,
            data: health,
            status: health.minutes_since_last_event > 60 ? 'warning' : 'ok'
        });
    } catch (error) {
        console.error('Error getting health check:', error);
        res.status(500).json({ error: 'Failed to get health status' });
    }
});

// 👤 USER ENDPOINTS

// Статистика для Premium пользователей
router.get('/user/stats/:userId', requirePremium, async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const stats = await analytics.getUserStats(userId);
        
        res.json({
            success: true,
            data: {
                profile_views_30d: stats.profile_views,
                received_likes_30d: stats.received_likes,
                total_matches_30d: stats.total_matches,
                period: '30 дней'
            }
        });
    } catch (error) {
        console.error('Error getting user stats:', error);
        res.status(500).json({ error: 'Failed to get user stats' });
    }
});

// 📝 EVENT TRACKING

// Основной endpoint для записи событий
router.post('/track', async (req, res) => {
    try {
        const { user_id, event_type, event_data = {} } = req.body;
        
        if (!user_id || !event_type) {
            return res.status(400).json({ error: 'user_id and event_type are required' });
        }
        
        // Список разрешенных событий
        const allowedEvents = [
            'signup', 'login', 'profile_view', 'like', 'match', 
            'message', 'subscription', 'ai_request', 'profile_update'
        ];
        
        if (!allowedEvents.includes(event_type)) {
            return res.status(400).json({ error: 'Invalid event type' });
        }
        
        const event = await analytics.trackEvent(user_id, event_type, event_data);
        
        res.json({
            success: true,
            data: { event_id: event.id }
        });
    } catch (error) {
        console.error('Error tracking event:', error);
        res.status(500).json({ error: 'Failed to track event' });
    }
});

// Простой HTML дашборд для админов
router.get('/admin/dashboard', requireAdmin, async (req, res) => {
    try {
        const metrics = await analytics.getMetrics();
        
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>SalesMatch Pro Analytics</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, sans-serif; 
            margin: 20px; 
            background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #1e40af 100%);
            color: white;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        .metrics-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 20px; 
            margin: 20px 0; 
        }
        .metric-card { 
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            padding: 20px; 
            border-radius: 15px; 
            box-shadow: 20px 20px 40px rgba(30, 58, 138, 0.15), -20px -20px 40px rgba(255, 255, 255, 0.1);
            text-align: center;
            transition: all 0.3s ease;
        }
        .metric-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 25px 50px rgba(30, 58, 138, 0.2);
        }
        .metric-value { 
            font-size: 2rem; 
            font-weight: bold; 
            color: #ffd700;
            margin-bottom: 10px;
        }
        .metric-label { 
            color: rgba(255, 255, 255, 0.8); 
            margin-top: 5px; 
        }
        .refresh-btn { 
            background: linear-gradient(145deg, #ffd700, #f59e0b);
            border: none; 
            padding: 12px 24px; 
            border-radius: 10px; 
            font-weight: bold; 
            cursor: pointer;
            color: #1e3a8a;
            transition: all 0.3s ease;
        }
        .refresh-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(255, 215, 0, 0.3);
        }
        .timestamp { 
            text-align: center; 
            color: rgba(255, 255, 255, 0.6); 
            margin: 20px 0; 
        }
        .endpoints-section {
            margin-top: 30px; 
            padding: 20px; 
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            border-radius: 15px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        h1 { text-align: center; margin-bottom: 30px; }
        h3 { color: #ffd700; }
        ul { list-style: none; padding: 0; }
        li { 
            padding: 8px 0; 
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        strong { color: #ffd700; }
    </style>
    <script>
        function refreshMetrics() {
            location.reload();
        }
        // Автообновление каждые 60 секунд
        setTimeout(refreshMetrics, 60000);
    </script>
</head>
<body>
    <div class="container">
        <h1>📊 SalesMatch Pro Analytics</h1>
        <div style="text-align: center; margin-bottom: 30px;">
            <button class="refresh-btn" onclick="refreshMetrics()">🔄 Обновить</button>
        </div>
        
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-value">${metrics.new_users}</div>
                <div class="metric-label">Новых сегодня</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${metrics.active_users}</div>
                <div class="metric-label">Активных сегодня</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${metrics.matches_today}</div>
                <div class="metric-label">Матчей сегодня</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${metrics.paid_users}</div>
                <div class="metric-label">Платных подписок</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${metrics.messages_today}</div>
                <div class="metric-label">Сообщений сегодня</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${metrics.total_users}</div>
                <div class="metric-label">Всего пользователей</div>
            </div>
        </div>
        
        <div class="timestamp">
            Последнее обновление: ${new Date().toLocaleString('ru-RU')}
        </div>
        
        <div class="endpoints-section">
            <h3>🔗 API Endpoints</h3>
            <ul>
                <li><strong>GET</strong> /api/v1/analytics/admin/metrics?admin=true</li>
                <li><strong>GET</strong> /api/v1/analytics/admin/weekly-report?admin=true</li>
                <li><strong>GET</strong> /api/v1/analytics/user/stats/1?premium=true</li>
                <li><strong>POST</strong> /api/v1/analytics/track</li>
            </ul>
        </div>
    </div>
</body>
</html>
        `;
        
        res.send(html);
    } catch (error) {
        console.error('Error rendering dashboard:', error);
        res.status(500).send('Error loading dashboard');
    }
});

// Экспорт функции для трекинга событий (для использования в других модулях)
router.trackEvent = analytics.trackEvent.bind(analytics);

module.exports = router;