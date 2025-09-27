const Logger = require('../core/utils/logger');
const ErrorHandler = require('../core/utils/errorHandler');
const Validator = require('../core/utils/validator');

class MessageManager {
  constructor(db, subscriptionManager) {
    this.db = db;
    this.subscriptionManager = subscriptionManager;
    this.logger = Logger;
    this.errorHandler = ErrorHandler;
    this.validator = Validator;
    
    // Message type definitions
    this.messageTypes = {
      TEXT: 'text',
      IMAGE: 'image',
      DOCUMENT: 'document',
      SYSTEM: 'system'
    };
    
    // System message templates
    this.systemMessages = {
      MATCH_CREATED: 'You have a new match! Start the conversation.',
      SUBSCRIPTION_REQUIRED: 'Upgrade to Pro or Business plan to send messages.',
      FIRST_MESSAGE: 'This is the beginning of your conversation.',
      SUBSCRIPTION_EXPIRED: 'Your subscription has expired. Upgrade to continue messaging.'
    };
  }
  
  /**
   * Send a message between matched users
   * @param {number} senderId - ID of the message sender
   * @param {string} matchId - UUID of the match
   * @param {string} content - Message content
   * @param {string} messageType - Type of message (text, image, document)
   * @param {Object} metadata - Additional message metadata
   * @returns {Object} - Created message object
   */
  async sendMessage(senderId, matchId, content, messageType = 'text', metadata = {}) {
    try {
      // Validate input
      const validatedData = this.validator.validate({
        matchId,
        content,
        messageType
      }, 'messageCreate');
      
      // Verify match exists and sender is part of it
      const match = await this.getMatch(matchId);
      
      if (!match) {
        throw new ErrorHandler.NotFoundError('Match not found');
      }
      
      if (match.company_id !== senderId && match.agent_id !== senderId) {
        throw new ErrorHandler.AuthorizationError('Not authorized to send messages in this match');
      }
      
      if (match.status !== 'matched') {
        throw new ErrorHandler.ValidationError('Can only send messages to confirmed matches');
      }
      
      // Check subscription permissions
      const canSendMessage = await this.subscriptionManager.canSendMessage(senderId);
      
      if (!canSendMessage) {
        throw new ErrorHandler.AuthorizationError('Subscription required to send messages');
      }
      
      // Determine recipient
      const recipientId = match.company_id === senderId ? match.agent_id : match.company_id;
      
      // Create message
      const messageQuery = `
        INSERT INTO messages (
          match_id, sender_id, content, message_type, 
          metadata, created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING *
      `;
      
      const messageResult = await this.db.query(messageQuery, [
        matchId,
        senderId,
        validatedData.content,
        validatedData.messageType,
        JSON.stringify(metadata)
      ]);
      
      const message = messageResult.rows[0];
      
      // Send real-time notification to recipient
      await this.sendMessageNotification(recipientId, senderId, message);
      
      // Log message for analytics
      this.logger.businessInfo('MESSAGING', 'Message sent', {
        messageId: message.id,
        matchId,
        senderId,
        recipientId,
        messageType: validatedData.messageType
      });
      
      return this.formatMessage(message);
      
    } catch (error) {
      throw this.errorHandler.handleBusinessError(
        error,
        'MESSAGE_MANAGER',
        'sendMessage'
      );
    }
  }
  
