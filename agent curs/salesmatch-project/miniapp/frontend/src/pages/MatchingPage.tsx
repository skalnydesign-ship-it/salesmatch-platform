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
    name: 'Алексей Петров',
    title: 'Руководитель отдела продаж',
    company: 'ТехКорп',
    bio: 'Ищу B2B‑партнёров в финтехе. 10+ лет в корпоративных продажах.',
    image: '👨‍💼'
  },
  {
    id: 2,
    name: 'Софья Иванова',
    title: 'Директор по развитию бизнеса',
    company: 'ИнновейтЛаб',
    bio: 'Специализация: SaaS и цифровая трансформация. Открыта к стратегическим партнёрствам.',
    image: '👩‍💼'
  },
  {
    id: 3,
    name: 'Михаил Чэнь',
    title: 'Вице‑президент по продажам',
    company: 'ДатаФлоу Системс',
    bio: 'Эксперт по AI/ML‑решениям. Интересуют корпоративные клиенты.',
    image: '👨‍💻'
  },
  {
    id: 4,
    name: 'Ольга Кузнецова',
    title: 'Аккаунт‑менеджер',
    company: 'РитейлПро',
    bio: 'Развиваю сетевые продажи и партнёрства в ритейле.',
    image: '👩‍💼'
  },
  {
    id: 5,
    name: 'Илья Соколов',
    title: 'Head of Sales (EMEA)',
    company: 'CloudWare',
    bio: 'Облако, безопасность, масштабирование. Ищу реселлеров и интеграторов.',
    image: '🧑‍💼'
  },
  {
    id: 6,
    name: 'Анна Морозова',
    title: 'BD Manager',
    company: 'HealthTech Group',
    bio: 'Медтех проекты, клиники, страховые. Открыта пилотам и POC.',
    image: '👩‍⚕️'
  },
  {
    id: 7,
    name: 'Дмитрий Ефимов',
    title: 'Key Account Manager',
    company: 'FinSoft',
    bio: 'Финансовые сервисы, интеграции с банками, PCI DSS.',
    image: '🕴️'
  },
  {
    id: 8,
    name: 'Екатерина Орлова',
    title: 'Partnerships Lead',
    company: 'EduNext',
    bio: 'EdTech, корпоративное обучение, платформы LXP/LMS.',
    image: '👩‍🏫'
  },
  {
    id: 9,
    name: 'Роман Беляев',
    title: 'Sales Engineer',
    company: 'NetSecure',
    bio: 'Пресейл, демо, пилоты. Решения по кибербезопасности.',
    image: '👨‍🔧'
  },
  {
    id: 10,
    name: 'Наталья Фролова',
    title: 'Региональный менеджер',
    company: 'AgroTech',
    bio: 'Агросектор, IoT и аналитика. Интересны дистрибьюторы по регионам.',
    image: '👩‍🌾'
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
          <LoadingSpinner size="lg" color="primary" text="Подбираем идеальное совпадение..." />
        </div>
      </div>
    );
  }

  if (!currentProfile) {
    return (
      <div className="matching-page">
        <div className="matching-page__empty">
          <AnimatedText 
            text="🎉 Все анкеты просмотрены!" 
            variant="scale"
            className="animated-text--gradient"
          />
          <AnimatedText 
            text="Проверьте совпадения во вкладке Матчи." 
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
          ❌ Пропустить
        </AnimatedButton>
        <AnimatedButton
          variant="success"
          size="lg"
          onClick={handleLike}
          className="matching-page__like"
        >
          🤝 Нравится
        </AnimatedButton>
      </div>

      <div className="matching-page__stats">
        <AnimatedText 
          text={`Понравилось: ${likedProfiles.length}`}
          variant="fadeIn"
          delay={0.5}
        />
        <AnimatedText 
          text={`Осталось: ${mockProfiles.length - currentProfileIndex - 1}`}
          variant="fadeIn"
          delay={0.6}
        />
      </div>
    </div>
  );
};