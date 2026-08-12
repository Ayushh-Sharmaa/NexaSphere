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
  const [editingMember, setEditingMember] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  useEffect(() => {
    api.coreTeam
      .getAll()
      .then((data) => setMembers(data?.members ?? []))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      !searchQuery ||
      (member.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.role || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBranch = !selectedBranch || member.branch === selectedBranch;
    const matchesRole = !selectedRole || member.role === selectedRole;
    return matchesSearch && matchesBranch && matchesRole;
  });

  useEventListener(
    EVENTS.CORE_TEAM_MEMBER_ADDED,
    useCallback((member) => {
      setMembers((prev) => [...prev, member]);
      setShowForm(false);
    }, [])
  );

  useEventListener(
    EVENTS.CORE_TEAM_MEMBER_UPDATED,
    useCallback((updatedMember) => {
      setMembers((prev) => prev.map((m) => (m.id === updatedMember.id ? updatedMember : m)));
      setShowForm(false);
      setEditingMember(null);
    }, [])
  );

  useEventListener(
    EVENTS.CORE_TEAM_MEMBER_REMOVED,
    useCallback(({ id }) => {
      setMembers((prev) => prev.filter((m) => m.id !== id));
    }, [])
  );

  const handleRemove = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleting(id);
    setDeleteError('');
    try {
      await api.coreTeam.remove(id);
      setDeleteTarget(null);
    } catch {
      setDeleteError('Failed to remove member. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Core Team</h2>
        <button
          className="btn-primary"
          onClick={() => {
            setEditingMember(null);
            setShowForm(true);
          }}
        >
          + Add Member
        </button>
      </div>

      {showForm && (
        <CoreTeamForm
          member={editingMember}
          onClose={() => {
            setShowForm(false);
            setEditingMember(null);
          }}
        />
      )}

      {loading && <Skeleton height={72} count={4} />}

      {!loading && (
        <>
          <div
            className="filters-row animate-fade-in"
            style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}
          >
            <input
              type="text"
              placeholder="Search by name or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 2,
                minWidth: 200,
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)',
              }}
            />
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              style={{
                flex: 1,
                minWidth: 140,
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)',
              }}
              aria-label="Filter by branch"
            >
              <option value="">All Branches</option>
              {[...new Set(members.map((m) => m.branch).filter(Boolean))].map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              style={{
                flex: 1,
                minWidth: 140,
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)',
              }}
              aria-label="Filter by role"
            >
              <option value="">All Roles</option>
              {[...new Set(members.map((m) => m.role).filter(Boolean))].map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <div className="team-grid">
            {filteredMembers.length === 0 && (
              <div className="empty-state">No core team members match your criteria.</div>
            )}
            {filteredMembers.map((member) => (
              <div key={member.id} className="team-card animate-fade-in">
                {member.photo ? (
                  <img
                    loading="lazy"
                    src={member.photo}
                    alt={member.name}
                    className="team-avatar"
                  />
                ) : (
                  <div className="team-avatar-placeholder">{member.name?.[0]}</div>
                )}
                <div className="team-info">
                  <div className="item-name">{member.name}</div>
                  <div className="item-meta">{member.role}</div>
                  <div className="item-meta">
                    {member.branch} {member.year && `· ${member.year}`}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    className="btn-icon"
                    onClick={() => {
                      setEditingMember(member);
                      setShowForm(true);
                    }}
                    aria-label="Edit team member"
                  >
                    <AdminIcon name="Pencil" size={16} />
                  </button>
                  <button
                    className="btn-icon danger"
                    onClick={() => {
                      setDeleteTarget(member);
                      setDeleteError('');
                    }}
                    disabled={deleting === member.id}
                    aria-label="Remove team member"
                  >
                    {deleting === member.id ? '...' : <AdminIcon name="Trash" size={16} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {deleteTarget && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-member-title"
        >
          <div className="modal">
            <div className="modal-header">
              <h3 id="delete-member-title">Remove Team Member</h3>
              <button
                className="modal-close"
                onClick={() => setDeleteTarget(null)}
                aria-label="Close"
              >
                <AdminIcon name="X" size={16} />
              </button>
            </div>
            <p className="page-subtitle" style={{ marginBottom: 16 }}>
              This will remove "{deleteTarget.name}" from the core team list.
            </p>
            {deleteError && <div className="page-error">{deleteError}</div>}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 10,
                marginTop: 20,
              }}
            >
              <button
                className="btn-secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting === deleteTarget.id}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleRemove}
                disabled={deleting === deleteTarget.id}
              >
                {deleting === deleteTarget.id ? 'Removing...' : 'Remove Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
