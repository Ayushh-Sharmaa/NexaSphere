import { useState, useCallback } from "react";
import { api } from "../services/api";
import { useSponsorships } from "../hooks/useSponsorships";
import { useEventListener } from "../hooks/useEventListener";
import { EVENTS } from "../services/eventEmitter";
import { SponsorshipForm } from "../components/SponsorshipForm";
import { Skeleton } from "../components/Skeleton";
import { AdminIcon } from "../components/AdminIcon";

const TIER_COLORS = {
  platinum: { bg: "rgba(168,85,247,0.15)", color: "#a855f7" },
  gold: { bg: "rgba(251,191,36,0.15)", color: "#fbbf24" },
  silver: { bg: "rgba(156,163,175,0.15)", color: "#9ca3af" },
  bronze: { bg: "rgba(205,127,50,0.15)", color: "#cd7f32" },
  custom: { bg: "rgba(59,130,246,0.15)", color: "#3b82f6" },
};

const STATUS_COLORS = {
  active: "#22c55e",
  expired: "#6b7280",
  pending: "#f59e0b",
};

export function SponsorshipsManager() {
  const { sponsors, setSponsors, loading, error, reload } = useSponsorships();
  const [showForm, setShowForm] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  useEventListener(
    EVENTS.SPONSOR_CREATED,
    useCallback(() => {
      reload();
      setShowForm(false);
    }, [reload])
  );

  useEventListener(
    EVENTS.SPONSOR_UPDATED,
    useCallback(() => {
      reload();
      setEditingSponsor(null);
      setShowForm(false);
    }, [reload])
  );

  useEventListener(
    EVENTS.SPONSOR_DELETED,
    useCallback(() => {
      reload();
    }, [reload])
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleting(id);
    setDeleteError("");
    try {
      await api.sponsorships.delete(id);
      setDeleteTarget(null);
    } catch {
      setDeleteError("Failed to delete sponsor. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  const openEdit = (sponsor) => {
    setEditingSponsor(sponsor);
    setShowForm(true);
  };
  const closeForm = () => {
    setShowForm(false);
    setEditingSponsor(null);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Sponsorships & Partnerships</h2>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          + Add Sponsor
        </button>
      </div>

      {(showForm || editingSponsor) && (
        <SponsorshipForm sponsor={editingSponsor} onClose={closeForm} />
      )}

      {loading && <Skeleton height={72} count={4} />}
      {error && (
        <div className="page-error">Failed to load sponsors: {error}</div>
      )}

      {!loading && !error && (
        <div className="list">
          {sponsors.length === 0 && (
            <div className="empty-state">No sponsors yet. Add one!</div>
          )}
          {sponsors.map((sponsor) => {
            const tc = TIER_COLORS[sponsor.tier] || TIER_COLORS.bronze;
            return (
              <div key={sponsor.id} className="list-item">
                <div className="list-item-left">
                  <span className="item-icon">
                    <AdminIcon name="Handshake" size={22} />
                  </span>
                  <div>
                    <div className="item-name">
                      {sponsor.companyName}
                      {sponsor.isFeatured && (
                        <span
                          style={{
                            marginLeft: 8,
                            padding: "1px 6px",
                            borderRadius: 8,
                            background: "rgba(251,191,36,0.15)",
                            color: "#fbbf24",
                            fontSize: "0.65rem",
                            fontWeight: 600,
                          }}
                        >
                          Featured
                        </span>
                      )}
                    </div>
                    <div className="item-meta">
                      <span
                        style={{
                          padding: "1px 6px",
                          borderRadius: 4,
                          background: tc.bg,
                          color: tc.color,
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          textTransform: "capitalize",
                        }}
                      >
                        {sponsor.tier}
                      </span>
                      {sponsor.contactPerson && ` · ${sponsor.contactPerson}`}
                      {sponsor.agreementEnd &&
                        ` · Ends ${sponsor.agreementEnd}`}
                    </div>
                  </div>
                </div>
                <div className="list-item-right">
                  <span
                    className="status-badge"
                    style={{
                      background: STATUS_COLORS[sponsor.status] || "#6b7280",
                    }}
                  >
                    {sponsor.status}
                  </span>
                  <button
                    className="btn-icon"
                    onClick={() => openEdit(sponsor)}
                    aria-label="Edit sponsor"
                  >
                    <AdminIcon name="Pencil" size={16} />
                  </button>
                  <button
                    className="btn-icon danger"
                    onClick={() => {
                      setDeleteTarget(sponsor);
                      setDeleteError("");
                    }}
                    disabled={deleting === sponsor.id}
                    aria-label="Delete sponsor"
                  >
                    {deleting === sponsor.id ? (
                      "..."
                    ) : (
                      <AdminIcon name="Trash" size={16} />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {deleteTarget && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-sponsor-title"
        >
          <div className="modal">
            <div className="modal-header">
              <h3 id="delete-sponsor-title">Delete Sponsor</h3>
              <button
                className="modal-close"
                onClick={() => setDeleteTarget(null)}
                aria-label="Close"
              >
                <AdminIcon name="X" size={16} />
              </button>
            </div>
            <p className="page-subtitle" style={{ marginBottom: 16 }}>
              This will permanently remove "{deleteTarget.companyName}".
            </p>
            {deleteError && <div className="page-error">{deleteError}</div>}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
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
                onClick={handleDelete}
                disabled={deleting === deleteTarget.id}
              >
                {deleting === deleteTarget.id
                  ? "Deleting..."
                  : "Delete Sponsor"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
