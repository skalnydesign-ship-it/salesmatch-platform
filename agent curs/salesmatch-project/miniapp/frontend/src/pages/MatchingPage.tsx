import React, { useState } from 'react';
import { useContext7 } from '../contexts/Context7Provider';
import './MatchingPage.css';

const mockProfiles = [
  {
    id: 1,
    name: 'John Smith',
    title: 'Senior Sales Manager',
    company: 'TechCorp Inc.',
    bio: 'Looking for B2B partners in fintech sector. 10+ years experience in enterprise sales.',
    image: '👨‍💼'
  },
  {
    id: 2,
    name: 'Sarah Johnson',
    title: 'Business Development Director',
    company: 'InnovateLab',
    bio: 'Specialized in SaaS solutions and digital transformation. Seeking strategic partnerships.',
    image: '👩‍💼'
  },
  {
    id: 3,
    name: 'Mike Chen',
    title: 'VP of Sales',
    company: 'DataFlow Systems',
    bio: 'Expert in AI and machine learning solutions. Looking for enterprise clients.',
    image: '👨‍💻'
  }
];

export const MatchingPage: React.FC = () => {
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [likedProfiles, setLikedProfiles] = useState<number[]>([]);
  const { getCodeSuggestions, analyzeCode } = useContext7();

  const currentProfile = mockProfiles[currentProfileIndex];

  const handleLike = async () => {
    if (currentProfile) {
      setLikedProfiles([...likedProfiles, currentProfile.id]);
      
      // Use Context7 to analyze the interaction
      await analyzeCode(`User liked profile: ${currentProfile.name}`);
      
      // Move to next profile
      if (currentProfileIndex < mockProfiles.length - 1) {
        setCurrentProfileIndex(currentProfileIndex + 1);
      } else {
        setCurrentProfileIndex(0);
      }
    }
  };

  const handlePass = () => {
    if (currentProfileIndex < mockProfiles.length - 1) {
      setCurrentProfileIndex(currentProfileIndex + 1);
    } else {
      setCurrentProfileIndex(0);
    }
  };

  if (!currentProfile) {
    return (
      <div className="matching-page">
        <div className="matching-page__empty">
          <h2>🎉 All profiles reviewed!</h2>
          <p>Check your matches in the Matches tab.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="matching-page">
      <div className="matching-page__card">
        <div className="matching-page__image">
          {currentProfile.image}
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
          className="matching-page__pass"
          onClick={handlePass}
        >
          ❌ Pass
        </button>
        <button 
          className="matching-page__like"
          onClick={handleLike}
        >
          🤝 Like
        </button>
      </div>

      <div className="matching-page__stats">
        <p>Liked: {likedProfiles.length} profiles</p>
        <p>Remaining: {mockProfiles.length - currentProfileIndex - 1}</p>
      </div>
    </div>
  );
};