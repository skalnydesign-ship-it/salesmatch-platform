import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useContext7 } from '../contexts/Context7Provider';
import { useTelegram } from '../../hooks/useTelegram';
import './AuthPage.css';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const { user: telegramUser, initData, showAlert } = useTelegram();
  const { isConnected: context7Connected, getBestPractices, checkSecurity } = useContext7();
  const [securityTips, setSecurityTips] = useState<string[]>([]);
  const [bestPractices, setBestPractices] = useState<string[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/profile');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (context7Connected) {
      loadContext7Data();
    }
  }, [context7Connected]);

  const loadContext7Data = async () => {
    try {
      // Get React best practices
      const practices = await getBestPractices('react');
      setBestPractices(practices.slice(0, 3)); // Show first 3 practices

      // Check security for authentication code
      const authCode = `
        const handleLogin = async () => {
          if (!initData) {
            showAlert('Telegram authentication data not available');
            return;
          }
          // Authentication logic here
        };
      `;
      
      const securityCheck = await checkSecurity(authCode);
      setSecurityTips(securityCheck.suggestions.slice(0, 2)); // Show first 2 tips
    } catch (error) {
      console.warn('Failed to load Context7 data:', error);
    }
  };

  const handleLogin = async () => {
    try {
      if (!initData) {
        showAlert('Telegram authentication data not available');
        return;
      }

      // Show loading state
      showAlert('Authenticating with Telegram...');

      // Security check with Context7
      if (context7Connected) {
        const loginCode = `
          const handleLogin = async () => {
            try {
              if (!initData) {
                showAlert('Telegram authentication data not available');
                return;
              }
              showAlert('Welcome to SalesMatch Pro!');
              navigate('/profile');
            } catch (error) {
              console.error('Login error:', error);
              showAlert('Login failed. Please try again.');
            }
          };
        `;
        
        const securityCheck = await checkSecurity(loginCode);
        if (securityCheck.issues.length > 0) {
          console.warn('Security issues detected:', securityCheck.issues);
        }
      }

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
          <div className="auth-page__spinner"></div>
          <p>Loading...</p>
          {context7Connected && (
            <div className="auth-page__context7-indicator">
              <span className="context7-badge">Context7 Connected</span>
            </div>
          )}
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
          {context7Connected && (
            <div className="auth-page__context7-status">
              <span className="context7-indicator">🔗 Context7 Active</span>
            </div>
          )}
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

        {/* Context7 Best Practices Display */}
        {context7Connected && bestPractices.length > 0 && (
          <div className="auth-page__context7-tips">
            <h3>💡 Best Practices (Context7)</h3>
            <ul>
              {bestPractices.map((practice, index) => (
                <li key={index}>{practice}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Security Tips */}
        {context7Connected && securityTips.length > 0 && (
          <div className="auth-page__security-tips">
            <h3>🔒 Security Tips (Context7)</h3>
            <ul>
              {securityTips.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </div>
        )}

        <button 
          className="auth-page__button"
          onClick={handleLogin}
          disabled={!initData}
        >
          {initData ? 'Continue with Telegram' : 'Loading...'}
        </button>

        <div className="auth-page__footer">
          <p>By continuing, you agree to our Terms of Service and Privacy Policy</p>
          {context7Connected && (
            <p className="auth-page__context7-footer">
              Powered by Context7 MCP for enhanced development experience
            </p>
          )}
        </div>
      </div>
    </div>
  );
};