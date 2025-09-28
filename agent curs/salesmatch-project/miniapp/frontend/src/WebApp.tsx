import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Layout/Header';
import { BottomNavigation } from './components/Layout/BottomNavigation';
import { AuthPage } from './pages/AuthPage';
import { ProfilePage } from './pages/ProfilePage';
import { MatchingPage } from './pages/MatchingPage';
import { MatchesPage } from './pages/MatchesPage';
import { MessagesPage } from './pages/MessagesPage';
// import { DemoPage } from './pages/DemoPage';
import './App.css';

// Mock user data for web version
const mockUser = {
  id: 123456789,
  first_name: 'Test',
  last_name: 'User',
  username: 'testuser',
  language_code: 'en',
  is_premium: false,
  allows_write_to_pm: true
};

const WebApp: React.FC = () => {
  const [currentPage, setCurrentPage] = React.useState('matching');
  const [isAuthenticated, setIsAuthenticated] = React.useState(true);

  const handleAuth = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'auth':
        return <AuthPage onAuth={handleAuth} />;
      case 'matching':
        return <MatchingPage />;
      case 'matches':
        return <MatchesPage />;
      case 'messages':
        return <MessagesPage />;
      case 'profile':
        return <ProfilePage onLogout={handleLogout} />;
      case 'demo':
        return <div className="demo-page"><h2>Demo Page</h2><p>Demo functionality coming soon!</p></div>;
      default:
        return <MatchingPage />;
    }
  };

  return (
    <div className="app">
      <Header 
        title="SalesMatch Pro" 
        onBack={() => setCurrentPage('matching')}
        showBack={currentPage !== 'matching' && currentPage !== 'auth'}
      />
      
      <main className="app-main">
        {!isAuthenticated ? (
          <AuthPage onAuth={handleAuth} />
        ) : (
          <>
            {renderPage()}
            <BottomNavigation 
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </main>
    </div>
  );
};

export default WebApp;
