const { Telegraf, Markup } = require('telegraf');
const { session } = require('telegraf/session');
const Logger = require('../../core/utils/logger');

class EnhancedTelegramBot {
  constructor() {
    this.bot = null;
    this.logger = Logger;
    
    // Демо данные
    this.profiles = [
      {
        id: 1,
        name: 'ООО "ТехИнновации"',
        type: 'Компания • IT Services',
        description: 'Ищем опытных торговых агентов для продвижения инновационных IT-решений.',
        industry: 'IT',
        country: 'Россия, Москва',
        employees: '50-100',
        commission: '10-20%'
      },
      {
        id: 2,
        name: 'Александр Петров',
        type: 'Торговый агент • 5 лет опыта',
        description: 'Специализируюсь на продажах промышленного оборудования.',
        industry: 'Промышленность',
        country: 'Россия, СПб',
        experience: '5 лет'
      },
      {
        id: 3,
        name: 'ООО "МегаТрейд"',
        type: 'Компания • Retail',
        description: 'Крупная розничная сеть ищет региональных представителей.',
        industry: 'Retail',
        country: 'Россия, регионы',
        employees: '500+',
        commission: '15%'
      },
      {
        id: 4,
        name: 'Мария Сидорова',
        type: 'Торговый агент • 3 года опыта',
        description: 'Специализируюсь на B2B продажах программного обеспечения.',
        industry: 'Software',
        country: 'Россия, Казань',
        experience: '3 года'
      },
      {
        id: 5,
        name: 'ООО "СтройИнвест"',
        type: 'Компания • Строительство',
        description: 'Ищем дистрибьюторов строительных материалов.',
        industry: 'Строительство',
        country: 'Россия, Новосибирск',
        employees: '200-500',
        commission: '8-12%'
      }
    ];
    
    this.userProfiles = new Map();
    this.userMatches = new Map();
    this.userMessages = new Map();
  }
  
  async initialize() {
    if (!process.env.BOT_TOKEN) {
      throw new Error('BOT_TOKEN не найден');
    }
    
    this.bot = new Telegraf(process.env.BOT_TOKEN);
    
    this.bot.use(session({
      defaultSession: () => ({
        language: 'ru',
        currentProfileIndex: 0,
        editingField: null,
        profileData: {}
      })
    }));
    
    this.registerCommands();
    this.logger.info('🤖 Enhanced Telegram Bot инициализирован');
    return this;
  }
  
  registerCommands() {
    this.bot.start(this.handleStart.bind(this));
    this.bot.command('menu', this.showMainMenu.bind(this));
    this.bot.command('profile', this.showProfile.bind(this));
    this.bot.command('search', this.showSearch.bind(this));
    this.bot.command('matches', this.showMatches.bind(this));
    this.bot.command('messages', this.showMessages.bind(this));
    this.bot.command('analytics', this.showAnalytics.bind(this));
    
    // Callbacks
    this.bot.action(/^menu_(.+)$/, this.handleMenuAction.bind(this));
    this.bot.action(/^profile_(.+)$/, this.handleProfileAction.bind(this));
    this.bot.action(/^edit_(.+)$/, this.handleEditProfile.bind(this));
    this.bot.action(/^search_(.+)$/, this.handleSearchAction.bind(this));
    this.bot.action(/^swipe_(.+)$/, this.handleSwipeAction.bind(this));
    this.bot.action(/^msg_(.+)$/, this.handleMessageAction.bind(this));
    this.bot.action(/^template_(.+)$/, this.handleTemplateAction.bind(this));
    this.bot.action(/^ai_(.+)$/, this.handleAIAction.bind(this));
    
    this.bot.on('text', this.handleTextMessage.bind(this));
  }
  
