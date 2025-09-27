const Joi = require('joi');
const { ValidationError } = require('./errorHandler');

class Validator {
  constructor() {
    this.schemas = this.initializeSchemas();
  }

  initializeSchemas() {
    return {
      // User schemas
      userRegistration: Joi.object({
        telegramId: Joi.number().integer().required(),
        username: Joi.string().alphanum().min(3).max(30).allow(null),
        language: Joi.string().valid(
          'en', 'ru', 'hi', 'fa', 'zh', 'ar', 'es', 'fr', 'de', 'pt', 
          'it', 'ja', 'ko', 'tr', 'pl'
        ).default('en'),
        accountType: Joi.string().valid('company', 'agent').required()
      }),

      userUpdate: Joi.object({
        username: Joi.string().alphanum().min(3).max(30).allow(null),
        language: Joi.string().valid(
          'en', 'ru', 'hi', 'fa', 'zh', 'ar', 'es', 'fr', 'de', 'pt', 
          'it', 'ja', 'ko', 'tr', 'pl'
        )
      }),

      // Company profile schemas
      companyProfile: Joi.object({
        companyName: Joi.string().min(2).max(200).required(),
        country: Joi.string().min(2).max(100).required(),
        website: Joi.string().uri().allow(null),
        description: Joi.object().default({}),
        photos: Joi.array().items(Joi.string().uri()).max(10).default([]),
        industries: Joi.array().items(Joi.string()).max(20).default([]),
        commissionStructure: Joi.object({
          type: Joi.string().valid('percentage', 'fixed', 'tiered'),
          rate: Joi.number().min(0).max(100),
          details: Joi.string().max(1000)
        }).default({}),
        escrowAvailable: Joi.boolean().default(false),
        documents: Joi.object({
          presentations: Joi.array().items(Joi.string()).default([]),
          priceLists: Joi.array().items(Joi.string()).default([]),
          certificates: Joi.array().items(Joi.string()).default([]),
          contracts: Joi.array().items(Joi.string()).default([]),
          marketing: Joi.array().items(Joi.string()).default([])
        }).default({})
      }),

      // Agent profile schemas
      agentProfile: Joi.object({
        fullName: Joi.string().min(2).max(200).required(),
        countries: Joi.array().items(Joi.string()).min(1).max(50).required(),
        languages: Joi.array().items(Joi.string()).min(1).max(20).required(),
        experienceYears: Joi.number().integer().min(0).max(50).default(0),
        specializations: Joi.array().items(Joi.string()).max(30).default([]),
        portfolio: Joi.string().max(5000).allow('')
      }),

      // Swipe schemas
      swipeRequest: Joi.object({
        targetUserId: Joi.number().integer().required(),
        action: Joi.string().valid('like', 'pass').required()
      }),

      swipeFilters: Joi.object({
        country: Joi.string().max(100),
        industries: Joi.array().items(Joi.string()),
        languages: Joi.array().items(Joi.string()),
        experienceMin: Joi.number().integer().min(0),
        experienceMax: Joi.number().integer().max(50),
        ratingMin: Joi.number().min(0).max(5)
      }),

      // Message schemas
      messageCreate: Joi.object({
        matchId: Joi.string().uuid().required(),
        content: Joi.string().min(1).max(2000).required(),
        messageType: Joi.string().valid('text', 'image', 'document').default('text')
      }),

      // Review schemas
      reviewCreate: Joi.object({
        targetId: Joi.number().integer().required(),
        rating: Joi.number().integer().min(1).max(5).required(),
        comment: Joi.string().max(1000).required()
      }),

      reviewReply: Joi.object({
        reply: Joi.string().max(500).required()
      }),

      // Subscription schemas
      subscriptionCreate: Joi.object({
        planType: Joi.string().valid('pro', 'business').required()
      }),

      // AI schemas
      aiProfileSuggestion: Joi.object({
        profileData: Joi.object().required(),
        requestType: Joi.string().valid('optimization', 'completion', 'enhancement').required()
      }),

      aiMessageTemplate: Joi.object({
        matchId: Joi.string().uuid().required(),
        templateType: Joi.string().valid('introduction', 'follow_up', 'negotiation').required()
      }),

      // File upload schemas
      fileUpload: Joi.object({
        filename: Joi.string().max(255).required(),
        mimetype: Joi.string().valid(
          'image/jpeg', 'image/png', 'image/webp',
          'application/pdf', 'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ).required(),
        size: Joi.number().max(10485760) // 10MB
      }),

      // Pagination schemas
      pagination: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20),
        sortBy: Joi.string().default('created_at'),
        sortOrder: Joi.string().valid('asc', 'desc').default('desc')
      })
    };
  }

  // Main validation method
  validate(data, schemaName, options = {}) {
    const schema = this.schemas[schemaName];
    if (!schema) {
      throw new ValidationError(`Schema '${schemaName}' not found`, 'SCHEMA_NOT_FOUND');
    }

    const { error, value } = schema.validate(data, {
      allowUnknown: false,
      stripUnknown: true,
      abortEarly: false,
      ...options
    });

    if (error) {
      const message = error.details.map(detail => detail.message).join(', ');
      throw new ValidationError(message, 'VALIDATION_FAILED');
    }

    return value;
  }

  // Express middleware for validation
  middleware(schemaName, source = 'body') {
    return (req, res, next) => {
      try {
        const data = source === 'body' ? req.body : 
                    source === 'query' ? req.query :
                    source === 'params' ? req.params : req[source];

        const validated = this.validate(data, schemaName);
        
        // Replace the source data with validated data
        req[source] = validated;
        next();
      } catch (error) {
        next(error);
      }
    };
  }

  // Sanitize HTML content
  sanitizeHtml(content) {
    if (!content || typeof content !== 'string') return content;
    
    // Basic HTML sanitization - remove script tags and dangerous attributes
    return content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }

  // Validate and sanitize user input
  sanitizeInput(input) {
    if (typeof input === 'string') {
      return this.sanitizeHtml(input);
    }
    
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }
    
    if (typeof input === 'object' && input !== null) {
      const sanitized = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    
    return input;
  }

  // Custom validation rules
  addCustomValidation(name, rule) {
    Joi.extend({
      type: 'custom',
      base: Joi.any(),
      messages: {
        'custom.invalid': `${name} validation failed`
      },
      rules: {
        [name]: {
          validate(value, helpers) {
            if (!rule(value)) {
              return helpers.error('custom.invalid');
            }
            return value;
          }
        }
      }
    });
  }

  // Validate Telegram WebApp init data
  validateTelegramInitData(initData) {
    const schema = Joi.object({
      user: Joi.object({
        id: Joi.number().integer().required(),
        first_name: Joi.string().required(),
        last_name: Joi.string().allow(''),
        username: Joi.string().allow(''),
        language_code: Joi.string().allow('')
      }).required(),
      auth_date: Joi.number().integer().required(),
      hash: Joi.string().required()
    });

    return this.validate(initData, schema);
  }

  // Validate file upload
  validateFileUpload(file) {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/webp',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.mimetype)) {
      throw new ValidationError('File type not allowed', 'INVALID_FILE_TYPE');
    }

    if (file.size > maxSize) {
      throw new ValidationError('File size too large', 'FILE_TOO_LARGE');
    }

    return true;
  }

  // Validate URL
  validateUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      throw new ValidationError('Invalid URL format', 'INVALID_URL');
    }
  }

  // Validate email
  validateEmail(email) {
    const schema = Joi.string().email();
    const { error } = schema.validate(email);
    
    if (error) {
      throw new ValidationError('Invalid email format', 'INVALID_EMAIL');
    }
    
    return true;
  }

  // Validate phone number (basic)
  validatePhone(phone) {
    const schema = Joi.string().pattern(/^\+?[1-9]\d{1,14}$/);
    const { error } = schema.validate(phone);
    
    if (error) {
      throw new ValidationError('Invalid phone format', 'INVALID_PHONE');
    }
    
    return true;
  }

  // Get schema for external use
  getSchema(schemaName) {
    return this.schemas[schemaName];
  }
}

module.exports = new Validator();