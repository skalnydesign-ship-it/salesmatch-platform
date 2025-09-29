import React, { useState, useEffect } from 'react';
import { useContext7 } from '../contexts/Context7Provider';
import { AnimatedCard } from '../components/animations/AnimatedCard';
import { AnimatedText } from '../components/animations/AnimatedText';
import './MatchesPage.css';

const mockMatches = [
  { id: 1, name: 'Алексей Петров', title: 'Руководитель отдела продаж', company: 'ТехКорп', image: '👨‍💼', matchScore: 95, lastMessage: 'Готов обсудить партнёрство', timestamp: '2 часа назад' },
  { id: 2, name: 'Софья Иванова', title: 'Директор по развитию бизнеса', company: 'ИнновейтЛаб', image: '👩‍💼', matchScore: 88, lastMessage: 'Давайте назначим звонок', timestamp: '1 день назад' },
  { id: 3, name: 'Михаил Чэнь', title: 'Вице‑президент по продажам', company: 'ДатаФлоу Системс', image: '👨‍💻', matchScore: 90, lastMessage: 'Интересна интеграция', timestamp: '3 часа назад' },
  { id: 4, name: 'Ольга Кузнецова', title: 'Аккаунт‑менеджер', company: 'РитейлПро', image: '👩‍💼', matchScore: 82, lastMessage: 'Направлю КП', timestamp: 'вчера' },
  { id: 5, name: 'Илья Соколов', title: 'Head of Sales (EMEA)', company: 'CloudWare', image: '🧑‍💼', matchScore: 87, lastMessage: 'Ищу интеграторов', timestamp: '5 часов назад' },
  { id: 6, name: 'Анна Морозова', title: 'BD Manager', company: 'HealthTech Group', image: '👩‍⚕️', matchScore: 80, lastMessage: 'Готовы к пилоту', timestamp: 'сегодня' },
  { id: 7, name: 'Дмитрий Ефимов', title: 'Key Account Manager', company: 'FinSoft', image: '🕴️', matchScore: 84, lastMessage: 'Уточню детали', timestamp: '3 дня назад' },
  { id: 8, name: 'Екатерина Орлова', title: 'Partnerships Lead', company: 'EduNext', image: '👩‍🏫', matchScore: 83, lastMessage: 'Интересны B2B клиенты', timestamp: '1 час назад' },
  { id: 9, name: 'Роман Беляев', title: 'Sales Engineer', company: 'NetSecure', image: '👨‍🔧', matchScore: 79, lastMessage: 'Готов к демо', timestamp: '2 дня назад' },
  { id: 10, name: 'Наталья Фролова', title: 'Региональный менеджер', company: 'AgroTech', image: '👩‍🌾', matchScore: 85, lastMessage: 'Есть вопросы по дистрибуции', timestamp: 'только что' }
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
            <button className="matches-page__chat" onClick={() => window.dispatchEvent(new CustomEvent('goToMessages'))}>
              ✉️ Написать
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