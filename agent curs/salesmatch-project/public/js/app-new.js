// SalesMatch Pro - Neomorphic FAB Menu App
class SalesMatchApp {
    constructor() {
        this.currentSection = 'dashboard';
        this.fabMenuOpen = false;
        this.userId = this.generateUserId(); // Генерируем временный ID пользователя
        this.profiles = [
            {
                id: 1,
                name: 'ООО "ТехИнновации"',
                type: 'Компания • IT Services',
                description: 'Ищем опытных торговых агентов для продвижения инновационных IT-решений.',
                tags: ['IT', 'B2B', 'Москва', '20% комиссия'],
                icon: 'fas fa-building'
            },
            {
                id: 2,
                name: 'Александр Петров',
                type: 'Торговый агент • 5 лет опыта',
                description: 'Специализируюсь на продажах промышленного оборудования.',
                tags: ['Промышленность', 'СНГ', 'B2B', 'Опытный'],
                icon: 'fas fa-user-tie'
            },
            {
                id: 3,
                name: 'ООО "МегаТрейд"',
                type: 'Компания • Retail',
                description: 'Крупная розничная сеть ищет региональных представителей.',
                tags: ['Retail', 'Франшиза', 'Регионы', '15% комиссия'],
                icon: 'fas fa-store'
            }
        ];
        this.currentProfileIndex = 0;
        this.init();
    }
    
    init() {
        this.setupFABMenu();
        this.setupEventListeners();
        this.showSection('dashboard');
        
        // Отправляем событие запуска приложения
        this.trackEvent('login', {
            source: 'web_app',
            timestamp: new Date().toISOString()
        });
    }
    
    // === МЕТОДЫ АНАЛИТИКИ ===
    
    generateUserId() {
        // Генерируем временный ID пользователя
        let userId = localStorage.getItem('demo_user_id');
        if (!userId) {
            userId = Math.floor(Math.random() * 1000) + 1;
            localStorage.setItem('demo_user_id', userId);
        }
        return parseInt(userId);
    }
    
