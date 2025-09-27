// Core types for SalesMatch Mini App
export interface User {
  id: number;
  telegramId: number;
  firstName: string;
  lastName?: string;
  username?: string;
  language: string;
  isAgent: boolean;
  isCompany: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  id: number;
  userId: number;
  title: string;
  description: string;
  industry: string;
  location: string;
  experience: number;
  skills: string[];
  photos: string[];
  documents: Document[];
  isComplete: boolean;
  completionScore: number;
}

export interface Document {
  id: string;
  category: string;
  url: string;
  name: string;
  uploadedAt: string;
}

export interface Match {
  id: number;
  userId: number;
  matchedUserId: number;
  profile: Profile;
  matchedProfile: Profile;
  compatibilityScore: number;
  createdAt: string;
  status: 'active' | 'archived' | 'blocked';
}

export interface Message {
  id: number;
  matchId: number;
  senderId: number;
  content: string;
  type: 'text' | 'image' | 'document';
  createdAt: string;
  readAt?: string;
}

export interface Conversation {
  matchId: number;
  profile: Profile;
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
}

export interface Subscription {
  id: number;
  userId: number;
  plan: 'free' | 'pro' | 'business';
  status: 'active' | 'cancelled' | 'expired';
  startDate: string;
  endDate?: string;
  features: {
    messaging: boolean;
    aiRequests: number;
    reviews: boolean;
    priorityMatching: boolean;
    analytics: boolean;
  };
}

export interface SwipeProfile {
  id: number;
  profile: Profile;
  distance: number;
  compatibilityScore: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

export interface TelegramInitData {
  user: TelegramUser;
  auth_date: number;
  hash: string;
}