  /**
   * Get conversation messages for a match
   * @param {number} userId - User requesting messages
   * @param {string} matchId - Match ID
   * @param {number} limit - Number of messages to return
   * @param {number} offset - Offset for pagination
   * @returns {Array} - Array of messages
   */
  async getConversation(userId, matchId, limit = 50, offset = 0) {
    try {
      // Verify user is part of the match
      const match = await this.getMatch(matchId);
      
      if (!match) {
        throw new ErrorHandler.NotFoundError('Match not found');
      }
      
      if (match.company_id !== userId && match.agent_id !== userId) {
        throw new ErrorHandler.AuthorizationError('Not authorized to view this conversation');
      }
      
      // Get messages with sender information
      const query = `
        SELECT 
          m.*,
          u.username as sender_username,
          CASE 
            WHEN u.account_type = 'company' THEN cp.company_name
            WHEN u.account_type = 'agent' THEN ap.full_name
          END as sender_display_name
        FROM messages m
        JOIN users u ON m.sender_id = u.telegram_id
        LEFT JOIN company_profiles cp ON u.telegram_id = cp.user_id AND u.account_type = 'company'
        LEFT JOIN agent_profiles ap ON u.telegram_id = ap.user_id AND u.account_type = 'agent'
        WHERE m.match_id = $1
        ORDER BY m.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      
      const result = await this.db.query(query, [matchId, limit, offset]);
      
      // Mark messages as read
      await this.markMessagesAsRead(userId, matchId);
      
      // Format and return messages (reverse to show oldest first)
      return result.rows.reverse().map(msg => this.formatMessage(msg));
      
    } catch (error) {
      throw this.errorHandler.handleBusinessError(
        error,
        'MESSAGE_MANAGER',
        'getConversation'
      );
    }
  }
  
  /**
   * Get all conversations for a user
   * @param {number} userId - User ID
   * @param {number} limit - Number of conversations to return
   * @returns {Array} - Array of conversations with last message
   */
  async getConversations(userId, limit = 20) {
    try {
      const query = `
        SELECT 
          m.match_id,
          m.company_id,
          m.agent_id,
          m.status as match_status,
          m.created_at as match_created_at,
          m.matched_at,
          last_msg.content as last_message_content,
          last_msg.message_type as last_message_type,
          last_msg.created_at as last_message_at,
          last_msg.sender_id as last_message_sender_id,
          unread.unread_count,
          partner_user.username as partner_username,
          partner_user.rating as partner_rating,
          CASE 
            WHEN partner_user.account_type = 'company' THEN partner_cp.company_name
            WHEN partner_user.account_type = 'agent' THEN partner_ap.full_name
          END as partner_display_name,
          CASE 
            WHEN partner_user.account_type = 'company' THEN partner_cp.photos
            WHEN partner_user.account_type = 'agent' THEN NULL
          END as partner_photos
        FROM matches m
        LEFT JOIN LATERAL (
          SELECT msg.*
          FROM messages msg
          WHERE msg.match_id = m.id
          ORDER BY msg.created_at DESC
          LIMIT 1
        ) last_msg ON true
        LEFT JOIN LATERAL (
          SELECT COUNT(*) as unread_count
          FROM messages msg
          WHERE msg.match_id = m.id
          AND msg.sender_id != $1
          AND msg.read_at IS NULL
        ) unread ON true
        JOIN users partner_user ON (
          CASE 
            WHEN m.company_id = $1 THEN m.agent_id
            ELSE m.company_id
          END = partner_user.telegram_id
        )
        LEFT JOIN company_profiles partner_cp ON partner_user.telegram_id = partner_cp.user_id
        LEFT JOIN agent_profiles partner_ap ON partner_user.telegram_id = partner_ap.user_id
        WHERE (m.company_id = $1 OR m.agent_id = $1)
        AND m.status = 'matched'
        ORDER BY COALESCE(last_msg.created_at, m.matched_at) DESC
        LIMIT $2
      `;
      
      const result = await this.db.query(query, [userId, limit]);
      
      return result.rows.map(row => ({
        matchId: row.match_id,
        partnerId: row.company_id === userId ? row.agent_id : row.company_id,
        partnerUsername: row.partner_username,
        partnerDisplayName: row.partner_display_name,
        partnerRating: row.partner_rating,
        partnerPhotos: row.partner_photos ? 
          (typeof row.partner_photos === 'string' ? JSON.parse(row.partner_photos) : row.partner_photos) : [],
        matchCreatedAt: row.match_created_at,
        matchedAt: row.matched_at,
        lastMessage: row.last_message_content ? {
          content: row.last_message_content,
          type: row.last_message_type,
          senderId: row.last_message_sender_id,
          createdAt: row.last_message_at,
          isFromMe: row.last_message_sender_id === userId
        } : null,
        unreadCount: parseInt(row.unread_count) || 0,
        hasUnreadMessages: parseInt(row.unread_count) > 0
      }));
      
    } catch (error) {
      throw this.errorHandler.handleBusinessError(
        error,
        'MESSAGE_MANAGER',
        'getConversations'
      );
    }
  }
  
  /**
   * Mark messages as read
   * @param {number} userId - User reading messages
   * @param {string} matchId - Match ID
   * @returns {number} - Number of messages marked as read
   */
  async markMessagesAsRead(userId, matchId) {
    try {
      const query = `
        UPDATE messages 
        SET read_at = NOW()
        WHERE match_id = $1 
        AND sender_id != $2 
        AND read_at IS NULL
        RETURNING id
      `;
      
      const result = await this.db.query(query, [matchId, userId]);
      
      if (result.rows.length > 0) {
        this.logger.businessInfo('MESSAGING', 'Messages marked as read', {
          userId,
          matchId,
          messageCount: result.rows.length
        });
      }
      
      return result.rows.length;
      
    } catch (error) {
      throw this.errorHandler.handleBusinessError(
        error,
        'MESSAGE_MANAGER',
        'markMessagesAsRead'
      );
    }
  }
  
  /**
   * Delete a message (soft delete)
   * @param {number} userId - User deleting the message
   * @param {string} messageId - Message ID to delete
   * @returns {boolean} - Success status
   */
  async deleteMessage(userId, messageId) {
    try {
      const query = `
        UPDATE messages 
        SET content = '[Message deleted]',
            message_type = 'system',
            metadata = jsonb_set(COALESCE(metadata, '{}'), '{deleted}', 'true'),
            updated_at = NOW()
        WHERE id = $1 
        AND sender_id = $2
        AND created_at > NOW() - INTERVAL '24 hours'
        RETURNING id
      `;
      
      const result = await this.db.query(query, [messageId, userId]);
      
      if (result.rows.length === 0) {
        throw new ErrorHandler.NotFoundError('Message not found or cannot be deleted');
      }
      
      this.logger.businessInfo('MESSAGING', 'Message deleted', {
        messageId,
        userId
      });
      
      return true;
      
    } catch (error) {
      throw this.errorHandler.handleBusinessError(
        error,
        'MESSAGE_MANAGER',
        'deleteMessage'
      );
    }
  }
  
  /**
   * Send system message to a match
   * @param {string} matchId - Match ID
   * @param {string} messageKey - System message template key
   * @param {Object} variables - Variables for message template
   * @returns {Object} - Created system message
   */
  async sendSystemMessage(matchId, messageKey, variables = {}) {
    try {
      let content = this.systemMessages[messageKey] || messageKey;
      
      // Replace variables in message content
      Object.keys(variables).forEach(key => {
        content = content.replace(`{{${key}}}`, variables[key]);
      });
      
      const query = `
        INSERT INTO messages (
          match_id, sender_id, content, message_type, created_at
        ) VALUES ($1, NULL, $2, 'system', NOW())
        RETURNING *
      `;
      
      const result = await this.db.query(query, [matchId, content]);
      
      return this.formatMessage(result.rows[0]);
      
    } catch (error) {
      throw this.errorHandler.handleBusinessError(
        error,
        'MESSAGE_MANAGER',
        'sendSystemMessage'
      );
    }
  }
  
  /**
   * Get message statistics for a user
   * @param {number} userId - User ID
   * @returns {Object} - Message statistics
   */
  async getMessageStats(userId) {
    try {
      const query = `
        SELECT 
          COUNT(DISTINCT m.match_id) as active_conversations,
          COUNT(msg.id) as total_messages_sent,
          COUNT(CASE WHEN msg.created_at > NOW() - INTERVAL '7 days' THEN 1 END) as messages_this_week,
          COUNT(CASE WHEN msg.created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as messages_today
        FROM matches m
        LEFT JOIN messages msg ON m.id = msg.match_id AND msg.sender_id = $1
        WHERE (m.company_id = $1 OR m.agent_id = $1)
        AND m.status = 'matched'
      `;
      
      const result = await this.db.query(query, [userId]);
      
      // Get unread messages count
      const unreadQuery = `
        SELECT COUNT(*) as unread_messages
        FROM messages msg
        JOIN matches m ON msg.match_id = m.id
        WHERE (m.company_id = $1 OR m.agent_id = $1)
        AND msg.sender_id != $1
        AND msg.read_at IS NULL
      `;
      
      const unreadResult = await this.db.query(unreadQuery, [userId]);
      
      return {
        ...result.rows[0],
        unread_messages: parseInt(unreadResult.rows[0].unread_messages) || 0
      };
      
    } catch (error) {
      throw this.errorHandler.handleBusinessError(
        error,
        'MESSAGE_MANAGER',
        'getMessageStats'
      );
    }
  }
  
  /**
   * Search messages in conversations
   * @param {number} userId - User ID
   * @param {string} searchTerm - Search term
   * @param {string} matchId - Optional specific match ID
   * @param {number} limit - Number of results
   * @returns {Array} - Search results
   */
  async searchMessages(userId, searchTerm, matchId = null, limit = 50) {
    try {
      let query = `
        SELECT 
          msg.*,
          m.company_id,
          m.agent_id,
          sender.username as sender_username,
          CASE 
            WHEN sender.account_type = 'company' THEN sender_cp.company_name
            WHEN sender.account_type = 'agent' THEN sender_ap.full_name
          END as sender_display_name
        FROM messages msg
        JOIN matches m ON msg.match_id = m.id
        JOIN users sender ON msg.sender_id = sender.telegram_id
        LEFT JOIN company_profiles sender_cp ON sender.telegram_id = sender_cp.user_id
        LEFT JOIN agent_profiles sender_ap ON sender.telegram_id = sender_ap.user_id
        WHERE (m.company_id = $1 OR m.agent_id = $1)
        AND msg.content ILIKE $2
        AND msg.message_type = 'text'
      `;
      
      const params = [userId, `%${searchTerm}%`];
      
      if (matchId) {
        query += ` AND msg.match_id = $3`;
        params.push(matchId);
      }
      
      query += ` ORDER BY msg.created_at DESC LIMIT $${params.length + 1}`;
      params.push(limit);
      
      const result = await this.db.query(query, params);
      
      return result.rows.map(row => ({
        ...this.formatMessage(row),
        matchId: row.match_id,
        partnerId: row.company_id === userId ? row.agent_id : row.company_id
      }));
      
    } catch (error) {
      throw this.errorHandler.handleBusinessError(
        error,
        'MESSAGE_MANAGER',
        'searchMessages'
      );
    }
  }
  
  // Private helper methods
  
  async getMatch(matchId) {
    const query = 'SELECT * FROM matches WHERE id = $1';
    const result = await this.db.query(query, [matchId]);
    return result.rows[0];
  }
  
  async sendMessageNotification(recipientId, senderId, message) {
    // This would integrate with the notification system
    // For now, just log the notification
    this.logger.businessInfo('MESSAGING', 'Message notification sent', {
      recipientId,
      senderId,
      messageId: message.id
    });
  }
  
  formatMessage(message) {
    return {
      id: message.id,
      matchId: message.match_id,
      senderId: message.sender_id,
      content: message.content,
      messageType: message.message_type,
      metadata: typeof message.metadata === 'string' ? 
        JSON.parse(message.metadata || '{}') : (message.metadata || {}),
      createdAt: message.created_at,
      readAt: message.read_at,
      senderUsername: message.sender_username,
      senderDisplayName: message.sender_display_name,
      isSystem: message.message_type === 'system'
    };
  }
  
  // Message template system
  
  getMessageTemplate(templateKey, variables = {}) {
    const templates = {
      GREETING_COMPANY: 'Hi {{agentName}}! I\'m interested in your sales services for {{companyName}}.',
      GREETING_AGENT: 'Hello {{companyName}}! I\'d love to learn more about your products and commission structure.',
      FOLLOW_UP: 'Thanks for connecting! When would be a good time to discuss the opportunity?',
      COMMISSION_INQUIRY: 'Could you share more details about the commission structure?',
      MEETING_REQUEST: 'Would you like to schedule a call to discuss this further?'
    };
    
    let template = templates[templateKey] || templateKey;
    
    Object.keys(variables).forEach(key => {
      template = template.replace(`{{${key}}}`, variables[key]);
    });
    
    return template;
  }
}

module.exports = MessageManager;