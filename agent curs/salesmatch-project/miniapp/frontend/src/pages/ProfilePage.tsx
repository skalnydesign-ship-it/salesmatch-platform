import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useContext7 } from '../../contexts/Context7Provider';
import { useTelegram } from '../../hooks/useTelegram';
import { Header } from '../Layout/Header';
import { apiService } from '../../services/api';
import { Profile } from '../../types';
import './ProfilePage.css';

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { showAlert, hapticFeedback } = useTelegram();
  const { 
    isConnected: context7Connected, 
    getCodeSuggestions, 
    getBestPractices, 
    checkSecurity 
  } = useContext7();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [codeSuggestions, setCodeSuggestions] = useState<string[]>([]);
  const [bestPractices, setBestPractices] = useState<string[]>([]);
  const [securityIssues, setSecurityIssues] = useState<string[]>([]);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (context7Connected) {
      loadContext7Data();
    }
  }, [context7Connected, isEditing]);

  const loadContext7Data = async () => {
    try {
      // Get TypeScript best practices for profile management
      const practices = await getBestPractices('typescript');
      setBestPractices(practices.slice(0, 4));

      // Get code suggestions for profile editing
      const suggestions = await getCodeSuggestions('profile editing form validation');
      setCodeSuggestions(suggestions);

      // Check security for profile update code
      if (isEditing) {
        const profileUpdateCode = `
          const handleSave = async () => {
            try {
              if (profile) {
                const response = await apiService.updateProfile(profile);
                if (response.success) {
                  setProfile(response.data);
                  setIsEditing(false);
                  showAlert('Profile updated successfully!');
                }
              }
            } catch (error) {
              console.error('Failed to save profile:', error);
              showAlert('Failed to save profile');
            }
          };
        `;
        
        const securityCheck = await checkSecurity(profileUpdateCode);
        setSecurityIssues(securityCheck.issues);
      }
    } catch (error) {
      console.warn('Failed to load Context7 data:', error);
    }
  };

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getProfile();
      if (response.success && response.data) {
        setProfile(response.data);
      } else {
        // Create mock profile for demo
        setProfile({
          id: 1,
          userId: user?.id || 1,
          title: 'Sales Professional',
          description: 'Experienced B2B sales specialist with 5+ years in tech industry',
          industry: 'Technology',
          location: 'Moscow, Russia',
          experience: 5,
          skills: ['B2B Sales', 'CRM', 'Lead Generation', 'Negotiation'],
          photos: [],
          documents: [],
          isComplete: false,
          completionScore: 60,
        });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      showAlert('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    hapticFeedback('selection');
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      if (profile) {
        // Security check with Context7
        if (context7Connected) {
          const saveCode = `
            const handleSave = async () => {
              try {
                if (profile) {
                  const response = await apiService.updateProfile(profile);
                  if (response.success) {
                    setProfile(response.data);
                    setIsEditing(false);
                    showAlert('Profile updated successfully!');
                  }
                }
              } catch (error) {
                console.error('Failed to save profile:', error);
                showAlert('Failed to save profile');
              }
            };
          `;
          
          const securityCheck = await checkSecurity(saveCode);
          if (securityCheck.issues.length > 0) {
            console.warn('Security issues detected:', securityCheck.issues);
          }
        }

        const response = await apiService.updateProfile(profile);
        if (response.success) {
          setProfile(response.data);
          setIsEditing(false);
          showAlert('Profile updated successfully!');
        } else {
          showAlert('Failed to update profile');
        }
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
      showAlert('Failed to save profile');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    loadProfile(); // Reload original data
  };

  if (isLoading) {
    return (
      <div className="profile-page">
        <Header title="Profile" />
        <div className="profile-page__loading">
          <div className="profile-page__spinner"></div>
          <p>Loading profile...</p>
          {context7Connected && (
            <div className="profile-page__context7-indicator">
              <span className="context7-badge">Context7 Analyzing Code</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <Header 
        title="Profile" 
        rightButton={
          !isEditing ? (
            <button 
              className="profile-page__edit-button"
              onClick={handleEdit}
            >
              Edit
            </button>
          ) : (
            <div className="profile-page__edit-actions">
              <button 
                className="profile-page__cancel-button"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button 
                className="profile-page__save-button"
                onClick={handleSave}
              >
                Save
              </button>
            </div>
          )
        }
      />

      {/* Context7 Code Suggestions */}
      {context7Connected && codeSuggestions.length > 0 && isEditing && (
        <div className="profile-page__context7-suggestions">
          <h3>💡 Code Suggestions (Context7)</h3>
          <ul>
            {codeSuggestions.map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Security Issues Warning */}
      {context7Connected && securityIssues.length > 0 && (
        <div className="profile-page__security-warning">
          <h3>⚠️ Security Issues Detected</h3>
          <ul>
            {securityIssues.map((issue, index) => (
              <li key={index}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="profile-page__content">
        {profile && (
          <>
            <div className="profile-page__header">
              <div className="profile-page__avatar">
                {user?.firstName?.charAt(0) || 'U'}
              </div>
              <div className="profile-page__info">
                <h2>{user?.firstName} {user?.lastName}</h2>
                <p>@{user?.username || 'username'}</p>
                <div className="profile-page__completion">
                  <span>Profile completion: {profile.completionScore}%</span>
                  <div className="profile-page__progress">
                    <div 
                      className="profile-page__progress-bar"
                      style={{ width: `${profile.completionScore}%` }}
                    ></div>
                  </div>
                </div>
                {context7Connected && (
                  <div className="profile-page__context7-status">
                    <span className="context7-indicator">🔗 Context7 Active</span>
                  </div>
                )}
              </div>
            </div>

            <div className="profile-page__sections">
              <div className="profile-section">
                <h3>Professional Info</h3>
                {isEditing ? (
                  <div className="profile-section__edit">
                    <input
                      type="text"
                      value={profile.title}
                      onChange={(e) => setProfile({...profile, title: e.target.value})}
                      placeholder="Job title"
                      className="profile-section__input"
                    />
                    <textarea
                      value={profile.description}
                      onChange={(e) => setProfile({...profile, description: e.target.value})}
                      placeholder="Description"
                      className="profile-section__textarea"
                      rows={3}
                    />
                    <input
                      type="text"
                      value={profile.industry}
                      onChange={(e) => setProfile({...profile, industry: e.target.value})}
                      placeholder="Industry"
                      className="profile-section__input"
                    />
                    <input
                      type="text"
                      value={profile.location}
                      onChange={(e) => setProfile({...profile, location: e.target.value})}
                      placeholder="Location"
                      className="profile-section__input"
                    />
                    <input
                      type="number"
                      value={profile.experience}
                      onChange={(e) => setProfile({...profile, experience: parseInt(e.target.value) || 0})}
                      placeholder="Years of experience"
                      className="profile-section__input"
                    />
                  </div>
                ) : (
                  <div className="profile-section__content">
                    <p><strong>Title:</strong> {profile.title}</p>
                    <p><strong>Description:</strong> {profile.description}</p>
                    <p><strong>Industry:</strong> {profile.industry}</p>
                    <p><strong>Location:</strong> {profile.location}</p>
                    <p><strong>Experience:</strong> {profile.experience} years</p>
                  </div>
                )}
              </div>

              <div className="profile-section">
                <h3>Skills</h3>
                {isEditing ? (
                  <div className="profile-section__edit">
                    <input
                      type="text"
                      value={profile.skills.join(', ')}
                      onChange={(e) => setProfile({...profile, skills: e.target.value.split(',').map(s => s.trim()).filter(s => s)})}
                      placeholder="Skills (comma separated)"
                      className="profile-section__input"
                    />
                  </div>
                ) : (
                  <div className="profile-section__skills">
                    {profile.skills.map((skill, index) => (
                      <span key={index} className="skill-tag">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="profile-section">
                <h3>Photos & Documents</h3>
                <div className="profile-section__files">
                  {profile.photos.length === 0 && profile.documents.length === 0 ? (
                    <p className="profile-section__empty">No files uploaded yet</p>
                  ) : (
                    <>
                      {profile.photos.map((photo, index) => (
                        <div key={index} className="file-item">
                          <span>📷 Photo {index + 1}</span>
                        </div>
                      ))}
                      {profile.documents.map((doc, index) => (
                        <div key={index} className="file-item">
                          <span>📄 {doc.name}</span>
                        </div>
                      ))}
                    </>
                  )}
                  <button className="profile-section__upload-button">
                    + Upload Files
                  </button>
                </div>
              </div>
            </div>

            {/* Context7 Best Practices */}
            {context7Connected && bestPractices.length > 0 && (
              <div className="profile-page__context7-practices">
                <h3>📚 Best Practices (Context7)</h3>
                <ul>
                  {bestPractices.map((practice, index) => (
                    <li key={index}>{practice}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};