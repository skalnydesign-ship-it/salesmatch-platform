const { Telegraf } = require('telegraf');
const { session } = require('telegraf/session');
const Logger = require('../../core/utils/logger');
const ErrorHandler = require('../../core/utils/errorHandler');

class TelegramBotCore {
  constructor() {
    this.bot = null;
    this.middlewares = [];
    this.commands = new Map();
    this.scenes = new Map();
    this.callbacks = new Map();
    this.logger = Logger;
    this.errorHandler = ErrorHandler;
    
    // Multi-language support
    this.languages = {
      en: require('../locales/en.json'),
      ru: require('../locales/ru.json'),
      hi: require('../locales/hi.json'),
      fa: require('../locales/fa.json'),
      zh: require('../locales/zh.json')
    };
  }
  
  async initialize() {
    try {
      this.bot = new Telegraf(process.env.BOT_TOKEN);
      
      // Setup session middleware
      this.setupSession();
      
      // Setup core middlewares
      this.setupMiddlewares();
      
      // Apply registered middlewares
      this.middlewares.forEach(mw => this.bot.use(mw));
      
      // Register base commands
      this.registerBaseCommands();
      
      // Setup error handling
      this.setupErrorHandling();
      
      this.logger.info('Telegram Bot core initialized successfully');
      return this;
      
    } catch (error) {
      this.logger.error('Failed to initialize Telegram Bot:', error);
      throw error;
    }
  }
  
  setupSession() {
    this.bot.use(session({
      defaultSession: () => ({
        language: null,
        accountType: null,
        registrationStep: 0,
        tempData: {},
        profileData: {},
        onboardingState: 'language_selection',
        lastActivity: Date.now()
      })
    }));
  }
  
  setupMiddlewares() {
    // Logging middleware
    this.bot.use(async (ctx, next) => {
      const start = Date.now();
      
      this.logger.telegramInfo(
        `Received ${ctx.updateType} from user ${ctx.from?.id}`,
        ctx
      );
      
      await next();
      
      const duration = Date.now() - start;
      this.logger.performance('Telegram handler', duration, {
        updateType: ctx.updateType,
        userId: ctx.from?.id
      });
    });
    
    // Session validation middleware
    this.bot.use(async (ctx, next) => {
      // Initialize session if needed
      if (!ctx.session) {
        ctx.session = {
          language: null,
          accountType: null,
          registrationStep: 0,
          tempData: {},
          profileData: {},
          onboardingState: 'language_selection',
          lastActivity: Date.now()
        };
      }
      
      // Update last activity
      ctx.session.lastActivity = Date.now();
      
      await next();
    });
    
    // Language middleware
    this.bot.use(async (ctx, next) => {
      // Set language helper
      ctx.t = (key, params = {}) => {
        const lang = ctx.session?.language || 'en';
        const template = this.languages[lang]?.[key] || this.languages.en[key] || key;
        
        // Simple template replacement
        return template.replace(/\{\{(\w+)\}\}/g, (match, param) => {
          return params[param] || match;
        });
      };
      
      await next();
    });
  }
  
  registerCommand(command, handler, options = {}) {
    try {
      // Prevent command conflicts
      if (this.commands.has(command)) {
        this.logger.warn(`Command ${command} already exists, using namespace`);
        command = `${options.namespace}_${command}`;
      }
      
      this.commands.set(command, { handler, options });
      this.bot.command(command, this.wrapHandler(handler));
      
      this.logger.info(`Registered command: /${command}`);
    } catch (error) {
      this.logger.error(`Failed to register command ${command}:`, error);
    }
  }
  
  registerCallback(pattern, handler, options = {}) {
    try {
      this.callbacks.set(pattern, { handler, options });
      this.bot.action(pattern, this.wrapHandler(handler));
      
      this.logger.info(`Registered callback: ${pattern}`);
    } catch (error) {
      this.logger.error(`Failed to register callback ${pattern}:`, error);
    }
  }
  
  wrapHandler(handler) {
    return async (ctx) => {
      try {
        await handler(ctx);
      } catch (error) {
        await this.errorHandler.handleTelegramError(ctx, error, handler.name);
      }
    };
  }
  
