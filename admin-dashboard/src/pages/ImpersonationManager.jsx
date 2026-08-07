import { useState, useEffect, useCallback } from "react";
import { api } from "../services/api";
import { eventEmitter, EVENTS } from "../services/eventEmitter";

export function ImpersonationManager() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [impersonating, setImpersonating] = useState(null);

  const refreshStatus = useCallback(async () => {
    try {
      const r = await api.impersonate.status();
      setImpersonating(r.impersonating ? r.user : null);
    } catch {
      setImpersonating(null);
    }
  }, []);

  useEffect(() => {
    api.users
      .getAll()
      .then((r) => setUsers(r.users || []))
      .catch(() => {});
    refreshStatus();
  }, [refreshStatus]);

  const start = async (user) => {
    try {
      const r = await api.impersonate.start(user.id);
      setImpersonating(r.user);
      eventEmitter.emit(EVENTS.IMPERSONATION_STARTED, { user: r.user });
    } catch (e) {
      eventEmitter.emit(EVENTS.NOTIFY, { type: "error", message: e.message });
    }
  };

  const stop = async () => {
    try {
      await api.impersonate.stop();
      setImpersonating(null);
      eventEmitter.emit(EVENTS.IMPERSONATION_STOPPED);
    } catch (e) {
      eventEmitter.emit(EVENTS.NOTIFY, { type: "error", message: e.message });
    }
  };

  const filtered = users.filter((u) =>
    [u.username, u.display_name, u.email].some((f) =>
      f?.toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div className="page-container">
      <h2>User Impersonation</h2>
      {impersonating && (
        <div className="alert alert-warning">
          Currently viewing as{" "}
          <strong>
            {impersonating.display_name || impersonating.username}
          </strong>
          <button
            className="btn btn-sm btn-outline"
            style={{ marginLeft: 12 }}
            onClick={stop}
          >
            Stop Impersonating
          </button>
        </div>
      )}
      <input
        className="form-input"
        placeholder="Search users by name, username, or email..."
        autoFocus
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 16 }}
      />
      <table className="admin-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Name</th>
            <th>Email</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((u) => (
            <tr key={u.id}>
              <td>{u.username}</td>
              <td>{u.display_name || "-"}</td>
              <td>{u.email}</td>
              <td>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => start(u)}
                >
                  Impersonate
                </button>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td
                colSpan={4}
                style={{ textAlign: "center", padding: 32, color: "#888" }}
              >
                No users found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
