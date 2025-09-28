import React, { useState } from 'react';
import { useContext7 } from '../contexts/Context7Provider';
import { AnimatedCard } from '../components/animations/AnimatedCard';
import { AnimatedButton } from '../components/animations/AnimatedButton';
import { AnimatedText } from '../components/animations/AnimatedText';
import { LoadingSpinner } from '../components/animations/LoadingSpinner';
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
  const [isLoading, setIsLoading] = useState(false);
  const { getCodeSuggestions, analyzeCode } = useContext7();

  const currentProfile = mockProfiles[currentProfileIndex];

  const handleLike = async () => {
    if (currentProfile) {
      setIsLoading(true);
      setLikedProfiles([...likedProfiles, currentProfile.id]);
      
      // Use Context7 to analyze the interaction
      await analyzeCode(`User liked profile: ${currentProfile.name}`);
      
      // Simulate loading delay for better UX
      setTimeout(() => {
        setIsLoading(false);
        // Move to next profile
        if (currentProfileIndex < mockProfiles.length - 1) {
          setCurrentProfileIndex(currentProfileIndex + 1);
        } else {
          setCurrentProfileIndex(0);
        }
      }, 1000);
    }
  };

  const handlePass = () => {
    if (currentProfileIndex < mockProfiles.length - 1) {
      setCurrentProfileIndex(currentProfileIndex + 1);
    } else {
      setCurrentProfileIndex(0);
    }
  };

  if (isLoading) {
    return (
      <div className="matching-page">
        <div className="matching-page__loading">
          <LoadingSpinner size="lg" color="primary" text="Finding your perfect match..." />
        </div>
      </div>
    );
  }

  if (!currentProfile) {
    return (
      <div className="matching-page">
        <div className="matching-page__empty">
          <AnimatedText 
            text="🎉 All profiles reviewed!" 
            variant="scale"
            className="animated-text--gradient"
          />
          <AnimatedText 
            text="Check your matches in the Matches tab." 
            variant="fadeIn"
            delay={0.5}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="matching-page">
      <AnimatedCard 
        className="matching-page__card"
        delay={0.2}
        direction="up"
      >
        <div className="matching-page__image">
          {currentProfile.image}
        </div>
        <div className="matching-page__info">
          <AnimatedText 
            text={currentProfile.name}
            variant="slideUp"
            className="matching-page__name"
          />
          <AnimatedText 
            text={currentProfile.title}
            variant="slideUp"
            delay={0.1}
            className="matching-page__title"
          />
          <AnimatedText 
            text={currentProfile.company}
            variant="slideUp"
            delay={0.2}
            className="matching-page__company"
          />
          <AnimatedText 
            text={currentProfile.bio}
            variant="fadeIn"
            delay={0.3}
            className="matching-page__bio"
          />
        </div>
      </AnimatedCard>

      <div className="matching-page__actions">
        <AnimatedButton
          variant="danger"
          size="lg"
          onClick={handlePass}
          className="matching-page__pass"
        >
          ❌ Pass
        </AnimatedButton>
        <AnimatedButton
          variant="success"
          size="lg"
          onClick={handleLike}
          className="matching-page__like"
        >
          🤝 Like
        </AnimatedButton>
      </div>

      <div className="matching-page__stats">
        <AnimatedText 
          text={`Liked: ${likedProfiles.length} profiles`}
          variant="fadeIn"
          delay={0.5}
        />
        <AnimatedText 
          text={`Remaining: ${mockProfiles.length - currentProfileIndex - 1}`}
          variant="fadeIn"
          delay={0.6}
        />
      </div>
    </div>
  );
};