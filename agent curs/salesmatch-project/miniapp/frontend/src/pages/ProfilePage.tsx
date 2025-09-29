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
    phone: '+1 (555) 123-4567',
    accountType: 'company' as 'company' | 'agent'
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const { getCodeSuggestions, getBestPractices, checkSecurity, getDocumentation } = useContext7();

  // Photos gallery state (up to 5)
  const [photos, setPhotos] = useState<string[]>([]);
  const [avatarIndex, setAvatarIndex] = useState<number | null>(null);

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

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const remainingSlots = 5 - photos.length;
    const filesToAdd = Array.from(files).slice(0, remainingSlots);
    const newUrls = filesToAdd.map((file) => URL.createObjectURL(file));
    const updated = [...photos, ...newUrls].slice(0, 5);
    setPhotos(updated);
    if (updated.length > 0 && avatarIndex === null) {
      setAvatarIndex(0);
    }
    // reset input value to allow uploading same file again if needed
    e.target.value = '';
  };

  const handleRemovePhoto = (index: number) => {
    const updated = photos.filter((_, i) => i !== index);
    setPhotos(updated);
    if (avatarIndex !== null) {
      if (index === avatarIndex) {
        // if removed avatar -> set to first or null
        setAvatarIndex(updated.length ? 0 : null);
      } else if (index < avatarIndex) {
        // shift avatar index left
        setAvatarIndex(avatarIndex - 1);
      }
    }
  };

  const handleSetAvatar = (index: number) => {
    setAvatarIndex(index);
  };

  return (
    <div className="profile-page">
      <div className="profile-page__header">
        <div className="profile-page__avatar">
          {photos.length > 0 && avatarIndex !== null ? (
            <img src={photos[avatarIndex]} alt="Аватар" className="profile-page__avatar-img" />
          ) : (
            <span>👤</span>
          )}
        </div>
        <h2>{profile.name}</h2>
        <p>
          {profile.title}
          {profile.accountType === 'company' && profile.company
            ? ` в ${profile.company}`
            : ' (Агент)'}
        </p>
      </div>

      <div className="profile-page__content">
        <div className="profile-page__section">
          <h3>Личные данные</h3>
          <div className="profile-page__field">
            <label>Имя</label>
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
            <label>Должность</label>
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
            <label>Тип профиля</label>
            {isEditing ? (
              <select
                value={profile.accountType}
                onChange={(e) => handleInputChange('accountType', e.target.value)}
                className="profile-page__input"
              >
                <option value="company">Компания</option>
                <option value="agent">Агент</option>
              </select>
            ) : (
              <p>{profile.accountType === 'company' ? 'Компания' : 'Агент'}</p>
            )}
          </div>

          <div className="profile-page__field">
            <label>Компания</label>
            {isEditing ? (
              profile.accountType === 'company' ? (
                <input
                  type="text"
                  value={profile.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  className="profile-page__input"
                  placeholder="Название компании"
                />
              ) : (
                <p>-</p>
              )
            ) : (
              <p>{profile.accountType === 'company' && profile.company ? profile.company : 'Агент'}</p>
            )}
          </div>

          <div className="profile-page__field">
            <label>О себе</label>
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
          <h3>Контакты</h3>
          <div className="profile-page__field">
            <label>Email</label>
            <p>{profile.email}</p>
          </div>
          <div className="profile-page__field">
            <label>Телефон</label>
            <p>{profile.phone}</p>
          </div>
        </div>

        <div className="profile-page__section">
          <h3>Фотографии</h3>
          <div className="profile-page__field">
            <label>Добавьте до 5 фотографий</label>
            <input 
              type="file" 
              accept="image/*" 
              multiple 
              onChange={handlePhotoUpload}
              className="profile-page__file-input"
            />
          </div>
          <div className="profile-page__gallery">
            {photos.map((src, index) => (
              <div key={index} className="profile-page__thumb">
                <img src={src} alt={`Фото ${index + 1}`} />
                <div className="profile-page__thumb-actions">
                  <button 
                    className={`profile-page__thumb-set ${avatarIndex === index ? 'is-active' : ''}`}
                    onClick={() => handleSetAvatar(index)}
                  >
                    {avatarIndex === index ? 'Аватар' : 'Сделать аватаром'}
                  </button>
                  <button 
                    className="profile-page__thumb-remove"
                    onClick={() => handleRemovePhoto(index)}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
            {photos.length === 0 && (
              <p className="profile-page__gallery-empty">Фотографии не добавлены</p>
            )}
          </div>
        </div>

        <div className="profile-page__stats">
          <h3>Статистика</h3>
          <div className="profile-page__stats-grid">
            <div className="profile-page__stat">
              <span className="profile-page__stat-number">12</span>
              <span className="profile-page__stat-label">Совпадения</span>
            </div>
            <div className="profile-page__stat">
              <span className="profile-page__stat-number">8</span>
              <span className="profile-page__stat-label">Сообщения</span>
            </div>
            <div className="profile-page__stat">
              <span className="profile-page__stat-number">95%</span>
              <span className="profile-page__stat-label">Профиль заполнен</span>
            </div>
          </div>
        </div>

        <div className="profile-page__actions">
          {isEditing ? (
            <button 
              className="profile-page__save"
              onClick={handleSave}
            >
              💾 Сохранить
            </button>
          ) : (
            <button 
              className="profile-page__edit"
              onClick={() => setIsEditing(true)}
            >
              ✏️ Редактировать
            </button>
          )}
          
          <button 
            className="profile-page__logout"
            onClick={onLogout}
          >
            🚪 Выйти
          </button>
        </div>
      </div>
    </div>
  );
};