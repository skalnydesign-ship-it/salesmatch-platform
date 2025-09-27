import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTelegram } from '../hooks/useTelegram';
import './AuthPage.css';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const { user: telegramUser, initData, showAlert } = useTelegram();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/profile');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async () => {
    try {
      if (!initData) {
        showAlert('Telegram authentication data not available');
        return;
      }

      // Show loading state
      showAlert('Authenticating with Telegram...');

      // Simulate authentication delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // In a real app, this would call the actual login function
      showAlert('🎉 Welcome to SalesMatch Pro!');
      navigate('/profile');
    } catch (error) {
      console.error('Login error:', error);
      showAlert('❌ Login failed. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="auth-page">
        <div className="auth-page__loading">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-page__content">
        <div className="auth-page__header">
          <h1>🚀 SalesMatch Pro</h1>
          <p>B2B Sales Matching Platform</p>
        </div>

        <div className="auth-page__features">
          <h2>✨ Features</h2>
          <ul>
            <li>🔍 Smart Profile Matching</li>
            <li>💬 Real-time Messaging</li>
            <li>📊 Analytics Dashboard</li>
            <li>🤖 AI-Powered Suggestions</li>
          </ul>
        </div>

        <div className="auth-page__login">
          <button 
            className="auth-page__button"
            onClick={handleLogin}
            disabled={!initData}
          >
            {initData ? '🚀 Login with Telegram' : '⏳ Initializing...'}
          </button>
          
          {telegramUser && (
            <div className="auth-page__user-info">
              <p>Welcome, {telegramUser.first_name}!</p>
            </div>
          )}
        </div>

        <div className="auth-page__footer">
          <p>Powered by Deep Fon Corporation</p>
        </div>
      </div>
    </div>
  );
};