import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';
import { Header } from '../components/Layout/Header';
import { apiService } from '../services/api';
import { Match } from '../types';
import './MatchesPage.css';

export const MatchesPage: React.FC = () => {
  const navigate = useNavigate();
  const { hapticFeedback } = useTelegram();
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      setIsLoading(true);
      const matchesData = await apiService.getMatches();
      setMatches(matchesData);
    } catch (error) {
      console.error('Failed to load matches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMatchClick = (match: Match) => {
    hapticFeedback('selection');
    navigate(`/messages/${match.id}`);
  };

  if (isLoading) {
    return (
      <div className="matches-page">
        <Header title="Matches" />
        <div className="matches-page__loading">
          <div className="spinner"></div>
          <p>Loading matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="matches-page">
      <Header title="Matches" />
      
      <div className="matches-page__content">
        {matches.length === 0 ? (
          <div className="matches-page__empty">
            <h2>💕 No matches yet</h2>
            <p>Keep swiping to find your perfect match!</p>
            <button 
              className="matches-page__button"
              onClick={() => navigate('/matching')}
            >
              🔍 Start Swiping
            </button>
          </div>
        ) : (
          <div className="matches-page__list">
            {matches.map((match) => (
              <div 
                key={match.id}
                className="matches-page__match"
                onClick={() => handleMatchClick(match)}
              >
                <div className="matches-page__avatar">
                  {match.avatar ? (
                    <img src={match.avatar} alt={match.name} />
                  ) : (
                    <div className="matches-page__avatar-placeholder">
                      {match.name[0]}
                    </div>
                  )}
                </div>
                
                <div className="matches-page__info">
                  <h3>{match.name}</h3>
                  <p>{match.title} at {match.company}</p>
                  <p className="matches-page__time">
                    Matched {new Date(match.matchedAt).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="matches-page__arrow">
                  →
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};