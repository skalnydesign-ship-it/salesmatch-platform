import React, { useState, useEffect } from 'react';
import { useTelegram } from '../hooks/useTelegram';
import { Header } from '../components/Layout/Header';
import { apiService } from '../services/api';
import { SwipeProfile } from '../types';
import './MatchingPage.css';

export const MatchingPage: React.FC = () => {
  const { hapticFeedback, showAlert } = useTelegram();
  const [profiles, setProfiles] = useState<SwipeProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      setIsLoading(true);
      const profilesData = await apiService.getSwipeProfiles();
      setProfiles(profilesData);
    } catch (error) {
      console.error('Failed to load profiles:', error);
      showAlert('Failed to load profiles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (currentIndex >= profiles.length) return;

    hapticFeedback('selection');
    
    try {
      const profile = profiles[currentIndex];
      await apiService.swipeProfile(profile.id, direction);
      
      if (direction === 'right') {
        showAlert('🤝 Liked!');
      }
      
      setCurrentIndex(prev => prev + 1);
    } catch (error) {
      console.error('Swipe failed:', error);
      showAlert('Swipe failed');
    }
  };

  const handleLike = () => handleSwipe('right');
  const handlePass = () => handleSwipe('left');

  if (isLoading) {
    return (
      <div className="matching-page">
        <Header title="Find Matches" />
        <div className="matching-page__loading">
          <div className="spinner"></div>
          <p>Loading profiles...</p>
        </div>
      </div>
    );
  }

  if (currentIndex >= profiles.length) {
    return (
      <div className="matching-page">
        <Header title="Find Matches" />
        <div className="matching-page__empty">
          <h2>🎉 All caught up!</h2>
          <p>No more profiles to review right now.</p>
          <button 
            className="matching-page__button"
            onClick={loadProfiles}
          >
            🔄 Refresh
          </button>
        </div>
      </div>
    );
  }

  const currentProfile = profiles[currentIndex];

  return (
    <div className="matching-page">
      <Header title="Find Matches" />
      
      <div className="matching-page__content">
        <div className="matching-page__card">
          <div className="matching-page__image">
            {currentProfile.avatar ? (
              <img src={currentProfile.avatar} alt={currentProfile.name} />
            ) : (
              <div className="matching-page__image-placeholder">
                {currentProfile.name[0]}
              </div>
            )}
          </div>
          
          <div className="matching-page__info">
            <h2>{currentProfile.name}</h2>
            <p className="matching-page__title">{currentProfile.title}</p>
            <p className="matching-page__company">{currentProfile.company}</p>
            <p className="matching-page__bio">{currentProfile.bio}</p>
          </div>
        </div>

        <div className="matching-page__actions">
          <button 
            className="matching-page__button matching-page__button--pass"
            onClick={handlePass}
          >
            ❌ Pass
          </button>
          <button 
            className="matching-page__button matching-page__button--like"
            onClick={handleLike}
          >
            🤝 Like
          </button>
        </div>

        <div className="matching-page__progress">
          <p>{currentIndex + 1} of {profiles.length} profiles</p>
        </div>
      </div>
    </div>
  );
};