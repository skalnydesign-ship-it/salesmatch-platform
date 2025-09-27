const Logger = require('../core/utils/logger');
const ErrorHandler = require('../core/utils/errorHandler');
const Validator = require('../core/utils/validator');

class ProfileManager {
  constructor(db) {
    this.db = db;
    this.logger = Logger;
    this.errorHandler = ErrorHandler;
    this.validator = Validator;
    this.cache = new Map();
  }
  
  // Company Profile Management
  async createCompanyProfile(userId, data) {
    try {
      // Validate company profile data
      const validatedData = this.validator.validate(data, 'companyProfile');
      
      const query = `
        INSERT INTO company_profiles (
          user_id, company_name, country, website, 
          description, photos, industries, 
          commission_structure, escrow_available,
          documents, version, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 1, NOW())
        ON CONFLICT (user_id) DO UPDATE SET
          company_name = EXCLUDED.company_name,
          country = EXCLUDED.country,
          website = EXCLUDED.website,
          description = EXCLUDED.description,
          photos = EXCLUDED.photos,
          industries = EXCLUDED.industries,
          commission_structure = EXCLUDED.commission_structure,
          escrow_available = EXCLUDED.escrow_available,
          documents = EXCLUDED.documents,
          version = company_profiles.version + 1,
          updated_at = NOW()
        RETURNING *
      `;
      
      // Prepare document structure
      const documentStructure = {
        presentations: validatedData.documents?.presentations || [],
        priceLists: validatedData.documents?.priceLists || [],
        certificates: validatedData.documents?.certificates || [],
        contracts: validatedData.documents?.contracts || [],
        marketing: validatedData.documents?.marketing || []
      };
      
      const result = await this.db.query(query, [
        userId,
        validatedData.companyName,
        validatedData.country,
        validatedData.website,
        JSON.stringify(validatedData.description),
        JSON.stringify(validatedData.photos),
        JSON.stringify(validatedData.industries),
        JSON.stringify(validatedData.commissionStructure),
        validatedData.escrowAvailable,
        JSON.stringify(documentStructure)
      ]);
      
      const profile = result.rows[0];
      
      // Update cache
      this.cache.set(`company_${userId}`, profile);
      
      this.logger.businessInfo('PROFILE_MANAGER', 'Company profile created/updated', {
        userId,
        companyName: validatedData.companyName,
        version: profile.version
      });
      
      return this.formatCompanyProfile(profile);
      
    } catch (error) {
      throw this.errorHandler.handleBusinessError(
        error, 
        'PROFILE_MANAGER', 
        'createCompanyProfile'
      );
    }
  }
  
  // Agent Profile Management
  async createAgentProfile(userId, data) {
    try {
      // Validate agent profile data
      const validatedData = this.validator.validate(data, 'agentProfile');
      
      const query = `
        INSERT INTO agent_profiles (
          user_id, full_name, countries, languages,
          experience_years, specializations, 
          portfolio, version, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 1, NOW())
        ON CONFLICT (user_id) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          countries = EXCLUDED.countries,
          languages = EXCLUDED.languages,
          experience_years = EXCLUDED.experience_years,
          specializations = EXCLUDED.specializations,
          portfolio = EXCLUDED.portfolio,
          version = agent_profiles.version + 1,
          updated_at = NOW()
        RETURNING *
      `;
      
      const result = await this.db.query(query, [
        userId,
        validatedData.fullName,
        JSON.stringify(validatedData.countries),
        JSON.stringify(validatedData.languages),
        validatedData.experienceYears,
        JSON.stringify(validatedData.specializations),
        validatedData.portfolio || ''
      ]);
      
      const profile = result.rows[0];
      
      // Update cache
      this.cache.set(`agent_${userId}`, profile);
      
      this.logger.businessInfo('PROFILE_MANAGER', 'Agent profile created/updated', {
        userId,
        fullName: validatedData.fullName,
        version: profile.version
      });
      
      return this.formatAgentProfile(profile);
      
    } catch (error) {
      throw this.errorHandler.handleBusinessError(
        error, 
        'PROFILE_MANAGER', 
        'createAgentProfile'
      );
    }
  }
  
