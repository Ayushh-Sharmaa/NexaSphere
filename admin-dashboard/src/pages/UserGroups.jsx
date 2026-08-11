import React, { useState, useEffect } from 'react';
import { Skeleton, SkeletonText } from '../components/Skeleton';

export default function UserGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', permissions: '' });

  const [newMemberIds, setNewMemberIds] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailForm, setEmailForm] = useState({ subject: '', htmlContent: '' });

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/admin/groups', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch groups');
      const data = await res.json();
      setGroups(data.groups);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      const perms = form.permissions
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch('/api/admin/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          permissions: perms,
        }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to create group');
      setShowAddModal(false);
      setForm({ name: '', description: '', permissions: '' });
      fetchGroups();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteGroup = async (id) => {
    if (!confirm('Delete this group?')) return;
    try {
      const res = await fetch(`/api/admin/groups/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to delete group');
      if (selectedGroup?.id === id) setSelectedGroup(null);
      fetchGroups();
    } catch (err) {
      alert(err.message);
    }
  };

  const loadGroupMembers = async (group) => {
    setSelectedGroup(group);
    try {
      const res = await fetch(`/api/admin/groups/${group.id}/members`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load members');
      const data = await res.json();
      setGroupMembers(data.members);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddMembers = async (e) => {
    e.preventDefault();
    if (!selectedGroup) return;
    const ids = newMemberIds
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((id) => !isNaN(id));
    if (!ids.length) return alert('Enter valid student IDs');
    try {
      const res = await fetch(`/api/admin/groups/${selectedGroup.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds: ids }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to add members');
      setNewMemberIds('');
      loadGroupMembers(selectedGroup);
      fetchGroups();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRemoveMember = async (studentId) => {
    if (!selectedGroup) return;
    try {
      const res = await fetch(`/api/admin/groups/${selectedGroup.id}/members/${studentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to remove member');
      loadGroupMembers(selectedGroup);
      fetchGroups();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!selectedGroup) return;
    try {
      const res = await fetch(`/api/admin/groups/${selectedGroup.id}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailForm),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to send email');
      alert('Email queued successfully!');
      setShowEmailModal(false);
      setEmailForm({ subject: '', htmlContent: '' });
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        <Skeleton height={32} width="32%" />
        <div style={{ margin: '12px 0 20px' }}>
          <Skeleton height={36} width={160} />
        </div>

        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #444' }}>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Members</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 4 }).map((_, rowIndex) => (
                  <tr key={rowIndex} style={{ borderBottom: '1px solid #333' }}>
                    <td style={{ padding: 8 }}>
                      <Skeleton height={16} width="78%" />
                    </td>
                    <td style={{ padding: 8 }}>
                      <Skeleton height={16} width="88%" />
                    </td>
                    <td style={{ padding: 8 }}>
                      <Skeleton height={16} width="36%" />
                    </td>
                    <td style={{ padding: 8 }}>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <Skeleton height={28} width={112} />
                        <Skeleton height={28} width={72} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div
            style={{
              flex: 1,
              backgroundColor: 'rgba(255,255,255,0.05)',
              padding: 20,
              borderRadius: 8,
            }}
          >
            <Skeleton height={24} width="62%" />
            <div style={{ display: 'flex', gap: 10, margin: '18px 0 20px' }}>
              <Skeleton height={34} width={140} />
            </div>
            <SkeletonText lines={4} width="100%" />
          </div>
        </div>
      </div>
    );
  }
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ padding: 20 }}>
      <h1>User Groups</h1>
      <button onClick={() => setShowAddModal(true)} style={{ marginBottom: 20 }}>
        + Create Group
      </button>

      <div style={{ display: 'flex', gap: 20 }}>
        {/* Groups List */}
        <div style={{ flex: 1 }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #444' }}>
                <th>Name</th>
                <th>Description</th>
                <th>Members</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <tr key={g.id} style={{ borderBottom: '1px solid #333' }}>
                  <td style={{ padding: 8 }}>{g.name}</td>
                  <td style={{ padding: 8 }}>{g.description}</td>
                  <td style={{ padding: 8 }}>{g.memberCount}</td>
                  <td style={{ padding: 8, display: 'flex', gap: 10 }}>
                    <button onClick={() => loadGroupMembers(g)}>Manage Members</button>
                    <button onClick={() => handleDeleteGroup(g.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Selected Group Management */}
        {selectedGroup && (
          <div
            style={{
              flex: 1,
              backgroundColor: 'rgba(255,255,255,0.05)',
              padding: 20,
              borderRadius: 8,
            }}
          >
            <h2>Manage Members: {selectedGroup.name}</h2>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              <button
                onClick={() => setShowEmailModal(true)}
                style={{ backgroundColor: '#4a90e2' }}
              >
                ✉ Bulk Email Group
              </button>
            </div>
            <form
              onSubmit={handleAddMembers}
              style={{ display: 'flex', gap: 10, marginBottom: 20 }}
            >
              <input
                type="text"
                placeholder="Comma-separated student IDs"
                value={newMemberIds}
                onChange={(e) => setNewMemberIds(e.target.value)}
                style={{ flex: 1, padding: 8 }}
              />
              <button type="submit">Add</button>
            </form>

            <ul style={{ listStyle: 'none', padding: 0 }}>
              {groupMembers.map((m) => (
                <li
                  key={m.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px 0',
                    borderBottom: '1px solid #333',
                  }}
                >
                  <span>
                    {m.full_name} ({m.email}) - ID: {m.id}
                  </span>
                  <button onClick={() => handleRemoveMember(m.id)}>Remove</button>
                </li>
              ))}
              {groupMembers.length === 0 && <p>No members in this group.</p>}
            </ul>
          </div>
        )}
      </div>

      {showEmailModal && selectedGroup && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ backgroundColor: '#1a1a2e', padding: 30, borderRadius: 8, width: 500 }}>
            <h2>Send Email to {selectedGroup.name}</h2>
            <form
              onSubmit={handleSendEmail}
              style={{ display: 'flex', flexDirection: 'column', gap: 15 }}
            >
              <input
                placeholder="Subject"
                value={emailForm.subject}
                onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                required
              />
              <textarea
                placeholder="HTML Content"
                value={emailForm.htmlContent}
                onChange={(e) => setEmailForm({ ...emailForm, htmlContent: e.target.value })}
                required
                style={{ minHeight: 150 }}
              />
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit">Send Email</button>
                <button type="button" onClick={() => setShowEmailModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ backgroundColor: '#1a1a2e', padding: 30, borderRadius: 8, width: 400 }}>
            <h2>Create New Group</h2>
            <form
              onSubmit={handleCreateGroup}
              style={{ display: 'flex', flexDirection: 'column', gap: 15 }}
            >
              <input
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <textarea
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <input
                placeholder="Permissions (comma separated)"
                value={form.permissions}
                onChange={(e) => setForm({ ...form, permissions: e.target.value })}
              />
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit">Create</button>
                <button type="button" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
