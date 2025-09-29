import React, { useState } from 'react';
import { useContext7 } from '../contexts/Context7Provider';
import './MessagesPage.css';

const mockConversations = [
  {
    id: 1,
    name: 'John Smith',
    company: 'TechCorp Inc.',
    image: '👨‍💼',
    lastMessage: 'Hi! Interested in discussing partnership opportunities?',
    timestamp: '2 hours ago',
    unread: 2
  },
  {
    id: 2,
    name: 'Sarah Johnson',
    company: 'InnovateLab',
    image: '👩‍💼',
    lastMessage: 'Let\'s schedule a call this week',
    timestamp: '1 day ago',
    unread: 0
  }
];

export const MessagesPage: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const { getCodeSuggestions, optimizePerformance } = useContext7();

  const handleConversationClick = async (conversationId: number) => {
    setSelectedConversation(conversationId);
    
    // Use Context7 to optimize the conversation view
    await optimizePerformance(`Opening conversation ${conversationId}`);
  };

  if (selectedConversation) {
    const conversation = mockConversations.find(c => c.id === selectedConversation);
    
    return (
      <div className="messages-page">
        <div className="messages-page__header">
          <button 
            className="messages-page__back"
            onClick={() => setSelectedConversation(null)}
          >
            ← Назад
          </button>
          <div className="messages-page__contact">
            <span className="messages-page__contact-avatar">{conversation?.image}</span>
            <div>
              <h3>{conversation?.name}</h3>
              <p>{conversation?.company}</p>
            </div>
          </div>
        </div>
        
          <div className="messages-page__chat">
          <div className="messages-page__message messages-page__message--sent">
            <p>Здравствуйте! Интересуют ваши услуги.</p>
            <span className="messages-page__time">14:30</span>
          </div>
          <div className="messages-page__message messages-page__message--received">
            <p>Здравствуйте! Рады вашему обращению. Какие именно услуги вам нужны?</p>
            <span className="messages-page__time">14:32</span>
          </div>
          <div className="messages-page__message messages-page__message--sent">
            <p>Нам нужны AI-решения для отдела продаж.</p>
            <span className="messages-page__time">14:35</span>
          </div>
        </div>
        
        <div className="messages-page__input">
          <input 
            type="text" 
            placeholder="Напишите сообщение..."
            className="messages-page__input-field"
          />
          <button className="messages-page__send">Отправить</button>
        </div>
      </div>
    );
  }

  return (
    <div className="messages-page">
      <div className="messages-page__header">
        <h2>💬 Сообщения</h2>
        <p>Ваши диалоги</p>
      </div>

      <div className="messages-page__list">
        {mockConversations.map((conversation) => (
          <div 
            key={conversation.id} 
            className="messages-page__conversation"
            onClick={() => handleConversationClick(conversation.id)}
          >
            <div className="messages-page__avatar">
              {conversation.image}
            </div>
            <div className="messages-page__info">
              <div className="messages-page__name-row">
                <h3>{conversation.name}</h3>
                {conversation.unread > 0 && (
                  <span className="messages-page__unread">{conversation.unread}</span>
                )}
              </div>
              <p className="messages-page__company">{conversation.company}</p>
              <p className="messages-page__last-message">{conversation.lastMessage}</p>
              <p className="messages-page__timestamp">{conversation.timestamp}</p>
            </div>
          </div>
        ))}
      </div>

      {mockConversations.length === 0 && (
        <div className="messages-page__empty">
          <h3>Пока нет сообщений</h3>
          <p>Начните диалог с вашими совпадениями!</p>
        </div>
      )}
    </div>
  );
};