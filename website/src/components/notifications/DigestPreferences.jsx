import React, { useState } from 'react';
import './DigestPreferences.css';

export default function DigestPreferences() {
  const [frequency, setFrequency] = useState('daily');
  const [content, setContent] = useState({
    events: true,
    news: true,
    announcements: true,
  });
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [saved, setSaved] = useState(false);

  const handleContentChange = (key) => {
    setContent(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    // Mock save
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleUnsubscribe = () => {
    setFrequency('real-time'); // Or disabled
    setContent({ events: false, news: false, announcements: false });
    alert('Unsubscribed from digest emails.');
  };

  return (
    <div className="digest-preferences">
      <h3>Email Digest Settings</h3>
      <p className="digest-subtitle">Receive a summary of updates instead of individual emails.</p>

      <div className="digest-section">
        <h4>Digest Frequency</h4>
        <div className="frequency-options">
          {['real-time', 'daily', 'weekly'].map(freq => (
            <label key={freq} className="radio-label">
              <input 
                type="radio" 
                name="frequency" 
                value={freq} 
                checked={frequency === freq} 
                onChange={(e) => setFrequency(e.target.value)} 
              />
              {freq.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </label>
          ))}
        </div>
      </div>

      <div className="digest-section">
        <h4>Digest Content</h4>
        <div className="content-options">
          <label className="checkbox-label">
            <input 
              type="checkbox" 
              checked={content.events} 
              onChange={() => handleContentChange('events')} 
            />
            Upcoming Events
          </label>
          <label className="checkbox-label">
            <input 
              type="checkbox" 
              checked={content.news} 
              onChange={() => handleContentChange('news')} 
            />
            Platform News
          </label>
          <label className="checkbox-label">
            <input 
              type="checkbox" 
              checked={content.announcements} 
              onChange={() => handleContentChange('announcements')} 
            />
            Admin Announcements
          </label>
        </div>
      </div>

      <div className="digest-section">
        <h4>Timezone</h4>
        <p className="tz-hint">Digests will be sent in your local morning time (8:00 AM).</p>
        <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="tz-select">
          <option value={Intl.DateTimeFormat().resolvedOptions().timeZone}>
            {Intl.DateTimeFormat().resolvedOptions().timeZone} (Detected)
          </option>
          <option value="UTC">UTC</option>
          <option value="America/New_York">Eastern Time (ET)</option>
          <option value="America/Los_Angeles">Pacific Time (PT)</option>
          <option value="Asia/Kolkata">India Standard Time (IST)</option>
        </select>
      </div>

      <div className="digest-actions">
        <button className="btn-save" onClick={handleSave}>
          {saved ? 'Saved!' : 'Save Digest Settings'}
        </button>
        <button className="btn-unsubscribe" onClick={handleUnsubscribe}>
          Unsubscribe from Digest
        </button>
      </div>
    </div>
  );
}
