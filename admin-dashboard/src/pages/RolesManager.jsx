import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

export function RolesManager() {
  const { email } = useAuth();

  // Mock State for Roles
  const [roles, setRoles] = useState([
    {
      id: 1,
      name: 'Super Admin',
      description: 'Full access to all platform features',
      permissions: ['events:read', 'events:write', 'settings:admin'],
    },
    {
      id: 2,
      name: 'Event Manager',
      description: 'Can manage events and registrations',
      permissions: ['events:read', 'events:write'],
    },
    {
      id: 3,
      name: 'Content Moderator',
      description: 'Can review and moderate forum posts',
      permissions: ['forum:read', 'forum:write'],
    },
  ]);

  // Mock State for Admins
  const [admins, setAdmins] = useState([
    { id: 101, email: 'admin@nexasphere.com', roleId: 1, status: 'Active' },
    { id: 102, email: 'events@nexasphere.com', roleId: 2, status: 'Active' },
  ]);

  const [loading, setLoading] = useState(true);

  // Modals state
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleForm, setRoleForm] = useState({ name: '', description: '', permissions: [] });
  const availablePermissions = [
    'events:read',
    'events:write',
    'settings:admin',
    'users:read',
    'users:write',
    'forum:read',
    'forum:write',
  ];

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', roleId: '' });

  useEffect(() => {
    // Simulate API fetch
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleCreateRole = (e) => {
    e.preventDefault();
    const newRole = {
      id: Date.now(),
      name: roleForm.name,
      description: roleForm.description,
      permissions: roleForm.permissions,
    };
    setRoles([...roles, newRole]);
    setShowRoleModal(false);
    setRoleForm({ name: '', description: '', permissions: [] });
    alert('Role created successfully!');
  };

  const handleDeleteRole = (id) => {
    if (!window.confirm('Delete this role? Any admins with this role will lose their permissions.'))
      return;
    setRoles(roles.filter((r) => r.id !== id));
  };

  const togglePermission = (perm) => {
    setRoleForm((prev) => {
      const perms = prev.permissions;
      if (perms.includes(perm)) {
        return { ...prev, permissions: perms.filter((p) => p !== perm) };
      } else {
        return { ...prev, permissions: [...perms, perm] };
      }
    });
  };

  const handleInviteAdmin = (e) => {
    e.preventDefault();
    if (!inviteForm.roleId) return alert('Please select a role.');
    const newAdmin = {
      id: Date.now(),
      email: inviteForm.email,
      roleId: parseInt(inviteForm.roleId, 10),
      status: 'Pending',
    };
    setAdmins([...admins, newAdmin]);
    setShowInviteModal(false);
    setInviteForm({ email: '', roleId: '' });
    alert(`Invitation sent to ${inviteForm.email}!`);
  };

  const handleRevokeAccess = (id) => {
    if (!window.confirm('Revoke access for this admin?')) return;
    setAdmins(admins.filter((a) => a.id !== id));
  };

  if (loading) return <div style={{ padding: 20, color: 'var(--text)' }}>Loading Roles...</div>;

  return (
    <div className="page" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">User Roles Management</h1>
          <p style={{ color: 'var(--text2)', marginTop: '4px' }}>
            Manage admin roles and invite team members to co-manage the platform securely.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px' }}>
        {/* Roles Section */}
        <div
          style={{
            flex: '1 1 350px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            padding: '20px',
            borderRadius: 'var(--radius)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}
          >
            <h2 style={{ fontSize: '18px', margin: 0, color: 'var(--text)' }}>Roles</h2>
            <button className="btn-primary" onClick={() => setShowRoleModal(true)}>
              + Custom Role
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {roles.map((r) => (
              <div
                key={r.id}
                style={{
                  padding: '16px',
                  backgroundColor: 'var(--surface2)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', color: 'var(--text)' }}>
                      {r.name}
                    </h3>
                    <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--text2)' }}>
                      {r.description}
                    </p>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {r.permissions.map((p) => (
                        <span
                          key={p}
                          style={{
                            fontSize: '11px',
                            padding: '3px 8px',
                            backgroundColor: 'rgba(204, 17, 17, 0.15)',
                            color: 'var(--red)',
                            borderRadius: '12px',
                            fontWeight: 500,
                          }}
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                  {r.id !== 1 && (
                    <button
                      onClick={() => handleDeleteRole(r.id)}
                      className="btn-icon danger"
                      title="Delete Role"
                      style={{ color: '#ff4444' }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Admins Section */}
        <div
          style={{
            flex: '1 1 450px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            padding: '20px',
            borderRadius: 'var(--radius)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}
          >
            <h2 style={{ fontSize: '18px', margin: 0, color: 'var(--text)' }}>Admin Users</h2>
            <button className="btn-primary" onClick={() => setShowInviteModal(true)}>
              + Invite Admin
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px',
                color: 'var(--text)',
              }}
            >
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 8px', color: 'var(--text2)', fontWeight: 600 }}>
                    Email
                  </th>
                  <th style={{ padding: '12px 8px', color: 'var(--text2)', fontWeight: 600 }}>
                    Role
                  </th>
                  <th style={{ padding: '12px 8px', color: 'var(--text2)', fontWeight: 600 }}>
                    Status
                  </th>
                  <th
                    style={{
                      padding: '12px 8px',
                      color: 'var(--text2)',
                      fontWeight: 600,
                      textAlign: 'right',
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => {
                  const role = roles.find((r) => r.id === admin.roleId);
                  return (
                    <tr key={admin.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 8px' }}>{admin.email}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <span
                          style={{
                            padding: '4px 8px',
                            backgroundColor: 'var(--surface2)',
                            borderRadius: '12px',
                            fontSize: '12px',
                            border: '1px solid var(--border)',
                          }}
                        >
                          {role ? role.name : 'Unknown Role'}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: '12px 8px',
                          color: admin.status === 'Active' ? '#22c55e' : '#eab308',
                        }}
                      >
                        {admin.status}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                        {admin.email !== email && (
                          <button
                            onClick={() => handleRevokeAccess(admin.id)}
                            className="btn-secondary"
                            style={{
                              padding: '4px 8px',
                              fontSize: '12px',
                              borderColor: 'transparent',
                              color: '#ef4444',
                            }}
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Role Modal */}
      {showRoleModal && (
        <div className="modal-overlay" onClick={() => setShowRoleModal(false)}>
          <div
            style={{
              backgroundColor: 'var(--surface)',
              padding: '24px',
              borderRadius: 'var(--radius)',
              width: '500px',
              maxWidth: '95%',
              border: '1px solid var(--border)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', color: 'var(--text)' }}>
              Create Custom Role
            </h2>
            <form onSubmit={handleCreateRole} className="form">
              <div className="form-row">
                <label>Role Name</label>
                <input
                  type="text"
                  value={roleForm.name}
                  onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                  required
                  placeholder="e.g. Marketing Lead"
                />
              </div>
              <div className="form-row">
                <label>Description</label>
                <input
                  type="text"
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                  required
                  placeholder="What can this role do?"
                />
              </div>
              <div className="form-row">
                <label>Permissions</label>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px',
                    maxHeight: '180px',
                    overflowY: 'auto',
                    padding: '12px',
                    background: 'var(--surface2)',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {availablePermissions.map((perm) => (
                    <label
                      key={perm}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '13px',
                        cursor: 'pointer',
                        color: 'var(--text)',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={roleForm.permissions.includes(perm)}
                        onChange={() => togglePermission(perm)}
                        style={{ width: 'auto', accentColor: 'var(--red)' }}
                      />
                      {perm}
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-actions" style={{ marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowRoleModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Admin Modal */}
      {showInviteModal && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div
            style={{
              backgroundColor: 'var(--surface)',
              padding: '24px',
              borderRadius: 'var(--radius)',
              width: '400px',
              maxWidth: '95%',
              border: '1px solid var(--border)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', color: 'var(--text)' }}>
              Invite Admin
            </h2>
            <form onSubmit={handleInviteAdmin} className="form">
              <div className="form-row">
                <label>Email Address</label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  required
                  placeholder="admin@example.com"
                />
              </div>
              <div className="form-row">
                <label>Assign Role</label>
                <select
                  value={inviteForm.roleId}
                  onChange={(e) => setInviteForm({ ...inviteForm, roleId: e.target.value })}
                  required
                >
                  <option value="" disabled>
                    Select a role...
                  </option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-actions" style={{ marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowInviteModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default RolesManager;
