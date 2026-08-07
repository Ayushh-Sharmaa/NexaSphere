import { useState, useEffect, useCallback } from "react";
import { api } from "../services/api";
import { Skeleton } from "../components/Skeleton";
import { AdminIcon } from "../components/AdminIcon";
import { Pagination } from "../components/Pagination";

const COLUMNS = [
  { key: "fullName", label: "Full Name" },
  { key: "collegeEmail", label: "Email" },
  { key: "year", label: "Year" },
  { key: "branch", label: "Branch" },
  { key: "role", label: "Role" },
  { key: "interests", label: "Interests" },
  { key: "status", label: "Status" },
  { key: "submittedAt", label: "Submitted" },
];

const STATUS_OPTIONS = ["applied", "shortlisted", "rejected"];

const STATUS_STYLES = {
  applied: {
    bg: "rgba(59,130,246,0.12)",
    border: "rgba(59,130,246,0.4)",
    color: "#3b82f6",
  },
  shortlisted: {
    bg: "rgba(34,197,94,0.12)",
    border: "rgba(34,197,94,0.4)",
    color: "#22c55e",
  },
  rejected: {
    bg: "rgba(239,68,68,0.12)",
    border: "rgba(239,68,68,0.4)",
    color: "#ef4444",
  },
};

function formatDate(val) {
  if (!val) return "—";
  try {
    return new Date(val).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return val;
  }
}

