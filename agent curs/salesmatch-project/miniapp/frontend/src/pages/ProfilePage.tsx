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
    accountType: 'company' as 'company' | 'agent',
    socials: {
      website: '',
      telegram: '',
      instagram: '',
      facebook: '',
      linkedin: '',
      twitter: '',
      youtube: '',
      tiktok: '',
      github: '',
      vk: ''
    }
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const { getCodeSuggestions, getBestPractices, checkSecurity, getDocumentation } = useContext7();

  // Photos gallery state (up to 5)
  const [photos, setPhotos] = useState<string[]>([]);
  const [avatarIndex, setAvatarIndex] = useState<number | null>(null);
  // Documents (legal/identity/company registration)
  type DocumentItem = { url: string; name: string; mime: string };
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [primaryDocIndex, setPrimaryDocIndex] = useState<number | null>(null);

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

  const handleSocialChange = (field: keyof typeof profile.socials, value: string) => {
    setProfile(prev => ({
      ...prev,
      socials: {
        ...prev.socials,
        [field]: value
      }
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

  const getDocEmoji = (mime: string, name: string) => {
    const lower = (mime || '').toLowerCase();
    const ext = name.toLowerCase();
    if (lower.includes('pdf') || ext.endsWith('.pdf')) return '🧾';
    if (lower.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp|heic|heif)$/i.test(ext)) return '🖼️';
    if (ext.endsWith('.doc') || ext.endsWith('.docx')) return '📄';
    return '📎';
  };

  const handleDocsUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newDocs: DocumentItem[] = Array.from(files).map((file) => ({
      url: URL.createObjectURL(file),
      name: file.name,
      mime: file.type || 'application/octet-stream'
    }));
    const updated = [...documents, ...newDocs];
    setDocuments(updated);
    if (updated.length > 0 && primaryDocIndex === null) setPrimaryDocIndex(0);
    e.target.value = '';
  };

  const handleRemoveDoc = (index: number) => {
    const updated = documents.filter((_, i) => i !== index);
    setDocuments(updated);
    if (primaryDocIndex !== null) {
      if (index === primaryDocIndex) setPrimaryDocIndex(updated.length ? 0 : null);
      else if (index < primaryDocIndex) setPrimaryDocIndex(primaryDocIndex - 1);
    }
  };

  const handleSetPrimaryDoc = (index: number) => setPrimaryDocIndex(index);

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
          <div className="profile-page__field">
            <label>Ссылки</label>
            {isEditing ? (
              <div className="profile-page__socials-edit">
                <div className="profile-page__socials-row">
                  <input className="profile-page__input" placeholder="🌐 Веб-сайт" value={profile.socials.website} onChange={(e) => handleSocialChange('website', e.target.value)} />
                  <input className="profile-page__input" placeholder="✈️ Telegram" value={profile.socials.telegram} onChange={(e) => handleSocialChange('telegram', e.target.value)} />
                </div>
                <div className="profile-page__socials-row">
                  <input className="profile-page__input" placeholder="📸 Instagram" value={profile.socials.instagram} onChange={(e) => handleSocialChange('instagram', e.target.value)} />
                  <input className="profile-page__input" placeholder="📘 Facebook" value={profile.socials.facebook} onChange={(e) => handleSocialChange('facebook', e.target.value)} />
                </div>
                <div className="profile-page__socials-row">
                  <input className="profile-page__input" placeholder="🔗 LinkedIn" value={profile.socials.linkedin} onChange={(e) => handleSocialChange('linkedin', e.target.value)} />
                  <input className="profile-page__input" placeholder="🐦 Twitter/X" value={profile.socials.twitter} onChange={(e) => handleSocialChange('twitter', e.target.value)} />
                </div>
                <div className="profile-page__socials-row">
                  <input className="profile-page__input" placeholder="▶️ YouTube" value={profile.socials.youtube} onChange={(e) => handleSocialChange('youtube', e.target.value)} />
                  <input className="profile-page__input" placeholder="🎵 TikTok" value={profile.socials.tiktok} onChange={(e) => handleSocialChange('tiktok', e.target.value)} />
                </div>
                <div className="profile-page__socials-row">
                  <input className="profile-page__input" placeholder="🐙 GitHub" value={profile.socials.github} onChange={(e) => handleSocialChange('github', e.target.value)} />
                  <input className="profile-page__input" placeholder="🖖 VK" value={profile.socials.vk} onChange={(e) => handleSocialChange('vk', e.target.value)} />
                </div>
              </div>
            ) : (
              <div className="profile-page__socials">
                {profile.socials.website && (
                  <a className="profile-page__social" href={profile.socials.website} target="_blank" rel="noreferrer">
                    <span className="profile-page__social-icon">🌐</span>
                    <span>Веб-сайт</span>
                  </a>
                )}
                {profile.socials.telegram && (
                  <a className="profile-page__social" href={profile.socials.telegram} target="_blank" rel="noreferrer">
                    <span className="profile-page__social-icon">✈️</span>
                    <span>Telegram</span>
                  </a>
                )}
                {profile.socials.instagram && (
                  <a className="profile-page__social" href={profile.socials.instagram} target="_blank" rel="noreferrer">
                    <span className="profile-page__social-icon">📸</span>
                    <span>Instagram</span>
                  </a>
                )}
                {profile.socials.facebook && (
                  <a className="profile-page__social" href={profile.socials.facebook} target="_blank" rel="noreferrer">
                    <span className="profile-page__social-icon">📘</span>
                    <span>Facebook</span>
                  </a>
                )}
                {profile.socials.linkedin && (
                  <a className="profile-page__social" href={profile.socials.linkedin} target="_blank" rel="noreferrer">
                    <span className="profile-page__social-icon">🔗</span>
                    <span>LinkedIn</span>
                  </a>
                )}
                {profile.socials.twitter && (
                  <a className="profile-page__social" href={profile.socials.twitter} target="_blank" rel="noreferrer">
                    <span className="profile-page__social-icon">🐦</span>
                    <span>Twitter</span>
                  </a>
                )}
                {profile.socials.youtube && (
                  <a className="profile-page__social" href={profile.socials.youtube} target="_blank" rel="noreferrer">
                    <span className="profile-page__social-icon">▶️</span>
                    <span>YouTube</span>
                  </a>
                )}
                {profile.socials.tiktok && (
                  <a className="profile-page__social" href={profile.socials.tiktok} target="_blank" rel="noreferrer">
                    <span className="profile-page__social-icon">🎵</span>
                    <span>TikTok</span>
                  </a>
                )}
                {profile.socials.github && (
                  <a className="profile-page__social" href={profile.socials.github} target="_blank" rel="noreferrer">
                    <span className="profile-page__social-icon">🐙</span>
                    <span>GitHub</span>
                  </a>
                )}
                {profile.socials.vk && (
                  <a className="profile-page__social" href={profile.socials.vk} target="_blank" rel="noreferrer">
                    <span className="profile-page__social-icon">🖖</span>
                    <span>VK</span>
                  </a>
                )}
                {!profile.socials.website && !profile.socials.telegram && !profile.socials.instagram && !profile.socials.facebook && !profile.socials.linkedin && !profile.socials.twitter && !profile.socials.youtube && !profile.socials.tiktok && !profile.socials.github && !profile.socials.vk && (
                  <p className="profile-page__gallery-empty">Ссылки не добавлены</p>
                )}
              </div>
            )}
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

        <div className="profile-page__section">
          <h3>Документы</h3>
          <div className="profile-page__field">
            <label>Загрузите юридические документы (PDF, изображения, DOC/DOCX)</label>
            <input 
              type="file" 
              accept=".pdf,image/*,.doc,.docx"
              multiple 
              onChange={handleDocsUpload}
              className="profile-page__file-input"
            />
          </div>
          <div className="profile-page__docs">
            {documents.map((doc, index) => (
              <div key={index} className="profile-page__doc">
                <div className="profile-page__doc-left">
                  <span className="profile-page__doc-icon">{getDocEmoji(doc.mime, doc.name)}</span>
                  <a href={doc.url} target="_blank" rel="noreferrer" className="profile-page__doc-name">{doc.name}</a>
                </div>
                <div className="profile-page__doc-actions">
                  <button 
                    className={`profile-page__doc-primary ${primaryDocIndex === index ? 'is-active' : ''}`}
                    onClick={() => handleSetPrimaryDoc(index)}
                  >
                    {primaryDocIndex === index ? 'Основной' : 'Сделать основным'}
                  </button>
                  <button 
                    className="profile-page__doc-remove"
                    onClick={() => handleRemoveDoc(index)}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
            {documents.length === 0 && (
              <p className="profile-page__gallery-empty">Документы не загружены</p>
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