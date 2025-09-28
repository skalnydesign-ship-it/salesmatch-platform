import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTelegram } from '../hooks/useTelegram';
import { Header } from '../components/Layout/Header';
import { apiService } from '../services/api';
import { Profile } from '../types';
import './ProfilePage.css';

interface ProfilePageProps {
  onLogout?: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onLogout }) => {
  const { user, updateUser } = useAuth();
  const { showAlert, hapticFeedback } = useTelegram();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const profileData = await apiService.getProfile();
      setProfile(profileData);
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
        await apiService.updateProfile(profile);
        showAlert('Profile updated successfully!');
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      showAlert('Failed to update profile');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    loadProfile(); // Reload original data
  };

  const handleInputChange = (field: keyof Profile, value: string) => {
    if (profile) {
      setProfile({ ...profile, [field]: value });
    }
  };

  if (isLoading) {
    return (
      <div className="profile-page">
        <Header title="Profile" />
        <div className="profile-page__loading">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <Header title="Profile" />
      
      <div className="profile-page__content">
        <div className="profile-page__header">
          <div className="profile-page__avatar">
            {profile?.avatar ? (
              <img src={profile.avatar} alt="Profile" />
            ) : (
              <div className="profile-page__avatar-placeholder">
                {user?.first_name?.[0] || 'U'}
              </div>
            )}
          </div>
          
          <div className="profile-page__info">
            <h2>{profile?.name || user?.first_name || 'User'}</h2>
            <p>{profile?.title || 'Sales Professional'}</p>
            <p>{profile?.company || 'Company Name'}</p>
          </div>
        </div>

        <div className="profile-page__actions">
          {!isEditing ? (
            <button 
              className="profile-page__button profile-page__button--edit"
              onClick={handleEdit}
            >
              ✏️ Edit Profile
            </button>
          ) : (
            <div className="profile-page__edit-actions">
              <button 
                className="profile-page__button profile-page__button--save"
                onClick={handleSave}
              >
                💾 Save
              </button>
              <button 
                className="profile-page__button profile-page__button--cancel"
                onClick={handleCancel}
              >
                ❌ Cancel
              </button>
            </div>
          )}
        </div>

        <div className="profile-page__details">
          <h3>Profile Details</h3>
          
          <div className="profile-page__field">
            <label>Name</label>
            {isEditing ? (
              <input
                type="text"
                value={profile?.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter your name"
              />
            ) : (
              <p>{profile?.name || 'Not specified'}</p>
            )}
          </div>

          <div className="profile-page__field">
            <label>Title</label>
            {isEditing ? (
              <input
                type="text"
                value={profile?.title || ''}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter your job title"
              />
            ) : (
              <p>{profile?.title || 'Not specified'}</p>
            )}
          </div>

          <div className="profile-page__field">
            <label>Company</label>
            {isEditing ? (
              <input
                type="text"
                value={profile?.company || ''}
                onChange={(e) => handleInputChange('company', e.target.value)}
                placeholder="Enter your company"
              />
            ) : (
              <p>{profile?.company || 'Not specified'}</p>
            )}
          </div>

          <div className="profile-page__field">
            <label>Bio</label>
            {isEditing ? (
              <textarea
                value={profile?.bio || ''}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell us about yourself"
                rows={4}
              />
            ) : (
              <p>{profile?.bio || 'No bio available'}</p>
            )}
          </div>
        </div>

        <div className="profile-page__stats">
          <h3>Statistics</h3>
          <div className="profile-page__stats-grid">
            <div className="profile-page__stat">
              <span className="profile-page__stat-number">12</span>
              <span className="profile-page__stat-label">Matches</span>
            </div>
            <div className="profile-page__stat">
              <span className="profile-page__stat-number">8</span>
              <span className="profile-page__stat-label">Messages</span>
            </div>
            <div className="profile-page__stat">
              <span className="profile-page__stat-number">95%</span>
              <span className="profile-page__stat-label">Profile Complete</span>
            </div>
          </div>
        </div>

        {onLogout && (
          <div className="profile-page__actions">
            <button 
              className="profile-page__logout-button"
              onClick={onLogout}
            >
              🚪 Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};