import React from 'react';
import { useContext7 } from '../contexts/Context7Provider';
import './AuthPage.css';

interface AuthPageProps {
  onAuth: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuth }) => {
  const { getBestPractices, checkSecurity } = useContext7();

  const handleLogin = async () => {
    // Simulate authentication
    await new Promise(resolve => setTimeout(resolve, 1000));
    onAuth();
  };

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
          >
            🚀 Login to SalesMatch Pro
          </button>
        </div>

        <div className="auth-page__footer">
          <p>Powered by Deep Fon Corporation</p>
        </div>
      </div>
    </div>
  );
};