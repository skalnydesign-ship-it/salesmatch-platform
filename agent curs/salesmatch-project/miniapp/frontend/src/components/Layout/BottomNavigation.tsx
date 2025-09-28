import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTelegram } from '../../hooks/useTelegram';
import './BottomNavigation.css';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}

const navItems: NavItem[] = [
  { id: 'matching', label: 'Поиск', icon: '🔍', path: '/matching' },
  { id: 'matches', label: 'Матчи', icon: '💕', path: '/matches' },
  { id: 'messages', label: 'Чаты', icon: '💬', path: '/messages' },
  { id: 'profile', label: 'Профиль', icon: '👤', path: '/profile' },
];

interface BottomNavigationProps {
  currentPage?: string;
  onPageChange?: (page: string) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ 
  currentPage, 
  onPageChange 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { hapticFeedback } = useTelegram();

  const handleNavClick = (item: NavItem) => {
    hapticFeedback('selection');
    
    if (onPageChange) {
      onPageChange(item.id);
    } else {
      navigate(item.path);
    }
  };

  const activePage = currentPage || location.pathname.replace('/', '') || 'matching';

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const isActive = activePage === item.id || 
                        (item.path === '/matching' && location.pathname === '/');
        
        return (
          <button
            key={item.id}
            className={`bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`}
            onClick={() => handleNavClick(item)}
            aria-label={item.label}
          >
            <span className="bottom-nav__icon">{item.icon}</span>
            <span className="bottom-nav__label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};