function exportCSV(rows) {
  const exportCols = COLUMNS.filter((c) => c.key !== "status");
  const header = [...exportCols.map((c) => c.label), "Status"].join(",");
  const body = rows
    .map((row) =>
      [
        ...exportCols.map(
          (c) => `"${(row[c.key] ?? "").toString().replace(/"/g, '""')}"`
        ),
        `"${(row.status ?? "applied").toString().replace(/"/g, '""')}"`,
      ].join(",")
    )
    .join("\n");
  const blob = new Blob([`${header}\n${body}`], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `recruitment-responses-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function StatusBadge({ status, onStatusChange }) {
  const [open, setOpen] = useState(false);
  const style = STATUS_STYLES[status] || STATUS_STYLES.applied;

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          background: style.bg,
          border: `1px solid ${style.border}`,
          color: style.color,
          borderRadius: 6,
          padding: "3px 10px",
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          textTransform: "capitalize",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {status || "applied"}
        <AdminIcon name="ChevronDown" size={12} />
      </button>
      {open && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 999 }}
            onClick={() => setOpen(false)}
          />
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              marginTop: 4,
              background: "var(--surface, #1a1a2e)",
              border: "1px solid var(--border, rgba(255,255,255,0.1))",
              borderRadius: 8,
              padding: 4,
              zIndex: 1000,
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              minWidth: 130,
            }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  onStatusChange(opt);
                  setOpen(false);
                }}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "6px 10px",
                  border: "none",
                  borderRadius: 4,
                  background:
                    opt === status ? "rgba(255,255,255,0.08)" : "transparent",
                  color: STATUS_STYLES[opt]?.color || "#fff",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "rgba(255,255,255,0.06)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background =
                    opt === status ? "rgba(255,255,255,0.08)" : "transparent";
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function RecruitmentResponsesManager() {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api.recruitment
      .getAll({ page, limit: pageSize })
      .then((data) => {
        setResponses(data?.submissions ?? []);
        setTotal(data?.total ?? 0);
        setTotalPages(data?.totalPages ?? 0);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load responses");
        setLoading(false);
      });
  }, [page, pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  // Reset to page 1 when search text changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleStatusChange = async (id, newStatus) => {
    setUpdating(id);
    try {
      await api.recruitment.updateStatus(id, newStatus);
      setResponses((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdating(null);
    }
  };

  const filtered = responses.filter((r) =>
    COLUMNS.some((c) =>
      (r[c.key] ?? "").toString().toLowerCase().includes(search.toLowerCase())
    )
  );

  const pendingCount = responses.filter(
    (r) => !r.status || r.status === "applied"
  ).length;

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  return (
    <div className="page">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h2 className="page-title" style={{ margin: 0 }}>
            Recruitment Responses
          </h2>
          {pendingCount > 0 && (
            <span
              style={{
                background: "rgba(59,130,246,0.15)",
                color: "#3b82f6",
                borderRadius: 20,
                padding: "2px 10px",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {pendingCount} pending
            </span>
          )}
        </div>
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <input
            type="search"
            placeholder="Search by name, email, branch…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text)",
              fontSize: 14,
              minWidth: 220,
            }}
          />
          <button
            className="btn btn-secondary"
            onClick={() => exportCSV(filtered)}
            disabled={filtered.length === 0}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <AdminIcon name="Download" size={16} /> Export CSV
          </button>
        </div>
      </div>

      {loading && (
        <div>
          <Skeleton height={44} count={6} />
        </div>
      )}

      {!loading && error && (
        <div
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 10,
            padding: "20px 24px",
            color: "#ef4444",
            textAlign: "center",
          }}
        >
          <AdminIcon name="AlertCircle" size={24} />
          <p style={{ marginTop: 8 }}>{error}</p>
        </div>
      )}

      {!loading && !error && total === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "60px 24px",
            color: "var(--text-muted)",
            border: "1px dashed var(--border)",
            borderRadius: 12,
            marginTop: 8,
          }}
        >
          <AdminIcon name="Inbox" size={40} />
          <p style={{ marginTop: 12, fontSize: 15 }}>
            No recruitment applications yet.
          </p>
        </div>
      )}

      {!loading && !error && total > 0 && filtered.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "60px 24px",
            color: "var(--text-muted)",
            border: "1px dashed var(--border)",
            borderRadius: 12,
            marginTop: 8,
          }}
        >
          <AdminIcon name="Search" size={40} />
          <p style={{ marginTop: 12, fontSize: 15 }}>
            No responses match your search.
          </p>
          <button
            className="btn btn-secondary"
            style={{ marginTop: 8 }}
            onClick={() => setSearch("")}
          >
            Clear search
          </button>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div
          style={{
            overflowX: "auto",
            borderRadius: 12,
            border: "1px solid var(--border)",
          }}
        >
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}
          >
            <thead>
              <tr
                style={{
                  background: "var(--surface-elevated, var(--surface))",
                }}
              >
                {COLUMNS.map((c) => (
                  <th
                    key={c.key}
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      fontSize: 12,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      borderBottom: "1px solid var(--border)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <tr
                  key={row.id ?? i}
                  style={{
                    borderBottom: "1px solid var(--border)",
                    background:
                      i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
                    opacity: updating === row.id ? 0.5 : 1,
                  }}
                >
                  {COLUMNS.map((c) => (
                    <td
                      key={c.key}
                      style={{
                        padding: "12px 16px",
                        color: "var(--text)",
                        verticalAlign: "top",
                      }}
                    >
                      {c.key === "status" ? (
                        <StatusBadge
                          status={row.status || "applied"}
                          onStatusChange={(s) => handleStatusChange(row.id, s)}
                        />
                      ) : c.key === "submittedAt" ? (
                        formatDate(row[c.key])
                      ) : c.key === "interests" ? (
                        <span style={{ fontSize: 13, lineHeight: 1.5 }}>
                          {(row[c.key] ?? "—").split(",").map((t, j) => (
                            <span
                              key={j}
                              style={{
                                display: "inline-block",
                                background: "rgba(0,212,255,0.08)",
                                border: "1px solid rgba(0,212,255,0.2)",
                                borderRadius: 4,
                                padding: "1px 6px",
                                margin: "1px 2px",
                                fontSize: 11,
                              }}
                            >
                              {t.trim()}
                            </span>
                          ))}
                        </span>
                      ) : (
                        (row[c.key] ?? "—")
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
            loading={loading}
          />
        </div>
      )}
    </div>
  );
}