  async handleStart(ctx) {
    const firstName = ctx.from.first_name;
    
    await ctx.reply(
      `🚀 <b>Добро пожаловать в SalesMatch Pro!</b>\n\n` +
      `Привет, ${firstName}! 👋\n\n` +
      `🎯 B2B платформа для поиска партнеров по продажам\n` +
      `💼 Найдите компании и агентов для сотрудничества\n` +
      `🤖 Умный алгоритм подбора + AI-помощник`,
      {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🏠 Главное меню', 'menu_main')],
          [Markup.button.callback('👤 Мой профиль', 'profile_view')],
          [Markup.button.callback('🔍 Начать поиск', 'search_start')]
        ])
      }
    );
  }
  
  async showMainMenu(ctx) {
    const menuText = `🏠 <b>Главное меню SalesMatch Pro</b>\n\nВыберите действие:`;
    
    await this.editOrReply(ctx, menuText, {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('👤 Профиль', 'profile_view'), Markup.button.callback('🔍 Поиск', 'search_start')],
        [Markup.button.callback('💕 Совпадения', 'menu_matches'), Markup.button.callback('💬 Сообщения', 'menu_messages')],
        [Markup.button.callback('📊 Аналитика', 'menu_analytics'), Markup.button.callback('🤖 AI-Помощник', 'menu_ai')]
      ])
    });
  }
  
  async showProfile(ctx) {
    const userId = ctx.from.id;
    let profile = this.userProfiles.get(userId);
    
    if (!profile) {
      profile = {
        name: ctx.from.first_name || 'Пользователь',
        type: 'Не указано',
        industry: 'Не указано',
        description: 'Описание не заполнено',
        country: 'Не указано',
        contact: ctx.from.username ? `@${ctx.from.username}` : 'Не указано'
      };
      this.userProfiles.set(userId, profile);
    }
    
    const profileText = 
      `👤 <b>Ваш профиль</b>\n\n` +
      `📝 <b>Имя:</b> ${profile.name}\n` +
      `🏢 <b>Тип:</b> ${profile.type}\n` +
      `🏭 <b>Отрасль:</b> ${profile.industry}\n` +
      `🌍 <b>Страна:</b> ${profile.country}\n` +
      `📞 <b>Контакт:</b> ${profile.contact}\n\n` +
      `📄 <b>Описание:</b>\n${profile.description}`;
    
    await this.editOrReply(ctx, profileText, {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('✏️ Редактировать', 'profile_edit')],
        [Markup.button.callback('🏢 Тип', 'edit_type'), Markup.button.callback('🏭 Отрасль', 'edit_industry')],
        [Markup.button.callback('🌍 Страна', 'edit_country'), Markup.button.callback('📝 Описание', 'edit_description')],
        [Markup.button.callback('🏠 Главное меню', 'menu_main')]
      ])
    });
  }
  
  async showSearch(ctx) {
    const searchText = 
      `🔍 <b>Поиск партнеров</b>\n\n` +
      `Найдите идеальных партнеров:\n\n` +
      `• 🏢 Компании ищущие агентов\n` +
      `• 👨‍💼 Опытные торговые агенты\n` +
      `• 🎯 Умный алгоритм подбора`;
    
    await this.editOrReply(ctx, searchText, {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🏢 Искать компании', 'search_companies')],
        [Markup.button.callback('👨‍💼 Искать агентов', 'search_agents')],
        [Markup.button.callback('🎲 Случайный выбор', 'search_random')],
        [Markup.button.callback('🏠 Главное меню', 'menu_main')]
      ])
    });
  }
  
  async showCurrentProfile(ctx) {
    const index = ctx.session.currentProfileIndex || 0;
    const profile = this.profiles[index];
    
    if (!profile) {
      await ctx.reply('🎉 Все профили просмотрены!', {
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🔄 Начать заново', 'search_start')],
          [Markup.button.callback('🏠 Главное меню', 'menu_main')]
        ])
      });
      return;
    }
    
    const profileText = 
      `👤 <b>${profile.name}</b>\n` +
      `🏷️ ${profile.type}\n\n` +
      `📄 <b>Описание:</b>\n${profile.description}\n\n` +
      `🏭 <b>Отрасль:</b> ${profile.industry}\n` +
      `🌍 <b>Локация:</b> ${profile.country}\n` +
      `${profile.employees ? `👥 <b>Сотрудники:</b> ${profile.employees}\n` : ''}` +
      `${profile.commission ? `💰 <b>Комиссия:</b> ${profile.commission}` : ''}`;
    
    await this.editOrReply(ctx, profileText, {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('💚 Нравится', `swipe_like_${profile.id}`), Markup.button.callback('❌ Пропустить', `swipe_pass_${profile.id}`)],
        [Markup.button.callback('💬 Написать', `msg_send_${profile.id}`)],
        [Markup.button.callback('🏠 Главное меню', 'menu_main')]
      ])
    });
  }
  
  // Обработчики
  async handleMenuAction(ctx) {
    const action = ctx.match[1];
    await ctx.answerCbQuery();
    
    switch (action) {
      case 'main': await this.showMainMenu(ctx); break;
      case 'matches': await this.showMatches(ctx); break;
      case 'messages': await this.showMessages(ctx); break;
      case 'analytics': await this.showAnalytics(ctx); break;
      case 'ai': await this.showAIAssistant(ctx); break;
    }
  }
  
  async handleProfileAction(ctx) {
    const action = ctx.match[1];
    await ctx.answerCbQuery();
    
    if (action === 'view') {
      await this.showProfile(ctx);
    }
  }
  
  async handleEditProfile(ctx) {
    const field = ctx.match[1];
    await ctx.answerCbQuery();
    
    ctx.session.editingField = field;
    
    const fieldNames = {
      type: 'тип аккаунта',
      industry: 'отрасль',
      country: 'страну',
      description: 'описание'
    };
    
    await ctx.reply(
      `✏️ Введите новое значение для "${fieldNames[field]}":\n\n💡 /cancel для отмены`,
      { parse_mode: 'HTML' }
    );
  }
  
  async handleSearchAction(ctx) {
    const action = ctx.match[1];
    await ctx.answerCbQuery();
    
    if (['start', 'companies', 'agents', 'random'].includes(action)) {
      ctx.session.currentProfileIndex = 0;
      await this.showCurrentProfile(ctx);
    }
  }
  
  async handleSwipeAction(ctx) {
    const [action, profileId] = ctx.match[1].split('_');
    await ctx.answerCbQuery();
    
    if (action === 'like') {
      const userId = ctx.from.id;
      const profile = this.profiles.find(p => p.id == profileId);
      const matches = this.userMatches.get(userId) || [];
      
      if (!matches.find(m => m.id == profileId)) {
        matches.push(profile);
        this.userMatches.set(userId, matches);
        await ctx.reply(`💚 Лайк отправлен! Профиль "${profile.name}" добавлен в совпадения.`);
      }
    }
    
    ctx.session.currentProfileIndex = (ctx.session.currentProfileIndex || 0) + 1;
    await this.showCurrentProfile(ctx);
  }
  
  async handleMessageAction(ctx) {
    const action = ctx.match[1];
    await ctx.answerCbQuery();
    
    if (action.startsWith('send_')) {
      const profileId = action.split('_')[1];
      await this.startMessageCompose(ctx, profileId);
    } else if (action === 'compose') {
      await this.showMessageComposer(ctx);
    } else if (action === 'templates') {
      await this.showMessageTemplates(ctx);
    }
  }
  
  async startMessageCompose(ctx, profileId) {
    const profile = this.profiles.find(p => p.id == profileId);
    if (!profile) {
      await ctx.reply('❌ Профиль не найден');
      return;
    }
    
    ctx.session.composingTo = profileId;
    
    await ctx.reply(
      `✉️ <b>Написать ${profile.name}</b>\n\n` +
      `Введите ваше сообщение:\n\n` +
      `💡 Используйте команды:\n` +
      `/cancel - Отменить\n` +
      `/template - Шаблоны сообщений`,
      { parse_mode: 'HTML' }
    );
  }
  
  async showMessageComposer(ctx) {
    const composerText = 
      `✉️ <b>Написать сообщение</b>\n\n` +
      `Выберите получателя:`;
    
    // Создаем кнопки для всех профилей
    const buttons = this.profiles.map(profile => 
      [Markup.button.callback(`${profile.name}`, `msg_send_${profile.id}`)]
    );
    
    buttons.push([Markup.button.callback('🏠 Главное меню', 'menu_main')]);
    
    await this.editOrReply(ctx, composerText, {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard(buttons)
    });
  }
  
  async showMessageTemplates(ctx) {
    const templatesText = 
      `📝 <b>Шаблоны сообщений</b>\n\n` +
      `Выберите шаблон:`;
    
    await this.editOrReply(ctx, templatesText, {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('👋 Приветствие', 'template_hello')],
        [Markup.button.callback('🤝 Предложение сотрудничества', 'template_collaboration')],
        [Markup.button.callback('📋 Запрос деталей', 'template_details')],
        [Markup.button.callback('💰 Обсуждение условий', 'template_terms')],
        [Markup.button.callback('🏠 Главное меню', 'menu_main')]
      ])
    });
  }
  
  async showAIAssistant(ctx) {
    const aiText = 
      `🤖 <b>AI-Помощник</b>\n\n` +
      `Ваш персональный помощник для бизнеса:\n\n` +
      `• 📝 Составление сообщений\n` +
      `• 📊 Анализ профилей\n` +
      `• 💡 Советы по продажам\n` +
      `• 🎯 Рекомендации партнеров`;
    
    await this.editOrReply(ctx, aiText, {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('📝 Составить сообщение', 'ai_compose')],
        [Markup.button.callback('📊 Анализ профиля', 'ai_analyze')],
        [Markup.button.callback('💡 Получить совет', 'ai_advice')],
        [Markup.button.callback('🏠 Главное меню', 'menu_main')]
      ])
    });
  }
  
  async handleTextMessage(ctx) {
    const text = ctx.message.text;
    
    if (text === '/cancel') {
      ctx.session.editingField = null;
      ctx.session.composingTo = null;
      await ctx.reply('❌ Действие отменено.');
      await this.showMainMenu(ctx);
      return;
    }
    
    if (text === '/template') {
      await this.showMessageTemplates(ctx);
      return;
    }
    
    if (ctx.session.editingField) {
      const userId = ctx.from.id;
      const profile = this.userProfiles.get(userId) || {};
      
      profile[ctx.session.editingField] = text;
      this.userProfiles.set(userId, profile);
      ctx.session.editingField = null;
      
      await ctx.reply(`✅ Профиль обновлен!`, { parse_mode: 'HTML' });
      await this.showProfile(ctx);
      return;
    }
    
    // Отправка сообщения
    if (ctx.session.composingTo) {
      const profileId = ctx.session.composingTo;
      const profile = this.profiles.find(p => p.id == profileId);
      
      if (profile) {
        // Сохраняем сообщение
        const userId = ctx.from.id;
        const messages = this.userMessages.get(userId) || [];
        messages.push({
          to: profile.name,
          text: text,
          time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
        });
        this.userMessages.set(userId, messages);
        
        ctx.session.composingTo = null;
        
        await ctx.reply(
          `✅ Сообщение отправлено ${profile.name}!\n\n` +
          `"${text}"`,
          { parse_mode: 'HTML' }
        );
        
        // Имитируем ответ через 2-5 секунд
        setTimeout(() => {
          ctx.reply(`📩 Новый ответ от ${profile.name}:\n\n"Спасибо за ваше сообщение! Давайте обсудим детали."`);
        }, 2000 + Math.random() * 3000);
      }
      
      await this.showMainMenu(ctx);
      return;
    }
    
    await ctx.reply('💬 Используйте /menu для главного меню');
  }
  
  async showMatches(ctx) {
    const userId = ctx.from.id;
    const matches = this.userMatches.get(userId) || [];
    
    let text = `💕 <b>Ваши совпадения</b>\n\n`;
    
    if (matches.length === 0) {
      text += `Пока нет совпадений.\n🔍 Начните поиск!`;
    } else {
      text += `Найдено: ${matches.length}\n\n`;
      matches.slice(0, 3).forEach((match, i) => {
        text += `${i + 1}. <b>${match.name}</b>\n${match.type}\n\n`;
      });
    }
    
    await this.editOrReply(ctx, text, {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('👀 Смотреть профили', 'search_start')],
        [Markup.button.callback('🏠 Главное меню', 'menu_main')]
      ])
    });
  }
  
  async showMessages(ctx) {
    const userId = ctx.from.id;
    const messages = this.userMessages.get(userId) || [];
    
    let text = `💬 <b>Сообщения</b>\n\n`;
    
    if (messages.length === 0) {
      text += `📭 Пока нет сообщений.\nНачните общение с партнерами!`;
    } else {
      text += `У вас ${messages.length} сообщений:\n\n`;
      messages.slice(-3).forEach((msg, i) => {
        text += `📩 <b>${msg.to}</b>\n${msg.text}\n🕐 ${msg.time}\n\n`;
      });
    }
    
    await this.editOrReply(ctx, text, {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('✉️ Написать', 'msg_compose')],
        [Markup.button.callback('📝 Шаблоны', 'msg_templates')],
        [Markup.button.callback('🏠 Главное меню', 'menu_main')]
      ])
    });
  }
  
  async showAnalytics(ctx) {
    const userId = ctx.from.id;
    const matches = this.userMatches.get(userId) || [];
    
    const text = 
      `📊 <b>Ваша аналитика</b>\n\n` +
      `💕 <b>Совпадения:</b> ${matches.length}\n` +
      `👀 <b>Просмотры:</b> ${Math.floor(Math.random() * 50) + 10}\n` +
      `⭐ <b>Рейтинг:</b> ${(4.2 + Math.random() * 0.7).toFixed(1)}/5.0`;
    
    await this.editOrReply(ctx, text, {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🏠 Главное меню', 'menu_main')]
      ])
    });
  }
  
  async editOrReply(ctx, text, options) {
    try {
      if (ctx.callbackQuery) {
        await ctx.editMessageText(text, options);
      } else {
        await ctx.reply(text, options);
      }
    } catch (error) {
      await ctx.reply(text, options);
    }
  }
  
  async handleTemplateAction(ctx) {
    const template = ctx.match[1];
    await ctx.answerCbQuery();
    
    const templates = {
      hello: 'Добрый день! Меня заинтересовал ваш профиль. Хотел бы обсудить возможное сотрудничество.',
      collaboration: 'Предлагаю рассмотреть сотрудничество по продаже ваших продуктов. У меня есть опыт в этой сфере.',
      details: 'Расскажите, пожалуйста, подробнее о ваших условиях и требованиях к партнерам.',
      terms: 'Какие условия сотрудничества и комиссия у вас предусмотрены?'
    };
    
    if (templates[template]) {
      await ctx.reply(`📝 Шаблон сообщения:\n\n${templates[template]}`);
    }
  }
  
  async handleAIAction(ctx) {
    const action = ctx.match[1];
    await ctx.answerCbQuery();
    
    const responses = {
      compose: '🤖 AI предлагает написать: "Здравствуйте! Меня заинтересовала возможность сотрудничества. Могу ли я узнать больше о ваших условиях?"',
      analyze: '🤖 AI анализ показывает: высокая совместимость по отраслям, рекомендуется обсудить условия комиссии.',
      advice: '🤖 Совет: Начните с обсуждения конкретных продуктов и целевых рынков для более эффективного сотрудничества.'
    };
    
    if (responses[action]) {
      await ctx.reply(responses[action]);
    }
  }
  
  async start() {
    if (!this.bot) {
      throw new Error('Бот не инициализирован');
    }
    
    await this.bot.launch();
    this.logger.info('🚀 Enhanced Telegram Bot запущен');
  }
  
  async stop() {
    if (this.bot) {
      await this.bot.stop();
      this.logger.info('🛑 Enhanced Telegram Bot остановлен');
    }
  }
}

module.exports = EnhancedTelegramBot;