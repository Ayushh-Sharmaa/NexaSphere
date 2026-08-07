import { useState, useEffect } from "react";
import { api } from "../services/api";
import { Pagination } from "../components/Pagination";

export function RBACManager() {
  const [roles, setRoles] = useState({ defaultRoles: [], customRoles: [] });
  const [permissions, setPermissions] = useState([]);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("roles");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [matrix, setMatrix] = useState({});
  const [filters, setFilters] = useState({
    adminId: "",
    action: "",
    startDate: "",
    endDate: "",
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadData();
  }, [activeTab, page]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === "roles") {
        const rolesData = await api.rbac.getRoles();
        setRoles(rolesData);
      } else if (activeTab === "permissions") {
        const matrixData = await api.rbac.getPermissionMatrix();
        setMatrix(matrixData.matrix);
        const permsData = await api.rbac.getPermissions();
        setPermissions(permsData.permissions);
      } else if (activeTab === "users") {
        const usersData = await api.rbac.getUsersWithRoles();
        setUsers(usersData.users);
      } else if (activeTab === "audit") {
        const logsData = await api.rbac.getAuditLogs({
          ...filters,
          limit: 20,
          offset: (page - 1) * 20,
        });
        setAuditLogs(logsData.logs);
      }
    } catch (error) {
      console.error("Failed to load RBAC data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async (roleData) => {
    try {
      await api.rbac.createRole(roleData);
      setShowCreateModal(false);
      loadData();
    } catch (error) {
      console.error("Failed to create role:", error);
    }
  };

  const handleDeleteRole = async (roleName) => {
    if (!window.confirm(`Are you sure you want to delete role "${roleName}"?`))
      return;
    try {
      await api.rbac.deleteRole(roleName);
      loadData();
    } catch (error) {
      console.error("Failed to delete role:", error);
    }
  };

  const handleAssignRole = async (assignment) => {
    try {
      await api.rbac.assignRole(assignment);
      setShowAssignModal(false);
      loadData();
    } catch (error) {
      console.error("Failed to assign role:", error);
    }
  };

  const handleRevokeRole = async (userId, roleName) => {
    if (
      !window.confirm(
        `Are you sure you want to revoke "${roleName}" from this user?`
      )
    )
      return;
    try {
      await api.rbac.revokeRole(userId, roleName);
      loadData();
    } catch (error) {
      console.error("Failed to revoke role:", error);
    }
  };

  const tabs = [
    { key: "roles", label: "Roles" },
    { key: "permissions", label: "Permission Matrix" },
    { key: "users", label: "User Roles" },
    { key: "audit", label: "Audit Logs" },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Role-Based Access Control</h2>
        <p className="page-subtitle">
          Manage roles, permissions, and user access
        </p>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`tab ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          {/* Roles Tab */}
          {activeTab === "roles" && (
            <div className="section">
              <div className="section-header">
                <h3>System Roles</h3>
              </div>
              <div className="role-grid">
                {roles.defaultRoles.map((role) => (
                  <div key={role.key} className="role-card system">
                    <div className="role-header">
                      <h4>{role.name}</h4>
                      <span className="badge system">System</span>
                    </div>
                    <p>{role.description}</p>
                    <div className="role-meta">
                      <span>{role.permissions.length} permissions</span>
                      <span>Hierarchy: {role.hierarchy}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="section-header">
                <h3>Custom Roles</h3>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowCreateModal(true)}
                >
                  Create Role
                </button>
              </div>
              <div className="role-grid">
                {roles.customRoles.length === 0 ? (
                  <p className="empty-state">No custom roles created yet</p>
                ) : (
                  roles.customRoles.map((role) => (
                    <div key={role.name} className="role-card">
                      <div className="role-header">
                        <h4>{role.name}</h4>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteRole(role.name)}
                        >
                          Delete
                        </button>
                      </div>
                      <p>{role.description}</p>
                      <div className="role-meta">
                        <span>{role.permissions.length} permissions</span>
                        <span>Hierarchy: {role.hierarchy}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Permission Matrix Tab */}
          {activeTab === "permissions" && (
            <div className="section">
              <div className="section-header">
                <h3>Permission Matrix</h3>
              </div>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Role</th>
                      {permissions.map((p) => (
                        <th key={p.key} title={p.description}>
                          {p.key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(matrix).map(([roleName, roleData]) => (
                      <tr key={roleName}>
                        <td className="role-name">{roleData.name}</td>
                        {roleData.permissions.map((p) => (
                          <td
                            key={p.permission}
                            className={p.granted ? "granted" : "denied"}
                          >
                            {p.granted ? "✓" : "✗"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* User Roles Tab */}
          {activeTab === "users" && (
            <div className="section">
              <div className="section-header">
                <h3>User Role Assignments</h3>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowAssignModal(true)}
                >
                  Assign Role
                </button>
              </div>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Roles</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.display_name || user.username}</td>
                        <td>{user.email}</td>
                        <td>
                          <div className="role-tags">
                            {user.roles.map((role) => (
                              <span key={role} className="role-tag">
                                {role}
                                <button
                                  className="remove-tag"
                                  onClick={() =>
                                    handleRevokeRole(user.id, role)
                                  }
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Audit Logs Tab */}
          {activeTab === "audit" && (
            <div className="section">
              <div className="section-header">
                <h3>Audit Logs</h3>
                <div className="filters">
                  <input
                    type="text"
                    placeholder="Admin ID"
                    value={filters.adminId}
                    onChange={(e) =>
                      setFilters({ ...filters, adminId: e.target.value })
                    }
                  />
                  <input
                    type="text"
                    placeholder="Action"
                    value={filters.action}
                    onChange={(e) =>
                      setFilters({ ...filters, action: e.target.value })
                    }
                  />
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) =>
                      setFilters({ ...filters, startDate: e.target.value })
                    }
                  />
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) =>
                      setFilters({ ...filters, endDate: e.target.value })
                    }
                  />
                  <button className="btn btn-secondary" onClick={loadData}>
                    Filter
                  </button>
                </div>
              </div>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Admin</th>
                      <th>Action</th>
                      <th>Target User</th>
                      <th>IP Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td>{new Date(log.created_at).toLocaleString()}</td>
                        <td>{log.admin_id}</td>
                        <td>{log.action}</td>
                        <td>{log.target_user_id || "-"}</td>
                        <td>{log.ip_address}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}

      {/* Create Role Modal */}
      {showCreateModal && (
        <CreateRoleModal
          permissions={permissions}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateRole}
        />
      )}

      {/* Assign Role Modal */}
      {showAssignModal && (
        <AssignRoleModal
          roles={[...roles.defaultRoles, ...roles.customRoles]}
          users={users}
          onClose={() => setShowAssignModal(false)}
          onAssign={handleAssignRole}
        />
      )}
    </div>
  );
}

function CreateRoleModal({ permissions, onClose, onCreate }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [hierarchy, setHierarchy] = useState(10);

  const categories = [...new Set(permissions.map((p) => p.category))];

  const togglePermission = (perm) => {
    setSelectedPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const toggleCategory = (category, granted) => {
    const categoryPerms = permissions
      .filter((p) => p.category === category)
      .map((p) => p.key);
    if (granted) {
      setSelectedPermissions((prev) => [
        ...new Set([...prev, ...categoryPerms]),
      ]);
    } else {
      setSelectedPermissions((prev) =>
        prev.filter((p) => !categoryPerms.includes(p))
      );
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate({
      name,
      description,
      permissions: selectedPermissions,
      hierarchy,
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>Create Custom Role</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Role Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Hierarchy (lower = higher access)</label>
            <input
              type="number"
              value={hierarchy}
              onChange={(e) => setHierarchy(parseInt(e.target.value))}
              min="1"
              max="100"
            />
          </div>
          <div className="form-group">
            <label>Permissions</label>
            {categories.map((category) => (
              <div key={category} className="permission-category">
                <div className="category-header">
                  <label>
                    <input
                      type="checkbox"
                      checked={permissions
                        .filter((p) => p.category === category)
                        .every((p) => selectedPermissions.includes(p.key))}
                      onChange={(e) =>
                        toggleCategory(category, e.target.checked)
                      }
                    />
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </label>
                </div>
                <div className="permission-list">
                  {permissions
                    .filter((p) => p.category === category)
                    .map((perm) => (
                      <label key={perm.key} className="permission-item">
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes(perm.key)}
                          onChange={() => togglePermission(perm.key)}
                        />
                        {perm.key}
                      </label>
                    ))}
                </div>
              </div>
            ))}
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Role
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AssignRoleModal({ roles, users, onClose, onAssign }) {
  const [userId, setUserId] = useState("");
  const [roleName, setRoleName] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onAssign({
      userId: parseInt(userId),
      roleName,
      expiresAt: expiresAt || null,
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>Assign Role to User</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>User</label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
            >
              <option value="">Select a user</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.display_name || user.username} ({user.email})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Role</label>
            <select
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              required
            >
              <option value="">Select a role</option>
              {roles.map((role) => (
                <option
                  key={role.key || role.name}
                  value={role.key || role.name}
                >
                  {role.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Expiration (optional)</label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Assign Role
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
