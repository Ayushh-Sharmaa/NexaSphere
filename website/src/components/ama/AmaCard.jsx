import { useNavigate } from 'react-router-dom';
import { formatRelativeTime } from '../../utils/formatRelativeTime';
import { MessageSquare } from 'lucide-react';

export function AmaCard({ ama }) {
  const navigate = useNavigate();

  return (
    <div
      className="ama-card"
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/ama/${ama.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(`/ama/${ama.id}`);
        }
      }}
    >
      <div className="ama-card-header">
        <span className={`ama-status-badge ${ama.status}`}>{ama.status}</span>
      </div>

      <h3 className="ama-card-topic">{ama.topic}</h3>

      <div className="ama-card-mentor">
        <img src={ama.mentor.avatar} alt={ama.mentor.name} className="ama-card-avatar" />
        <div className="ama-card-mentor-info">
          <span className="ama-card-mentor-name">{ama.mentor.name}</span>
          <span className="ama-card-mentor-role">{ama.mentor.role}</span>
        </div>
      </div>

      <div className="ama-card-meta">
        <span>{new Date(ama.date).toLocaleDateString()}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MessageSquare size={16} /> {ama.questionsCount}
        </span>
      </div>
    </div>
  );
}
