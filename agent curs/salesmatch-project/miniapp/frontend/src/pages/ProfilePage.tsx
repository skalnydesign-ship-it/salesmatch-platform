import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTelegram } from '../../hooks/useTelegram';
import { Header } from '../Layout/Header';
import { apiService } from '../../services/api';
import { Profile } from '../../types';
import './ProfilePage.css';

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { showAlert, hapticFeedback } = useTelegram();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

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
          </>
        )}
      </div>
    </div>
  );
};


