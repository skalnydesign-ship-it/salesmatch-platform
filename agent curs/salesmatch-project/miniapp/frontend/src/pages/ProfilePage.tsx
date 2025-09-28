import React, { useState, useEffect } from 'react';
import { useContext7 } from '../contexts/Context7Provider';
import './ProfilePage.css';

interface ProfilePageProps {
  onLogout: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onLogout }) => {
  const [profile, setProfile] = useState({
    name: 'Test User',
    title: 'Sales Manager',
    company: 'Demo Corp',
    bio: 'Experienced sales professional looking for new opportunities.',
    email: 'test@demo.com',
    phone: '+1 (555) 123-4567'
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const { getCodeSuggestions, getBestPractices, checkSecurity, getDocumentation } = useContext7();

  useEffect(() => {
    // Use Context7 to analyze profile
    const analyzeProfile = async () => {
      const suggestions = await getCodeSuggestions();
      const practices = await getBestPractices();
      const security = await checkSecurity();
      const docs = await getDocumentation();
      
      console.log('Profile analysis complete:', {
        suggestions,
        practices,
        security,
        docs
      });
    };
    
    analyzeProfile();
  }, [getCodeSuggestions, getBestPractices, checkSecurity, getDocumentation]);

  const handleSave = () => {
    setIsEditing(false);
    // Here you would typically save to backend
  };

  const handleInputChange = (field: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="profile-page">
      <div className="profile-page__header">
        <div className="profile-page__avatar">👤</div>
        <h2>{profile.name}</h2>
        <p>{profile.title} at {profile.company}</p>
      </div>

      <div className="profile-page__content">
        <div className="profile-page__section">
          <h3>Personal Information</h3>
          <div className="profile-page__field">
            <label>Name</label>
            {isEditing ? (
              <input
                type="text"
                value={profile.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="profile-page__input"
              />
            ) : (
              <p>{profile.name}</p>
            )}
          </div>

          <div className="profile-page__field">
            <label>Title</label>
            {isEditing ? (
              <input
                type="text"
                value={profile.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="profile-page__input"
              />
            ) : (
              <p>{profile.title}</p>
            )}
          </div>

          <div className="profile-page__field">
            <label>Company</label>
            {isEditing ? (
              <input
                type="text"
                value={profile.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                className="profile-page__input"
              />
            ) : (
              <p>{profile.company}</p>
            )}
          </div>

          <div className="profile-page__field">
            <label>Bio</label>
            {isEditing ? (
              <textarea
                value={profile.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                className="profile-page__textarea"
                rows={3}
              />
            ) : (
              <p>{profile.bio}</p>
            )}
          </div>
        </div>

        <div className="profile-page__section">
          <h3>Contact Information</h3>
          <div className="profile-page__field">
            <label>Email</label>
            <p>{profile.email}</p>
          </div>
          <div className="profile-page__field">
            <label>Phone</label>
            <p>{profile.phone}</p>
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

        <div className="profile-page__actions">
          {isEditing ? (
            <button 
              className="profile-page__save"
              onClick={handleSave}
            >
              💾 Save Changes
            </button>
          ) : (
            <button 
              className="profile-page__edit"
              onClick={() => setIsEditing(true)}
            >
              ✏️ Edit Profile
            </button>
          )}
          
          <button 
            className="profile-page__logout"
            onClick={onLogout}
          >
            🚪 Logout
          </button>
        </div>
      </div>
    </div>
  );
};