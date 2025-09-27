const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const TelegramAuth = require('../../miniapp/auth/TelegramAuth');
const Logger = require('../../core/utils/logger');
const ErrorHandler = require('../../core/utils/errorHandler');
const Validator = require('../../core/utils/validator');

class ProfileAPI {
  constructor(managers) {
    this.profileManager = managers.profile;
    this.userManager = managers.user;
    this.telegramAuth = new TelegramAuth();
    this.logger = Logger;
    this.errorHandler = ErrorHandler;
    this.validator = Validator;
    this.router = express.Router();
    
    this.setupMulter();
    this.setupRoutes();
  }
  
  setupMulter() {
    // Configure multer for file uploads
    const storage = multer.diskStorage({
      destination: async (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'uploads', 'profiles', req.telegramUser.id.toString());
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
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
        files: 10
      },
      fileFilter: (req, file, cb) => {
        try {
          this.validator.validateFileUpload(file);
          cb(null, true);
        } catch (error) {
          cb(error, false);
        }
      }
    });
  }
  
  setupRoutes() {
    // Get current user profile
    this.router.get('/profile',
      this.telegramAuth.requireAuth(),
      this.getProfile.bind(this)
    );
    
    // Create or update profile
    this.router.put('/profile',
      this.telegramAuth.requireAuth(),
      this.updateProfile.bind(this)
    );
    
    // Get profile completion score
    this.router.get('/completion-score',
      this.telegramAuth.requireAuth(),
      this.getCompletionScore.bind(this)
    );
    
    // Upload profile photos
    this.router.post('/photos',
      this.telegramAuth.requireAuth(),
      this.upload.array('photos', 5),
      this.uploadPhotos.bind(this)
    );
    
    // Upload documents (companies only)
    this.router.post('/documents/:category',
      this.telegramAuth.requireAuth(),
      this.upload.single('document'),
      this.uploadDocument.bind(this)
    );
    
    // Delete profile
    this.router.delete('/profile',
      this.telegramAuth.requireAuth(),
      this.deleteProfile.bind(this)
    );
    
    // Get public profile (for viewing other users)
    this.router.get('/public/:userId',
      this.telegramAuth.requireAuth(),
      this.getPublicProfile.bind(this)
    );
    
    // Search profiles
    this.router.get('/search',
      this.telegramAuth.requireAuth(),
      this.searchProfiles.bind(this)
    );
  }
  
  async getProfile(req, res) {
    try {
      const userId = req.telegramUser.id;
      
      // Get user data first to determine account type
      const user = await this.userManager.getUser(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'User not found',
            code: 'USER_NOT_FOUND'
          }
        });
      }
      
      if (!user.account_type) {
        return res.json({
          success: true,
          user: {
            id: user.telegram_id,
            username: user.username,
            language: user.language,
            accountType: null
          },
          profile: null,
          profileComplete: false,
          completionScore: { score: 0, suggestions: ['Select account type first'] }
        });
      }
      
      // Get full profile data
      const fullProfile = await this.profileManager.getFullProfile(userId);
      const completionScore = await this.profileManager.getProfileCompletionScore(
        userId, 
        user.account_type
      );
      
      res.json({
        success: true,
        user: fullProfile.user,
        profile: fullProfile.profile,
        profileComplete: fullProfile.profileComplete,
        completionScore
      });
      
    } catch (error) {
      this.logger.apiError('Get profile error', error, req);
      this.errorHandler.sendErrorResponse(res, error);
    }
  }
  
  async updateProfile(req, res) {
    try {
      const userId = req.telegramUser.id;
      
      // Get user to determine account type
      const user = await this.userManager.getUser(userId);
      
      if (!user || !user.account_type) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Account type must be set before creating profile',
            code: 'ACCOUNT_TYPE_REQUIRED'
          }
        });
      }
      
      // Validate and sanitize input data
      const sanitizedData = this.validator.sanitizeInput(req.body);
      
      let profile;
      if (user.account_type === 'company') {
        profile = await this.profileManager.createCompanyProfile(userId, sanitizedData);
      } else {
        profile = await this.profileManager.createAgentProfile(userId, sanitizedData);
      }
      
      // Get updated completion score
      const completionScore = await this.profileManager.getProfileCompletionScore(
        userId, 
        user.account_type
      );
      
      this.logger.apiInfo('Profile updated successfully', {
        userId,
        accountType: user.account_type,
        completionScore: completionScore.score
      });
      
      res.json({
        success: true,
        message: 'Profile updated successfully',
        profile,
        completionScore
      });
      
    } catch (error) {
      this.logger.apiError('Update profile error', error, req);
      this.errorHandler.sendErrorResponse(res, error);
    }
  }
  
  async getCompletionScore(req, res) {
    try {
      const userId = req.telegramUser.id;
      
      const user = await this.userManager.getUser(userId);
      
      if (!user || !user.account_type) {
        return res.json({
          success: true,
          completionScore: {
            score: 0,
            suggestions: ['Select account type first']
          }
        });
      }
      
      const completionScore = await this.profileManager.getProfileCompletionScore(
        userId, 
        user.account_type
      );
      
      res.json({
        success: true,
        completionScore
      });
      
    } catch (error) {
      this.logger.apiError('Get completion score error', error, req);
      this.errorHandler.sendErrorResponse(res, error);
    }
  }
  
  async uploadPhotos(req, res) {
    try {
      const userId = req.telegramUser.id;
      
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'No photos uploaded',
            code: 'NO_FILES'
          }
        });
      }
      
      // Get current profile
      const user = await this.userManager.getUser(userId);
      if (!user || !user.account_type) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Profile must be created first',
            code: 'PROFILE_REQUIRED'
          }
        });
      }
      
      const profile = await this.profileManager.getProfile(userId, user.account_type);
      
      // Generate photo URLs
      const photoUrls = req.files.map(file => {
        return `/uploads/profiles/${userId}/${file.filename}`;
      });
      
      // Update profile with new photos
      const currentPhotos = (profile?.photos || []);
      const updatedPhotos = [...currentPhotos, ...photoUrls];
      
      let updatedProfile;
      if (user.account_type === 'company') {
        updatedProfile = await this.profileManager.createCompanyProfile(userId, {
          ...profile,
          photos: updatedPhotos
        });
      } else {
        // For agents, photos could be part of portfolio or separate field
        // This would need to be implemented based on agent profile structure
        return res.status(400).json({
          success: false,
          error: {
            message: 'Photo upload not supported for agent profiles yet',
            code: 'NOT_SUPPORTED'
          }
        });
      }
      
      this.logger.apiInfo('Photos uploaded successfully', {
        userId,
        photoCount: req.files.length
      });
      
      res.json({
        success: true,
        message: 'Photos uploaded successfully',
        photos: photoUrls,
        profile: updatedProfile
      });
      
    } catch (error) {
      this.logger.apiError('Upload photos error', error, req);
      
      // Clean up uploaded files on error
      if (req.files) {
        req.files.forEach(async (file) => {
          try {
            await fs.unlink(file.path);
          } catch (unlinkError) {
            this.logger.error('Failed to clean up uploaded file:', unlinkError);
          }
        });
      }
      
      this.errorHandler.sendErrorResponse(res, error);
    }
  }
  
  async uploadDocument(req, res) {
    try {
      const userId = req.telegramUser.id;
      const { category } = req.params;
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'No document uploaded',
            code: 'NO_FILE'
          }
        });
      }
      
      // Verify user has company account
      const user = await this.userManager.getUser(userId);
      if (!user || user.account_type !== 'company') {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Document upload only available for company accounts',
            code: 'COMPANY_ONLY'
          }
        });
      }
      
      const documentUrl = `/uploads/profiles/${userId}/${req.file.filename}`;
      
      const updatedProfile = await this.profileManager.addDocument(
        userId,
        'company',
        category,
        documentUrl,
        {
          filename: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype
        }
      );
      
      this.logger.apiInfo('Document uploaded successfully', {
        userId,
        category,
        filename: req.file.originalname
      });
      
      res.json({
        success: true,
        message: 'Document uploaded successfully',
        document: {
          category,
          url: documentUrl,
          filename: req.file.originalname,
          size: req.file.size
        },
        profile: updatedProfile
      });
      
    } catch (error) {
      this.logger.apiError('Upload document error', error, req);
      
      // Clean up uploaded file on error
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          this.logger.error('Failed to clean up uploaded file:', unlinkError);
        }
      }
      
      this.errorHandler.sendErrorResponse(res, error);
    }
  }
  
  async deleteProfile(req, res) {
    try {
      const userId = req.telegramUser.id;
      
      const user = await this.userManager.getUser(userId);
      if (!user || !user.account_type) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'No profile found to delete',
            code: 'PROFILE_NOT_FOUND'
          }
        });
      }
      
      await this.profileManager.deleteProfile(userId, user.account_type);
      
      this.logger.apiInfo('Profile deleted successfully', {
        userId,
        accountType: user.account_type
      });
      
      res.json({
        success: true,
        message: 'Profile deleted successfully'
      });
      
    } catch (error) {
      this.logger.apiError('Delete profile error', error, req);
      this.errorHandler.sendErrorResponse(res, error);
    }
  }
  
  async getPublicProfile(req, res) {
    try {
      const viewerId = req.telegramUser.id;
      const { userId } = req.params;
      
      if (!userId || isNaN(parseInt(userId))) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid user ID',
            code: 'INVALID_USER_ID'
          }
        });
      }
      
      const targetUserId = parseInt(userId);
      
      // Don't allow viewing own profile through this endpoint
      if (targetUserId === viewerId) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Use /profile endpoint to view your own profile',
            code: 'USE_PROFILE_ENDPOINT'
          }
        });
      }
      
      const fullProfile = await this.profileManager.getFullProfile(targetUserId);
      
      if (!fullProfile.profileComplete) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Profile not found or incomplete',
            code: 'PROFILE_NOT_FOUND'
          }
        });
      }
      
      // Log profile view for analytics
      this.logger.businessInfo('PROFILE_VIEW', 'Profile viewed', {
        viewerId,
        targetUserId
      });
      
      res.json({
        success: true,
        user: {
          id: fullProfile.user.id,
          username: fullProfile.user.username,
          accountType: fullProfile.user.accountType,
          rating: fullProfile.user.rating,
          reviewCount: fullProfile.user.reviewCount
        },
        profile: fullProfile.profile
      });
      
    } catch (error) {
      this.logger.apiError('Get public profile error', error, req);
      this.errorHandler.sendErrorResponse(res, error);
    }
  }
  
  async searchProfiles(req, res) {
    try {
      const userId = req.telegramUser.id;
      const { 
        q: searchTerm,
        type: accountType,
        country,
        industries,
        languages,
        experienceMin,
        experienceMax,
        ratingMin,
        limit = 20
      } = req.query;
      
      // Validate and sanitize query parameters
      const filters = {};
      
      if (country) filters.country = country;
      if (industries) filters.industries = industries.split(',');
      if (languages) filters.languages = languages.split(',');
      if (experienceMin) filters.experienceMin = parseInt(experienceMin);
      if (experienceMax) filters.experienceMax = parseInt(experienceMax);
      if (ratingMin) filters.ratingMin = parseFloat(ratingMin);
      
      // Get user's account type to determine what to search
      const user = await this.userManager.getUser(userId);
      const searchAccountType = accountType || (
        user.account_type === 'company' ? 'agent' : 'company'
      );
      
      const profiles = await this.profileManager.getProfilesForMatching(
        userId,
        user.account_type,
        filters,
        Math.min(parseInt(limit), 50) // Max 50 results
      );
      
      // If search term provided, filter by name/company name
      let filteredProfiles = profiles;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredProfiles = profiles.filter(profile => {
          const searchableText = searchAccountType === 'company' ?
            profile.profile.companyName?.toLowerCase() :
            profile.profile.fullName?.toLowerCase();
          
          return searchableText?.includes(term) || 
                 profile.username?.toLowerCase().includes(term);
        });
      }
      
      res.json({
        success: true,
        profiles: filteredProfiles,
        total: filteredProfiles.length,
        searchTerm,
        filters
      });
      
    } catch (error) {
      this.logger.apiError('Search profiles error', error, req);
      this.errorHandler.sendErrorResponse(res, error);
    }
  }
}

module.exports = ProfileAPI;