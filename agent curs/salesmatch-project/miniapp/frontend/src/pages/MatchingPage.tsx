import React, { useState, useEffect } from 'react';
import { useContext7 } from '../contexts/Context7Provider';
import { useTelegram } from '../../hooks/useTelegram';
import { Header } from '../Layout/Header';
import { apiService } from '../../services/api';
import { SwipeProfile } from '../../types';
import './MatchingPage.css';

export const MatchingPage: React.FC = () => {
  const { hapticFeedback, showAlert } = useTelegram();
  const { 
    isConnected: context7Connected, 
    getCodeSuggestions, 
    getBestPractices, 
    checkSecurity 
  } = useContext7();
  
  const [profiles, setProfiles] = useState<SwipeProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwipeInProgress, setIsSwipeInProgress] = useState(false);
  const [codeSuggestions, setCodeSuggestions] = useState<string[]>([]);
  const [bestPractices, setBestPractices] = useState<string[]>([]);

  useEffect(() => {
    loadProfiles();
  }, []);

  useEffect(() => {
    if (context7Connected) {
      loadContext7Data();
    }
  }, [context7Connected]);

  const loadContext7Data = async () => {
    try {
      // Get React best practices for interactive components
      const practices = await getBestPractices('react');
      setBestPractices(practices.slice(0, 3));

      // Get code suggestions for swipe handling
      const suggestions = await getCodeSuggestions('swipe gesture handling performance optimization');
      setCodeSuggestions(suggestions);
    } catch (error) {
      console.warn('Failed to load Context7 data:', error);
    }
  };

  const loadProfiles = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getSwipeProfiles();
      if (response.success && response.data) {
        setProfiles(response.data);
      } else {
        // Mock data for demo
        setProfiles([
          {
            id: 1,
            profile: {
              id: 1,
              userId: 1,
              title: 'Senior Sales Manager',
              description: 'Experienced in B2B sales with focus on enterprise clients. Proven track record of exceeding targets.',
              industry: 'Technology',
              location: 'Moscow, Russia',
              experience: 7,
              skills: ['B2B Sales', 'CRM', 'Lead Generation', 'Negotiation', 'Account Management'],
              photos: [],
              documents: [],
              isComplete: true,
              completionScore: 95,
            },
            distance: 5.2,
            compatibilityScore: 87,
          },
          {
            id: 2,
            profile: {
              id: 2,
              userId: 2,
              title: 'Business Development Director',
              description: 'Strategic business development professional with international experience.',
              industry: 'Finance',
              location: 'St. Petersburg, Russia',
              experience: 10,
              skills: ['Business Development', 'Strategic Planning', 'Partnerships', 'International Sales'],
              photos: [],
              documents: [],
              isComplete: true,
              completionScore: 92,
            },
            distance: 12.8,
            compatibilityScore: 73,
          },
        ]);
      }
    } catch (error) {
      console.error('Failed to load profiles:', error);
      showAlert('Failed to load profiles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwipe = async (action: 'like' | 'pass') => {
    if (isSwipeInProgress || currentIndex >= profiles.length) return;

    setIsSwipeInProgress(true);
    hapticFeedback('impact');

    try {
      // Security check with Context7
      if (context7Connected) {
        const swipeCode = `
          const handleSwipe = async (action) => {
            if (isSwipeInProgress || currentIndex >= profiles.length) return;
            setIsSwipeInProgress(true);
            hapticFeedback('impact');
            try {
              const response = await apiService.swipeProfile(profiles[currentIndex].id, action);
              if (response.success) {
                if (action === 'like') {
                  showAlert('Liked! 🎉');
                }
                setCurrentIndex(prev => prev + 1);
              }
            } catch (error) {
              console.error('Swipe error:', error);
              showAlert('Failed to process swipe');
            } finally {
              setIsSwipeInProgress(false);
            }
          };
        `;
        
        const securityCheck = await checkSecurity(swipeCode);
        if (securityCheck.issues.length > 0) {
          console.warn('Security issues detected:', securityCheck.issues);
        }
      }

      const response = await apiService.swipeProfile(profiles[currentIndex].id, action);
      if (response.success) {
        if (action === 'like') {
          showAlert('Liked! 🎉');
        }
        setCurrentIndex(prev => prev + 1);
      } else {
        showAlert('Failed to process swipe');
      }
    } catch (error) {
      console.error('Swipe error:', error);
      showAlert('Failed to process swipe');
    } finally {
      setIsSwipeInProgress(false);
    }
  };

  const handleLike = () => handleSwipe('like');
  const handlePass = () => handleSwipe('pass');

  if (isLoading) {
    return (
      <div className="matching-page">
        <Header title="Find Matches" />
        <div className="matching-page__loading">
          <div className="matching-page__spinner"></div>
          <p>Finding profiles for you...</p>
          {context7Connected && (
            <div className="matching-page__context7-indicator">
              <span className="context7-badge">Context7 Optimizing Swipe Performance</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (currentIndex >= profiles.length) {
    return (
      <div className="matching-page">
        <Header title="Find Matches" />
        <div className="matching-page__empty">
          <div className="matching-page__empty-icon">🎉</div>
          <h2>No more profiles!</h2>
          <p>You've seen all available profiles. Check back later for new matches.</p>
          <button 
            className="matching-page__refresh-button"
            onClick={() => {
              setCurrentIndex(0);
              loadProfiles();
            }}
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  const currentProfile = profiles[currentIndex];

  return (
    <div className="matching-page">
      <Header title="Find Matches" />
      
      {/* Context7 Code Suggestions */}
      {context7Connected && codeSuggestions.length > 0 && (
        <div className="matching-page__context7-suggestions">
          <h3>💡 Performance Suggestions (Context7)</h3>
          <ul>
            {codeSuggestions.map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="matching-page__content">
        <div className="matching-page__card">
          <div className="matching-page__card-header">
            <div className="matching-page__avatar">
              {currentProfile.profile.title.charAt(0)}
            </div>
            <div className="matching-page__info">
              <h3>{currentProfile.profile.title}</h3>
              <p>{currentProfile.profile.industry} • {currentProfile.profile.location}</p>
              <div className="matching-page__compatibility">
                <span>Compatibility: {currentProfile.compatibilityScore}%</span>
                <div className="matching-page__compatibility-bar">
                  <div 
                    className="matching-page__compatibility-fill"
                    style={{ width: `${currentProfile.compatibilityScore}%` }}
                  ></div>
                </div>
              </div>
              {context7Connected && (
                <div className="matching-page__context7-status">
                  <span className="context7-indicator">🔗 Context7 Active</span>
                </div>
              )}
            </div>
          </div>

          <div className="matching-page__card-body">
            <p className="matching-page__description">
              {currentProfile.profile.description}
            </p>
            
            <div className="matching-page__details">
              <div className="matching-page__detail">
                <span className="matching-page__detail-label">Experience:</span>
                <span className="matching-page__detail-value">{currentProfile.profile.experience} years</span>
              </div>
              <div className="matching-page__detail">
                <span className="matching-page__detail-label">Distance:</span>
                <span className="matching-page__detail-value">{currentProfile.distance} km</span>
              </div>
            </div>

            <div className="matching-page__skills">
              <h4>Skills:</h4>
              <div className="matching-page__skills-list">
                {currentProfile.profile.skills.map((skill, index) => (
                  <span key={index} className="matching-page__skill-tag">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="matching-page__actions">
          <button 
            className="matching-page__pass-button"
            onClick={handlePass}
            disabled={isSwipeInProgress}
          >
            ✕ Pass
          </button>
          <button 
            className="matching-page__like-button"
            onClick={handleLike}
            disabled={isSwipeInProgress}
          >
            ♥ Like
          </button>
        </div>

        <div className="matching-page__progress">
          <span>{currentIndex + 1} of {profiles.length}</span>
        </div>

        {/* Context7 Best Practices */}
        {context7Connected && bestPractices.length > 0 && (
          <div className="matching-page__context7-practices">
            <h3>📚 Best Practices (Context7)</h3>
            <ul>
              {bestPractices.map((practice, index) => (
                <li key={index}>{practice}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};