import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";

const API_BASE = import.meta.env.VITE_API_URL || "";

const TABS = [
  { id: "documents", label: "Documents" },
  { id: "acceptances", label: "Acceptances" },
  { id: "gdpr", label: "GDPR Requests" },
  { id: "audit", label: "Audit Log" },
];

const DOC_TYPES = {
  privacy_policy: "Privacy Policy",
  terms_of_service: "Terms of Service",
  code_of_conduct: "Code of Conduct",
  event_waiver: "Event Waiver",
};

// ─── Document Tab Components ──────────────────────────────────────────────────

function DocumentsTab({ documents, load, showToast }) {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    type: "privacy_policy",
    title: "",
    version: "1.0.0",
    summary: "",
    content: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/compliance/admin/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });
      if (!res.ok)
        throw new Error(
          (await res.json()).error || "Failed to create document"
        );
      showToast("Document created successfully", "success");
      setShowModal(false);
      load();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleArchive = async (id) => {
    if (
      !window.confirm("Are you sure you want to archive this document version?")
    )
      return;
    try {
      const res = await fetch(
        `${API_BASE}/api/compliance/admin/documents/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      if (!res.ok)
        throw new Error((await res.json()).error || "Failed to archive");
      showToast("Document archived", "success");
      load();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <h3>Active Legal Documents</h3>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + New Version
        </button>
      </div>

      <div className="list">
        {documents.map((doc) => (
          <div key={doc.id} className="list-item">
            <div className="list-item-left">
              <div className="list-item-title">
                {DOC_TYPES[doc.type] || doc.type}
              </div>
              <div className="list-item-meta">
                Version: {doc.version} · Effective:{" "}
                {new Date(doc.effectiveDate).toLocaleString()} ·{" "}
                {doc.archived ? "Archived" : "Active"}
              </div>
              <div style={{ fontSize: "0.8rem", color: "#666", marginTop: 4 }}>
                {doc.summary || "No summary provided."}
              </div>
            </div>
            {!doc.archived && (
              <div className="list-item-right">
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleArchive(doc.id)}
                >
                  Archive
                </button>
              </div>
            )}
          </div>
        ))}
        {documents.length === 0 && (
          <div style={{ color: "#888", padding: 20 }}>No documents found.</div>
        )}
      </div>

      {showModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowModal(false)}
          onKeyDown={(e) => e.key === "Escape" && setShowModal(false)}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="compliance-doc-version-title"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 600 }}
          >
            <h3 id="compliance-doc-version-title">
              Create New Document Version
            </h3>
            <form
              onSubmit={handleSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                marginTop: 16,
              }}
            >
              <div>
                <label htmlFor="compliance-doc-type">Document Type</label>
                <select
                  id="compliance-doc-type"
                  className="input"
                  style={{ width: "100%", padding: 8 }}
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                >
                  {Object.entries(DOC_TYPES).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Title</label>
                <input
                  required
                  className="input"
                  style={{ width: "100%", padding: 8 }}
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label>Version</label>
                  <input
                    required
                    className="input"
                    style={{ width: "100%", padding: 8 }}
                    value={formData.version}
                    onChange={(e) =>
                      setFormData({ ...formData, version: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <label>Plain-language Summary</label>
                <textarea
                  className="input"
                  style={{ width: "100%", padding: 8, minHeight: 60 }}
                  value={formData.summary}
                  onChange={(e) =>
                    setFormData({ ...formData, summary: e.target.value })
                  }
                />
              </div>
              <div>
                <label>Full Content (Legal text)</label>
                <textarea
                  required
                  className="input"
                  style={{ width: "100%", padding: 8, minHeight: 150 }}
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                />
              </div>
              <div className="modal-actions" style={{ marginTop: 20 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Version
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── GDPR Tab Component ───────────────────────────────────────────────────────

function GDPRTab({ requests, load, showToast }) {
  const handleProcess = async (id, status) => {
    try {
      const res = await fetch(`${API_BASE}/api/compliance/admin/gdpr/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok)
        throw new Error((await res.json()).error || "Failed to update");
      showToast("Request processed", "success");
      load();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  return (
    <div>
      <h3 style={{ marginBottom: 20 }}>GDPR & Data Requests</h3>
      <div className="list">
        {requests.map((req) => (
          <div key={req.id} className="list-item">
            <div className="list-item-left">
              <div
                className="list-item-title"
                style={{ textTransform: "capitalize" }}
              >
                {req.type.replace("_", " ")}
              </div>
              <div className="list-item-meta">
                User: {req.userId} · Requested:{" "}
                {new Date(req.requestedAt).toLocaleString()}
                {req.processedAt &&
                  ` · Processed: ${new Date(req.processedAt).toLocaleString()}`}
              </div>
              <div style={{ fontSize: "0.8rem", color: "#666", marginTop: 4 }}>
                Status:{" "}
                <strong
                  style={{
                    color:
                      req.status === "pending"
                        ? "#f59e0b"
                        : req.status === "completed"
                          ? "#10b981"
                          : "#ef4444",
                  }}
                >
                  {req.status}
                </strong>
                {req.notes && ` — Notes: ${req.notes}`}
              </div>
            </div>
            {req.status === "pending" && (
              <div
                className="list-item-right"
                style={{ display: "flex", gap: 8 }}
              >
                <button
                  className="btn btn-sm btn-success"
                  onClick={() => handleProcess(req.id, "completed")}
                >
                  Complete
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleProcess(req.id, "rejected")}
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
        {requests.length === 0 && (
          <div style={{ color: "#888", padding: 20 }}>
            No GDPR requests found.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Audit Tab Component ──────────────────────────────────────────────────────

function AuditTab({ logs }) {
  return (
    <div>
      <h3 style={{ marginBottom: 20 }}>Audit Log</h3>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "0.85rem",
        }}
      >
        <thead>
          <tr style={{ borderBottom: "2px solid #eee", textAlign: "left" }}>
            <th style={{ padding: 8 }}>Timestamp</th>
            <th style={{ padding: 8 }}>Action</th>
            <th style={{ padding: 8 }}>Actor ID</th>
            <th style={{ padding: 8 }}>Target ID</th>
            <th style={{ padding: 8 }}>Details</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 8, whiteSpace: "nowrap" }}>
                {new Date(log.timestamp).toLocaleString()}
              </td>
              <td style={{ padding: 8, fontWeight: 500 }}>{log.action}</td>
              <td style={{ padding: 8 }}>{log.actorId}</td>
              <td style={{ padding: 8 }}>{log.targetId || "-"}</td>
              <td style={{ padding: 8, color: "#666" }}>
                {JSON.stringify(log.details)}
              </td>
            </tr>
          ))}
          {logs.length === 0 && (
            <tr>
              <td
                colSpan={5}
                style={{ padding: 20, textAlign: "center", color: "#888" }}
              >
                No audit logs found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ComplianceManager() {
  const [activeTab, setActiveTab] = useState("documents");
  const [stats, setStats] = useState(null);

  // Data lists
  const [documents, setDocuments] = useState([]);
  const [gdprReqs, setGdprReqs] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [acceptances, setAcceptances] = useState([]);

  const [toast, setToast] = useState(null);
  const showToast = (message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = useCallback(async () => {
    try {
      const statsRes = await fetch(`${API_BASE}/api/compliance/admin/stats`, {
        credentials: "include",
      });
      if (statsRes.ok) setStats(await statsRes.json());

      if (activeTab === "documents") {
        const res = await fetch(`${API_BASE}/api/compliance/admin/documents`, {
          credentials: "include",
        });
        if (res.ok) setDocuments((await res.json()).documents);
      } else if (activeTab === "gdpr") {
        const res = await fetch(`${API_BASE}/api/compliance/admin/gdpr`, {
          credentials: "include",
        });
        if (res.ok) setGdprReqs((await res.json()).items);
      } else if (activeTab === "audit") {
        const res = await fetch(`${API_BASE}/api/compliance/admin/audit`, {
          credentials: "include",
        });
        if (res.ok) setAuditLogs((await res.json()).items);
      } else if (activeTab === "acceptances") {
        const res = await fetch(
          `${API_BASE}/api/compliance/admin/acceptances`,
          {
            credentials: "include",
          }
        );
        if (res.ok) setAcceptances((await res.json()).items);
      }
    } catch (err) {
      console.error(err);
    }
  }, [activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="page" style={{ maxWidth: 1000, margin: "0 auto" }}>
      <div className="page-header">
        <h2>Compliance & Legal Manager</h2>
        <p className="page-subtitle">
          Manage legal documents, track acceptances, and handle GDPR requests
        </p>
      </div>

      {stats && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              background: "#f8fafc",
              padding: 16,
              borderRadius: 8,
              border: "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                fontSize: "0.8rem",
                color: "#64748b",
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            >
              Active Docs
            </div>
            <div
              style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a" }}
            >
              {stats.totalDocuments}
            </div>
          </div>
          <div
            style={{
              background: "#f8fafc",
              padding: 16,
              borderRadius: 8,
              border: "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                fontSize: "0.8rem",
                color: "#64748b",
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            >
              Total Acceptances
            </div>
            <div
              style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a" }}
            >
              {stats.totalAcceptances}
            </div>
          </div>
          <div
            style={{
              background: "#fffbeb",
              padding: 16,
              borderRadius: 8,
              border: "1px solid #fef3c7",
            }}
          >
            <div
              style={{
                fontSize: "0.8rem",
                color: "#b45309",
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            >
              Pending GDPR
            </div>
            <div
              style={{ fontSize: "1.5rem", fontWeight: 700, color: "#d97706" }}
            >
              {stats.pendingGdprRequests}
            </div>
          </div>
          <div
            style={{
              background: "#f8fafc",
              padding: 16,
              borderRadius: 8,
              border: "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                fontSize: "0.8rem",
                color: "#64748b",
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            >
              Audit Logs
            </div>
            <div
              style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a" }}
            >
              {stats.auditLogEntries}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid #e2e8f0",
          marginBottom: 24,
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "12px 24px",
              border: "none",
              background: "transparent",
              borderBottom:
                activeTab === tab.id
                  ? "2px solid #3b82f6"
                  : "2px solid transparent",
              color: activeTab === tab.id ? "#3b82f6" : "#64748b",
              fontWeight: activeTab === tab.id ? 600 : 400,
              cursor: "pointer",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "documents" && (
        <DocumentsTab
          documents={documents}
          load={loadData}
          showToast={showToast}
        />
      )}
      {activeTab === "gdpr" && (
        <GDPRTab requests={gdprReqs} load={loadData} showToast={showToast} />
      )}
      {activeTab === "audit" && <AuditTab logs={auditLogs} />}

      {activeTab === "acceptances" && (
        <div>
          <h3 style={{ marginBottom: 20 }}>User Acceptances</h3>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.85rem",
            }}
          >
            <thead>
              <tr style={{ borderBottom: "2px solid #eee", textAlign: "left" }}>
                <th style={{ padding: 8 }}>Accepted At</th>
                <th style={{ padding: 8 }}>User ID</th>
                <th style={{ padding: 8 }}>Document</th>
                <th style={{ padding: 8 }}>Version</th>
                <th style={{ padding: 8 }}>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {acceptances.map((acc) => (
                <tr key={acc.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: 8 }}>
                    {new Date(acc.acceptedAt).toLocaleString()}
                  </td>
                  <td style={{ padding: 8 }}>{acc.userId}</td>
                  <td style={{ padding: 8 }}>
                    {DOC_TYPES[acc.documentType] || acc.documentType}
                  </td>
                  <td style={{ padding: 8 }}>v{acc.version}</td>
                  <td style={{ padding: 8 }}>{acc.ipAddress || "-"}</td>
                </tr>
              ))}
              {acceptances.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    style={{ padding: 20, textAlign: "center", color: "#888" }}
                  >
                    No acceptances recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 20,
            right: 20,
            background: toast.type === "error" ? "#ef4444" : "#10b981",
            color: "white",
            padding: "12px 24px",
            borderRadius: 8,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 9999,
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