  registerBaseCommands() {
    this.registerCommand('start', this.handleStart.bind(this));
    this.registerCommand('help', this.handleHelp.bind(this));
    this.registerCommand('settings', this.handleSettings.bind(this));
    this.registerCommand('profile', this.handleProfile.bind(this));
    this.registerCommand('subscription', this.handleSubscription.bind(this));
    
    // Callback handlers
    this.registerCallback(/^lang_(.+)$/, this.handleLanguageSelection.bind(this));
    this.registerCallback(/^account_(.+)$/, this.handleAccountTypeSelection.bind(this));
    this.registerCallback(/^menu_(.+)$/, this.handleMenuAction.bind(this));
    this.registerCallback(/^profile_(.+)$/, this.handleProfileAction.bind(this));
    
    // SSL callback redirection - will be handled by SSLManager
    this.registerCallback(/^ssl_menu$/, this.handleSSLMenuRedirect.bind(this));
  }
  
  async handleStart(ctx) {
    const userId = ctx.from.id;
    const username = ctx.from.username;
    
    this.logger.telegramInfo(`User ${userId} started the bot`, ctx);
    
    // Check if user exists and has completed onboarding
    const userExists = await this.checkUserExists(userId);
    
    if (userExists && userExists.account_type) {
      // User exists, show main menu
      await this.showMainMenu(ctx);
    } else {
      // New user or incomplete onboarding, start language selection
      await this.showLanguageSelection(ctx);
    }
  }
  