    async trackEvent(eventType, eventData = {}) {
        try {
            const response = await fetch('/api/v1/analytics/track', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: this.userId,
                    event_type: eventType,
                    event_data: eventData
                })
            });
            
            if (response.ok) {
                console.log(`📊 Event tracked: ${eventType}`);
            }
        } catch (error) {
            console.warn('Ошибка трекинга:', error);
        }
    }
    
    setupFABMenu() {
        const fabMainBtn = document.getElementById('fabMainBtn');
        const fabMenu = document.getElementById('fabMenu');
        
        if (fabMainBtn) {
            fabMainBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFABMenu();
            });
        }
        
        document.querySelectorAll('.fab-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                if (section) {
                    this.showSection(section);
                    this.closeFABMenu();
                }
            });
        });
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.fab-menu') && this.fabMenuOpen) {
                this.closeFABMenu();
            }
        });
    }
    
    toggleFABMenu() {
        if (this.fabMenuOpen) {
            this.closeFABMenu();
        } else {
            this.openFABMenu();
        }
    }
    
    openFABMenu() {
        const fabMenu = document.getElementById('fabMenu');
        const fabMainBtn = document.getElementById('fabMainBtn');
        const icon = fabMainBtn.querySelector('i');
        
        fabMenu.classList.add('open');
        icon.className = 'fas fa-times';
        this.fabMenuOpen = true;
        
        const fabItems = document.querySelectorAll('.fab-item');
        fabItems.forEach((item, index) => {
            setTimeout(() => {
                item.style.transform = 'scale(1) translateX(0)';
                item.style.opacity = '1';
            }, index * 50);
        });
    }
    
    closeFABMenu() {
        const fabMenu = document.getElementById('fabMenu');
        const fabMainBtn = document.getElementById('fabMainBtn');
        const icon = fabMainBtn.querySelector('i');
        
        fabMenu.classList.remove('open');
        icon.className = 'fas fa-bars';
        this.fabMenuOpen = false;
    }
    
    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.card:not([onclick])')) {
                this.addCardPressEffect(e.target.closest('.card'));
            }
        });
        
        // Keyboard shortcuts for navigation
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case '1': e.preventDefault(); this.showSection('dashboard'); break;
                    case '2': e.preventDefault(); this.showSection('swipe'); break;
                    case '3': e.preventDefault(); this.showSection('matches'); break;
                    case '4': e.preventDefault(); this.showSection('messages'); break;
                    case '5': e.preventDefault(); this.showSection('profile'); break;
                    case '6': e.preventDefault(); this.showSection('ai-assistant'); break;
                }
            }
        });
    }
    
    addCardPressEffect(card) {
        card.style.transform = 'translateY(-2px) scale(0.98)';
        card.style.boxShadow = 'var(--shadow-pressed)';
        
        setTimeout(() => {
            card.style.transform = '';
            card.style.boxShadow = '';
        }, 150);
    }
    
    showSection(sectionName) {
        this.currentSection = sectionName;
        const content = this.getSectionContent(sectionName);
        const appContent = document.getElementById('app-content');
        
        // Отправляем событие просмотра секции
        this.trackEvent('profile_view', {
            section: sectionName,
            timestamp: new Date().toISOString()
        });
        
        appContent.style.opacity = '0';
        appContent.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            appContent.innerHTML = content;
            appContent.style.opacity = '1';
            appContent.style.transform = 'translateY(0)';
            this.setupSectionHandlers(sectionName);
        }, 200);
    }
    
    getSectionContent(section) {
        switch (section) {
            case 'dashboard': return this.getDashboardContent();
            case 'swipe': return this.getSwipeContent();
            case 'matches': return this.getMatchesContent();
            case 'messages': return this.getMessagesContent();
            case 'profile': return this.getProfileContent();
            case 'ai-assistant': return this.getAIAssistantContent();
            case 'analytics': return this.getAnalyticsContent();
            default: return '<div class="glass-card"><h2>Раздел в разработке</h2></div>';
        }
    }
    
    getDashboardContent() {
        return `
            <div class="cards-grid">
                <div class="card glass-card" onclick="app.showSection('swipe')">
                    <div class="card-icon">🔍</div>
                    <div class="card-title">Поиск партнеров</div>
                    <div class="card-description">Интеллектуальный алгоритм подбора бизнес-партнеров</div>
                </div>
                
                <div class="card glass-card" onclick="app.showSection('matches')">
                    <div class="card-icon">🤝</div>
                    <div class="card-title">Совпадения</div>
                    <div class="card-description">Взаимные интересы с другими участниками</div>
                </div>
                
                <div class="card glass-card" onclick="app.showSection('messages')">
                    <div class="card-icon">💬</div>
                    <div class="card-title">Сообщения</div>
                    <div class="card-description">Безопасная система коммуникации</div>
                </div>
                
                <div class="card glass-card" onclick="app.showSection('ai-assistant')">
                    <div class="card-icon">🤖</div>
                    <div class="card-title">AI-Помощник</div>
                    <div class="card-description">Персональный AI-консультант для бизнеса</div>
                </div>
                
                <div class="card glass-card" onclick="app.showSection('analytics')">
                    <div class="card-icon">📊</div>
                    <div class="card-title">Аналитика</div>
                    <div class="card-description">Детальная статистика эффективности</div>
                </div>
                
                <div class="card glass-card" onclick="app.showSection('profile')">
                    <div class="card-icon">⭐</div>
                    <div class="card-title">Premium</div>
                    <div class="card-description">Расширенные возможности для серьезного бизнеса</div>
                </div>
            </div>
            
            <div class="text-center mt-30">
                <button class="btn btn-gold btn-lg btn-primary" onclick="app.showSection('swipe')">
                    <i class="fas fa-rocket"></i>
                    Начать поиск партнеров
                </button>
                <button class="btn btn-glass btn-lg" onclick="app.showSection('analytics')">
                    <i class="fas fa-chart-line"></i>
                    Посмотреть статистику
                </button>
            </div>
        `;
    }
    
    getSwipeContent() {
        const profile = this.profiles[this.currentProfileIndex] || this.profiles[0];
        return `
            <div class="swipe-container">
                <div class="glass-card">
                    <div class="card-icon" style="font-size: 4rem; margin-bottom: 20px;">
                        <i class="${profile.icon}"></i>
                    </div>
                    <div class="card-title">${profile.name}</div>
                    <div class="card-description" style="margin-bottom: 15px;">${profile.type}</div>
                    <div class="card-description" style="margin-bottom: 20px;">${profile.description}</div>
                    <div class="profile-tags" style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;">
                        ${profile.tags.map(tag => `<span style="background: var(--glass-background); padding: 4px 12px; border-radius: 20px; font-size: 0.9rem;">${tag}</span>`).join('')}
                    </div>
                </div>
            </div>
            
            <div class="text-center mt-30">
                <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                    <button class="btn btn-glass btn-lg" onclick="app.swipeAction('reject')">
                        <i class="fas fa-times"></i> Пропустить
                    </button>
                    <button class="btn btn-blue btn-lg" onclick="app.sendMessage(${profile.id}, '${profile.name}')">
                        <i class="fas fa-envelope"></i> Написать
                    </button>
                    <button class="btn btn-gold btn-lg" onclick="app.swipeAction('like')">
                        <i class="fas fa-heart"></i> Нравится
                    </button>
                </div>
                
                <div class="mt-20" style="color: rgba(255,255,255,0.7); font-size: 0.9rem;">
                    💡 Совет: Отправьте сообщение для прямого контакта или лайк для взаимного интереса
                </div>
            </div>
        `;
    }
    
    getMatchesContent() {
        return `
            <div class="glass-card text-center">
                <div class="card-icon">🤝</div>
                <div class="card-title">Ваши совпадения</div>
                <div class="card-description">Взаимный интерес с другими участниками платформы</div>
                <p style="margin-top: 20px;">Пока нет совпадений. Продолжайте листать профили!</p>
                <button class="btn btn-gold mt-20" onclick="app.showSection('swipe')">
                    <i class="fas fa-search"></i> Найти партнеров
                </button>
            </div>
        `;
    }
    
    getMessagesContent() {
        return `
            <div class="glass-card">
                <div class="text-center mb-30">
                    <div class="card-icon">💬</div>
                    <div class="card-title">Сообщения</div>
                    <div class="card-description">Безопасная система обмена сообщениями</div>
                </div>
                
                <div class="conversations-list">
                    <div class="conversation-item" onclick="app.openConversation(1)">
                        <div style="display: flex; align-items: center; gap: 15px; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 10px; margin-bottom: 10px; cursor: pointer; transition: all 0.3s ease;" 
                             onmouseover="this.style.background='rgba(255,255,255,0.1)'" 
                             onmouseout="this.style.background='rgba(255,255,255,0.05)'">
                            <div style="background: linear-gradient(45deg, #ffd700, #f59e0b); width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                                🏢
                            </div>
                            <div style="flex: 1;">
                                <div style="color: white; font-weight: bold; margin-bottom: 5px;">ООО "ТехИнновации"</div>
                                <div style="color: rgba(255,255,255,0.7); font-size: 0.9rem;">Привет! Интересно обсудить возможности...</div>
                            </div>
                            <div style="text-align: right;">
                                <div style="background: #10b981; color: white; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; margin-bottom: 5px;">1</div>
                                <div style="color: rgba(255,255,255,0.5); font-size: 0.8rem;">2 мин</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="conversation-item" onclick="app.openConversation(2)">
                        <div style="display: flex; align-items: center; gap: 15px; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 10px; margin-bottom: 10px; cursor: pointer; transition: all 0.3s ease;" 
                             onmouseover="this.style.background='rgba(255,255,255,0.1)'" 
                             onmouseout="this.style.background='rgba(255,255,255,0.05)'">
                            <div style="background: linear-gradient(45deg, #3b82f6, #1e40af); width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                                👤
                            </div>
                            <div style="flex: 1;">
                                <div style="color: white; font-weight: bold; margin-bottom: 5px;">Александр Петров</div>
                                <div style="color: rgba(255,255,255,0.7); font-size: 0.9rem;">Спасибо за обращение! Можем обсудить...</div>
                            </div>
                            <div style="text-align: right;">
                                <div style="color: rgba(255,255,255,0.5); font-size: 0.8rem;">1ч назад</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="text-center mt-20">
                    <button class="btn btn-gold" onclick="app.showSection('swipe')">
                        <i class="fas fa-envelope-open"></i> Написать новое сообщение
                    </button>
                </div>
            </div>
        `;
    }
    
    getProfileContent() {
        return `
            <div class="glass-card">
                <div class="card-icon">👤</div>
                <div class="card-title">Профиль компании</div>
                <div class="card-description">Управление информацией о вашей компании</div>
                
                <!-- Профиль компании -->
                <div class="profile-info-card" style="margin-top: 30px; text-align: left;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px;">
                        <div class="info-group">
                            <label>Название компании</label>
                            <div class="info-value" id="companyName">ООО "Инновационные решения"</div>
                        </div>
                        <div class="info-group">
                            <label>Отрасль</label>
                            <div class="info-value" id="industry">IT и цифровые решения</div>
                        </div>
                        <div class="info-group">
                            <label>Страна/Регион</label>
                            <div class="info-value" id="country">Россия, Москва</div>
                        </div>
                        <div class="info-group">
                            <label>Сайт</label>
                            <div class="info-value" id="website">https://innovation-solutions.ru</div>
                        </div>
                        <div class="info-group">
                            <label>Количество сотрудников</label>
                            <div class="info-value" id="employees">50-100 человек</div>
                        </div>
                        <div class="info-group">
                            <label>Год основания</label>
                            <div class="info-value" id="founded">2018</div>
                        </div>
                    </div>
                    
                    <div class="info-group" style="margin-bottom: 20px;">
                        <label>Описание деятельности</label>
                        <div class="info-value" id="description">Разрабатываем и внедряем корпоративные IT-решения для автоматизации бизнес-процессов. Специализируемся на CRM-системах, облачных решениях и интеграции с внешними сервисами.</div>
                    </div>
                    
                    <div class="info-group">
                        <label>Комиссионная структура</label>
                        <div class="info-value" id="commission">5-15% от сделки в зависимости от объема и сложности проекта</div>
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                    <button class="btn btn-gold" onclick="app.editProfile()">
                        <i class="fas fa-edit"></i> Редактировать профиль
                    </button>
                    <button class="btn btn-glass" onclick="app.uploadPhoto()">
                        <i class="fas fa-camera"></i> Загрузить фото
                    </button>
                    <button class="btn btn-glass" onclick="app.viewDocuments()">
                        <i class="fas fa-file-alt"></i> Документы
                    </button>
                </div>
            </div>
        `;
    }
    
    getAIAssistantContent() {
        return `
            <div class="glass-card text-center">
                <div class="card-icon">🤖</div>
                <div class="card-title">AI-Помощник</div>
                <div class="card-description">Персональный AI-консультант для оптимизации бизнеса</div>
                <div style="margin-top: 30px;">
                    <button class="btn btn-gold" onclick="app.showNotification('AI анализирует ваш профиль...', 'info')">
                        <i class="fas fa-brain"></i> Анализ профиля
                    </button>
                    <button class="btn btn-glass" onclick="app.showNotification('Генерация шаблонов...', 'info')">
                        <i class="fas fa-comment-dots"></i> Шаблоны сообщений
                    </button>
                </div>
            </div>
        `;
    }
    
    getAnalyticsContent() {
        return `
            <div class="glass-card text-center">
                <div class="card-icon">📊</div>
                <div class="card-title">Аналитика</div>
                <div class="card-description">Подробная статистика вашей активности</div>
                
                <div id="analytics-loading" class="mt-30">
                    <div class="loading-shimmer" style="height: 100px; border-radius: 10px; margin-bottom: 20px;"></div>
                    <p>Загрузка данных...</p>
                </div>
                
                <div id="analytics-content" class="mt-30" style="display: none;">
                    <div class="cards-grid" id="analytics-metrics"></div>
                    
                    <div class="mt-30">
                        <button class="btn btn-gold" onclick="window.open('/admin/analytics', '_blank')">
                            <i class="fas fa-external-link-alt"></i>
                            Админ-панель
                        </button>
                        <button class="btn btn-glass" onclick="window.open('/api/v1/analytics/admin/dashboard?admin=true', '_blank')">
                            <i class="fas fa-chart-line"></i>
                            Простая панель
                        </button>
                        <button class="btn btn-glass" onclick="app.loadAnalytics()">
                            <i class="fas fa-sync-alt"></i>
                            Обновить
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    setupSectionHandlers(sectionName) {
        if (sectionName === 'swipe') {
            this.setupSwipeHandlers();
        } else if (sectionName === 'analytics') {
            // Автоматически загружаем аналитику
            setTimeout(() => this.loadAnalytics(), 500);
        }
    }
    
    async loadAnalytics() {
        try {
            const loadingEl = document.getElementById('analytics-loading');
            const contentEl = document.getElementById('analytics-content');
            const metricsEl = document.getElementById('analytics-metrics');
            
            if (loadingEl) loadingEl.style.display = 'block';
            if (contentEl) contentEl.style.display = 'none';
            
            // Загружаем аналитику с сервера
            const response = await fetch('/api/v1/analytics/admin/metrics?admin=true');
            
            if (response.ok) {
                const data = await response.json();
                
                if (metricsEl) {
                    metricsEl.innerHTML = `
                        <div class="card glass-card">
                            <div class="card-title">${data.data.new_users_today}</div>
                            <div class="card-description">Новых сегодня</div>
                        </div>
                        <div class="card glass-card">
                            <div class="card-title">${data.data.active_users_today}</div>
                            <div class="card-description">Активных сегодня</div>
                        </div>
                        <div class="card glass-card">
                            <div class="card-title">${data.data.matches_today}</div>
                            <div class="card-description">Матчей сегодня</div>
                        </div>
                        <div class="card glass-card">
                            <div class="card-title">${data.data.paid_users_total}</div>
                            <div class="card-description">Платные подписки</div>
                        </div>
                        <div class="card glass-card">
                            <div class="card-title">${data.data.messages_today}</div>
                            <div class="card-description">Сообщений сегодня</div>
                        </div>
                        <div class="card glass-card">
                            <div class="card-title">${data.data.total_users}</div>
                            <div class="card-description">Всего пользователей</div>
                        </div>
                    `;
                }
                
                // Отправляем событие просмотра аналитики
                this.trackEvent('profile_view', {
                    section: 'analytics_data',
                    metrics_loaded: true,
                    timestamp: new Date().toISOString()
                });
                
            } else {
                if (metricsEl) {
                    metricsEl.innerHTML = `
                        <div class="card glass-card text-center">
                            <div class="card-description">Ошибка загрузки данных</div>
                        </div>
                    `;
                }
            }
            
        } catch (error) {
            console.error('Ошибка загрузки аналитики:', error);
        } finally {
            // Показываем контент
            const loadingEl = document.getElementById('analytics-loading');
            const contentEl = document.getElementById('analytics-content');
            
            if (loadingEl) loadingEl.style.display = 'none';
            if (contentEl) contentEl.style.display = 'block';
        }
    }
    
    setupSwipeHandlers() {
        document.addEventListener('keydown', (e) => {
            if (this.currentSection !== 'swipe') return;
            
            switch (e.key) {
                case 'ArrowLeft':
                    this.swipeAction('reject');
                    break;
                case 'ArrowRight':
                    this.swipeAction('like');
                    break;
            }
        });
    }
    
    swipeAction(action) {
        const profile = this.profiles[this.currentProfileIndex];
        
        // Отправляем событие лайка или пропуска
        this.trackEvent(action === 'like' ? 'like' : 'profile_view', {
            target_profile_id: profile.id,
            target_profile_name: profile.name,
            target_profile_type: profile.type.split(' • ')[0],
            action: action,
            timestamp: new Date().toISOString()
        });
        
        switch (action) {
            case 'like':
                this.showNotification('💖 Лайк отправлен!', 'success');
                
                // Симулируем матч с вероятностью 30%
                if (Math.random() < 0.3) {
                    setTimeout(() => {
                        this.trackEvent('match', {
                            partner_profile_id: profile.id,
                            partner_profile_name: profile.name,
                            timestamp: new Date().toISOString()
                        });
                        this.showNotification('🎉 Матч! Взаимный интерес!', 'success');
                    }, 1500);
                }
                break;
            case 'reject':
                this.showNotification('👋 Профиль пропущен', 'info');
                break;
        }
        
        setTimeout(() => {
            this.nextProfile();
        }, 1000);
    }
    
    sendMessage(profileId, profileName) {
        // Отправляем событие отправки сообщения
        this.trackEvent('message', {
            target_profile_id: profileId,
            target_profile_name: profileName,
            message_type: 'direct',
            timestamp: new Date().toISOString()
        });
        
        // Показываем модальное окно для отправки сообщения
        this.showMessageModal(profileId, profileName);
    }
    
    showMessageModal(profileId, profileName) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(30, 58, 138, 0.9);
            backdrop-filter: blur(10px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
        `;
        
        modal.innerHTML = `
            <div style="
                background: var(--glass-background);
                backdrop-filter: var(--glass-backdrop);
                border: 1px solid var(--glass-border);
                border-radius: var(--border-radius-medium);
                padding: 30px;
                max-width: 500px;
                width: 90%;
                box-shadow: var(--shadow-neumorphic);
                animation: slideInUp 0.4s ease;
            ">
                <div style="text-align: center; margin-bottom: 25px;">
                    <div style="font-size: 2rem; margin-bottom: 10px;">💬</div>
                    <h3 style="color: white; margin-bottom: 5px;">Отправить сообщение</h3>
                    <p style="color: rgba(255,255,255,0.7); font-size: 0.9rem;">${profileName}</p>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <textarea 
                        id="messageText" 
                        placeholder="Напишите сообщение..."
                        style="
                            width: 100%;
                            height: 120px;
                            background: rgba(255,255,255,0.1);
                            border: 1px solid rgba(255,255,255,0.2);
                            border-radius: 10px;
                            padding: 15px;
                            color: white;
                            font-size: 1rem;
                            resize: vertical;
                            font-family: inherit;
                        "
                    ></textarea>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <div style="color: rgba(255,255,255,0.7); font-size: 0.9rem; margin-bottom: 10px;">Быстрые шаблоны:</div>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button class="btn-template" onclick="document.getElementById('messageText').value = 'Привет! Интересно обсудить возможности сотрудничества.'">О сотрудничестве</button>
                        <button class="btn-template" onclick="document.getElementById('messageText').value = 'Здравствуйте! Могли бы обсудить детали партнерства?'">О партнерстве</button>
                        <button class="btn-template" onclick="document.getElementById('messageText').value = 'Привет! Можем обменяться контактами клиентов.'">Обмен контактами</button>
                    </div>
                </div>
                
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button class="btn btn-glass" onclick="app.closeMessageModal()">
                        <i class="fas fa-times"></i> Отмена
                    </button>
                    <button class="btn btn-gold" onclick="app.sendMessageSubmit(${profileId}, '${profileName}')">
                        <i class="fas fa-paper-plane"></i> Отправить
                    </button>
                </div>
            </div>
        `;
        
        // Добавляем стили для кнопок шаблонов
        const style = document.createElement('style');
        style.textContent = `
            .btn-template {
                background: rgba(255, 215, 0, 0.2);
                border: 1px solid rgba(255, 215, 0, 0.3);
                color: white;
                padding: 8px 12px;
                border-radius: 15px;
                font-size: 0.8rem;
                cursor: pointer;
                transition: all 0.3s ease;
                white-space: nowrap;
            }
            .btn-template:hover {
                background: rgba(255, 215, 0, 0.3);
                transform: translateY(-2px);
            }
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
            @keyframes slideInUp {
                from { transform: translateY(30px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(modal);
        
        // Фокус на текстовом поле
        setTimeout(() => {
            document.getElementById('messageText').focus();
        }, 400);
        
        // Закрывать по ESC
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                this.closeMessageModal();
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
        
        this.currentModal = modal;
        this.currentStyle = style;
    }
    
    closeMessageModal() {
        if (this.currentModal) {
            this.currentModal.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                if (this.currentModal && this.currentModal.parentNode) {
                    this.currentModal.parentNode.removeChild(this.currentModal);
                }
                if (this.currentStyle && this.currentStyle.parentNode) {
                    this.currentStyle.parentNode.removeChild(this.currentStyle);
                }
                this.currentModal = null;
                this.currentStyle = null;
            }, 300);
        }
    }
    
    sendMessageSubmit(profileId, profileName) {
        const messageText = document.getElementById('messageText')?.value?.trim();
        
        if (!messageText) {
            this.showNotification('Пожалуйста, напишите сообщение', 'warning');
            return;
        }
        
        // Отправляем событие отправки сообщения
        this.trackEvent('message', {
            target_profile_id: profileId,
            target_profile_name: profileName,
            message_length: messageText.length,
            timestamp: new Date().toISOString()
        });
        
        this.closeMessageModal();
        this.showNotification(`📬 Сообщение отправлено компании "${profileName}"!`, 'success');
        
        // Симулируем быстрый ответ с вероятностью 40%
        if (Math.random() < 0.4) {
            setTimeout(() => {
                this.showNotification(`📨 Новый ответ от "${profileName}"!`, 'info');
            }, 3000 + Math.random() * 5000); // 3-8 секунд
        }
    }
    
    openConversation(conversationId) {
        // Отправляем событие открытия диалога
        this.trackEvent('profile_view', {
            section: 'conversation',
            conversation_id: conversationId,
            timestamp: new Date().toISOString()
        });
        
        // Получаем данные о собеседнике
        const conversations = {
            1: {
                name: 'ООО "ТехИнновации"',
                avatar: '🏢',
                online: true,
                messages: [
                    { sender: 'them', text: 'Привет! Интересно обсудить возможности сотрудничества.', time: '14:25' },
                    { sender: 'me', text: 'Здравствуйте! Конечно, с удовольствием обсудим. Какие у вас направления?', time: '14:27' },
                    { sender: 'them', text: 'Мы работаем с IT-решениями для бизнеса. Нужны партнеры для продаж в регионах.', time: '14:30' }
                ]
            },
            2: {
                name: 'Александр Петров',
                avatar: '👤',
                online: false,
                messages: [
                    { sender: 'me', text: 'Здравствуйте! Могли бы обсудить детали партнерства?', time: '13:15' },
                    { sender: 'them', text: 'Спасибо за обращение! Можем обсудить. Я специализируюсь на промышленном оборудовании.', time: '13:45' }
                ]
            }
        };
        
        const conversation = conversations[conversationId];
        if (!conversation) {
            this.showNotification('Диалог не найден', 'error');
            return;
        }
        
        this.showConversationModal(conversation, conversationId);
    }
    
    showConversationModal(conversation, conversationId) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(30, 58, 138, 0.95);
            backdrop-filter: blur(15px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
        `;
        
        const messagesHtml = conversation.messages.map(msg => `
            <div style="
                display: flex;
                justify-content: ${msg.sender === 'me' ? 'flex-end' : 'flex-start'};
                margin-bottom: 15px;
            ">
                <div style="
                    max-width: 70%;
                    padding: 12px 16px;
                    border-radius: 18px;
                    background: ${msg.sender === 'me' ? 'linear-gradient(145deg, #ffd700, #f59e0b)' : 'rgba(255,255,255,0.1)'};
                    color: ${msg.sender === 'me' ? '#1e3a8a' : 'white'};
                    font-weight: ${msg.sender === 'me' ? '500' : 'normal'};
                ">
                    <div>${msg.text}</div>
                    <div style="
                        font-size: 0.8rem;
                        opacity: 0.7;
                        margin-top: 5px;
                        text-align: right;
                    ">${msg.time}</div>
                </div>
            </div>
        `).join('');
        
        modal.innerHTML = `
            <div style="
                background: var(--glass-background);
                backdrop-filter: var(--glass-backdrop);
                border: 1px solid var(--glass-border);
                border-radius: var(--border-radius-medium);
                width: 90%;
                max-width: 600px;
                height: 80%;
                max-height: 700px;
                display: flex;
                flex-direction: column;
                box-shadow: var(--shadow-neumorphic);
                animation: slideInUp 0.4s ease;
            ">
                <!-- Заголовок чата -->
                <div style="
                    padding: 20px;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                    display: flex;
                    align-items: center;
                    gap: 15px;
                ">
                    <div style="
                        background: linear-gradient(45deg, #ffd700, #f59e0b);
                        width: 50px;
                        height: 50px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 1.5rem;
                    ">
                        ${conversation.avatar}
                    </div>
                    <div style="flex: 1;">
                        <h3 style="color: white; margin-bottom: 5px;">${conversation.name}</h3>
                        <div style="color: rgba(255,255,255,0.7); font-size: 0.9rem;">
                            ${conversation.online ? '🟢 Онлайн' : '🔴 Офлайн'}
                        </div>
                    </div>
                    <button onclick="app.closeConversationModal()" style="
                        background: rgba(255,255,255,0.1);
                        border: none;
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        color: white;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.3s ease;
                    " onmouseover="this.style.background='rgba(255,255,255,0.2)'" 
                       onmouseout="this.style.background='rgba(255,255,255,0.1)'">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <!-- Область сообщений -->
                <div style="
                    flex: 1;
                    padding: 20px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                ">
                    ${messagesHtml}
                </div>
                
                <!-- Поле ввода -->
                <div style="
                    padding: 20px;
                    border-top: 1px solid rgba(255,255,255,0.1);
                    display: flex;
                    gap: 15px;
                    align-items: flex-end;
                ">
                    <textarea 
                        id="chatMessageInput"
                        placeholder="Напишите сообщение..."
                        style="
                            flex: 1;
                            background: rgba(255,255,255,0.1);
                            border: 1px solid rgba(255,255,255,0.2);
                            border-radius: 20px;
                            padding: 12px 16px;
                            color: white;
                            font-size: 1rem;
                            resize: none;
                            height: 45px;
                            max-height: 120px;
                            font-family: inherit;
                        "
                        onkeydown="if(event.key==='Enter' && !event.shiftKey) { event.preventDefault(); app.sendChatMessage(${conversationId}); }"
                    ></textarea>
                    <button onclick="app.sendChatMessage(${conversationId})" style="
                        background: linear-gradient(145deg, #ffd700, #f59e0b);
                        border: none;
                        width: 45px;
                        height: 45px;
                        border-radius: 50%;
                        color: #1e3a8a;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.3s ease;
                        font-size: 1.1rem;
                    " onmouseover="this.style.transform='scale(1.05)'" 
                       onmouseout="this.style.transform='scale(1)'">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Фокус на поле ввода
        setTimeout(() => {
            const input = document.getElementById('chatMessageInput');
            if (input) input.focus();
        }, 400);
        
        this.currentConversationModal = modal;
        this.currentConversationId = conversationId;
    }
    
    closeConversationModal() {
        if (this.currentConversationModal) {
            this.currentConversationModal.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                if (this.currentConversationModal.parentNode) {
                    this.currentConversationModal.parentNode.removeChild(this.currentConversationModal);
                }
            }, 300);
        }
    }
    
    sendChatMessage(conversationId) {
        const input = document.getElementById('chatMessageInput');
        const messageText = input.value.trim();
        
        if (!messageText) return;
        
        // Отправляем событие
        this.trackEvent('message', {
            conversation_id: conversationId,
            message_length: messageText.length,
            timestamp: new Date().toISOString()
        });
        
        // Очистка поля
        input.value = '';
        
        // Показываем уведомление
        this.showNotification('📬 Сообщение отправлено!', 'success');
    }
    
    nextProfile() {
        this.currentProfileIndex = (this.currentProfileIndex + 1) % this.profiles.length;
        this.showSection('swipe');
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 30px;
                right: 30px;
                background: var(--glass-background);
                backdrop-filter: var(--glass-backdrop);
                border: 1px solid var(--glass-border);
                color: white;
                padding: 15px 20px;
                border-radius: var(--border-radius-small);
                box-shadow: var(--shadow-neumorphic);
                z-index: 9999;
                transform: translateX(400px);
                transition: all 0.3s ease;
            ">${message}</div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.firstElementChild.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            notification.firstElementChild.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    // === ПРОФИЛЬ ФУНКЦИИ ===
    
    editProfile() {
        this.showProfileEditModal();
        
        // Отправляем событие
        this.trackEvent('profile_view', {
            section: 'edit_profile',
            timestamp: new Date().toISOString()
        });
    }
    
    showProfileEditModal() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(30, 58, 138, 0.95);
            backdrop-filter: blur(15px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
        `;
        
        modal.innerHTML = `
            <div style="
                background: var(--glass-background);
                backdrop-filter: var(--glass-backdrop);
                border: 1px solid var(--glass-border);
                border-radius: var(--border-radius-medium);
                width: 90%;
                max-width: 600px;
                max-height: 80vh;
                overflow-y: auto;
                padding: 30px;
                box-shadow: var(--shadow-neumorphic);
                animation: slideInUp 0.4s ease;
            ">
                <h2 style="color: white; margin-bottom: 25px; display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-edit"></i>
                    Редактирование профиля
                </h2>
                
                <form id="profileEditForm" style="color: white;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 20px;">
                        <div class="form-group">
                            <label for="editCompanyName">Название компании</label>
                            <input type="text" id="editCompanyName" value="ООО 'Инновационные решения'" class="profile-input">
                        </div>
                        <div class="form-group">
                            <label for="editIndustry">Отрасль</label>
                            <input type="text" id="editIndustry" value="IT и цифровые решения" class="profile-input">
                        </div>
                        <div class="form-group">
                            <label for="editCountry">Страна/Регион</label>
                            <input type="text" id="editCountry" value="Россия, Москва" class="profile-input">
                        </div>
                        <div class="form-group">
                            <label for="editWebsite">Веб-сайт</label>
                            <input type="url" id="editWebsite" value="https://innovation-solutions.ru" class="profile-input">
                        </div>
                        <div class="form-group">
                            <label for="editEmployees">Количество сотрудников</label>
                            <select id="editEmployees" class="profile-input">
                                <option value="1-10">1-10 человек</option>
                                <option value="11-50">11-50 человек</option>
                                <option value="50-100" selected>50-100 человек</option>
                                <option value="100-500">100-500 человек</option>
                                <option value="500+">500+ человек</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="editFounded">Год основания</label>
                            <input type="number" id="editFounded" value="2018" min="1900" max="2025" class="profile-input">
                        </div>
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label for="editDescription">Описание деятельности</label>
                        <textarea id="editDescription" rows="4" class="profile-input">Разрабатываем и внедряем корпоративные IT-решения для автоматизации бизнес-процессов. Специализируемся на CRM-системах, облачных решениях и интеграции с внешними сервисами.</textarea>
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 30px;">
                        <label for="editCommission">Комиссионная структура</label>
                        <textarea id="editCommission" rows="2" class="profile-input">5-15% от сделки в зависимости от объема и сложности проекта</textarea>
                    </div>
                    
                    <div style="display: flex; gap: 15px; justify-content: center;">
                        <button type="button" class="btn btn-glass" onclick="app.closeProfileEditModal()">
                            <i class="fas fa-times"></i> Отмена
                        </button>
                        <button type="button" class="btn btn-gold" onclick="app.saveProfile()">
                            <i class="fas fa-save"></i> Сохранить
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        // Добавляем стили для формы
        const style = document.createElement('style');
        style.textContent = `
            .form-group {
                margin-bottom: 15px;
            }
            .form-group label {
                display: block;
                margin-bottom: 5px;
                color: rgba(255, 255, 255, 0.9);
                font-weight: 500;
                font-size: 0.9rem;
            }
            .profile-input {
                width: 100%;
                padding: 12px 15px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 10px;
                color: white;
                font-size: 1rem;
                font-family: inherit;
                transition: all 0.3s ease;
            }
            .profile-input:focus {
                outline: none;
                border-color: var(--gold);
                background: rgba(255, 255, 255, 0.15);
                box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.2);
            }
            .profile-input::placeholder {
                color: rgba(255, 255, 255, 0.5);
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(modal);
        
        this.currentProfileModal = modal;
        this.currentProfileStyle = style;
    }
    
    closeProfileEditModal() {
        if (this.currentProfileModal) {
            this.currentProfileModal.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                if (this.currentProfileModal && this.currentProfileModal.parentNode) {
                    this.currentProfileModal.parentNode.removeChild(this.currentProfileModal);
                }
                if (this.currentProfileStyle && this.currentProfileStyle.parentNode) {
                    this.currentProfileStyle.parentNode.removeChild(this.currentProfileStyle);
                }
                this.currentProfileModal = null;
                this.currentProfileStyle = null;
            }, 300);
        }
    }
    
    async saveProfile() {
        try {
            // Собираем данные из формы
            const formData = {
                companyName: document.getElementById('editCompanyName')?.value,
                industry: document.getElementById('editIndustry')?.value,
                country: document.getElementById('editCountry')?.value,
                website: document.getElementById('editWebsite')?.value,
                employees: document.getElementById('editEmployees')?.value,
                founded: document.getElementById('editFounded')?.value,
                description: document.getElementById('editDescription')?.value,
                commission: document.getElementById('editCommission')?.value
            };
            
            // Отправляем событие сохранения
            this.trackEvent('profile_update', {
                fields_updated: Object.keys(formData),
                timestamp: new Date().toISOString()
            });
            
            // Симулируем отправку на сервер
            const response = await fetch('/api/v1/profiles/profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            if (response.ok) {
                // Обновляем отображение профиля
                this.updateProfileDisplay(formData);
                this.closeProfileEditModal();
                this.showNotification('✅ Профиль успешно обновлен!', 'success');
            } else {
                throw new Error('Ошибка сохранения');
            }
            
        } catch (error) {
            console.error('Ошибка сохранения профиля:', error);
            this.showNotification('❌ Ошибка сохранения профиля', 'error');
        }
    }
    
    updateProfileDisplay(data) {
        // Обновляем отображаемую информацию в профиле
        const elements = {
            'companyName': data.companyName,
            'industry': data.industry,
            'country': data.country,
            'website': data.website,
            'employees': data.employees,
            'founded': data.founded,
            'description': data.description,
            'commission': data.commission
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element && value) {
                element.textContent = value;
            }
        });
    }
    
    uploadPhoto() {
        // Создаем input для загрузки файла
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = true;
        input.style.display = 'none';
        
        input.onchange = (event) => {
            const files = event.target.files;
            if (files.length > 0) {
                this.showNotification(`📸 Выбрано ${files.length} фото для загрузки`, 'info');
                
                // Отправляем событие
                this.trackEvent('photo_upload', {
                    files_count: files.length,
                    timestamp: new Date().toISOString()
                });
                
                // Симулируем загрузку
                setTimeout(() => {
                    this.showNotification('✅ Фотографии успешно загружены!', 'success');
                }, 2000);
            }
        };
        
        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
    }
    
    viewDocuments() {
        this.showNotification('📁 Функция просмотра документов в разработке', 'info');
        
        // Отправляем событие
        this.trackEvent('profile_view', {
            section: 'documents',
            timestamp: new Date().toISOString()
        });
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new SalesMatchApp();
});