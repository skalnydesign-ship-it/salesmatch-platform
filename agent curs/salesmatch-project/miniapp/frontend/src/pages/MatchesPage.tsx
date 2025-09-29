import React, { useState, useEffect } from 'react';
import { useContext7 } from '../contexts/Context7Provider';
import { AnimatedCard } from '../components/animations/AnimatedCard';
import { AnimatedText } from '../components/animations/AnimatedText';
import './MatchesPage.css';

const mockMatches = [
  {
    id: 1,
    name: 'John Smith',
    title: 'Senior Sales Manager',
    company: 'TechCorp Inc.',
    image: '👨‍💼',
    matchScore: 95,
    lastMessage: 'Hi! Interested in discussing partnership opportunities?',
    timestamp: '2 hours ago'
  },
  {
    id: 2,
    name: 'Sarah Johnson',
    title: 'Business Development Director',
    company: 'InnovateLab',
    image: '👩‍💼',
    matchScore: 88,
    lastMessage: 'Let\'s schedule a call this week',
    timestamp: '1 day ago'
  }
];

export const MatchesPage: React.FC = () => {
  const [matches, setMatches] = useState(mockMatches);
  const { getBestPractices, checkSecurity } = useContext7();

  useEffect(() => {
    // Use Context7 to analyze matches
    const analyzeMatches = async () => {
      const practices = await getBestPractices();
      const security = await checkSecurity();
      console.log('Best practices for matches:', practices);
      console.log('Security analysis:', security);
    };
    
    analyzeMatches();
  }, [getBestPractices, checkSecurity]);

  return (
    <div className="matches-page">
      <div className="matches-page__header">
        <AnimatedText 
          text="🤝 Ваши совпадения" 
          variant="slideUp"
          className="animated-text--gradient"
        />
        <AnimatedText 
          text="Люди, которым вы тоже понравились" 
          variant="fadeIn"
          delay={0.3}
        />
      </div>

      <div className="matches-page__list">
        {matches.map((match, index) => (
          <AnimatedCard
            key={match.id}
            className="matches-page__match"
            delay={index * 0.1}
            direction="up"
          >
            <div className="matches-page__avatar">
              {match.image}
            </div>
            <div className="matches-page__info">
              <AnimatedText 
                text={match.name}
                variant="slideUp"
                delay={index * 0.1 + 0.2}
              />
              <AnimatedText 
                text={match.title}
                variant="fadeIn"
                delay={index * 0.1 + 0.3}
                className="matches-page__title"
              />
              <AnimatedText 
                text={match.company}
                variant="fadeIn"
                delay={index * 0.1 + 0.4}
                className="matches-page__company"
              />
              <div className="matches-page__score">
                <AnimatedText 
                  text="Совпадение:"
                  variant="fadeIn"
                  delay={index * 0.1 + 0.5}
                  className="matches-page__score-label"
                />
                <AnimatedText 
                  text={`${match.matchScore}%`}
                  variant="scale"
                  delay={index * 0.1 + 0.6}
                  className="matches-page__score-value"
                />
              </div>
              <AnimatedText 
                text={match.lastMessage}
                variant="fadeIn"
                delay={index * 0.1 + 0.7}
                className="matches-page__message"
              />
              <AnimatedText 
                text={match.timestamp}
                variant="fadeIn"
                delay={index * 0.1 + 0.8}
                className="matches-page__timestamp"
              />
            </div>
            <button className="matches-page__chat">
              💬
            </button>
          </AnimatedCard>
        ))}
      </div>

      {matches.length === 0 && (
        <div className="matches-page__empty">
          <h3>Совпадений пока нет</h3>
          <p>Продолжайте свайпать, чтобы найти идеальное совпадение!</p>
        </div>
      )}
    </div>
  );
};