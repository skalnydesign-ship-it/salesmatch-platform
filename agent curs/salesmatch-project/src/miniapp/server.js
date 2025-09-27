const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const Logger = require('../core/utils/logger');
const ErrorHandler = require('../core/utils/errorHandler');

class MiniAppServer {
  constructor() {
    this.app = express();
    this.server = null;
    this.routes = new Map();
    this.logger = Logger;
    this.errorHandler = ErrorHandler;
    
    this.initializeMiddlewares();
    this.setupRoutes();
  }
  
  initializeMiddlewares() {
    // Security middlewares
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'", 
            "'unsafe-inline'", 
            "https://telegram.org",
            "https://web.telegram.org"
          ],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          connectSrc: ["'self'", "https://api.telegram.org"],
          fontSrc: ["'self'", "https:", "data:"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false
    }));
    
    // CORS configuration
    this.app.use(cors({
      origin: (origin, callback) => {
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
          'https://web.telegram.org',
          'https://telegram.org',
          'http://localhost:3000',
          'http://localhost:3001'
        ];
        
        // Allow requests with no origin (mobile apps, etc.)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'X-Telegram-Init-Data',
        'X-Requested-With'
      ]
    }));
    
    // Rate limiting
    this.app.use('/api/', rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        error: 'Too many requests, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
      },
      handler: (req, res) => {
        this.logger.security('Rate limit exceeded', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          url: req.url
        });
        res.status(429).json({
          error: 'Too many requests, please try again later.',
          code: 'RATE_LIMIT_EXCEEDED'
        });
      }
    }));
    
    // Body parsing
    this.app.use(express.json({ 
      limit: '10mb',
      verify: (req, res, buf) => {
        req.rawBody = buf;
      }
    }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Request logging middleware
    this.app.use((req, res, next) => {
      const start = Date.now();
      
      // Log request
      this.logger.apiInfo(`${req.method} ${req.url}`, req);
      
      // Override res.end to log response
      const originalEnd = res.end;
      res.end = function(chunk, encoding) {
        const duration = Date.now() - start;
        Logger.performance(`API ${req.method} ${req.url}`, duration, {
          status: res.statusCode,
          ip: req.ip
        });
        originalEnd.call(this, chunk, encoding);
      };
      
      next();
    });
    
    // Static files
    this.app.use('/css', express.static(path.join(process.cwd(), 'public', 'css')));
    this.app.use('/js', express.static(path.join(process.cwd(), 'public', 'js')));
    this.app.use('/static', express.static(path.join(process.cwd(), 'public')));
    this.app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  }
  
  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      });
    });
    
    // Database health check
    this.app.get('/health/db', async (req, res) => {
      try {
        const db = require('../database/connection');
        const health = await db.healthCheck();
        res.json(health);
      } catch (error) {
        res.status(503).json({
          status: 'unhealthy',
          error: error.message
        });
      }
    });
    
    // Serve Mini App
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
    });
    
    // Serve app route for Telegram Mini App
    this.app.get('/app', (req, res) => {
      res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
    });
    
    // API routes will be registered here by modules
    this.app.use('/api', (req, res, next) => {
      // Add common headers for API responses
      res.header('X-API-Version', 'v1');
      res.header('X-Powered-By', 'SalesMatch Pro');
      next();
    });
  }
  
  // Non-conflicting route registration
  registerRoute(method, path, ...handlers) {
    const routeKey = `${method.toUpperCase()}:${path}`;
    
    if (this.routes.has(routeKey)) {
      this.logger.warn(`Route ${routeKey} already exists, skipping registration`);
      return false;
    }
    
    try {
      this.routes.set(routeKey, handlers);
      this.app[method.toLowerCase()](path, ...handlers);
      this.logger.info(`Registered route: ${routeKey}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to register route ${routeKey}:`, error);
      return false;
    }
  }
  
  // Modular API versioning
  registerAPIVersion(version, routes) {
    const router = express.Router();
    
    routes.forEach(route => {
      const { method, path, handlers } = route;
      
      if (method === 'use') {
        router.use(path, ...handlers);
      } else {
        router[method](path, ...handlers);
      }
      
      this.logger.info(`Registered API ${version} route: ${method.toUpperCase()} ${path}`);
    });
    
    this.app.use(`/api/${version}`, router);
    this.logger.info(`API version ${version} registered`);
  }
  
  // Setup error handling
  setupErrorHandling() {
    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: {
          message: 'Endpoint not found',
          code: 'NOT_FOUND',
          path: req.originalUrl
        }
      });
    });
    
    // Global error handler
    this.app.use(this.errorHandler.expressErrorHandler());
  }
  
  async start(port = 3000) {
    return new Promise((resolve, reject) => {
      try {
        // Setup error handling before starting
        this.setupErrorHandling();
        
        this.server = this.app.listen(port, () => {
          this.logger.info(`🌐 Mini App Server running on port ${port}`);
          this.logger.info(`📱 WebApp URL: http://localhost:${port}`);
          resolve(this.server);
        });
        
        this.server.on('error', (error) => {
          this.logger.error('Server startup error:', error);
          reject(error);
        });
        
      } catch (error) {
        this.logger.error('Failed to start server:', error);
        reject(error);
      }
    });
  }
  
  async stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          this.logger.info('Mini App Server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
  
  // Get server statistics
  getStats() {
    return {
      registeredRoutes: this.routes.size,
      routes: Array.from(this.routes.keys()),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      env: process.env.NODE_ENV
    };
  }
  
  // Middleware for specific route groups
  addMiddleware(path, middleware) {
    this.app.use(path, middleware);
    this.logger.info(`Added middleware for path: ${path}`);
  }
  
  // Get Express app instance (for testing)
  getApp() {
    return this.app;
  }
}

module.exports = new MiniAppServer();