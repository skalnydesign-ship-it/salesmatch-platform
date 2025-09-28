import React from 'react';
import './BottomNavigation.css';

interface BottomNavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const navItems = [
  { id: 'matching', label: 'Поиск', icon: '🔍' },
  { id: 'matches', label: 'Матчи', icon: '🤝' },
  { id: 'messages', label: 'Чаты', icon: '💬' },
  { id: 'profile', label: 'Профиль', icon: '👤' },
];

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ 
  currentPage, 
  onPageChange 
}) => {
  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const isActive = currentPage === item.id;
        
        return (
          <button
            key={item.id}
            className={`bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`}
            onClick={() => onPageChange(item.id)}
          >
            <span className="bottom-nav__icon">{item.icon}</span>
            <span className="bottom-nav__label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
