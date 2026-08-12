import { useState, useCallback } from "react";
import { api } from "../services/api";
import { AdminIcon } from "./AdminIcon";
import { useFocusTrap } from "../hooks/useFocusTrap";

const TIERS = ["platinum", "gold", "silver", "bronze", "custom"];
const STATUSES = ["active", "expired", "pending"];

const empty = {
  companyName: "",
  logoUrl: "",
  description: "",
  websiteUrl: "",
  contactPerson: "",
  contactEmail: "",
  tier: "bronze",
  agreementStart: "",
  agreementEnd: "",
  amount: "",
  benefitsInput: "",
  status: "active",
  isFeatured: false,
  sortOrder: 0,
};

export function SponsorshipForm({ sponsor, onClose }) {
  const handleClose = useCallback(() => onClose(), [onClose]);
  const modalRef = useFocusTrap(true, handleClose);
  const [form, setForm] = useState(
    sponsor
      ? {
          ...sponsor,
          benefitsInput: Array.isArray(sponsor.benefits)
            ? sponsor.benefits.join(", ")
            : sponsor.benefits || "",
          amount: sponsor.amount ?? "",
          agreementStart: sponsor.agreementStart || "",
          agreementEnd: sponsor.agreementEnd || "",
          sortOrder: sponsor.sortOrder ?? 0,
        }
      : { ...empty }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const benefits = form.benefitsInput
        ? form.benefitsInput
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];
      const payload = {
        ...form,
        benefits,
        amount: form.amount ? parseFloat(form.amount) : null,
      };
      delete payload.benefitsInput;

      if (sponsor?.id) {
        await api.sponsorships.update(sponsor.id, payload);
      } else {
        await api.sponsorships.create(payload);
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
        aria-labelledby="sponsorship-form-title"
        style={{ maxWidth: 600, maxHeight: "90vh", overflowY: "auto" }}
      >
        <div className="modal-header">
          <h3 id="sponsorship-form-title">
            {sponsor?.id ? "Edit Sponsor" : "Add Sponsor"}
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
            <label htmlFor="sponsor-company-name">Company Name *</label>
            <input
              id="sponsor-company-name"
              value={form.companyName}
              onChange={(e) => set("companyName", e.target.value)}
              placeholder="e.g. TechCorp India"
              autoComplete="organization"
              required
            />
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <div className="form-row">
              <label htmlFor="sponsor-tier">Sponsorship Tier</label>
              <select
                id="sponsor-tier"
                value={form.tier}
                onChange={(e) => set("tier", e.target.value)}
              >
                {TIERS.map((t) => (
                  <option key={t} value={t}>
                    {t[0].toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <label htmlFor="sponsor-status">Status</label>
              <select
                id="sponsor-status"
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s[0].toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <label htmlFor="sponsor-description">Description</label>
            <textarea
              id="sponsor-description"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              placeholder="Brief description of the sponsor..."
            />
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <div className="form-row">
              <label htmlFor="sponsor-logo-url">Logo URL</label>
              <input
                id="sponsor-logo-url"
                value={form.logoUrl}
                onChange={(e) => set("logoUrl", e.target.value)}
                placeholder="https://example.com/logo.png"
                type="url"
                inputMode="url"
                autoComplete="url"
              />
            </div>
            <div className="form-row">
              <label htmlFor="sponsor-website-url">Website URL</label>
              <input
                id="sponsor-website-url"
                value={form.websiteUrl}
                onChange={(e) => set("websiteUrl", e.target.value)}
                placeholder="https://example.com"
                type="url"
                inputMode="url"
                autoComplete="url"
              />
            </div>
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <div className="form-row">
              <label htmlFor="sponsor-contact-person">Contact Person</label>
              <input
                id="sponsor-contact-person"
                value={form.contactPerson}
                onChange={(e) => set("contactPerson", e.target.value)}
                placeholder="Rahul Sharma"
                autoComplete="name"
              />
            </div>
            <div className="form-row">
              <label htmlFor="sponsor-contact-email">Contact Email</label>
              <input
                id="sponsor-contact-email"
                type="email"
                value={form.contactEmail}
                onChange={(e) => set("contactEmail", e.target.value)}
                placeholder="rahul@example.com"
                autoComplete="email"
              />
            </div>
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <div className="form-row">
              <label htmlFor="sponsor-agreement-start">Agreement Start</label>
              <input
                id="sponsor-agreement-start"
                type="date"
                value={form.agreementStart}
                onChange={(e) => set("agreementStart", e.target.value)}
                style={{ colorScheme: "dark" }}
              />
            </div>
            <div className="form-row">
              <label htmlFor="sponsor-agreement-end">Agreement End</label>
              <input
                id="sponsor-agreement-end"
                type="date"
                value={form.agreementEnd}
                onChange={(e) => set("agreementEnd", e.target.value)}
                style={{ colorScheme: "dark" }}
              />
            </div>
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <div className="form-row">
              <label>Sponsorship Amount (₹)</label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => set("amount", e.target.value)}
                placeholder="e.g. 500000"
                inputMode="decimal"
                min="0"
              />
            </div>
            <div className="form-row">
              <label>Sort Order</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) =>
                  set("sortOrder", parseInt(e.target.value) || 0)
                }
                placeholder="0"
                inputMode="numeric"
                min="0"
              />
            </div>
          </div>

          <div
            className="form-row"
            style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
          >
            <label style={{ marginBottom: 0 }}>Featured</label>
            <button
              type="button"
              onClick={() => set("isFeatured", !form.isFeatured)}
              style={{
                width: 42,
                height: 24,
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                background: form.isFeatured ? "var(--c1)" : "var(--bdr)",
                position: "relative",
                transition: "background 0.2s",
              }}
              aria-label="Toggle featured"
            >
              <span
                style={{
                  position: "absolute",
                  top: 2,
                  left: form.isFeatured ? 22 : 2,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "white",
                  transition: "left 0.2s",
                }}
              />
            </button>
          </div>

          <div className="form-row">
            <label>
              Benefits{" "}
              <span style={{ fontWeight: 400, textTransform: "none" }}>
                (comma separated)
              </span>
            </label>
            <input
              value={form.benefitsInput}
              onChange={(e) => set("benefitsInput", e.target.value)}
              placeholder="Logo on homepage, Speaking slot, Booth"
            />
          </div>

          {error && <div className="form-error">{error}</div>}
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Saving..." : "Save Sponsor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
