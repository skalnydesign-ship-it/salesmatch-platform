// Простая система аналитики для SalesMatch Pro
class AnalyticsManager {
    constructor() {
        this.events = new Map(); // Храним события в памяти для тестирования
        this.initializeSchema();
    }
    
    initializeSchema() {
        // Схема таблицы events для реальной БД
        this.schema = {
            id: 'SERIAL PRIMARY KEY',
            user_id: 'INTEGER',
            event_type: 'VARCHAR(50)',
            event_data: 'JSONB',
            created_at: 'TIMESTAMP DEFAULT NOW()'
        };
        
        console.log('📊 Analytics schema initialized');
    }
    
    // Основной метод для записи событий
    async trackEvent(userId, eventType, data = {}) {
        const event = {
            id: Date.now() + Math.random(),
            user_id: userId,
            event_type: eventType,
            event_data: data,
            created_at: new Date().toISOString()
        };
        
        // Сохраняем в памяти (для реальной БД это будет INSERT в PostgreSQL)
        if (!this.events.has(eventType)) {
            this.events.set(eventType, []);
        }
        this.events.get(eventType).push(event);
        
        console.log(`📊 Event tracked: ${eventType}`, { userId, data });
        return event;
    }
    
    // Получение метрик для админ-дашборда
    async getMetrics() {
        const today = new Date().toISOString().split('T')[0];
        
        const metrics = {
            // 1. Новые пользователи сегодня
            new_users: this.getEventCount('signup', today),
            
            // 2. Активные пользователи сегодня
            active_users: this.getUniqueUsersCount(today),
            
            // 3. Матчи сегодня
            matches_today: this.getEventCount('match', today),
            
            // 4. Платные подписки (всего)
            paid_users: this.getEventCount('subscription'),
            
            // 5. Сообщения сегодня
            messages_today: this.getEventCount('message', today),
            
            // Бонус: общее количество пользователей
            total_users: this.getEventCount('signup')
        };
        
        return metrics;
    }
    
    // Недельный отчет
    async getWeeklyReport() {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekAgoStr = weekAgo.toISOString().split('T')[0];
        
        const report = {
            new_users: this.getEventCountSince('signup', weekAgoStr),
            active_users: this.getUniqueUsersCountSince(weekAgoStr),
            total_matches: this.getEventCountSince('match', weekAgoStr),
            total_messages: this.getEventCountSince('message', weekAgoStr),
            new_subscriptions: this.getEventCountSince('subscription', weekAgoStr)
        };
        
        return report;
    }
    
    // Статистика для пользователей (Premium)
    async getUserStats(userId) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const stats = {
            profile_views: this.getUserEventCount(userId, 'profile_view', thirtyDaysAgo),
            received_likes: this.getUserEventCount(userId, 'like_received', thirtyDaysAgo),
            total_matches: this.getUserEventCount(userId, 'match', thirtyDaysAgo)
        };
        
        return stats;
    }
    
    // Вспомогательные методы
    getEventCount(eventType, date = null) {
        const events = this.events.get(eventType) || [];
        if (!date) return events.length;
        
        return events.filter(event => 
            event.created_at.startsWith(date)
        ).length;
    }
    
    getEventCountSince(eventType, sinceDate) {
        const events = this.events.get(eventType) || [];
        return events.filter(event => 
            event.created_at >= sinceDate
        ).length;
    }
    
    getUniqueUsersCount(date = null) {
        const allEvents = [];
        this.events.forEach(eventList => allEvents.push(...eventList));
        
        const filtered = date ? 
            allEvents.filter(event => event.created_at.startsWith(date)) :
            allEvents;
            
        const uniqueUsers = new Set(filtered.map(event => event.user_id));
        return uniqueUsers.size;
    }
    
    getUniqueUsersCountSince(sinceDate) {
        const allEvents = [];
        this.events.forEach(eventList => allEvents.push(...eventList));
        
        const filtered = allEvents.filter(event => event.created_at >= sinceDate);
        const uniqueUsers = new Set(filtered.map(event => event.user_id));
        return uniqueUsers.size;
    }
    
    getUserEventCount(userId, eventType, sinceDate) {
        const events = this.events.get(eventType) || [];
        return events.filter(event => 
            event.user_id === userId && 
            event.created_at >= sinceDate.toISOString()
        ).length;
    }
    
    // Мониторинг здоровья системы
    async getHealthCheck() {
        const lastEvent = this.getLastEvent();
        const checks = {
            database: true, // В реальности проверка подключения к БД
            telegram: true, // Проверка Telegram API
            last_event: lastEvent ? new Date(lastEvent.created_at) : null
        };
        
        // Алерт если нет событий больше часа
        if (lastEvent) {
            const minutesAgo = (Date.now() - new Date(lastEvent.created_at)) / 60000;
            checks.minutes_since_last_event = minutesAgo;
            
            if (minutesAgo > 60) {
                console.warn('⚠️ No events for more than 1 hour!');
            }
        }
        
        return checks;
    }
    
    getLastEvent() {
        let lastEvent = null;
        this.events.forEach(eventList => {
            eventList.forEach(event => {
                if (!lastEvent || event.created_at > lastEvent.created_at) {
                    lastEvent = event;
                }
            });
        });
        return lastEvent;
    }
    
    // Генерация тестовых данных
    async generateTestData() {
        const userIds = [1, 2, 3, 4, 5];
        const eventTypes = ['signup', 'login', 'profile_view', 'like', 'match', 'message', 'subscription'];
        
        // Генерируем события за последние 7 дней
        for (let day = 7; day >= 0; day--) {
            const date = new Date();
            date.setDate(date.getDate() - day);
            
            // Случайные события для каждого дня
            for (let i = 0; i < Math.random() * 20 + 5; i++) {
                const userId = userIds[Math.floor(Math.random() * userIds.length)];
                const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
                
                const event = {
                    id: Date.now() + Math.random(),
                    user_id: userId,
                    event_type: eventType,
                    event_data: { generated: true },
                    created_at: date.toISOString()
                };
                
                if (!this.events.has(eventType)) {
                    this.events.set(eventType, []);
                }
                this.events.get(eventType).push(event);
            }
        }
        
        console.log('📊 Test analytics data generated');
        return true;
    }
}

module.exports = AnalyticsManager;