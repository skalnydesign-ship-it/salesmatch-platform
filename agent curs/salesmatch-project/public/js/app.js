// SalesMatch Pro - Frontend Application
class SalesMatchApp {
    constructor() {
        this.currentSection = 'dashboard';
        this.currentView = 'main'; // main, detail, settings
        this.selectedProfile = null;
        this.designSettings = {
            theme: 'gradient', // gradient, dark, light, custom
            primaryColor: '#667eea',
            secondaryColor: '#764ba2',
            layout: 'sidebar', // sidebar, tabs, modern
            cardStyle: 'modern' // modern, classic, minimal
        };
        this.profiles = [
            {
                id: 1,
                name: 'ООО "ТехИнновации"',
                type: 'Компания • IT Services',
                description: 'Ищем опытных торговых агентов для продвижения инновационных IT-решений в корпоративном секторе.',
                tags: ['IT', 'B2B', 'Москва', '20% комиссия'],
                icon: 'fas fa-building',
                fullProfile: {
                    founded: '2015',
                    employees: '50-100',
                    revenue: '$2M-5M',
                    website: 'techinnovations.ru',
                    phone: '+7 (495) 123-45-67',
                    email: 'partners@techinnovations.ru',
                    address: 'Москва, Красная Площадь, 1',
                    documents: ['Презентация компании.pdf', 'Коммерческое предложение.pdf', 'Сертификаты.pdf'],
                    photos: ['office1.jpg', 'team.jpg', 'product.jpg'],
                    services: ['Разработка ПО', 'Консультации', 'Интеграция систем'],
                    targetMarkets: ['Банки', 'Производство', 'Ритейл'],
                    commission: '15-25%',
                    requirements: 'Опыт B2B продаж от 3 лет, знание IT-сферы',
                    benefits: 'Высокая комиссия, обучение, маркетинговая поддержка'
                }
            },
            {
                id: 2,
                name: 'Александр Петров',
                type: 'Торговый агент • 5 лет опыта',
                description: 'Специализируюсь на продажах промышленного оборудования. Обширная клиентская база в СНГ.',
                tags: ['Промышленность', 'СНГ', 'B2B', 'Опытный'],
                icon: 'fas fa-user-tie',
                fullProfile: {
                    experience: '5 лет',
                    specialization: 'Промышленное оборудование',
                    regions: ['Россия', 'Казахстан', 'Беларусь'],
                    phone: '+7 (926) 123-45-67',
                    email: 'a.petrov@example.com',
                    languages: ['Русский', 'Английский'],
                    education: 'МГТУ им. Баумана, Инженер',
                    achievements: ['Топ-продажи 2023', 'Клиентская база 200+ компаний'],
                    portfolio: ['Завод "Металл"', 'ООО "ПромТех"', 'АО "Машиностроение"'],
                    commission: 'От 10%',
                    availability: 'Полная занятость',
                    references: ['Рекомендация от ООО "ПромСтрой"', 'Отзыв клиента ABC Corp']
                }
            },
            {
                id: 3,
                name: 'ООО "МегаТрейд"',
                type: 'Компания • Retail',
                description: 'Крупная розничная сеть ищет региональных представителей для расширения географии.',
                tags: ['Retail', 'Франшиза', 'Регионы', '15% комиссия'],
                icon: 'fas fa-store'
            }
        ];
        this.currentProfileIndex = 0;
        this.matches = [];
        this.conversations = [
            {
                id: 1,
                name: 'ООО "ТехИнновации"',
                lastMessage: 'Отлично! Давайте обсудим детали...',
                messages: [
                    { sender: 'received', content: 'Привет! Видел ваш профиль, очень интересно!' },
                    { sender: 'sent', content: 'Привет! Спасибо за интерес. Расскажите о вашем опыте?' },
                    { sender: 'received', content: 'У меня 5 лет опыта в B2B продажах IT-решений. Работал с крупными корпорациями.' },
                    { sender: 'sent', content: 'Отлично! Давайте обсудим детали сотрудничества.' }
                ]
            },
            {
                id: 2,
                name: 'Александр Петров',
                lastMessage: 'Привет! Интересует сотрудничество?',
                messages: [
                    { sender: 'received', content: 'Привет! Интересует сотрудничество?' },
                    { sender: 'sent', content: 'Да, конечно! Расскажите подробнее о ваших услугах.' }
                ]
            }
        ];
        this.currentConversation = 0;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.applyDesignSettings();
        this.showSection('dashboard');
    }
    
    applyDesignSettings() {
        const root = document.documentElement;
        const { theme, primaryColor, secondaryColor, layout } = this.designSettings;
        
        // Apply CSS custom properties
        root.style.setProperty('--primary-color', primaryColor);
        root.style.setProperty('--secondary-color', secondaryColor);
        
        // Apply theme
        document.body.className = `theme-${theme} layout-${layout}`;
        
        // Update app container class for layout
        const appContainer = document.querySelector('.app-container');
        if (appContainer) {
            appContainer.className = `app-container layout-${layout}`;
        }
    }
    
