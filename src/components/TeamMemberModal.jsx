import { useEffect } from 'react';

export default function TeamMemberModal({ member, onClose }) {
  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!member) return null;

  const hasSocial = member.linkedin || member.whatsapp || member.instagram || member.email;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box">
        {/* Close */}
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>

        {/* Photo */}
        <img src={member.photo} alt={member.name} className="modal-photo" />

        {/* Name & Role */}
        <div className="modal-name">{member.name}</div>
        <div className="modal-role">{member.role}</div>

        {/* Info */}
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

        {/* Social links */}
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
              <a
                href={member.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="modal-social-btn btn-whatsapp"
              >
                💬 WhatsApp
              </a>
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
              <a
                href={`mailto:${member.email}`}
                className="modal-social-btn btn-contact"
              >
                ✉️ Email
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
