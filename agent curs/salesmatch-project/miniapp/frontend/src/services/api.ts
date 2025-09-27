import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ApiResponse, User, Profile, Match, Message, Conversation, SwipeProfile, Subscription } from '../types';

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          window.location.href = '/auth';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async validateTelegramUser(initData: string): Promise<ApiResponse<User>> {
    const response = await this.api.post('/api/v1/auth/validate', { initData });
    return response.data;
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    const response = await this.api.get('/api/v1/auth/me');
    return response.data;
  }

  async updateLanguage(language: string): Promise<ApiResponse> {
    const response = await this.api.post('/api/v1/auth/language', { language });
    return response.data;
  }

  // Profile endpoints
  async getProfile(): Promise<ApiResponse<Profile>> {
    const response = await this.api.get('/api/v1/profiles/profile');
    return response.data;
  }

  async updateProfile(profileData: Partial<Profile>): Promise<ApiResponse<Profile>> {
    const response = await this.api.put('/api/v1/profiles/profile', profileData);
    return response.data;
  }

  async uploadPhoto(file: File): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('photo', file);
    
    const response = await this.api.post('/api/v1/profiles/photos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async uploadDocument(file: File, category: string): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('category', category);
    
    const response = await this.api.post('/api/v1/profiles/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  // Matching endpoints
  async getSwipeProfiles(): Promise<ApiResponse<SwipeProfile[]>> {
    const response = await this.api.get('/api/v1/matching/swipe/next');
    return response.data;
  }

  async swipeProfile(profileId: number, action: 'like' | 'pass'): Promise<ApiResponse> {
    const response = await this.api.post('/api/v1/matching/swipe', {
      profileId,
      action,
    });
    return response.data;
  }

  async getMatches(): Promise<ApiResponse<Match[]>> {
    const response = await this.api.get('/api/v1/matching/matches');
    return response.data;
  }

  // Messaging endpoints
  async getConversations(): Promise<ApiResponse<Conversation[]>> {
    const response = await this.api.get('/api/v1/messages/conversations');
    return response.data;
  }

  async getMessages(matchId: number): Promise<ApiResponse<Message[]>> {
    const response = await this.api.get(`/api/v1/messages/${matchId}`);
    return response.data;
  }

  async sendMessage(matchId: number, content: string): Promise<ApiResponse<Message>> {
    const response = await this.api.post(`/api/v1/messages/${matchId}`, {
      content,
    });
    return response.data;
  }

  // Subscription endpoints
  async getSubscription(): Promise<ApiResponse<Subscription>> {
    const response = await this.api.get('/api/v1/subscription');
    return response.data;
  }

  async createSubscription(plan: 'pro' | 'business'): Promise<ApiResponse> {
    const response = await this.api.post('/api/v1/subscription', { plan });
    return response.data;
  }

  // AI endpoints
  async getProfileSuggestions(): Promise<ApiResponse<{ suggestions: string[] }>> {
    const response = await this.api.post('/api/v1/ai/profile-suggestions');
    return response.data;
  }

  async getMessageTemplates(matchId: number): Promise<ApiResponse<{ templates: string[] }>> {
    const response = await this.api.post('/api/v1/ai/message-templates', { matchId });
    return response.data;
  }

  // Analytics
  async trackEvent(event: string, data?: any): Promise<void> {
    try {
      await this.api.post('/api/v1/analytics/events', { event, data });
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  }
}

export const apiService = new ApiService();
export default apiService;


