import { useState, useEffect } from "react";
import UserTimelineModal from "../components/UserTimelineModal";
import { Skeleton } from "../components/Skeleton";
import { HelpTooltip } from "../components/HelpTooltip";

const ROLES = ["member", "moderator", "admin"];
const PASSWORD_REQUIREMENTS = [
  { test: (value) => value.length >= 8, message: "at least 8 characters" },
  { test: (value) => /[A-Z]/.test(value), message: "one uppercase letter" },
  { test: (value) => /[a-z]/.test(value), message: "one lowercase letter" },
  { test: (value) => /[0-9]/.test(value), message: "one number" },
  {
    test: (value) => /[^A-Za-z0-9]/.test(value),
    message: "one special character",
  },
];

function getPasswordValidationError(password) {
  const missing = PASSWORD_REQUIREMENTS.filter(
    (requirement) => !requirement.test(password)
  ).map((requirement) => requirement.message);
  return missing.length ? `Password must include ${missing.join(", ")}.` : "";
}

export default function UserManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const [awardBadgeUser, setAwardBadgeUser] = useState(null);
  const [badgeForm, setBadgeForm] = useState({
    name: "",
    description: "",
    icon: "Award",
  });
  const [editUser, setEditUser] = useState(null);
  const [timelineUser, setTimelineUser] = useState(null);
  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [resetPasswordForm, setResetPasswordForm] = useState({
    newPassword: "",
  });
  const [resetPasswordError, setResetPasswordError] = useState("");
  const [form, setForm] = useState({
    username: "",
    display_name: "",
    email: "",
    admin_roles: "member",
  });

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let interval;
    if (importJobId && importProgress !== 100) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/admin/bulk/jobs/${importJobId}`, {
            credentials: "include",
          });
          if (res.ok) {
            const job = await res.json();
            setImportProgress(job.progress);
            if (job.status === "completed" || job.status === "failed") {
              setImportErrors(job.errors || []);
              clearInterval(interval);
              fetchUsers(); // Refresh after import
            }
          }
        } catch (err) {
          console.error("Failed to poll job status");
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [importJobId, importProgress]);

  function downloadCsvTemplate() {
    const template =
      "email,username,displayname,role,major,year,tags\njohn@college.edu,johndoe,John Doe,user,Computer Science,2028,tech;sports\n";
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleFileSelected(e) {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    setCsvText(text);

    // Get preview
    const res = await fetch("/api/admin/bulk/users/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ csv: text }),
    });
    if (res.ok) {
      const data = await res.json();
      setImportPreview(data);
    } else {
      alert("Failed to generate preview");
    }
  }

  async function handleImportSubmit() {
    if (!csvText) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/bulk/users/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ csv: csvText }),
      });
      if (res.ok) {
        const job = await res.json();
        setImportJobId(job.id);
        setImportProgress(0);
      } else {
        alert("Failed to start import");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreate() {
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowAddModal(false);
      setForm({
        username: "",
        display_name: "",
        email: "",
        admin_roles: "member",
      });
      fetchUsers();
    } else {
      const d = await res.json();
      alert(d.error);
    }
  }

  async function handleUpdate() {
    const res = await fetch(`/api/admin/users/${editUser.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        display_name: form.display_name,
        email: form.email,
        admin_roles: form.admin_roles,
      }),
    });
    if (res.ok) {
      setEditUser(null);
      fetchUsers();
    } else {
      const d = await res.json();
      alert(d.error);
    }
  }

  async function handleDeactivate(id) {
    if (!window.confirm("Deactivate this user?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) fetchUsers();
      else {
        const d = await res.json();
        alert(d.error);
      }
    } finally {
      setDeleting(null);
    }
  }

  async function handleAwardBadge() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${awardBadgeUser.id}/badges`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...badgeForm,
          isCustom: true,
          earnedAt: new Date(),
        }),
      });
      if (res.ok) {
        setAwardBadgeUser(null);
        setBadgeForm({ name: "", description: "", icon: "Award" });
        fetchUsers();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to award badge");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUnlock(id) {
    if (!window.confirm("Unlock this user account?")) return;
    try {
      const res = await fetch(`/api/admin/users/${id}/unlock`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) alert("Account unlocked successfully");
      else alert("Failed to unlock");
    } catch (e) {
      console.error(e);
      alert("Error unlocking account");
    }
  }

  function openResetPassword(user) {
    setResetPasswordUser(user);
    setResetPasswordForm({ newPassword: "" });
    setResetPasswordError("");
  }

  function closeResetPassword() {
    setResetPasswordUser(null);
    setResetPasswordForm({ newPassword: "" });
    setResetPasswordError("");
  }

  async function handleResetPassword() {
    const newPassword = resetPasswordForm.newPassword;
    const validationError = getPasswordValidationError(newPassword);
    if (validationError) {
      setResetPasswordError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/admin/users/${resetPasswordUser.id}/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ newPassword }),
        }
      );
      if (res.ok) {
        closeResetPassword();
        alert("Password reset successfully");
      } else {
        alert("Failed to reset password");
      }
    } catch (e) {
      console.error(e);
      alert("Error resetting password");
    } finally {
      setSubmitting(false);
    }
  }

  function openEdit(user) {
    setEditUser(user);
    setForm({
      username: user.username,
      display_name: user.display_name,
      email: user.email,
      admin_roles: user.admin_roles,
    });
  }

  if (loading) {
    return (
      <div style={{ padding: "24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
            gap: "16px",
          }}
        >
          <div style={{ flex: 1, maxWidth: "320px" }}>
            <Skeleton height={28} width="45%" />
            <div style={{ marginTop: "8px" }}>
              <Skeleton height={16} width="70%" />
            </div>
          </div>
          <Skeleton height={36} width={120} />
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {[
                "Username",
                "Display Name",
                "Email",
                "Role",
                "Joined",
                "Actions",
              ].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    borderBottom: "1px solid #ccc",
                    padding: "8px",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                <td style={{ padding: "8px" }}>
                  <Skeleton height={16} width="72%" />
                </td>
                <td style={{ padding: "8px" }}>
                  <Skeleton height={16} width="68%" />
                </td>
                <td style={{ padding: "8px" }}>
                  <Skeleton height={16} width="84%" />
                </td>
                <td style={{ padding: "8px" }}>
                  <Skeleton height={16} width="58%" />
                </td>
                <td style={{ padding: "8px" }}>
                  <Skeleton height={16} width="52%" />
                </td>
                <td style={{ padding: "8px" }}>
                  <div
                    style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}
                  >
                    <Skeleton height={28} width={58} />
                    <Skeleton height={28} width={86} />
                    <Skeleton height={28} width={64} />
                    <Skeleton height={28} width={108} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (error) return <p>{error}</p>;

  return (
    <div style={{ padding: "24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <h2 style={{ margin: 0 }}>User Management</h2>
          <HelpTooltip
            content="Register new users, assign administrator permissions (member, moderator, admin), unlock security locks, and reset passwords."
            position="right"
          />
        </div>
        <button onClick={() => setShowAddModal(true)}>+ Add User</button>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {[
              "Username",
              "Display Name",
              "Email",
              "Role",
              "Joined",
              "Actions",
            ].map((h) => (
              <th
                key={h}
                style={{
                  textAlign: "left",
                  borderBottom: "1px solid #ccc",
                  padding: "8px",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td style={{ padding: "8px" }}>{user.username}</td>
              <td style={{ padding: "8px" }}>{user.display_name}</td>
              <td style={{ padding: "8px" }}>{user.email}</td>
              <td style={{ padding: "8px" }}>{user.admin_roles}</td>
              <td style={{ padding: "8px" }}>
                {user.joined_at
                  ? new Date(user.joined_at).toLocaleDateString()
                  : "-"}
              </td>
              <td style={{ padding: "8px", display: "flex", gap: "8px" }}>
                <button
                  onClick={() => openEdit(user)}
                  disabled={deleting === user.id || submitting}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeactivate(user.id)}
                  disabled={submitting}
                >
                  Deactivate
                </button>
                <button
                  onClick={() => setAwardBadgeUser(user)}
                  disabled={submitting}
                  style={{ background: "#8B5CF6", color: "white" }}
                >
                  Award Badge
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {(showAddModal || editUser) && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "24px",
              borderRadius: "8px",
              minWidth: "320px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <h3>{editUser ? "Edit User" : "Add User"}</h3>
            {!editUser && (
              <input
                placeholder="Username"
                value={form.username}
                onChange={(e) =>
                  setForm((f) => ({ ...f, username: e.target.value }))
                }
              />
            )}
            <input
              placeholder="Display Name"
              value={form.display_name}
              onChange={(e) =>
                setForm((f) => ({ ...f, display_name: e.target.value }))
              }
            />
            <input
              placeholder="Email"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
            />
            <select
              value={form.admin_roles}
              onChange={(e) =>
                setForm((f) => ({ ...f, admin_roles: e.target.value }))
              }
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={editUser ? handleUpdate : handleCreate}>
                {editUser ? "Save" : "Create"}
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditUser(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {awardBadgeUser && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "24px",
              borderRadius: "8px",
              minWidth: "320px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <h3>Award Badge to {awardBadgeUser.username}</h3>
            <input
              placeholder="Badge Name (e.g., Top Contributor)"
              value={badgeForm.name}
              onChange={(e) =>
                setBadgeForm((f) => ({ ...f, name: e.target.value }))
              }
            />
            <input
              placeholder="Description"
              value={badgeForm.description}
              onChange={(e) =>
                setBadgeForm((f) => ({ ...f, description: e.target.value }))
              }
            />
            <select
              value={badgeForm.icon}
              onChange={(e) =>
                setBadgeForm((f) => ({ ...f, icon: e.target.value }))
              }
            >
              <option value="Award">Award</option>
              <option value="Star">Star</option>
              <option value="Shield">Shield</option>
              <option value="Zap">Zap</option>
              <option value="Target">Target</option>
            </select>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={handleAwardBadge}
                style={{ background: "#8B5CF6", color: "white" }}
              >
                Award
              </button>
              <button
                onClick={() => {
                  setAwardBadgeUser(null);
                  setBadgeForm({ name: "", description: "", icon: "Award" });
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {resetPasswordUser && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "24px",
              borderRadius: "8px",
              minWidth: "320px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <h3>Reset Password</h3>
            <p style={{ margin: 0 }}>
              Set a new password for{" "}
              {resetPasswordUser.display_name || resetPasswordUser.email}.
            </p>
            <input
              type="password"
              placeholder="New Password"
              autoComplete="new-password"
              value={resetPasswordForm.newPassword}
              onChange={(e) => {
                const newPassword = e.target.value;
                setResetPasswordForm({ newPassword });
                setResetPasswordError(getPasswordValidationError(newPassword));
              }}
            />
            <small>
              Password must include uppercase, lowercase, number, special
              character, and be at least 8 characters.
            </small>
            {resetPasswordError && (
              <p style={{ color: "red", margin: 0 }}>{resetPasswordError}</p>
            )}
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={handleResetPassword} disabled={submitting}>
                Reset Password
              </button>
              <button onClick={closeResetPassword} disabled={submitting}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {timelineUser && (
        <UserTimelineModal
          user={timelineUser}
          onClose={() => setTimelineUser(null)}
        />
      )}
    </div>
  );
}
