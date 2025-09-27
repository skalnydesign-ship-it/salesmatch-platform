import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';
import { Header } from '../components/Layout/Header';
import { apiService } from '../services/api';
import { Conversation } from '../types';
import './MessagesPage.css';

export const MessagesPage: React.FC = () => {
  const navigate = useNavigate();
  const { hapticFeedback } = useTelegram();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const conversationsData = await apiService.getConversations();
      setConversations(conversationsData);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConversationClick = (conversation: Conversation) => {
    hapticFeedback('selection');
    navigate(`/messages/${conversation.id}`);
  };

  if (isLoading) {
    return (
      <div className="messages-page">
        <Header title="Messages" />
        <div className="messages-page__loading">
          <div className="spinner"></div>
          <p>Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="messages-page">
      <Header title="Messages" />
      
      <div className="messages-page__content">
        {conversations.length === 0 ? (
          <div className="messages-page__empty">
            <h2>💬 No messages yet</h2>
            <p>Start a conversation with your matches!</p>
            <button 
              className="messages-page__button"
              onClick={() => navigate('/matches')}
            >
              💕 View Matches
            </button>
          </div>
        ) : (
          <div className="messages-page__list">
            {conversations.map((conversation) => (
              <div 
                key={conversation.id}
                className="messages-page__conversation"
                onClick={() => handleConversationClick(conversation)}
              >
                <div className="messages-page__avatar">
                  {conversation.avatar ? (
                    <img src={conversation.avatar} alt={conversation.name} />
                  ) : (
                    <div className="messages-page__avatar-placeholder">
                      {conversation.name[0]}
                    </div>
                  )}
                </div>
                
                <div className="messages-page__info">
                  <h3>{conversation.name}</h3>
                  <p className="messages-page__last-message">
                    {conversation.lastMessage}
                  </p>
                  <p className="messages-page__time">
                    {new Date(conversation.lastMessageAt).toLocaleDateString()}
                  </p>
                </div>
                
                {conversation.unreadCount > 0 && (
                  <div className="messages-page__badge">
                    {conversation.unreadCount}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};