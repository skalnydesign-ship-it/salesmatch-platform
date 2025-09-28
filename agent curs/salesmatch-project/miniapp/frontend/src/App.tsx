import React, { useState } from 'react';
import { Context7Provider } from './contexts/Context7Provider';
import { Header } from './components/Header';
import { BottomNavigation } from './components/BottomNavigation';
import { MatchingPage } from './pages/MatchingPage';
import { MatchesPage } from './pages/MatchesPage';
import { MessagesPage } from './pages/MessagesPage';
import { ProfilePage } from './pages/ProfilePage';
import { AuthPage } from './pages/AuthPage';
import './App.css';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('matching');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
      default:
        return <MatchingPage />;
    }
  };

  return (
    <Context7Provider>
      <div className="app">
        <Header title="SalesMatch Pro" />
        
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
    </Context7Provider>
  );
};

export default App;

