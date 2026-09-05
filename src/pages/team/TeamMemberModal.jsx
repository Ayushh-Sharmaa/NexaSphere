import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

function CopyPopup({ value, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('.copy-popup')) onClose();
    };
    setTimeout(() => document.addEventListener('click', handler), 0);
    return () => document.removeEventListener('click', handler);
  }, [onClose]);

  return (
    <div className="copy-popup">
      <span className="copy-popup-value">{value}</span>
      <button className="copy-popup-btn" onClick={handleCopy}>
        {copied ? '✅ Copied!' : '📋 Copy'}
      </button>
    </div>
  );
}

function getWhatsappDisplay(raw) {
  if (!raw) return null;
  
  if (raw.startsWith('http')) return raw;
  
  return raw;
}

function ModalContent({ member, onClose }) {
  const [activePopup, setActivePopup] = useState(null);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const hasSocial = member.linkedin || member.whatsapp || member.instagram || member.email;
  const whatsappValue = getWhatsappDisplay(member.whatsapp);

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-box">
        
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>

        
        <img src={member.photo} alt={member.name} className="modal-photo" />

        
        <div className="modal-name">{member.name}</div>
        <div className="modal-role">{member.role}</div>

        
        <div className="modal-info">
          <div className="modal-info-row">
            <span className="modal-info-label">🎓 Year</span>
            <span className="modal-info-value">{member.year}</span>
          </div>
          <div className="modal-info-row">
            <span className="modal-info-label">🔬 Branch</span>
            <span className="modal-info-value">{member.branch}</span>
          </div>
          <div className="modal-info-row">
            <span className="modal-info-label">📋 Section</span>
            <span className="modal-info-value">{member.section}</span>
          </div>
        </div>

        
        {member.achievements && member.achievements.length > 0 && (
          <div className="modal-achievements">
            <div className="modal-achievements-title">🏆 Achievements</div>
            <ul className="modal-achievements-list">
              {member.achievements.map((ach, idx) => (
                <li key={idx} className="modal-achievement-item">{ach}</li>
              ))}
            </ul>
          </div>
        )}

        
        {member.testimonials && member.testimonials.length > 0 && (
          <div className="modal-testimonials">
            <div className="modal-testimonials-title">💬 Testimonials</div>
            <ul className="modal-testimonials-list">
              {member.testimonials.map((t, idx) => (
                <li key={idx} className="modal-testimonial-item">
                  <span className="testimonial-text">“{t.text}”</span>
                  <span className="testimonial-author">- {t.author}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        
        {hasSocial && (
          <div className="modal-social">
            {member.linkedin && (
              <a
                href={member.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="modal-social-btn btn-linkedin"
              >
                🔗 LinkedIn
              </a>
            )}

            {member.whatsapp && (
              <div style={{ position: 'relative' }}>
                <button
                  className="modal-social-btn btn-whatsapp"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePopup(activePopup === 'whatsapp' ? null : 'whatsapp');
                  }}
                >
                  💬 WhatsApp
                </button>
                {activePopup === 'whatsapp' && (
                  <CopyPopup value={whatsappValue} onClose={() => setActivePopup(null)} />
                )}
              </div>
            )}

            {member.instagram && (
              <a
                href={member.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="modal-social-btn btn-instagram"
              >
                📸 Instagram
              </a>
            )}

            {member.email && (
              <div style={{ position: 'relative' }}>
                <button
                  className="modal-social-btn btn-contact"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePopup(activePopup === 'email' ? null : 'email');
                  }}
                >
                  ✉️ Email
                </button>
                {activePopup === 'email' && (
                  <CopyPopup value={member.email} onClose={() => setActivePopup(null)} />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TeamMemberModal({ member, onClose }) {
  if (!member) return null;
  return createPortal(
    <ModalContent member={member} onClose={onClose} />,
    document.body
  );
}

