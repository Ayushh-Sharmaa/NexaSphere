import { useRef } from 'react';

export default function TeamMemberCard({ member, onClick }) {
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `translateY(-8px) rotateX(${-y * 12}deg) rotateY(${x * 12}deg)`;
  };

  const handleMouseLeave = () => {
    if (cardRef.current) cardRef.current.style.transform = '';
  };

  const handleClick = () => {
    // Brief scale down then open modal
    const card = cardRef.current;
    if (card) {
      card.style.transform = 'scale(0.95)';
      setTimeout(() => { card.style.transform = ''; }, 150);
    }
    setTimeout(() => onClick(member), 100);
  };

  return (
    <div
      ref={cardRef}
      className="team-card shimmer-card tilt-card reveal"
      style={{ perspective: '600px', cursor: 'pointer' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
      aria-label={`View ${member.name}'s profile`}
    >
      <div className="team-card-photo-wrap">
        <img src={member.photo} alt={member.name} className="team-card-photo" />
      </div>
      <div className="team-card-name">{member.name}</div>
      <div className="team-card-role">{member.role}</div>
      <div className="team-card-click-hint">Click to view profile →</div>
    </div>
  );
}
