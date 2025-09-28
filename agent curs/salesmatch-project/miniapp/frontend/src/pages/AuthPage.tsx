import React from 'react';
import { useContext7 } from '../contexts/Context7Provider';
import { AnimatedButton } from '../components/animations/AnimatedButton';
import { AnimatedText } from '../components/animations/AnimatedText';
import { AnimatedCard } from '../components/animations/AnimatedCard';
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
        <AnimatedCard className="auth-page__header" delay={0.2}>
          <AnimatedText 
            text="🚀 SalesMatch Pro" 
            variant="scale"
            className="animated-text--gradient"
          />
          <AnimatedText 
            text="B2B Sales Matching Platform" 
            variant="fadeIn"
            delay={0.5}
          />
        </AnimatedCard>

        <AnimatedCard className="auth-page__features" delay={0.4}>
          <AnimatedText 
            text="✨ Features" 
            variant="slideUp"
            delay={0.6}
          />
          <ul>
            <li>
              <AnimatedText 
                text="🔍 Smart Profile Matching" 
                variant="slideLeft"
                delay={0.8}
              />
            </li>
            <li>
              <AnimatedText 
                text="💬 Real-time Messaging" 
                variant="slideLeft"
                delay={0.9}
              />
            </li>
            <li>
              <AnimatedText 
                text="📊 Analytics Dashboard" 
                variant="slideLeft"
                delay={1.0}
              />
            </li>
            <li>
              <AnimatedText 
                text="🤖 AI-Powered Suggestions" 
                variant="slideLeft"
                delay={1.1}
              />
            </li>
          </ul>
        </AnimatedCard>

        <div className="auth-page__login">
          <AnimatedButton
            variant="primary"
            size="lg"
            onClick={handleLogin}
            className="auth-page__button"
          >
            🚀 Login to SalesMatch Pro
          </AnimatedButton>
        </div>

        <div className="auth-page__footer">
          <AnimatedText 
            text="Powered by Deep Fon Corporation" 
            variant="fadeIn"
            delay={1.5}
          />
        </div>
      </div>
    </div>
  );
};