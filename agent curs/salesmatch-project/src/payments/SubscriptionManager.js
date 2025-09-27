const Logger = require('../core/utils/logger');
const ErrorHandler = require('../core/utils/errorHandler');
const crypto = require('crypto');

class SubscriptionManager {
  constructor(db, bot) {
    this.db = db;
    this.bot = bot;
    this.logger = Logger;
    this.errorHandler = ErrorHandler;
    
    // Subscription plans configuration
    this.plans = {
      free: {
        name: 'Free',
        price: 0,
        currency: 'XTR',
        duration: 0, // Unlimited duration
        features: {
          messages: 0,          // No messaging
          aiRequests: 5,        // 5 AI requests per day
          reviews: false,       // No reviews
          priorityMatching: false,
          customerSupport: false,
          analytics: false
        },
        limits: {
          dailySwipes: 10,
          maxMatches: 5
        }
      },
      pro: {
        name: 'Pro',
        price: 500, // 500 Telegram Stars = ~$5
        currency: 'XTR',
        duration: 30, // 30 days
        features: {
          messages: -1,         // Unlimited messaging
          aiRequests: 50,       // 50 AI requests per day
          reviews: true,        // Can leave and receive reviews
          priorityMatching: false,
          customerSupport: true,
          analytics: true
        },
        limits: {
          dailySwipes: 50,
          maxMatches: -1
        }
      },
      business: {
        name: 'Business',
        price: 2000, // 2000 Telegram Stars = ~$20
        currency: 'XTR',
        duration: 30, // 30 days
        features: {
          messages: -1,         // Unlimited messaging
          aiRequests: -1,       // Unlimited AI requests
          reviews: true,        // Can leave and receive reviews
          priorityMatching: true,
          customerSupport: true,
          analytics: true,
          customBranding: true,
          bulkOperations: true
        },
        limits: {
          dailySwipes: -1,
          maxMatches: -1
        }
      }
    };
  }
  
  /**
   * Get subscription plans available for purchase
   * @returns {Array} - Available subscription plans
   */
  getAvailablePlans() {
    return Object.entries(this.plans)
      .filter(([key]) => key !== 'free')
      .map(([key, plan]) => ({
        planId: key,
        name: plan.name,
        price: plan.price,
        currency: plan.currency,
        duration: plan.duration,
        features: plan.features,
        limits: plan.limits,
        popular: key === 'pro' // Mark Pro as popular
      }));
  }
  
  /**
   * Create subscription invoice for Telegram Stars payment
   * @param {number} userId - User ID
   * @param {string} planType - Subscription plan type
   * @returns {Object} - Invoice object for Telegram payment
   */
  async createInvoice(userId, planType) {
    try {
      const plan = this.plans[planType];
      
      if (!plan || plan.price === 0) {
        throw new ErrorHandler.ValidationError('Invalid subscription plan');
      }
      
      // Check if user already has active subscription
      const existingSubscription = await this.checkSubscription(userId);
      
      if (existingSubscription && existingSubscription.plan_type === planType) {
        throw new ErrorHandler.ValidationError('User already has this subscription plan');
      }
      
      // Generate unique invoice payload
      const invoicePayload = JSON.stringify({
        userId,
        planType,
        timestamp: Date.now(),
        nonce: crypto.randomBytes(16).toString('hex')
      });
      
      // Create Telegram invoice
      const invoice = {
        title: `${plan.name} Subscription - SalesMatch Pro`,
        description: this.getSubscriptionDescription(planType),
        payload: invoicePayload,
        provider_token: '', // Empty for Telegram Stars
        currency: plan.currency,
        prices: [{
          label: `${plan.name} Plan (${plan.duration} days)`,
          amount: plan.price
        }],
        max_tip_amount: 0,
        suggested_tip_amounts: [],
        start_parameter: `subscription_${planType}`,
        provider_data: JSON.stringify({
          planType,
          userId,
          features: plan.features
        }),
        photo_url: null,
        photo_size: null,
        photo_width: null,
        photo_height: null,
        need_name: false,
        need_phone_number: false,
        need_email: false,
        need_shipping_address: false,
        send_phone_number_to_provider: false,
        send_email_to_provider: false,
        is_flexible: false
      };
      
      this.logger.businessInfo('SUBSCRIPTION', 'Invoice created', {
        userId,
        planType,
        amount: plan.price
      });
      
      return invoice;
      
    } catch (error) {
      throw this.errorHandler.handleBusinessError(
        error,
        'SUBSCRIPTION_MANAGER',
        'createInvoice'
      );
    }
  }
  
