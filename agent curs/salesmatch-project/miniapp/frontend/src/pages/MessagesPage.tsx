import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '../../hooks/useTelegram';
import { Header } from '../Layout/Header';
import { apiService } from '../../services/api';
import { Conversation } from '../../types';
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
      const response = await apiService.getConversations();
      if (response.success && response.data) {
        setConversations(response.data);
      } else {
        // Mock data for demo
        setConversations([
          {
            matchId: 1,
            profile: {
              id: 1,
              userId: 1,
              title: 'Senior Sales Manager',
              description: 'Experienced in B2B sales with focus on enterprise clients.',
              industry: 'Technology',
              location: 'Moscow, Russia',
              experience: 7,
              skills: ['B2B Sales', 'CRM', 'Lead Generation'],
              photos: [],
              documents: [],
              isComplete: true,
              completionScore: 95,
            },
            lastMessage: {
              id: 1,
              matchId: 1,
              senderId: 2,
              content: 'Hi! I saw your profile and I think we could work well together.',
              type: 'text',
              createdAt: '2024-09-17T14:30:00Z',
            },
            unreadCount: 2,
            updatedAt: '2024-09-17T14:30:00Z',
          },
          {
            matchId: 2,
            profile: {
              id: 2,
              userId: 2,
              title: 'Business Development Director',
              description: 'Strategic business development professional with international experience.',
              industry: 'Finance',
              location: 'St. Petersburg, Russia',
              experience: 10,
              skills: ['Business Development', 'Strategic Planning', 'Partnerships'],
              photos: [],
              documents: [],
              isComplete: true,
              completionScore: 92,
            },
            lastMessage: {
              id: 2,
              matchId: 2,
              senderId: 1,
              content: 'Thanks for the connection! Let\'s discuss potential collaboration.',
              type: 'text',
              createdAt: '2024-09-17T12:15:00Z',
            },
            unreadCount: 0,
            updatedAt: '2024-09-17T12:15:00Z',
          },
        ]);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConversationClick = (conversation: Conversation) => {
    hapticFeedback('selection');
    navigate(`/messages/${conversation.matchId}`);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="messages-page">
        <Header title="Messages" />
        <div className="messages-page__loading">
          <div className="messages-page__spinner"></div>
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
            <div className="messages-page__empty-icon">💬</div>
            <h2>No conversations yet</h2>
            <p>Start matching to begin conversations with potential business partners!</p>
            <button 
              className="messages-page__start-button"
              onClick={() => navigate('/matching')}
            >
              Start Matching
            </button>
          </div>
        ) : (
          <div className="messages-page__list">
            {conversations.map((conversation) => (
              <div 
                key={conversation.matchId}
                className="messages-page__conversation"
                onClick={() => handleConversationClick(conversation)}
              >
                <div className="messages-page__conversation-avatar">
                  {conversation.profile.title.charAt(0)}
                </div>
                
                <div className="messages-page__conversation-info">
                  <div className="messages-page__conversation-header">
                    <h3>{conversation.profile.title}</h3>
                    <span className="messages-page__conversation-time">
                      {formatTime(conversation.updatedAt)}
                    </span>
                  </div>
                  
                  <p className="messages-page__conversation-preview">
                    {conversation.lastMessage?.content || 'No messages yet'}
                  </p>
                  
                  <div className="messages-page__conversation-details">
                    <span className="messages-page__conversation-industry">
                      {conversation.profile.industry}
                    </span>
                    {conversation.unreadCount > 0 && (
                      <span className="messages-page__unread-badge">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="messages-page__conversation-arrow">
                  →
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


