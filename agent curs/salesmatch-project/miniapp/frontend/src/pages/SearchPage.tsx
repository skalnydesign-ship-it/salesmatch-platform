import React from 'react';
import './MatchingPage.css';

export const SearchPage: React.FC = () => {
  const selectFilter = (value: 'all' | 'company' | 'agent') => {
    try {
      localStorage.setItem('matchingFilter', value);
    } catch {}
    window.dispatchEvent(new CustomEvent('goToMatching'));
  };

  return (
    <div className="matching-page">
      <div className="matching-page__question">
        <span className="matching-page__question-label">Кого ищем?</span>
        <div className="matching-page__question-actions">
          <button 
            className="matching-page__question-btn"
            onClick={() => selectFilter('agent')}
          >
            🧑‍💼 Агенты
          </button>
          <button 
            className="matching-page__question-btn"
            onClick={() => selectFilter('company')}
          >
            🏢 Компании
          </button>
          <button 
            className="matching-page__question-btn"
            onClick={() => selectFilter('all')}
          >
            🔎 Все
          </button>
        </div>
      </div>
    </div>
  );
};