  /**
   * Process successful payment and activate subscription
   * @param {number} userId - User ID
   * @param {string} planType - Subscription plan type
   * @param {string} paymentId - Telegram payment ID
   * @param {Object} paymentData - Payment details
   * @returns {Object} - Created subscription
   */
  async processPayment(userId, planType, paymentId, paymentData = {}) {
    try {
      const plan = this.plans[planType];
      
      if (!plan) {
        throw new ErrorHandler.ValidationError('Invalid subscription plan');
      }
      
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + plan.duration);
      
      // Create or update subscription
      const query = `
        INSERT INTO subscriptions (
          user_id, plan_type, status, 
          starts_at, expires_at, 
          payment_id, auto_renew, created_at
        ) VALUES ($1, $2, 'active', $3, $4, $5, true, NOW())
        ON CONFLICT (user_id) DO UPDATE SET
          plan_type = EXCLUDED.plan_type,
          status = EXCLUDED.status,
          starts_at = EXCLUDED.starts_at,
          expires_at = EXCLUDED.expires_at,
          payment_id = EXCLUDED.payment_id,
          auto_renew = EXCLUDED.auto_renew,
          updated_at = NOW()
        RETURNING *
      `;
      
      const result = await this.db.query(query, [
        userId,
        planType,
        startDate,
        endDate,
        paymentId
      ]);
      
      const subscription = result.rows[0];
      
      // Send welcome message and features overview
      await this.sendSubscriptionWelcome(userId, planType);
      
      // Schedule auto-renewal reminder
      this.scheduleRenewalReminder(userId, endDate);
      
      this.logger.businessInfo('SUBSCRIPTION', 'Payment processed and subscription activated', {
        userId,
        planType,
        paymentId,
        expiresAt: endDate
      });
      
      return subscription;
      
    } catch (error) {
      throw this.errorHandler.handleBusinessError(
        error,
        'SUBSCRIPTION_MANAGER',
        'processPayment'
      );
    }
  }
  
  /**
   * Check user's current subscription status
   * @param {number} userId - User ID
   * @returns {Object|null} - Active subscription or null
   */
  async checkSubscription(userId) {
    try {
      const query = `
        SELECT * FROM subscriptions 
        WHERE user_id = $1 
        AND status = 'active' 
        AND expires_at > NOW()
      `;
      
      const result = await this.db.query(query, [userId]);
      return result.rows[0] || null;
      
    } catch (error) {
      this.logger.error('Error checking subscription:', error);
      return null;
    }
  }
  
  /**
   * Check if user can send messages
   * @param {number} userId - User ID
   * @returns {boolean} - True if user can send messages
   */
  async canSendMessage(userId) {
    try {
      const subscription = await this.checkSubscription(userId);
      
      if (!subscription) return false; // Free users cannot send messages
      
      const plan = this.plans[subscription.plan_type];
      return plan && plan.features.messages !== 0;
      
    } catch (error) {
      this.logger.error('Error checking message permissions:', error);
      return false;
    }
  }
  
  /**
   * Check if user can leave reviews
   * @param {number} userId - User ID
   * @returns {boolean} - True if user can leave reviews
   */
  async canLeaveReview(userId) {
    try {
      const subscription = await this.checkSubscription(userId);
      
      if (!subscription) return false; // Free users cannot leave reviews
      
      const plan = this.plans[subscription.plan_type];
      return plan && plan.features.reviews === true;
      
    } catch (error) {
      this.logger.error('Error checking review permissions:', error);
      return false;
    }
  }
  
  /**
   * Check AI usage limits for user
   * @param {number} userId - User ID
   * @returns {Object} - AI usage limits and current usage
   */
  async checkAIUsage(userId) {
    try {
      const subscription = await this.checkSubscription(userId) || { plan_type: 'free' };
      const plan = this.plans[subscription.plan_type];
      const limit = plan.features.aiRequests;
      
      if (limit === -1) {
        return { canUse: true, limit: 'unlimited', remaining: 'unlimited' };
      }
      
      // Check current daily usage
      const query = `
        SELECT COUNT(*) as usage_count 
        FROM ai_usage_logs 
        WHERE user_id = $1 
        AND created_at > NOW() - INTERVAL '24 hours'
      `;
      
      const result = await this.db.query(query, [userId]);
      const currentUsage = parseInt(result.rows[0].usage_count) || 0;
      const remaining = Math.max(0, limit - currentUsage);
      
      return {
        canUse: currentUsage < limit,
        limit,
        used: currentUsage,
        remaining
      };
      
    } catch (error) {
      this.logger.error('Error checking AI usage:', error);
      return { canUse: false, limit: 0, remaining: 0 };
    }
  }
  
  /**
   * Get subscription usage statistics
   * @param {number} userId - User ID
   * @returns {Object} - Usage statistics
   */
  async getUsageStats(userId) {
    try {
      const subscription = await this.checkSubscription(userId);
      const planType = subscription?.plan_type || 'free';
      const plan = this.plans[planType];
      
      // Get AI usage stats
      const aiUsageQuery = `
        SELECT COUNT(*) as ai_requests_today
        FROM ai_usage_logs 
        WHERE user_id = $1 
        AND created_at > NOW() - INTERVAL '24 hours'
      `;
      
      // Get messaging stats
      const messageStatsQuery = `
        SELECT COUNT(*) as messages_sent_today
        FROM messages msg
        JOIN matches m ON msg.match_id = m.id
        WHERE msg.sender_id = $1
        AND msg.created_at > NOW() - INTERVAL '24 hours'
      `;
      
      // Get swipe stats
      const swipeStatsQuery = `
        SELECT COUNT(*) as swipes_today
        FROM swipe_history
        WHERE user_id = $1
        AND created_at > NOW() - INTERVAL '24 hours'
      `;
      
      const [aiUsage, messageStats, swipeStats] = await Promise.all([
        this.db.query(aiUsageQuery, [userId]),
        this.db.query(messageStatsQuery, [userId]),
        this.db.query(swipeStatsQuery, [userId])
      ]);
      
      return {
        subscription: {
          plan: planType,
          status: subscription?.status || 'none',
          expiresAt: subscription?.expires_at || null,
          daysRemaining: subscription ? 
            Math.ceil((new Date(subscription.expires_at) - new Date()) / (1000 * 60 * 60 * 24)) : 0
        },
        usage: {
          aiRequestsToday: parseInt(aiUsage.rows[0].ai_requests_today) || 0,
          aiRequestsLimit: plan.features.aiRequests,
          messagesSentToday: parseInt(messageStats.rows[0].messages_sent_today) || 0,
          swipesToday: parseInt(swipeStats.rows[0].swipes_today) || 0,
          swipesLimit: plan.limits.dailySwipes
        },
        features: plan.features,
        limits: plan.limits
      };
      
    } catch (error) {
      this.logger.error('Error getting usage stats:', error);
      return {
        subscription: { plan: 'free', status: 'none' },
        usage: { aiRequestsToday: 0, messagesSentToday: 0, swipesToday: 0 },
        features: this.plans.free.features,
        limits: this.plans.free.limits
      };
    }
  }
  
  /**
   * Cancel subscription (set to not auto-renew)
   * @param {number} userId - User ID
   * @returns {Object} - Updated subscription
   */
  async cancelSubscription(userId) {
    try {
      const query = `
        UPDATE subscriptions 
        SET auto_renew = false, updated_at = NOW()
        WHERE user_id = $1 
        AND status = 'active'
        RETURNING *
      `;
      
      const result = await this.db.query(query, [userId]);
      
      if (!result.rows[0]) {
        throw new ErrorHandler.NotFoundError('No active subscription found');
      }
      
      // Send cancellation confirmation
      await this.sendCancellationConfirmation(userId, result.rows[0]);
      
      this.logger.businessInfo('SUBSCRIPTION', 'Subscription cancelled', {
        userId,
        expiresAt: result.rows[0].expires_at
      });
      
      return result.rows[0];
      
    } catch (error) {
      throw this.errorHandler.handleBusinessError(
        error,
        'SUBSCRIPTION_MANAGER',
        'cancelSubscription'
      );
    }
  }
  
  /**
   * Reactivate cancelled subscription
   * @param {number} userId - User ID
   * @returns {Object} - Updated subscription
   */
  async reactivateSubscription(userId) {
    try {
      const query = `
        UPDATE subscriptions 
        SET auto_renew = true, updated_at = NOW()
        WHERE user_id = $1 
        AND status = 'active'
        AND expires_at > NOW()
        RETURNING *
      `;
      
      const result = await this.db.query(query, [userId]);
      
      if (!result.rows[0]) {
        throw new ErrorHandler.NotFoundError('No active subscription found to reactivate');
      }
      
      this.logger.businessInfo('SUBSCRIPTION', 'Subscription reactivated', {
        userId
      });
      
      return result.rows[0];
      
    } catch (error) {
      throw this.errorHandler.handleBusinessError(
        error,
        'SUBSCRIPTION_MANAGER',
        'reactivateSubscription'
      );
    }
  }
  
  /**
   * Handle expired subscriptions (run as cron job)
   */
  async processExpiredSubscriptions() {
    try {
      // Find expired subscriptions
      const query = `
        SELECT * FROM subscriptions 
        WHERE status = 'active' 
        AND expires_at < NOW()
      `;
      
      const result = await this.db.query(query);
      
      for (const subscription of result.rows) {
        if (subscription.auto_renew) {
          // Attempt auto-renewal
          await this.attemptAutoRenewal(subscription);
        } else {
          // Mark as expired
          await this.expireSubscription(subscription.user_id);
        }
      }
      
      this.logger.businessInfo('SUBSCRIPTION', 'Processed expired subscriptions', {
        count: result.rows.length
      });
      
    } catch (error) {
      this.logger.error('Error processing expired subscriptions:', error);
    }
  }
  
  // Private helper methods
  
  getSubscriptionDescription(planType) {
    const descriptions = {
      pro: 'Unlock unlimited messaging, 50 AI requests daily, customer support, and detailed analytics.',
      business: 'Get everything in Pro plus unlimited AI requests, priority matching, custom branding, and advanced features.'
    };
    
    return descriptions[planType] || `${planType} subscription for SalesMatch Pro`;
  }
  
  async sendSubscriptionWelcome(userId, planType) {
    try {
      if (!this.bot) return;
      
      const plan = this.plans[planType];
      const message = `🎉 Welcome to SalesMatch Pro ${plan.name}!

Your subscription is now active and includes:
${this.formatFeatures(plan.features)}

Start maximizing your business connections today!`;

      await this.bot.sendNotification(userId, message, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📱 Open App', web_app: { url: process.env.WEBAPP_URL } }]
          ]
        }
      });
      
    } catch (error) {
      this.logger.error('Error sending subscription welcome:', error);
    }
  }
  
  async sendCancellationConfirmation(userId, subscription) {
    try {
      if (!this.bot) return;
      
      const expiryDate = new Date(subscription.expires_at).toLocaleDateString();
      const message = `📋 Subscription Cancelled

Your ${subscription.plan_type} subscription will not auto-renew.
You can continue using premium features until ${expiryDate}.

You can reactivate auto-renewal anytime in your subscription settings.`;

      await this.bot.sendNotification(userId, message);
      
    } catch (error) {
      this.logger.error('Error sending cancellation confirmation:', error);
    }
  }
  
  scheduleRenewalReminder(userId, expiryDate) {
    // Schedule reminder 3 days before expiry
    const reminderDate = new Date(expiryDate);
    reminderDate.setDate(reminderDate.getDate() - 3);
    
    const timeUntilReminder = reminderDate.getTime() - Date.now();
    
    if (timeUntilReminder > 0) {
      setTimeout(async () => {
        await this.sendRenewalReminder(userId);
      }, timeUntilReminder);
    }
  }
  
  async sendRenewalReminder(userId) {
    try {
      if (!this.bot) return;
      
      const message = `⏰ Subscription Expiring Soon

Your SalesMatch Pro subscription expires in 3 days.

To continue enjoying premium features, your subscription will auto-renew unless cancelled.`;

      await this.bot.sendNotification(userId, message, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '💳 Manage Subscription', web_app: { url: `${process.env.WEBAPP_URL}/subscription` } }
            ]
          ]
        }
      });
      
    } catch (error) {
      this.logger.error('Error sending renewal reminder:', error);
    }
  }
  
  async attemptAutoRenewal(subscription) {
    try {
      // For Telegram Stars, auto-renewal would need to be handled
      // through Telegram's payment system or by creating new invoices
      this.logger.info('Auto-renewal attempted for user:', subscription.user_id);
      
      // For now, mark as expired and send renewal notification
      await this.expireSubscription(subscription.user_id);
      await this.sendRenewalNotification(subscription.user_id);
      
    } catch (error) {
      this.logger.error('Error attempting auto-renewal:', error);
    }
  }
  
  async expireSubscription(userId) {
    try {
      const query = `
        UPDATE subscriptions 
        SET status = 'expired', updated_at = NOW()
        WHERE user_id = $1
      `;
      
      await this.db.query(query, [userId]);
      
      // Send expiry notification
      await this.sendExpiryNotification(userId);
      
    } catch (error) {
      this.logger.error('Error expiring subscription:', error);
    }
  }
  
  async sendExpiryNotification(userId) {
    try {
      if (!this.bot) return;
      
      const message = `⚠️ Subscription Expired

Your SalesMatch Pro subscription has expired.
Upgrade now to continue using premium features.`;

      await this.bot.sendNotification(userId, message, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '⬆️ Upgrade Now', web_app: { url: `${process.env.WEBAPP_URL}/subscription` } }
            ]
          ]
        }
      });
      
    } catch (error) {
      this.logger.error('Error sending expiry notification:', error);
    }
  }
  
  async sendRenewalNotification(userId) {
    try {
      if (!this.bot) return;
      
      const message = `🔄 Subscription Renewal Required

Your subscription has expired. Renew now to continue accessing:
• Unlimited messaging
• AI-powered features
• Priority matching
• Advanced analytics`;

      await this.bot.sendNotification(userId, message, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🔄 Renew Subscription', web_app: { url: `${process.env.WEBAPP_URL}/subscription` } }
            ]
          ]
        }
      });
      
    } catch (error) {
      this.logger.error('Error sending renewal notification:', error);
    }
  }
  
  formatFeatures(features) {
    const featureList = [];
    
    if (features.messages === -1) featureList.push('• Unlimited messaging');
    if (features.aiRequests === -1) featureList.push('• Unlimited AI requests');
    else if (features.aiRequests > 0) featureList.push(`• ${features.aiRequests} AI requests daily`);
    if (features.reviews) featureList.push('• Reviews and ratings');
    if (features.priorityMatching) featureList.push('• Priority matching');
    if (features.customerSupport) featureList.push('• Priority customer support');
    if (features.analytics) featureList.push('• Advanced analytics');
    
    return featureList.join('\n');
  }
}

module.exports = SubscriptionManager;