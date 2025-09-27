import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, TelegramUser } from '../types';
import { useTelegram } from '../hooks/useTelegram';
import { apiService } from '../services/api';

interface AuthContextType {
  user: User | null;
  telegramUser: TelegramUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (initData: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { telegramUser, initData, isReady } = useTelegram();

  const isAuthenticated = !!user;

  const login = async (initData: string) => {
    try {
      setIsLoading(true);
      const response = await apiService.validateTelegramUser(initData);
      
      if (response.success && response.data) {
        setUser(response.data);
        localStorage.setItem('auth_token', 'mock_token'); // In real app, get from response
        localStorage.setItem('user_data', JSON.stringify(response.data));
      } else {
        throw new Error(response.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user_data', JSON.stringify(updatedUser));
    }
  };

  // Auto-login when Telegram is ready
  useEffect(() => {
    if (isReady && initData && !user) {
      // Check if we have cached user data
      const cachedUser = localStorage.getItem('user_data');
      if (cachedUser) {
        try {
          setUser(JSON.parse(cachedUser));
          setIsLoading(false);
          return;
        } catch (error) {
          console.warn('Failed to parse cached user data:', error);
        }
      }

      // Try to authenticate with Telegram
      login(initData).catch((error) => {
        console.error('Auto-login failed:', error);
        setIsLoading(false);
      });
    } else if (isReady && !initData) {
      // No init data, user not authenticated
      setIsLoading(false);
    }
  }, [isReady, initData, user]);

  const value: AuthContextType = {
    user,
    telegramUser,
    isLoading,
    isAuthenticated,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


