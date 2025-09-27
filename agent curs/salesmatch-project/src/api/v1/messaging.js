const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const TelegramAuth = require('../../miniapp/auth/TelegramAuth');
const Logger = require('../../core/utils/logger');
const ErrorHandler = require('../../core/utils/errorHandler');
const Validator = require('../../core/utils/validator');

class MessagingAPI {
  constructor(managers) {
    this.messageManager = managers.message;
    this.userManager = managers.user;
    this.subscriptionManager = managers.subscription;
    this.telegramAuth = new TelegramAuth();
    this.logger = Logger;
    this.errorHandler = ErrorHandler;
    this.validator = Validator;
    this.router = express.Router();
    
    this.setupMulter();
    this.setupRoutes();
  }
  
  setupMulter() {
    // Configure multer for message attachments
    const storage = multer.diskStorage({
      destination: async (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'uploads', 'messages', req.telegramUser.id.toString());
        try {
          await fs.mkdir(uploadDir, { recursive: true });
          cb(null, uploadDir);
        } catch (error) {
          cb(error);
        }
      },
      filename: (req, file, cb) => {
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
        cb(null, `${timestamp}_${name}${ext}`);
      }
    });
    
    this.upload = multer({
      storage,
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit for messages
        files: 1 // One file per message
      },
      fileFilter: (req, file, cb) => {
        const allowedTypes = [
          'image/jpeg', 'image/png', 'image/webp', 'image/gif',
          'application/pdf', 'text/plain',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new ErrorHandler.ValidationError('File type not allowed for messages'), false);
        }
      }
    });
  }
  
  setupRoutes() {
    // Send text message
    this.router.post('/:matchId',
      this.telegramAuth.requireAuth(),
      this.sendMessage.bind(this)
    );
    
    // Send message with attachment
    this.router.post('/:matchId/attachment',
      this.telegramAuth.requireAuth(),
      this.upload.single('file'),
      this.sendMessageWithAttachment.bind(this)
    );
    
    // Get conversation messages
    this.router.get('/:matchId',
      this.telegramAuth.requireAuth(),
      this.getConversation.bind(this)
    );
    
    // Get all conversations
    this.router.get('/conversations',
      this.telegramAuth.requireAuth(),
      this.getConversations.bind(this)
    );
    
    // Mark messages as read
    this.router.post('/:matchId/read',
      this.telegramAuth.requireAuth(),
      this.markAsRead.bind(this)
    );
    
    // Delete message
    this.router.delete('/message/:messageId',
      this.telegramAuth.requireAuth(),
      this.deleteMessage.bind(this)
    );
    
    // Search messages
    this.router.get('/search',
      this.telegramAuth.requireAuth(),
      this.searchMessages.bind(this)
    );
    
    // Get message statistics
    this.router.get('/stats',
      this.telegramAuth.requireAuth(),
      this.getMessageStats.bind(this)
    );
    
    // Get message templates
    this.router.get('/templates',
      this.telegramAuth.requireAuth(),
      this.getMessageTemplates.bind(this)
    );
  }
  
  async sendMessage(req, res) {
    try {
      const userId = req.telegramUser.id;
      const { matchId } = req.params;
      const { content, messageType = 'text' } = req.body;
      
      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Message content is required',
            code: 'CONTENT_REQUIRED'
          }
        });
      }
      
      if (!this.isValidUUID(matchId)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid match ID format',
            code: 'INVALID_MATCH_ID'
          }
        });
      }
      
      // Send the message
      const message = await this.messageManager.sendMessage(
        userId,
        matchId,
        content.trim(),
        messageType
      );
      
      this.logger.apiInfo('Message sent successfully', {
        userId,
        matchId,
        messageId: message.id,
        messageType
      });
      
      res.json({
        success: true,
        message: 'Message sent successfully',
        data: message
      });
      
    } catch (error) {
      this.logger.apiError('Send message error', error, req);
      
      if (error.message?.includes('Subscription required')) {
        return res.status(402).json({
          success: false,
          error: {
            message: 'Subscription required to send messages',
            code: 'SUBSCRIPTION_REQUIRED'
          }
        });
      }
      
      this.errorHandler.sendErrorResponse(res, error);
    }
  }
  
  async sendMessageWithAttachment(req, res) {
    try {
      const userId = req.telegramUser.id;
      const { matchId } = req.params;
      const { caption = '' } = req.body;
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'File attachment is required',
            code: 'FILE_REQUIRED'
          }
        });
      }
      
      if (!this.isValidUUID(matchId)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid match ID format',
            code: 'INVALID_MATCH_ID'
          }
        });
      }
      
      // Determine message type based on file
      let messageType = 'document';
      if (req.file.mimetype.startsWith('image/')) {
        messageType = 'image';
      }
      
      // Create file URL
      const fileUrl = `/uploads/messages/${userId}/${req.file.filename}`;
      
      // Prepare message content and metadata
      const content = caption || `[${messageType.toUpperCase()}] ${req.file.originalname}`;
      const metadata = {
        filename: req.file.originalname,
        fileUrl,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      };
      
      // Send the message
      const message = await this.messageManager.sendMessage(
        userId,
        matchId,
        content,
        messageType,
        metadata
      );
      
      this.logger.apiInfo('Message with attachment sent successfully', {
        userId,
        matchId,
        messageId: message.id,
        messageType,
        filename: req.file.originalname
      });
      
      res.json({
        success: true,
        message: 'Message with attachment sent successfully',
        data: message
      });
      
    } catch (error) {
      this.logger.apiError('Send message with attachment error', error, req);
      
      // Clean up uploaded file on error
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          this.logger.error('Failed to clean up uploaded file:', unlinkError);
        }
      }
      
      if (error.message?.includes('Subscription required')) {
        return res.status(402).json({
          success: false,
          error: {
            message: 'Subscription required to send messages',
            code: 'SUBSCRIPTION_REQUIRED'
          }
        });
      }
      
      this.errorHandler.sendErrorResponse(res, error);
    }
  }
  
  async getConversation(req, res) {
    try {
      const userId = req.telegramUser.id;
      const { matchId } = req.params;
      const { 
        limit = 50, 
        offset = 0,
        before // Get messages before this message ID (for pagination)
      } = req.query;
      
      if (!this.isValidUUID(matchId)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid match ID format',
            code: 'INVALID_MATCH_ID'
          }
        });
      }
      
      const messages = await this.messageManager.getConversation(
        userId,
        matchId,
        Math.min(parseInt(limit), 100),
        parseInt(offset)
      );
      
      res.json({
        success: true,
        messages,
        count: messages.length,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: messages.length === parseInt(limit)
        }
      });
      
    } catch (error) {
      this.logger.apiError('Get conversation error', error, req);
      this.errorHandler.sendErrorResponse(res, error);
    }
  }
  
  async getConversations(req, res) {
    try {
      const userId = req.telegramUser.id;
      const { limit = 20 } = req.query;
      
      const conversations = await this.messageManager.getConversations(
        userId,
        Math.min(parseInt(limit), 50)
      );
      
      res.json({
        success: true,
        conversations,
        count: conversations.length
      });
      
    } catch (error) {
      this.logger.apiError('Get conversations error', error, req);
      this.errorHandler.sendErrorResponse(res, error);
    }
  }
  
  async markAsRead(req, res) {
    try {
      const userId = req.telegramUser.id;
      const { matchId } = req.params;
      
      if (!this.isValidUUID(matchId)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid match ID format',
            code: 'INVALID_MATCH_ID'
          }
        });
      }
      
      const markedCount = await this.messageManager.markMessagesAsRead(userId, matchId);
      
      res.json({
        success: true,
        message: 'Messages marked as read',
        markedCount
      });
      
    } catch (error) {
      this.logger.apiError('Mark messages as read error', error, req);
      this.errorHandler.sendErrorResponse(res, error);
    }
  }
  
  async deleteMessage(req, res) {
    try {
      const userId = req.telegramUser.id;
      const { messageId } = req.params;
      
      if (!this.isValidUUID(messageId)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid message ID format',
            code: 'INVALID_MESSAGE_ID'
          }
        });
      }
      
      await this.messageManager.deleteMessage(userId, messageId);
      
      res.json({
        success: true,
        message: 'Message deleted successfully'
      });
      
    } catch (error) {
      this.logger.apiError('Delete message error', error, req);
      this.errorHandler.sendErrorResponse(res, error);
    }
  }
  
  async searchMessages(req, res) {
    try {
      const userId = req.telegramUser.id;
      const { 
        q: searchTerm,
        matchId,
        limit = 50
      } = req.query;
      
      if (!searchTerm || searchTerm.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Search term must be at least 2 characters',
            code: 'SEARCH_TERM_TOO_SHORT'
          }
        });
      }
      
      if (matchId && !this.isValidUUID(matchId)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid match ID format',
            code: 'INVALID_MATCH_ID'
          }
        });
      }
      
      const results = await this.messageManager.searchMessages(
        userId,
        searchTerm.trim(),
        matchId || null,
        Math.min(parseInt(limit), 100)
      );
      
      res.json({
        success: true,
        results,
        count: results.length,
        searchTerm: searchTerm.trim(),
        matchId: matchId || null
      });
      
    } catch (error) {
      this.logger.apiError('Search messages error', error, req);
      this.errorHandler.sendErrorResponse(res, error);
    }
  }
  
  async getMessageStats(req, res) {
    try {
      const userId = req.telegramUser.id;
      
      const stats = await this.messageManager.getMessageStats(userId);
      
      // Get subscription status
      const subscription = await this.subscriptionManager.checkSubscription(userId);
      const canSendMessages = await this.subscriptionManager.canSendMessage(userId);
      
      res.json({
        success: true,
        stats: {
          ...stats,
          canSendMessages,
          subscriptionPlan: subscription?.plan_type || 'free',
          subscriptionExpiry: subscription?.expires_at || null
        }
      });
      
    } catch (error) {
      this.logger.apiError('Get message stats error', error, req);
      this.errorHandler.sendErrorResponse(res, error);
    }
  }
  
  async getMessageTemplates(req, res) {
    try {
      const userId = req.telegramUser.id;
      const { type = 'all' } = req.query;
      
      // Get user profile to customize templates
      const user = await this.userManager.getUser(userId);
      
      const templates = {
        greetings: [
          {
            id: 'greeting_general',
            title: 'General Greeting',
            content: 'Hello! I\'m interested in connecting with you.',
            category: 'greeting'
          },
          {
            id: 'greeting_company',
            title: 'Company Introduction',
            content: user?.account_type === 'company' ? 
              'Hi! I represent a company looking for sales agents. I\'d love to discuss potential opportunities.' :
              'Hello! I\'m a sales professional interested in learning about your products and commission structure.',
            category: 'greeting'
          }
        ],
        business: [
          {
            id: 'commission_inquiry',
            title: 'Commission Structure',
            content: 'Could you share more details about your commission structure and payment terms?',
            category: 'business'
          },
          {
            id: 'meeting_request',
            title: 'Schedule Meeting',
            content: 'Would you like to schedule a call to discuss this opportunity in more detail?',
            category: 'business'
          },
          {
            id: 'follow_up',
            title: 'Follow Up',
            content: 'Thanks for connecting! When would be a good time to discuss next steps?',
            category: 'business'
          }
        ],
        questions: [
          {
            id: 'experience_question',
            title: 'Experience Inquiry',
            content: user?.account_type === 'company' ? 
              'What experience do you have in our industry?' :
              'Can you tell me more about your products and target market?',
            category: 'question'
          },
          {
            id: 'territory_question',
            title: 'Territory Question',
            content: 'What territories or regions do you typically work in?',
            category: 'question'
          }
        ]
      };
      
      const responseTemplates = type === 'all' ? 
        Object.values(templates).flat() :
        templates[type] || [];
      
      res.json({
        success: true,
        templates: responseTemplates,
        categories: Object.keys(templates)
      });
      
    } catch (error) {
      this.logger.apiError('Get message templates error', error, req);
      this.errorHandler.sendErrorResponse(res, error);
    }
  }
  
  // Helper methods
  
  isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}

module.exports = MessagingAPI;