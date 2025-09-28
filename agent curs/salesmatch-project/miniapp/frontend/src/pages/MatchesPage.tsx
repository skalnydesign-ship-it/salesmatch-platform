import React, { useState, useEffect } from 'react';
import { useContext7 } from '../contexts/Context7Provider';
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
        <h2>💕 Your Matches</h2>
        <p>People who liked you back</p>
      </div>

      <div className="matches-page__list">
        {matches.map((match) => (
          <div key={match.id} className="matches-page__match">
            <div className="matches-page__avatar">
              {match.image}
            </div>
            <div className="matches-page__info">
              <h3>{match.name}</h3>
              <p className="matches-page__title">{match.title}</p>
              <p className="matches-page__company">{match.company}</p>
              <div className="matches-page__score">
                <span className="matches-page__score-label">Match Score:</span>
                <span className="matches-page__score-value">{match.matchScore}%</span>
              </div>
              <p className="matches-page__message">{match.lastMessage}</p>
              <p className="matches-page__timestamp">{match.timestamp}</p>
            </div>
            <button className="matches-page__chat">
              💬
            </button>
          </div>
        ))}
      </div>

      {matches.length === 0 && (
        <div className="matches-page__empty">
          <h3>No matches yet</h3>
          <p>Keep swiping to find your perfect match!</p>
        </div>
      )}
    </div>
  );
};