  // Get profile by user ID and type
  async getProfile(userId, type) {
    try {
      const cacheKey = `${type}_${userId}`;
      
      // Check cache first
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached._cached_at < 300000) { // 5 minutes
          return cached;
        }
      }
      
      const table = type === 'company' ? 'company_profiles' : 'agent_profiles';
      const query = `SELECT * FROM ${table} WHERE user_id = $1`;
      
      const result = await this.db.query(query, [userId]);
      
      if (!result.rows[0]) {
        return null;
      }
      
      const profile = result.rows[0];
      profile._cached_at = Date.now();
      
      // Update cache
      this.cache.set(cacheKey, profile);
      
      return type === 'company' ? 
        this.formatCompanyProfile(profile) : 
        this.formatAgentProfile(profile);
        
    } catch (error) {
      throw this.errorHandler.handleBusinessError(
        error, 
        'PROFILE_MANAGER', 
        'getProfile'
      );
    }
  }
  
  // Get profile with user data
  async getFullProfile(userId) {
    try {
      const query = `
        SELECT 
          u.*,
          CASE 
            WHEN u.account_type = 'company' THEN 
              json_build_object(
                'type', 'company',
                'companyName', cp.company_name,
                'country', cp.country,
                'website', cp.website,
                'description', cp.description,
                'photos', cp.photos,
                'industries', cp.industries,
                'commissionStructure', cp.commission_structure,
                'escrowAvailable', cp.escrow_available,
                'documents', cp.documents,
                'version', cp.version,
                'createdAt', cp.created_at,
                'updatedAt', cp.updated_at
              )
            WHEN u.account_type = 'agent' THEN
              json_build_object(
                'type', 'agent',
                'fullName', ap.full_name,
                'countries', ap.countries,
                'languages', ap.languages,
                'experienceYears', ap.experience_years,
                'specializations', ap.specializations,
                'portfolio', ap.portfolio,
                'version', ap.version,
                'createdAt', ap.created_at,
                'updatedAt', ap.updated_at
              )
            ELSE null
          END as profile_data
        FROM users u
        LEFT JOIN company_profiles cp ON u.telegram_id = cp.user_id AND u.account_type = 'company'
        LEFT JOIN agent_profiles ap ON u.telegram_id = ap.user_id AND u.account_type = 'agent'
        WHERE u.telegram_id = $1
      `;
      
      const result = await this.db.query(query, [userId]);
      
      if (!result.rows[0]) {
        throw new ErrorHandler.NotFoundError('User not found');
      }
      
      const user = result.rows[0];
      
      return {
        user: {
          id: user.telegram_id,
          username: user.username,
          language: user.language,
          accountType: user.account_type,
          rating: user.rating,
          reviewCount: user.review_count,
          createdAt: user.created_at,
          updatedAt: user.updated_at
        },
        profile: user.profile_data,
        profileComplete: !!user.profile_data
      };
      
    } catch (error) {
      throw this.errorHandler.handleBusinessError(
        error, 
        'PROFILE_MANAGER', 
        'getFullProfile'
      );
    }
  }
  
  // Get profiles for matching (exclude specific user)
  async getProfilesForMatching(excludeUserId, accountType, filters = {}, limit = 20) {
    try {
      const targetType = accountType === 'company' ? 'agent' : 'company';
      
      let query = `
        SELECT 
          u.telegram_id,
          u.username,
          u.rating,
          u.review_count,
          CASE 
            WHEN u.account_type = 'company' THEN 
              json_build_object(
                'type', 'company',
                'companyName', cp.company_name,
                'country', cp.country,
                'website', cp.website,
                'description', cp.description,
                'photos', cp.photos,
                'industries', cp.industries,
                'commissionStructure', cp.commission_structure,
                'escrowAvailable', cp.escrow_available
              )
            WHEN u.account_type = 'agent' THEN
              json_build_object(
                'type', 'agent',
                'fullName', ap.full_name,
                'countries', ap.countries,
                'languages', ap.languages,
                'experienceYears', ap.experience_years,
                'specializations', ap.specializations,
                'portfolio', ap.portfolio
              )
          END as profile_data
        FROM users u
        LEFT JOIN company_profiles cp ON u.telegram_id = cp.user_id
        LEFT JOIN agent_profiles ap ON u.telegram_id = ap.user_id
        WHERE u.account_type = $1
        AND u.telegram_id != $2
        AND (
          (u.account_type = 'company' AND cp.company_name IS NOT NULL) OR
          (u.account_type = 'agent' AND ap.full_name IS NOT NULL)
        )
      `;
      
      const params = [targetType, excludeUserId];
      let paramIndex = 3;
      
      // Apply filters
      if (filters.country && targetType === 'company') {
        query += ` AND cp.country = $${paramIndex++}`;
        params.push(filters.country);
      }
      
      if (filters.countries && targetType === 'agent') {
        query += ` AND ap.countries::jsonb ?| $${paramIndex++}`;
        params.push(filters.countries);
      }
      
      if (filters.industries && targetType === 'company') {
        query += ` AND cp.industries::jsonb ?| $${paramIndex++}`;
        params.push(filters.industries);
      }
      
      if (filters.languages && targetType === 'agent') {
        query += ` AND ap.languages::jsonb ?| $${paramIndex++}`;
        params.push(filters.languages);
      }
      
      if (filters.experienceMin && targetType === 'agent') {
        query += ` AND ap.experience_years >= $${paramIndex++}`;
        params.push(filters.experienceMin);
      }
      
      if (filters.experienceMax && targetType === 'agent') {
        query += ` AND ap.experience_years <= $${paramIndex++}`;
        params.push(filters.experienceMax);
      }
      
      if (filters.ratingMin) {
        query += ` AND u.rating >= $${paramIndex++}`;
        params.push(filters.ratingMin);
      }
      
      // Randomize for diversity
      query += ` ORDER BY RANDOM() LIMIT $${paramIndex}`;
      params.push(limit);
      
      const result = await this.db.query(query, params);
      
      return result.rows.map(row => ({
        userId: row.telegram_id,
        username: row.username,
        rating: row.rating,
        reviewCount: row.review_count,
        profile: row.profile_data
      }));
      
    } catch (error) {
      throw this.errorHandler.handleBusinessError(
        error, 
        'PROFILE_MANAGER', 
        'getProfilesForMatching'
      );
    }
  }
  
  // Calculate profile completion score
  async getProfileCompletionScore(userId, accountType) {
    try {
      const profile = await this.getProfile(userId, accountType);
      
      if (!profile) {
        return { score: 0, suggestions: ['Create your profile'] };
      }
      
      let score = 0;
      const suggestions = [];
      
      if (accountType === 'company') {
        // Company profile scoring
        if (profile.companyName) score += 20;
        else suggestions.push('Add company name');
        
        if (profile.country) score += 15;
        else suggestions.push('Add country');
        
        if (profile.description && Object.keys(profile.description).length > 0) score += 15;
        else suggestions.push('Add company description');
        
        if (profile.industries && profile.industries.length > 0) score += 15;
        else suggestions.push('Select your industries');
        
        if (profile.photos && profile.photos.length > 0) score += 10;
        else suggestions.push('Upload company photos');
        
        if (profile.website) score += 10;
        else suggestions.push('Add website URL');
        
        if (profile.commissionStructure && Object.keys(profile.commissionStructure).length > 0) score += 10;
        else suggestions.push('Set commission structure');
        
        if (profile.documents && Object.values(profile.documents).some(docs => docs.length > 0)) score += 5;
        else suggestions.push('Upload business documents');
        
      } else {
        // Agent profile scoring
        if (profile.fullName) score += 25;
        else suggestions.push('Add your full name');
        
        if (profile.countries && profile.countries.length > 0) score += 20;
        else suggestions.push('Add countries you work in');
        
        if (profile.languages && profile.languages.length > 0) score += 20;
        else suggestions.push('Add languages you speak');
        
        if (profile.specializations && profile.specializations.length > 0) score += 15;
        else suggestions.push('Add your specializations');
        
        if (profile.experienceYears > 0) score += 10;
        else suggestions.push('Add your experience years');
        
        if (profile.portfolio) score += 10;
        else suggestions.push('Add portfolio/description');
      }
      
      return { score, suggestions };
      
    } catch (error) {
      throw this.errorHandler.handleBusinessError(
        error, 
        'PROFILE_MANAGER', 
        'getProfileCompletionScore'
      );
    }
  }
  
  // Document management
  async addDocument(userId, accountType, category, documentUrl, metadata = {}) {
    try {
      if (accountType !== 'company') {
        throw new ErrorHandler.ValidationError('Documents only supported for company profiles');
      }
      
      const profile = await this.getProfile(userId, 'company');
      if (!profile) {
        throw new ErrorHandler.NotFoundError('Company profile not found');
      }
      
      const validCategories = ['presentations', 'priceLists', 'certificates', 'contracts', 'marketing'];
      if (!validCategories.includes(category)) {
        throw new ErrorHandler.ValidationError('Invalid document category');
      }
      
      // Update documents
      const documents = profile.documents || {};
      if (!documents[category]) {
        documents[category] = [];
      }
      
      documents[category].push({
        url: documentUrl,
        filename: metadata.filename || 'document',
        size: metadata.size || 0,
        uploadedAt: new Date().toISOString(),
        ...metadata
      });
      
      const query = `
        UPDATE company_profiles 
        SET documents = $2, version = version + 1, updated_at = NOW()
        WHERE user_id = $1
        RETURNING *
      `;
      
      const result = await this.db.query(query, [userId, JSON.stringify(documents)]);
      
      // Update cache
      this.cache.delete(`company_${userId}`);
      
      this.logger.businessInfo('PROFILE_MANAGER', 'Document added', {
        userId,
        category,
        filename: metadata.filename
      });
      
      return this.formatCompanyProfile(result.rows[0]);
      
    } catch (error) {
      throw this.errorHandler.handleBusinessError(
        error, 
        'PROFILE_MANAGER', 
        'addDocument'
      );
    }
  }
  
  // Delete profile
  async deleteProfile(userId, accountType) {
    try {
      const table = accountType === 'company' ? 'company_profiles' : 'agent_profiles';
      const query = `DELETE FROM ${table} WHERE user_id = $1 RETURNING *`;
      
      const result = await this.db.query(query, [userId]);
      
      if (!result.rows[0]) {
        throw new ErrorHandler.NotFoundError('Profile not found');
      }
      
      // Clear cache
      this.cache.delete(`${accountType}_${userId}`);
      
      this.logger.businessInfo('PROFILE_MANAGER', 'Profile deleted', {
        userId,
        accountType
      });
      
      return result.rows[0];
      
    } catch (error) {
      throw this.errorHandler.handleBusinessError(
        error, 
        'PROFILE_MANAGER', 
        'deleteProfile'
      );
    }
  }
  
  // Format company profile
  formatCompanyProfile(profile) {
    if (!profile) return null;
    
    return {
      userId: profile.user_id,
      type: 'company',
      companyName: profile.company_name,
      country: profile.country,
      website: profile.website,
      description: typeof profile.description === 'string' ? 
        JSON.parse(profile.description) : profile.description,
      photos: typeof profile.photos === 'string' ? 
        JSON.parse(profile.photos) : profile.photos,
      industries: typeof profile.industries === 'string' ? 
        JSON.parse(profile.industries) : profile.industries,
      commissionStructure: typeof profile.commission_structure === 'string' ? 
        JSON.parse(profile.commission_structure) : profile.commission_structure,
      escrowAvailable: profile.escrow_available,
      documents: typeof profile.documents === 'string' ? 
        JSON.parse(profile.documents) : profile.documents,
      version: profile.version,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at
    };
  }
  
  // Format agent profile
  formatAgentProfile(profile) {
    if (!profile) return null;
    
    return {
      userId: profile.user_id,
      type: 'agent',
      fullName: profile.full_name,
      countries: typeof profile.countries === 'string' ? 
        JSON.parse(profile.countries) : profile.countries,
      languages: typeof profile.languages === 'string' ? 
        JSON.parse(profile.languages) : profile.languages,
      experienceYears: profile.experience_years,
      specializations: typeof profile.specializations === 'string' ? 
        JSON.parse(profile.specializations) : profile.specializations,
      portfolio: profile.portfolio,
      version: profile.version,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at
    };
  }
  
  // Cache management
  invalidateCache(userId, accountType = null) {
    if (accountType) {
      this.cache.delete(`${accountType}_${userId}`);
    } else {
      this.cache.delete(`company_${userId}`);
      this.cache.delete(`agent_${userId}`);
    }
  }
  
  clearCache() {
    this.cache.clear();
  }
}

module.exports = ProfileManager;