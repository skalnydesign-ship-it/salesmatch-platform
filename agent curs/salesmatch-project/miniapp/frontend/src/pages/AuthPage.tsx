import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTelegram } from '../../hooks/useTelegram';
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

      // In a real app, this would call the actual login function
      // For now, we'll simulate a successful login
      showAlert('Welcome to SalesMatch Pro!');
      navigate('/profile');
    } catch (error) {
      console.error('Login error:', error);
      showAlert('Login failed. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="auth-page">
        <div className="auth-page__loading">
          <div className="auth-page__spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-page__content">
        <div className="auth-page__logo">
          <h1>SalesMatch Pro</h1>
          <p>Enterprise B2B Sales Matching Platform</p>
        </div>

        <div className="auth-page__info">
          <h2>Welcome!</h2>
          {telegramUser ? (
            <div className="auth-page__user-info">
              <p>Hello, {telegramUser.first_name}!</p>
              <p>Connect with sales professionals worldwide</p>
            </div>
          ) : (
            <p>Connect with sales professionals worldwide</p>
          )}
        </div>

        <div className="auth-page__features">
          <div className="feature-item">
            <span className="feature-icon">🤝</span>
            <span>Smart Matching</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">💬</span>
            <span>Secure Messaging</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🤖</span>
            <span>AI Assistant</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🌍</span>
            <span>Global Network</span>
          </div>
        </div>

        <button 
          className="auth-page__button"
          onClick={handleLogin}
          disabled={!initData}
        >
          {initData ? 'Continue with Telegram' : 'Loading...'}
        </button>

        <div className="auth-page__footer">
          <p>By continuing, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
};


