import React from 'react';
import './Header.css';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  title, 
  showBack = false, 
  onBack 
}) => {
  return (
    <header className="header">
      {showBack && (
        <button className="header__back" onClick={onBack}>
          ←
        </button>
      )}
      <h1 className="header__title">{title}</h1>
    </header>
  );
};
