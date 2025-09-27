import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '../../hooks/useTelegram';
import { Header } from '../Layout/Header';
import { apiService } from '../../services/api';
import { Match } from '../../types';
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
      const response = await apiService.getMatches();
      if (response.success && response.data) {
        setMatches(response.data);
      } else {
        // Mock data for demo
        setMatches([
          {
            id: 1,
            userId: 1,
            matchedUserId: 2,
            profile: {
              id: 1,
              userId: 1,
              title: 'Senior Sales Manager',
              description: 'Experienced in B2B sales with focus on enterprise clients.',
              industry: 'Technology',
              location: 'Moscow, Russia',
              experience: 7,
              skills: ['B2B Sales', 'CRM', 'Lead Generation'],
              photos: [],
              documents: [],
              isComplete: true,
              completionScore: 95,
            },
            matchedProfile: {
              id: 2,
              userId: 2,
              title: 'Business Development Director',
              description: 'Strategic business development professional with international experience.',
              industry: 'Finance',
              location: 'St. Petersburg, Russia',
              experience: 10,
              skills: ['Business Development', 'Strategic Planning', 'Partnerships'],
              photos: [],
              documents: [],
              isComplete: true,
              completionScore: 92,
            },
            compatibilityScore: 87,
            createdAt: '2024-09-17T10:30:00Z',
            status: 'active',
          },
          {
            id: 2,
            userId: 1,
            matchedUserId: 3,
            profile: {
              id: 1,
              userId: 1,
              title: 'Senior Sales Manager',
              description: 'Experienced in B2B sales with focus on enterprise clients.',
              industry: 'Technology',
              location: 'Moscow, Russia',
              experience: 7,
              skills: ['B2B Sales', 'CRM', 'Lead Generation'],
              photos: [],
              documents: [],
              isComplete: true,
              completionScore: 95,
            },
            matchedProfile: {
              id: 3,
              userId: 3,
              title: 'Sales Director',
              description: 'Proven track record in building high-performing sales teams.',
              industry: 'Healthcare',
              location: 'Kazan, Russia',
              experience: 8,
              skills: ['Team Leadership', 'Sales Strategy', 'Client Relations'],
              photos: [],
              documents: [],
              isComplete: true,
              completionScore: 88,
            },
            compatibilityScore: 73,
            createdAt: '2024-09-16T15:45:00Z',
            status: 'active',
          },
        ]);
      }
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="matches-page">
        <Header title="Matches" />
        <div className="matches-page__loading">
          <div className="matches-page__spinner"></div>
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
            <div className="matches-page__empty-icon">💕</div>
            <h2>No matches yet</h2>
            <p>Start swiping to find your perfect business match!</p>
            <button 
              className="matches-page__start-button"
              onClick={() => navigate('/matching')}
            >
              Start Matching
            </button>
          </div>
        ) : (
          <>
            <div className="matches-page__header">
              <h2>Your Matches ({matches.length})</h2>
              <p>People who liked you back</p>
            </div>

            <div className="matches-page__list">
              {matches.map((match) => (
                <div 
                  key={match.id}
                  className="matches-page__match"
                  onClick={() => handleMatchClick(match)}
                >
                  <div className="matches-page__match-avatar">
                    {match.matchedProfile.title.charAt(0)}
                  </div>
                  
                  <div className="matches-page__match-info">
                    <div className="matches-page__match-header">
                      <h3>{match.matchedProfile.title}</h3>
                      <span className="matches-page__match-time">
                        {formatDate(match.createdAt)}
                      </span>
                    </div>
                    
                    <p className="matches-page__match-description">
                      {match.matchedProfile.description}
                    </p>
                    
                    <div className="matches-page__match-details">
                      <span className="matches-page__match-industry">
                        {match.matchedProfile.industry}
                      </span>
                      <span className="matches-page__match-location">
                        {match.matchedProfile.location}
                      </span>
                    </div>
                    
                    <div className="matches-page__match-compatibility">
                      <span>Compatibility: {match.compatibilityScore}%</span>
                      <div className="matches-page__compatibility-bar">
                        <div 
                          className="matches-page__compatibility-fill"
                          style={{ width: `${match.compatibilityScore}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="matches-page__match-arrow">
                    →
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};