  async showLanguageSelection(ctx) {
    const welcomeText = `
🌟 <b>Welcome to SalesMatch Pro!</b>

🌍 Select your language / Выберите язык / भाषा चुनें / زبان انتخاب کنید / 选择语言

The premier B2B Sales Matching Platform connecting companies with qualified sales agents worldwide.
    `;
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: '🇬🇧 English', callback_data: 'lang_en' },
          { text: '🇷🇺 Русский', callback_data: 'lang_ru' }
        ],
        [
          { text: '🇮🇳 हिन्दी', callback_data: 'lang_hi' },
          { text: '🇮🇷 فارسی', callback_data: 'lang_fa' }
        ],
        [
          { text: '🇨🇳 中文', callback_data: 'lang_zh' },
          { text: '🌐 More languages', callback_data: 'lang_more' }
        ]
      ]
    };
    
    await ctx.reply(welcomeText, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
  }
  
  async handleLanguageSelection(ctx) {
    const language = ctx.match[1];
    
    if (language === 'more') {
      await this.showMoreLanguages(ctx);
      return;
    }
    
    // Save language to session
    ctx.session.language = language;
    ctx.session.onboardingState = 'account_type_selection';
    
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      ctx.t('language_selected', { language: this.getLanguageName(language) }),
      { parse_mode: 'HTML' }
    );
    
    // Show account type selection
    setTimeout(() => {
      this.showAccountTypeSelection(ctx);
    }, 1000);
  }
  
  async showMoreLanguages(ctx) {
    const keyboard = {
      inline_keyboard: [
        [
          { text: '🇸🇦 العربية', callback_data: 'lang_ar' },
          { text: '🇪🇸 Español', callback_data: 'lang_es' }
        ],
        [
          { text: '🇫🇷 Français', callback_data: 'lang_fr' },
          { text: '🇩🇪 Deutsch', callback_data: 'lang_de' }
        ],
        [
          { text: '🇵🇹 Português', callback_data: 'lang_pt' },
          { text: '🇮🇹 Italiano', callback_data: 'lang_it' }
        ],
        [
          { text: '🇯🇵 日本語', callback_data: 'lang_ja' },
          { text: '🇰🇷 한국어', callback_data: 'lang_ko' }
        ],
        [
          { text: '🇹🇷 Türkçe', callback_data: 'lang_tr' },
          { text: '🇵🇱 Polski', callback_data: 'lang_pl' }
        ],
        [
          { text: '← Back', callback_data: 'lang_back' }
        ]
      ]
    };
    
    await ctx.editMessageReplyMarkup(keyboard);
  }
  
  async showAccountTypeSelection(ctx) {
    const text = ctx.t('account_type_selection');
    
    const keyboard = {
      inline_keyboard: [
        [
          { 
            text: ctx.t('account_company_button'), 
            callback_data: 'account_company' 
          }
        ],
        [
          { 
            text: ctx.t('account_agent_button'), 
            callback_data: 'account_agent' 
          }
        ]
      ]
    };
    
    await ctx.reply(text, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
  }
  
  async handleAccountTypeSelection(ctx) {
    const accountType = ctx.match[1];
    
    this.logger.telegramInfo(`Account type selected: ${accountType}`, ctx);
    
    // Update session
    ctx.session.accountType = accountType;
    ctx.session.onboardingState = 'profile_creation';
    
    // Save to database via UserManager
    try {
      const userId = ctx.from.id;
      
      // First create/update user with account type
      await this.userManager.createOrUpdateUser(userId, {
        username: ctx.from.username,
        language: ctx.session.language || 'en',
        accountType: accountType
      });
      
      this.logger.telegramInfo(`User ${userId} account type saved: ${accountType}`, ctx);
    } catch (error) {
      this.logger.error('Error saving account type:', error);
    }
    
    await ctx.answerCbQuery();
    
    const confirmationText = ctx.t('account_type_confirmed', { 
      type: ctx.t(`account_${accountType}`) 
    });
    
    await ctx.editMessageText(confirmationText, { parse_mode: 'HTML' });
    
    // Redirect to profile creation
    setTimeout(() => {
      this.redirectToProfileCreation(ctx);
    }, 1500);
  }
  
  async redirectToProfileCreation(ctx) {
    const text = ctx.t('profile_creation_redirect');
    
    const keyboard = {
      inline_keyboard: [
        [
          { 
            text: ctx.t('open_profile_button'), 
            web_app: { url: `${process.env.WEBAPP_URL}/profile` }
          }
        ],
        [
          { text: ctx.t('continue_telegram_button'), callback_data: 'profile_telegram' }
        ]
      ]
    };
    
    await ctx.reply(text, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
  }
  
  async showMainMenu(ctx) {
    const text = ctx.t('main_menu');
    
    const keyboard = {
      inline_keyboard: [
        [
          { 
            text: ctx.t('open_app_button'), 
            web_app: { url: process.env.WEBAPP_URL }
          }
        ],
        [
          { text: ctx.t('profile_button'), callback_data: 'menu_profile' },
          { text: ctx.t('matches_button'), callback_data: 'menu_matches' }
        ],
        [
          { text: ctx.t('subscription_button'), callback_data: 'menu_subscription' },
          { text: ctx.t('settings_button'), callback_data: 'menu_settings' }
        ],
        [
          { text: '🔐 SSL Management', callback_data: 'ssl_menu' }
        ]
      ]
    };
    
    await ctx.reply(text, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
  }
  
  async handleHelp(ctx) {
    const helpText = ctx.t('help_message');
    
    const keyboard = {
      inline_keyboard: [
        [
          { 
            text: ctx.t('open_app_button'), 
            web_app: { url: process.env.WEBAPP_URL }
          }
        ],
        [
          { text: ctx.t('contact_support_button'), url: 'https://t.me/salesmatch_support' }
        ]
      ]
    };
    
    await ctx.reply(helpText, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
  }
  
  async handleSettings(ctx) {
    const text = ctx.t('settings_menu');
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: ctx.t('change_language_button'), callback_data: 'settings_language' }
        ],
        [
          { text: ctx.t('notification_settings_button'), callback_data: 'settings_notifications' }
        ],
        [
          { text: ctx.t('privacy_settings_button'), callback_data: 'settings_privacy' }
        ],
        [
          { text: ctx.t('back_button'), callback_data: 'menu_main' }
        ]
      ]
    };
    
    await ctx.reply(text, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
  }
  
  async handleProfile(ctx) {
    const text = ctx.t('profile_menu');
    
    const keyboard = {
      inline_keyboard: [
        [
          { 
            text: ctx.t('edit_profile_button'), 
            web_app: { url: `${process.env.WEBAPP_URL}/profile` }
          }
        ],
        [
          { text: ctx.t('view_profile_button'), callback_data: 'profile_view' }
        ],
        [
          { text: ctx.t('back_button'), callback_data: 'menu_main' }
        ]
      ]
    };
    
    await ctx.reply(text, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
  }
  
  async handleSubscription(ctx) {
    // This will be implemented in the subscription module
    const text = ctx.t('subscription_info');
    
    const keyboard = {
      inline_keyboard: [
        [
          { 
            text: ctx.t('upgrade_subscription_button'), 
            web_app: { url: `${process.env.WEBAPP_URL}/subscription` }
          }
        ]
      ]
    };
    
    await ctx.reply(text, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
  }
  
  async handleMenuAction(ctx) {
    const action = ctx.match[1];
    
    await ctx.answerCbQuery();
    
    switch (action) {
      case 'main':
        await this.showMainMenu(ctx);
        break;
      case 'profile':
        await this.handleProfile(ctx);
        break;
      case 'matches':
        await this.showMatches(ctx);
        break;
      case 'subscription':
        await this.handleSubscription(ctx);
        break;
      case 'settings':
        await this.handleSettings(ctx);
        break;
      default:
        await ctx.reply(ctx.t('unknown_action'));
    }
  }
  
  async showMatches(ctx) {
    const text = ctx.t('matches_menu');
    
    const keyboard = {
      inline_keyboard: [
        [
          { 
            text: ctx.t('view_matches_button'), 
            web_app: { url: `${process.env.WEBAPP_URL}/matches` }
          }
        ],
        [
          { 
            text: ctx.t('start_swiping_button'), 
            web_app: { url: `${process.env.WEBAPP_URL}/swipe` }
          }
        ],
        [
          { text: ctx.t('back_button'), callback_data: 'menu_main' }
        ]
      ]
    };
    
    await ctx.reply(text, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
  }
  
  async handleProfileAction(ctx) {
    const action = ctx.match[1];
    
    await ctx.answerCbQuery();
    
    switch (action) {
      case 'telegram':
        await ctx.reply('✅ Отлично! Ваш профиль создан.\n\n🎉 Добро пожаловать в SalesMatch Pro!\n\nИспользуйте команды:\n/help - Помощь\n/profile - Профиль\n/settings - Настройки');
        break;
      case 'webapp_info':
        await ctx.reply('📱 WebApp кнопки требуют HTTPS.\n\nВ продакшене они будут работать полностью.\n\nПока используйте Telegram команды.');
        break;
      default:
        await ctx.reply(ctx.t('unknown_action'));
    }
  }
  
  async handleSSLMenuRedirect(ctx) {
    // This will trigger the SSL command to show the SSL menu
    await ctx.answerCbQuery();
    
    // Simulate the /ssl command
    ctx.command = 'ssl';
    await this.handleSSLCommand(ctx);
  }
  
  async handleSSLCommand(ctx) {
    // This will be called by SSLManager when registered
    // For now, show a placeholder
    await ctx.reply('🔐 SSL Management\n\nSSL Manager is loading...');
  }
  
  setupErrorHandling() {
    this.bot.catch((error, ctx) => {
      this.errorHandler.handleTelegramError(ctx, error, 'Bot error handler');
    });
  }
  
  getLanguageName(code) {
    const names = {
      en: 'English',
      ru: 'Русский',
      hi: 'हिन्दी',
      fa: 'فارسی',
      zh: '中文',
      ar: 'العربية',
      es: 'Español',
      fr: 'Français',
      de: 'Deutsch',
      pt: 'Português',
      it: 'Italiano',
      ja: '日本語',
      ko: '한국어',
      tr: 'Türkçe',
      pl: 'Polski'
    };
    return names[code] || code;
  }
  
  // Extension point for modules
  addMiddleware(middleware) {
    this.middlewares.push(middleware);
    if (this.bot) {
      this.bot.use(middleware);
    }
  }
  
  // Placeholder for user existence check (will be implemented by UserManager)
  async checkUserExists(userId) {
    // This will be injected by the main app
    return null;
  }
  
  // Send notification to user
  async sendNotification(userId, message, options = {}) {
    try {
      await this.bot.telegram.sendMessage(userId, message, {
        parse_mode: 'HTML',
        ...options
      });
      return true;
    } catch (error) {
      this.logger.error(`Failed to send notification to ${userId}:`, error);
      return false;
    }
  }
  
  // Broadcast message to multiple users
  async broadcast(userIds, message, options = {}) {
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };
    
    for (const userId of userIds) {
      try {
        await this.sendNotification(userId, message, options);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({ userId, error: error.message });
      }
      
      // Add delay to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
  }
}

module.exports = new TelegramBotCore();