import React from 'react';
import { useTelegram } from '../../hooks/useTelegram';
import './Header.css';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightButton?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ 
  title, 
  showBack = false, 
  onBack,
  rightButton 
}) => {
  const { webApp, hapticFeedback } = useTelegram();

  const handleBack = () => {
    hapticFeedback('selection');
    if (onBack) {
      onBack();
    } else if (webApp) {
      webApp.BackButton.onClick();
    }
  };

  React.useEffect(() => {
    if (webApp) {
      if (showBack) {
        webApp.BackButton.show();
        webApp.BackButton.onClick(handleBack);
      } else {
        webApp.BackButton.hide();
      }
    }

    return () => {
      if (webApp) {
        webApp.BackButton.hide();
      }
    };
  }, [showBack, webApp]);

  return (
    <header className="header">
      <div className="header__content">
        {showBack && (
          <button 
            className="header__back-button"
            onClick={handleBack}
            aria-label="Back"
          >
            ←
          </button>
        )}
        <h1 className="header__title">{title}</h1>
        {rightButton && (
          <div className="header__right">
            {rightButton}
          </div>
        )}
      </div>
    </header>
  );
};


