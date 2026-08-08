import { useState, useCallback } from "react";
import { api } from "../services/api";
import { AdminIcon } from "./AdminIcon";
import { useFocusTrap } from "../hooks/useFocusTrap";

const ROLES = [
  "President",
  "Vice President",
  "Secretary",
  "Technical Lead",
  "Design Lead",
  "Marketing Lead",
  "Member",
];
const empty = {
  name: "",
  role: "Member",
  branch: "",
  year: "",
  email: "",
  linkedin: "",
  photo: "",
};

export function CoreTeamForm({ member, onClose }) {
  const [form, setForm] = useState(member || empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEdit = !!member;
  const handleClose = useCallback(() => onClose(), [onClose]);
  const modalRef = useFocusTrap(true, handleClose);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isEdit) {
        await api.coreTeam.update(member.id, form);
      } else {
        await api.coreTeam.add(form);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      ref={modalRef}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="core-team-form-title"
      >
        <div className="modal-header">
          <h3 id="core-team-form-title">
            {isEdit ? "Edit Core Team Member" : "Add Core Team Member"}
          </h3>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <AdminIcon name="X" size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="form">
          <div className="form-row">
            <label htmlFor="core-team-name">Name *</label>
            <input
              id="core-team-name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              autoComplete="name"
              required
            />
          </div>
          <div className="form-row">
            <label htmlFor="core-team-role">Role</label>
            <select
              id="core-team-role"
              value={form.role}
              onChange={(e) => set("role", e.target.value)}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label htmlFor="core-team-branch">Branch</label>
            <input
              id="core-team-branch"
              value={form.branch}
              onChange={(e) => set("branch", e.target.value)}
              placeholder="e.g. CSE"
              autoComplete="organization-title"
            />
          </div>
          <div className="form-row">
            <label htmlFor="core-team-year">Year</label>
            <input
              id="core-team-year"
              value={form.year}
              onChange={(e) => set("year", e.target.value)}
              placeholder="e.g. 2nd Year"
            />
          </div>
          <div className="form-row">
            <label htmlFor="core-team-email">Email</label>
            <input
              id="core-team-email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              type="email"
              autoComplete="email"
            />
          </div>
          <div className="form-row">
            <label htmlFor="core-team-linkedin">LinkedIn URL</label>
            <input
              id="core-team-linkedin"
              value={form.linkedin}
              onChange={(e) => set("linkedin", e.target.value)}
              type="url"
              inputMode="url"
              autoComplete="url"
            />
          </div>
          <div className="form-row">
            <label htmlFor="core-team-photo">Photo URL</label>
            <input
              id="core-team-photo"
              value={form.photo}
              onChange={(e) => set("photo", e.target.value)}
              type="url"
              inputMode="url"
              autoComplete="url"
            />
          </div>
          {error && <div className="form-error">{error}</div>}
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Saving..." : isEdit ? "Save Changes" : "Add Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
