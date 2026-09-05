import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useEventListener } from '../hooks/useEventListener';
import { EVENTS } from '../services/eventEmitter';
import { CoreTeamForm } from '../components/CoreTeamForm';
import { Skeleton } from '../components/Skeleton';
import { AdminIcon } from '../components/AdminIcon';

export function CoreTeamManager() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    api.coreTeam.getAll()
      .then(setMembers)
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, []);

  useEventListener(EVENTS.CORE_TEAM_MEMBER_ADDED, useCallback((member) => {
    setMembers(prev => [...prev, member]);
    setShowForm(false);
  }, []));

  useEventListener(EVENTS.CORE_TEAM_MEMBER_REMOVED, useCallback(({ id }) => {
    setMembers(prev => prev.filter(m => m.id !== id));
  }, []));

  const handleRemove = async (id) => {
    if (!confirm('Remove this member?')) return;
    setDeleting(id);
    try {
      await api.coreTeam.remove(id);
    } catch {
      alert('Failed to remove member');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Core Team</h2>
        <button className="btn-primary" onClick={() => setShowForm(true)}>+ Add Member</button>
      </div>

      {showForm && <CoreTeamForm onClose={() => setShowForm(false)} />}

      {loading && <Skeleton height={72} count={4} />}

      {!loading && (
        <div className="team-grid">
          {members.length === 0 && <div className="empty-state">No team members yet.</div>}
          {members.map(member => (
            <div key={member.id} className="team-card">
              {member.photo
                ? <img src={member.photo} alt={member.name} className="team-avatar" />
                : <div className="team-avatar-placeholder">{member.name?.[0]}</div>
              }
              <div className="team-info">
                <div className="item-name">{member.name}</div>
                <div className="item-meta">{member.role}</div>
                <div className="item-meta">{member.branch} {member.year && `· ${member.year}`}</div>
              </div>
              <button
                className="btn-icon danger"
                onClick={() => handleRemove(member.id)}
                disabled={deleting === member.id}
                aria-label="Remove team member"
              >
                {deleting === member.id ? '...' : <AdminIcon name="Trash" size={16} />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
