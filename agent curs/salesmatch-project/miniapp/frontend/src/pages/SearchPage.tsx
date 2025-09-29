import React from 'react';
import './MatchingPage.css';
import { AnimatedButton } from '../components/animations/AnimatedButton';

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
        <div className="matching-page__question-actions matching-page__question-actions--vertical">
          <AnimatedButton
            variant="primary"
            size="md"
            className="matching-page__write"
            onClick={() => selectFilter('agent')}
          >
            🧑‍💼 Агенты
          </AnimatedButton>
          <AnimatedButton
            variant="success"
            size="md"
            className="matching-page__like"
            onClick={() => selectFilter('company')}
          >
            🏢 Компании
          </AnimatedButton>
          <AnimatedButton
            variant="danger"
            size="md"
            className="matching-page__pass"
            onClick={() => selectFilter('all')}
          >
            🔎 Все
          </AnimatedButton>
        </div>
      </div>
    </div>
  );
};