    showDesignCustomizer() {
        const customizer = `
            <div class="design-customizer" id="designCustomizer">
                <div class="customizer-content">
                    <h3>Настройки дизайна</h3>
                    
                    <div class="customizer-section">
                        <label>Тема:</label>
                        <select id="themeSelect">
                            <option value="gradient">Градиент</option>
                            <option value="dark">Темная</option>
                            <option value="light">Светлая</option>
                            <option value="custom">Пользовательская</option>
                        </select>
                    </div>
                    
                    <div class="customizer-section">
                        <label>Основной цвет:</label>
                        <input type="color" id="primaryColorPicker" value="${this.designSettings.primaryColor}">
                    </div>
                    
                    <div class="customizer-section">
                        <label>Дополнительный цвет:</label>
                        <input type="color" id="secondaryColorPicker" value="${this.designSettings.secondaryColor}">
                    </div>
                    
                    <div class="customizer-section">
                        <label>Макет:</label>
                        <select id="layoutSelect">
                            <option value="sidebar">Боковая панель</option>
                            <option value="tabs">Вкладки</option>
                            <option value="modern">Современный</option>
                        </select>
                    </div>
                    
                    <div class="customizer-section">
                        <label>Стиль карточек:</label>
                        <select id="cardStyleSelect">
                            <option value="modern">Современный</option>
                            <option value="classic">Классический</option>
                            <option value="minimal">Минимальный</option>
                        </select>
                    </div>
                    
                    <div class="customizer-actions">
                        <button class="btn btn-primary" onclick="app.saveDesignSettings()">Сохранить</button>
                        <button class="btn btn-secondary" onclick="app.resetDesignSettings()">Сбросить</button>
                        <button class="btn btn-secondary" onclick="app.hideDesignCustomizer()">Закрыть</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', customizer);
        
        // Set current values
        document.getElementById('themeSelect').value = this.designSettings.theme;
        document.getElementById('layoutSelect').value = this.designSettings.layout;
        document.getElementById('cardStyleSelect').value = this.designSettings.cardStyle;
    }
    
    saveDesignSettings() {
        this.designSettings.theme = document.getElementById('themeSelect').value;
        this.designSettings.primaryColor = document.getElementById('primaryColorPicker').value;
        this.designSettings.secondaryColor = document.getElementById('secondaryColorPicker').value;
        this.designSettings.layout = document.getElementById('layoutSelect').value;
        this.designSettings.cardStyle = document.getElementById('cardStyleSelect').value;
        
        this.applyDesignSettings();
        localStorage.setItem('salesmatch_design', JSON.stringify(this.designSettings));
        this.hideDesignCustomizer();
        this.showNotification('Настройки дизайна сохранены!', 'success');
    }
    
    resetDesignSettings() {
        this.designSettings = {
            theme: 'gradient',
            primaryColor: '#667eea',
            secondaryColor: '#764ba2',
            layout: 'sidebar',
            cardStyle: 'modern'
        };
        this.applyDesignSettings();
        this.hideDesignCustomizer();
        this.showNotification('Настройки дизайна сброшены!', 'success');
    }
    
    hideDesignCustomizer() {
        const customizer = document.getElementById('designCustomizer');
        if (customizer) {
            customizer.remove();
        }
    }
    
    showProfileDetail(profile) {
        this.selectedProfile = profile;
        this.currentView = 'detail';
        
        const detailContent = `
            <div class="profile-detail">
                <div class="detail-header">
                    <button class="btn btn-secondary back-btn" onclick="app.goBack()">
                        <i class="fas fa-arrow-left"></i> Назад
                    </button>
                    <div class="detail-actions">
                        <button class="btn btn-primary" onclick="app.contactProfile(${profile.id})">
                            <i class="fas fa-envelope"></i> Связаться
                        </button>
                        <button class="btn btn-secondary" onclick="app.shareProfile(${profile.id})">
                            <i class="fas fa-share"></i> Поделиться
                        </button>
                    </div>
                </div>
                
                <div class="detail-content">
                    <div class="profile-overview">
                        <div class="profile-avatar">
                            <i class="${profile.icon}" style="font-size: 3rem; color: var(--primary-color);"></i>
                        </div>
                        <div class="profile-info">
                            <h1>${profile.name}</h1>
                            <h3>${profile.type}</h3>
                            <p>${profile.description}</p>
                        </div>
                    </div>
                    
                    <div class="detail-tabs">
                        <div class="tab-nav">
                            <button class="tab-btn active" data-tab="overview">Обзор</button>
                            <button class="tab-btn" data-tab="details">Детали</button>
                            <button class="tab-btn" data-tab="documents">Документы</button>
                            <button class="tab-btn" data-tab="photos">Фото</button>
                            <button class="tab-btn" data-tab="contacts">Контакты</button>
                        </div>
                        
                        <div class="tab-content">
                            <div class="tab-pane active" id="overview">
                                ${this.getOverviewTabContent(profile)}
                            </div>
                            <div class="tab-pane" id="details">
                                ${this.getDetailsTabContent(profile)}
                            </div>
                            <div class="tab-pane" id="documents">
                                ${this.getDocumentsTabContent(profile)}
                            </div>
                            <div class="tab-pane" id="photos">
                                ${this.getPhotosTabContent(profile)}
                            </div>
                            <div class="tab-pane" id="contacts">
                                ${this.getContactsTabContent(profile)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('app-content').innerHTML = detailContent;
        this.setupDetailHandlers();
    }
    
    getOverviewTabContent(profile) {
        return `
            <div class="overview-grid">
                <div class="card">
                    <h4>Основная информация</h4>
                    <div class="info-list">
                        <div class="info-item">
                            <span class="label">Тип:</span>
                            <span class="value">${profile.type}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Статус:</span>
                            <span class="value status-active">Активный</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Рейтинг:</span>
                            <span class="value">⭐⭐⭐⭐⭐ (4.8)</span>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <h4>Теги и специализация</h4>
                    <div class="profile-tags">
                        ${profile.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                </div>
                
                <div class="card">
                    <h4>Совместимость с AI</h4>
                    <div class="compatibility-score">
                        <div class="score-circle">
                            <div class="score-value">87%</div>
                        </div>
                        <div class="score-details">
                            <p>Высокая совместимость для сотрудничества</p>
                            <ul>
                                <li>✓ Совпадение по отрасли</li>
                                <li>✓ Географическое покрытие</li>
                                <li>✓ Опыт работы</li>
                                <li>⚠ Требует обсуждения условий</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    getDetailsTabContent(profile) {
        if (!profile.fullProfile) return '<p>Детальная информация недоступна</p>';
        
        const details = profile.fullProfile;
        return `
            <div class="details-grid">
                <div class="card">
                    <h4>Подробная информация</h4>
                    <div class="info-list">
                        ${Object.entries(details).map(([key, value]) => {
                            if (Array.isArray(value)) {
                                return `
                                    <div class="info-item">
                                        <span class="label">${this.getFieldLabel(key)}:</span>
                                        <span class="value">${value.join(', ')}</span>
                                    </div>
                                `;
                            } else {
                                return `
                                    <div class="info-item">
                                        <span class="label">${this.getFieldLabel(key)}:</span>
                                        <span class="value">${value}</span>
                                    </div>
                                `;
                            }
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    }
    
    getDocumentsTabContent(profile) {
        if (!profile.fullProfile?.documents) return '<p>Документы не загружены</p>';
        
        return `
            <div class="documents-grid">
                ${profile.fullProfile.documents.map(doc => `
                    <div class="document-card">
                        <div class="doc-icon">
                            <i class="fas fa-file-pdf"></i>
                        </div>
                        <div class="doc-info">
                            <div class="doc-name">${doc}</div>
                            <div class="doc-size">2.3 MB</div>
                        </div>
                        <div class="doc-actions">
                            <button class="btn btn-sm" onclick="app.viewDocument('${doc}')">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm" onclick="app.downloadDocument('${doc}')">
                                <i class="fas fa-download"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    getPhotosTabContent(profile) {
        if (!profile.fullProfile?.photos) return '<p>Фотографии не загружены</p>';
        
        return `
            <div class="photos-gallery">
                ${profile.fullProfile.photos.map(photo => `
                    <div class="photo-item" onclick="app.viewPhoto('${photo}')">
                        <div class="photo-placeholder">
                            <i class="fas fa-image"></i>
                            <span>${photo}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    getContactsTabContent(profile) {
        if (!profile.fullProfile) return '<p>Контактная информация недоступна</p>';
        
        const contacts = profile.fullProfile;
        return `
            <div class="contacts-info">
                <div class="card">
                    <h4>Контактная информация</h4>
                    <div class="contact-methods">
                        ${contacts.phone ? `
                            <div class="contact-item">
                                <i class="fas fa-phone"></i>
                                <span>${contacts.phone}</span>
                                <button class="btn btn-sm" onclick="app.callContact('${contacts.phone}')">
                                    <i class="fas fa-phone"></i> Позвонить
                                </button>
                            </div>
                        ` : ''}
                        ${contacts.email ? `
                            <div class="contact-item">
                                <i class="fas fa-envelope"></i>
                                <span>${contacts.email}</span>
                                <button class="btn btn-sm" onclick="app.emailContact('${contacts.email}')">
                                    <i class="fas fa-envelope"></i> Написать
                                </button>
                            </div>
                        ` : ''}
                        ${contacts.website ? `
                            <div class="contact-item">
                                <i class="fas fa-globe"></i>
                                <span>${contacts.website}</span>
                                <button class="btn btn-sm" onclick="app.visitWebsite('${contacts.website}')">
                                    <i class="fas fa-external-link-alt"></i> Посетить
                                </button>
                            </div>
                        ` : ''}
                        ${contacts.address ? `
                            <div class="contact-item">
                                <i class="fas fa-map-marker-alt"></i>
                                <span>${contacts.address}</span>
                                <button class="btn btn-sm" onclick="app.showOnMap('${contacts.address}')">
                                    <i class="fas fa-map"></i> На карте
                                </button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }
    
    getFieldLabel(key) {
        const labels = {
            founded: 'Основан',
            employees: 'Сотрудники',
            revenue: 'Оборот',
            website: 'Сайт',
            phone: 'Телефон',
            email: 'Email',
            address: 'Адрес',
            experience: 'Опыт',
            specialization: 'Специализация',
            regions: 'Регионы',
            languages: 'Языки',
            education: 'Образование',
            achievements: 'Достижения',
            portfolio: 'Портфолио',
            commission: 'Комиссия',
            availability: 'Доступность',
            references: 'Рекомендации',
            services: 'Услуги',
            targetMarkets: 'Целевые рынки',
            requirements: 'Требования',
            benefits: 'Преимущества'
        };
        return labels[key] || key;
    }
    
    setupDetailHandlers() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });
    }
    
    switchTab(tabName) {
        // Remove active from all tabs and panes
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
        
        // Add active to selected tab and pane
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(tabName).classList.add('active');
    }
    
    goBack() {
        if (this.currentView === 'detail') {
            this.currentView = 'main';
            this.showSection(this.currentSection);
        }
    }
    
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.showSection(section);
            });
        });
        
        // Global click handler for dynamic elements
        document.addEventListener('click', (e) => {
            if (e.target.closest('.card[data-action]')) {
                const action = e.target.closest('.card').dataset.action;
                this.handleCardAction(action);
            }
        });
    }
    
    showSection(sectionName) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
        
        this.currentSection = sectionName;
        
        // Render section content
        const content = this.getSectionContent(sectionName);
        document.getElementById('app-content').innerHTML = content;
        
        // Setup section-specific handlers
        this.setupSectionHandlers(sectionName);
    }
    
    getSectionContent(section) {
        switch (section) {
            case 'dashboard':
                return this.getDashboardContent();
            case 'swipe':
                return this.getSwipeContent();
            case 'matches':
                return this.getMatchesContent();
            case 'messages':
                return this.getMessagesContent();
            case 'profile':
                return this.getProfileContent();
            case 'subscription':
                return this.getSubscriptionContent();
            case 'ai-assistant':
                return this.getAIAssistantContent();
            case 'analytics':
                return this.getAnalyticsContent();
            default:
                return '<div class="content-section"><h2>Раздел в разработке</h2></div>';
        }
    }
    
    getAIAssistantContent() {
        return `
            <div class="content-section">
                <div class="content-header">
                    <div class="section-title">AI-Помощник</div>
                    <div class="section-subtitle">Искусственный интеллект для оптимизации вашего бизнеса</div>
                </div>
                
                <div class="ai-dashboard">
                    <div class="ai-stats">
                        <div class="ai-stat-card">
                            <div class="ai-stat-icon"><i class="fas fa-brain"></i></div>
                            <div class="ai-stat-info">
                                <div class="ai-stat-number">25/50</div>
                                <div class="ai-stat-label">Запросов сегодня</div>
                            </div>
                        </div>
                        
                        <div class="ai-stat-card">
                            <div class="ai-stat-icon"><i class="fas fa-chart-line"></i></div>
                            <div class="ai-stat-info">
                                <div class="ai-stat-number">87%</div>
                                <div class="ai-stat-label">Точность прогнозов</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="cards-grid">
                        <div class="card ai-feature" onclick="app.openAIFeature('profile-optimization')">
                            <div class="card-icon"><i class="fas fa-user-cog"></i></div>
                            <div class="card-title">Оптимизация профиля</div>
                            <div class="card-description">Получите индивидуальные рекомендации по улучшению вашего профиля</div>
                        </div>
                        
                        <div class="card ai-feature" onclick="app.openAIFeature('message-templates')">
                            <div class="card-icon"><i class="fas fa-comment-dots"></i></div>
                            <div class="card-title">Шаблоны сообщений</div>
                            <div class="card-description">Генерация профессиональных сообщений для коммуникации</div>
                        </div>
                        
                        <div class="card ai-feature" onclick="app.openAIFeature('compatibility-analysis')">
                            <div class="card-icon"><i class="fas fa-project-diagram"></i></div>
                            <div class="card-title">Анализ совместимости</div>
                            <div class="card-description">Оценка потенциала сотрудничества с партнерами</div>
                        </div>
                        
                        <div class="card ai-feature" onclick="app.openAIFeature('market-insights')">
                            <div class="card-icon"><i class="fas fa-lightbulb"></i></div>
                            <div class="card-title">Рыночные инсайты</div>
                            <div class="card-description">Анализ трендов и возможностей в вашей отрасли</div>
                        </div>
                    </div>
                    
                    <div class="ai-recommendations">
                        <h3>Персональные рекомендации</h3>
                        <div class="recommendation-list">
                            <div class="recommendation-item">
                                <div class="rec-icon"><i class="fas fa-star"></i></div>
                                <div class="rec-content">
                                    <div class="rec-title">Добавьте больше ключевых слов</div>
                                    <div class="rec-description">Для лучшей находимости добавьте слова: "CRM", "Автоматизация"</div>
                                </div>
                                <button class="btn btn-sm" onclick="app.applyRecommendation('keywords')">Применить</button>
                            </div>
                            
                            <div class="recommendation-item">
                                <div class="rec-icon"><i class="fas fa-camera"></i></div>
                                <div class="rec-content">
                                    <div class="rec-title">Обновите фотографии</div>
                                    <div class="rec-description">Профили с качественными фото получают на 40% больше откликов</div>
                                </div>
                                <button class="btn btn-sm" onclick="app.applyRecommendation('photos')">Обновить</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    getAnalyticsContent() {
        return `
            <div class="content-section">
                <div class="content-header">
                    <div class="section-title">Аналитика</div>
                    <div class="section-subtitle">Подробная статистика вашей активности</div>
                    <div class="analytics-filters">
                        <select id="analyticsTimeRange">
                            <option value="7d">Последние 7 дней</option>
                            <option value="30d">Последние 30 дней</option>
                            <option value="90d">Последние 3 месяца</option>
                        </select>
                    </div>
                </div>
                
                <div class="analytics-dashboard">
                    <div class="stats-grid">
                        <div class="stat-card highlight">
                            <div class="stat-icon"><i class="fas fa-eye"></i></div>
                            <div class="stat-content">
                                <div class="stat-number">1,247</div>
                                <div class="stat-label">Просмотров профиля</div>
                                <div class="stat-change positive">+15% к прошлому месяцу</div>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-icon"><i class="fas fa-heart"></i></div>
                            <div class="stat-content">
                                <div class="stat-number">89</div>
                                <div class="stat-label">Полученные лайки</div>
                                <div class="stat-change positive">+8% к прошлому месяцу</div>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-icon"><i class="fas fa-handshake"></i></div>
                            <div class="stat-content">
                                <div class="stat-number">23</div>
                                <div class="stat-label">Новые совпадения</div>
                                <div class="stat-change positive">+12% к прошлому месяцу</div>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-icon"><i class="fas fa-comments"></i></div>
                            <div class="stat-content">
                                <div class="stat-number">156</div>
                                <div class="stat-label">Отправленные сообщения</div>
                                <div class="stat-change neutral">0% к прошлому месяцу</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="analytics-charts">
                        <div class="chart-card">
                            <h4>Активность по дням</h4>
                            <div class="chart-placeholder">
                                <div class="chart-bars">
                                    <div class="bar" style="height: 60%;"></div>
                                    <div class="bar" style="height: 80%;"></div>
                                    <div class="bar" style="height: 45%;"></div>
                                    <div class="bar" style="height: 90%;"></div>
                                    <div class="bar" style="height: 70%;"></div>
                                    <div class="bar" style="height: 85%;"></div>
                                    <div class="bar" style="height: 95%;"></div>
                                </div>
                                <div class="chart-labels">
                                    <span>Пн</span><span>Вт</span><span>Ср</span><span>Чт</span><span>Пт</span><span>Сб</span><span>Вс</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="chart-card">
                            <h4>Конверсия</h4>
                            <div class="conversion-funnel">
                                <div class="funnel-step">
                                    <div class="step-bar" style="width: 100%;"></div>
                                    <span>Просмотры: 1,247</span>
                                </div>
                                <div class="funnel-step">
                                    <div class="step-bar" style="width: 40%;"></div>
                                    <span>Лайки: 498</span>
                                </div>
                                <div class="funnel-step">
                                    <div class="step-bar" style="width: 15%;"></div>
                                    <span>Совпадения: 187</span>
                                </div>
                                <div class="funnel-step">
                                    <div class="step-bar" style="width: 8%;"></div>
                                    <span>Сообщения: 99</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="performance-insights">
                        <h3>Рекомендации по улучшению</h3>
                        <div class="insight-cards">
                            <div class="insight-card">
                                <div class="insight-icon success"><i class="fas fa-arrow-up"></i></div>
                                <div class="insight-content">
                                    <div class="insight-title">Лучшее время для общения</div>
                                    <div class="insight-description">Вторник и четверг 14:00-16:00 - наибольшая активность</div>
                                </div>
                            </div>
                            
                            <div class="insight-card">
                                <div class="insight-icon warning"><i class="fas fa-exclamation-triangle"></i></div>
                                <div class="insight-content">
                                    <div class="insight-title">Низкая конверсия в сообщения</div>
                                    <div class="insight-description">Рассмотрите использование AI-шаблонов для первого сообщения</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    getDashboardContent() {
        return `
            <div class="content-section">
                <div class="content-header">
                    <div class="section-title">Добро пожаловать в SalesMatch Pro</div>
                    <div class="section-subtitle">Ваша B2B платформа для поиска торговых партнеров</div>
                    <button class="btn btn-secondary design-btn" onclick="app.showDesignCustomizer()">
                        <i class="fas fa-palette"></i> Настройки дизайна
                    </button>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-number">127</div>
                        <div class="stat-label">Просмотров профиля</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">15</div>
                        <div class="stat-label">Взаимных совпадений</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">8</div>
                        <div class="stat-label">Активных диалогов</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">Pro</div>
                        <div class="stat-label">Текущий план</div>
                    </div>
                </div>
                
                <div class="cards-grid">
                    <div class="card" data-action="swipe">
                        <div class="card-icon"><i class="fas fa-search"></i></div>
                        <div class="card-title">Найти партнеров</div>
                        <div class="card-description">Просматривайте профили потенциальных торговых агентов и компаний</div>
                    </div>
                    
                    <div class="card" data-action="matches">
                        <div class="card-icon"><i class="fas fa-handshake"></i></div>
                        <div class="card-title">Мои совпадения</div>
                        <div class="card-description">Взаимные интересы с другими участниками платформы</div>
                    </div>
                    
                    <div class="card" data-action="messages">
                        <div class="card-icon"><i class="fas fa-comments"></i></div>
                        <div class="card-title">Сообщения</div>
                        <div class="card-description">Общайтесь с вашими совпадениями</div>
                    </div>
                    
                    <div class="card" data-action="profile">
                        <div class="card-icon"><i class="fas fa-user"></i></div>
                        <div class="card-title">Мой профиль</div>
                        <div class="card-description">Управляйте информацией о компании</div>
                    </div>
                    
                    <div class="card" data-action="ai-assistant">
                        <div class="card-icon"><i class="fas fa-robot"></i></div>
                        <div class="card-title">AI-Помощник</div>
                        <div class="card-description">Получите рекомендации по оптимизации профиля</div>
                    </div>
                    
                    <div class="card" data-action="analytics">
                        <div class="card-icon"><i class="fas fa-chart-line"></i></div>
                        <div class="card-title">Аналитика</div>
                        <div class="card-description">Подробная статистика вашей активности</div>
                    </div>
                </div>
                
                <div class="quick-profiles">
                    <h3>Рекомендуемые профили</h3>
                    <div class="profiles-preview">
                        ${this.profiles.slice(0, 3).map(profile => `
                            <div class="profile-preview-card" data-profile-id="${profile.id}" onclick="app.showProfileDetail(app.profiles.find(p => p.id == ${profile.id}))">
                                <div class="preview-icon">
                                    <i class="${profile.icon}"></i>
                                </div>
                                <div class="preview-info">
                                    <div class="preview-name">${profile.name}</div>
                                    <div class="preview-type">${profile.type}</div>
                                    <div class="preview-tags">
                                        ${profile.tags.slice(0, 2).map(tag => `<span class="mini-tag">${tag}</span>`).join('')}
                                    </div>
                                </div>
                                <div class="preview-action">
                                    <i class="fas fa-chevron-right"></i>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }
    
    getSwipeContent() {
        const profile = this.profiles[this.currentProfileIndex] || this.profiles[0];
        
        return `
            <div class="content-section">
                <div class="content-header">
                    <div class="section-title">Поиск партнеров</div>
                    <div class="section-subtitle">Листайте профили и находите идеальных партнеров</div>
                    <div class="swipe-progress">
                        <span>Профиль ${this.currentProfileIndex + 1} из ${this.profiles.length}</span>
                    </div>
                </div>
                
                <div class="swipe-container">
                    <div class="profile-card" id="current-profile">
                        <div class="profile-header">
                            <i class="${profile.icon}"></i>
                            <button class="profile-detail-btn" onclick="app.showProfileDetail(app.profiles[${this.currentProfileIndex}])">
                                <i class="fas fa-info-circle"></i> Подробнее
                            </button>
                        </div>
                        <div class="profile-content">
                            <div class="profile-name">${profile.name}</div>
                            <div class="profile-type">${profile.type}</div>
                            <div class="profile-description">${profile.description}</div>
                            <div class="profile-tags">
                                ${profile.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                            </div>
                            
                            <div class="profile-quick-info">
                                <div class="quick-stat">
                                    <i class="fas fa-star"></i>
                                    <span>4.8 рейтинг</span>
                                </div>
                                <div class="quick-stat">
                                    <i class="fas fa-clock"></i>
                                    <span>Онлайн 2ч назад</span>
                                </div>
                                <div class="quick-stat">
                                    <i class="fas fa-check-circle"></i>
                                    <span>Проверен</span>
                                </div>
                            </div>
                            
                            <div class="compatibility-preview">
                                <div class="compatibility-title">Совместимость</div>
                                <div class="compatibility-bar">
                                    <div class="compatibility-fill" style="width: 87%;"></div>
                                    <span class="compatibility-score">87%</span>
                                </div>
                                <div class="compatibility-factors">
                                    <span class="factor positive">Отрасль</span>
                                    <span class="factor positive">География</span>
                                    <span class="factor neutral">Опыт</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="swipe-actions">
                    <button class="action-btn reject-btn" onclick="app.swipeAction('reject')" title="Пропустить">
                        <i class="fas fa-times"></i>
                    </button>
                    <button class="action-btn super-like-btn" onclick="app.swipeAction('super-like')" title="Супер лайк">
                        <i class="fas fa-star"></i>
                    </button>
                    <button class="action-btn like-btn" onclick="app.swipeAction('like')" title="Нравится">
                        <i class="fas fa-heart"></i>
                    </button>
                    <button class="action-btn bookmark-btn" onclick="app.swipeAction('bookmark')" title="Сохранить">
                        <i class="fas fa-bookmark"></i>
                    </button>
                </div>
                
                <div class="swipe-filters">
                    <h4>Фильтры поиска</h4>
                    <div class="filter-options">
                        <div class="filter-group">
                            <label>Тип:</label>
                            <select id="typeFilter">
                                <option value="all">Все</option>
                                <option value="company">Компании</option>
                                <option value="agent">Агенты</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label>Отрасль:</label>
                            <select id="industryFilter">
                                <option value="all">Все</option>
                                <option value="it">IT</option>
                                <option value="manufacturing">Производство</option>
                                <option value="retail">Ритейл</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label>Регион:</label>
                            <select id="regionFilter">
                                <option value="all">Все</option>
                                <option value="moscow">Москва</option>
                                <option value="spb">СПб</option>
                                <option value="regions">Регионы</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    getMatchesContent() {
        return `
            <div class="content-section">
                <div class="content-header">
                    <div class="section-title">Мои совпадения</div>
                    <div class="section-subtitle">Взаимный интерес с другими участниками</div>
                </div>
                
                <div class="cards-grid">
                    ${this.matches.map(match => `
                        <div class="card">
                            <div class="card-icon"><i class="${match.icon}"></i></div>
                            <div class="card-title">${match.name}</div>
                            <div class="card-description">${match.type} • Взаимное совпадение</div>
                            <button class="btn btn-primary" onclick="app.startConversation(${match.id})">Написать</button>
                        </div>
                    `).join('')}
                    ${this.matches.length === 0 ? '<p>Пока нет совпадений. Продолжайте листать профили!</p>' : ''}
                </div>
            </div>
        `;
    }
    
    getMessagesContent() {
        const currentConv = this.conversations[this.currentConversation] || this.conversations[0];
        
        return `
            <div class="content-section">
                <div class="content-header">
                    <div class="section-title">Сообщения</div>
                    <div class="section-subtitle">Общайтесь с вашими совпадениями</div>
                </div>
                
                <div class="messages-container">
                    <div class="conversations-list">
                        ${this.conversations.map((conv, index) => `
                            <div class="conversation-item ${index === this.currentConversation ? 'active' : ''}" onclick="app.selectConversation(${index})">
                                <div style="font-weight: 600;">${conv.name}</div>
                                <div style="font-size: 0.9rem; color: #666;">${conv.lastMessage}</div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="chat-area">
                        <div class="chat-header">${currentConv.name}</div>
                        <div class="messages-area" id="messages-area">
                            ${currentConv.messages.map(message => `
                                <div class="message ${message.sender}">
                                    <div class="message-content">${message.content}</div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="message-input">
                            <input type="text" placeholder="Напишите сообщение..." id="messageInput" onkeypress="app.handleMessageKeyPress(event)">
                            <button class="send-btn" onclick="app.sendMessage()">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    getProfileContent() {
        return `
            <div class="content-section">
                <div class="content-header">
                    <div class="section-title">Мой профиль</div>
                    <div class="section-subtitle">Управляйте своей информацией</div>
                </div>
                
                <div class="card">
                    <div class="card-title">Информация о компании</div>
                    <div class="card-description">
                        <p><strong>Название:</strong> ООО "Инновационные решения"</p>
                        <p><strong>Сфера:</strong> Информационные технологии</p>
                        <p><strong>Локация:</strong> Москва, Россия</p>
                        <p><strong>Описание:</strong> Разрабатываем и внедряем корпоративные IT-решения</p>
                        <p><strong>Комиссия:</strong> 15-25%</p>
                    </div>
                    <button class="btn btn-primary">Редактировать профиль</button>
                </div>
                
                <div class="cards-grid" style="margin-top: 20px;">
                    <div class="card">
                        <div class="card-title">Загруженные документы</div>
                        <div class="card-description">
                            • Свидетельство о регистрации<br>
                            • Презентация компании<br>
                            • Коммерческое предложение
                        </div>
                        <button class="btn btn-secondary">Загрузить документы</button>
                    </div>
                    <div class="card">
                        <div class="card-title">Фотографии</div>
                        <div class="card-description">
                            Добавьте фотографии офиса, команды или продукции
                        </div>
                        <button class="btn btn-secondary">Добавить фото</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    getSubscriptionContent() {
        return `
            <div class="content-section">
                <div class="content-header">
                    <div class="section-title">Подписка</div>
                    <div class="section-subtitle">Управляйте своим планом</div>
                </div>
                
                <div class="cards-grid">
                    <div class="card">
                        <div class="card-title">Free Plan</div>
                        <div class="card-description">
                            • Базовый подбор<br>
                            • 5 ИИ запросов/день<br>
                            • Ограниченные сообщения
                        </div>
                        <button class="btn btn-secondary">Текущий план</button>
                    </div>
                    <div class="card">
                        <div class="card-title">Pro Plan - $5/месяц</div>
                        <div class="card-description">
                            • Неограниченные сообщения<br>
                            • 50 ИИ запросов/день<br>
                            • Отзывы и рейтинги
                        </div>
                        <button class="btn btn-primary">Обновить до Pro</button>
                    </div>
                    <div class="card">
                        <div class="card-title">Business Plan - $20/месяц</div>
                        <div class="card-description">
                            • Все функции Pro<br>
                            • Приоритетный подбор<br>
                            • Расширенная аналитика<br>
                            • Приоритетная поддержка
                        </div>
                        <button class="btn btn-primary">Обновить до Business</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    setupSectionHandlers(section) {
        if (section === 'messages') {
            // Scroll to bottom of messages
            setTimeout(() => {
                const messagesArea = document.getElementById('messages-area');
                if (messagesArea) {
                    messagesArea.scrollTop = messagesArea.scrollHeight;
                }
            }, 100);
        }
    }
    
    handleCardAction(action) {
        if (action === 'design') {
            this.showDesignCustomizer();
        } else {
            this.showSection(action);
        }
    }
    
    handleCardClick(element) {
        const profileId = element.dataset.profileId;
        if (profileId) {
            const profile = this.profiles.find(p => p.id == profileId);
            if (profile) {
                this.showProfileDetail(profile);
            }
        }
    }
    
    swipeAction(action) {
        const currentProfile = this.profiles[this.currentProfileIndex];
        
        if (action === 'like') {
            // Add to matches (simulate mutual like)
            this.matches.push({
                id: currentProfile.id,
                name: currentProfile.name,
                type: currentProfile.type,
                icon: currentProfile.icon
            });
            
            // Show match notification
            this.showNotification(`Взаимное совпадение с ${currentProfile.name}!`, 'success');
        }
        
        // Move to next profile
        this.currentProfileIndex = (this.currentProfileIndex + 1) % this.profiles.length;
        
        // Refresh swipe section
        if (this.currentSection === 'swipe') {
            this.showSection('swipe');
        }
    }
    
    selectConversation(index) {
        this.currentConversation = index;
        this.showSection('messages');
    }
    
    sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();
        
        if (message) {
            // Add message to current conversation
            this.conversations[this.currentConversation].messages.push({
                sender: 'sent',
                content: message
            });
            
            // Clear input
            input.value = '';
            
            // Refresh messages
            this.showSection('messages');
            
            // Simulate response after delay
            setTimeout(() => {
                this.conversations[this.currentConversation].messages.push({
                    sender: 'received',
                    content: 'Спасибо за сообщение! Обязательно отвечу в ближайшее время.'
                });
                
                if (this.currentSection === 'messages') {
                    this.showSection('messages');
                }
            }, 2000);
        }
    }
    
    handleMessageKeyPress(event) {
        if (event.key === 'Enter') {
            this.sendMessage();
        }
    }
    
    startConversation(matchId) {
        // Find or create conversation
        let convIndex = this.conversations.findIndex(conv => conv.id === matchId);
        
        if (convIndex === -1) {
            const match = this.matches.find(m => m.id === matchId);
            this.conversations.push({
                id: matchId,
                name: match.name,
                lastMessage: 'Начать диалог...',
                messages: []
            });
            convIndex = this.conversations.length - 1;
        }
        
        this.currentConversation = convIndex;
        this.showSection('messages');
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px;
            background: ${type === 'success' ? '#51cf66' : '#667eea'};
            color: white; padding: 15px 20px; border-radius: 8px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.2); z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
    
    // AI Feature Methods
    openAIFeature(feature) {
        const messages = {
            'profile-optimization': 'Оптимизация профиля: Добавьте ключевые слова, обновите фото',
            'message-templates': 'Шаблоны сообщений: Профессиональные темплейты готовы',
            'compatibility-analysis': 'Анализ совместимости: 87% - высокая совместимость',
            'market-insights': 'Рыночные инсайты: Рост спроса на IT-решения +23%'
        };
        this.showNotification(messages[feature] || 'AI функция активирована', 'success');
    }
    
    // Document and contact methods  
    viewDocument(docName) { this.showNotification(`Открываем: ${docName}`); }
    downloadDocument(docName) { this.showNotification(`Скачиваем: ${docName}`); }
    viewPhoto(photoName) { this.showNotification(`Просмотр: ${photoName}`); }
    callContact(phone) { this.showNotification(`Звонок: ${phone}`); }
    emailContact(email) { this.showNotification(`Почта: ${email}`); }
    visitWebsite(website) { window.open(`https://${website}`, '_blank'); }
    showOnMap(address) { this.showNotification(`Карта: ${address}`); }
    contactProfile(id) { this.showNotification('Открываем диалог'); this.showSection('messages'); }
    shareProfile(id) { this.showNotification('Профиль скопирован'); }
    applyRecommendation(type) { this.showNotification(`Применяем: ${type}`, 'success'); }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new SalesMatchApp();
});

// Add slide in animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);