import { EmptyState } from "../components/EmptyState";
import { useState, useEffect } from "react";
import { api } from "../services/api";
import { Skeleton } from "../components/Skeleton";
import { AdminIcon } from "../components/AdminIcon";
import { Pagination } from "../components/Pagination";

const isOfflineMode = !import.meta.env.VITE_MEMBERSHIP_SCRIPT_URL;

const COLUMNS = [
  { key: "fullName", label: "Full Name" },
  { key: "collegeEmail", label: "Email" },
  { key: "rollNumber", label: "Roll No." },
  { key: "course", label: "Course" },
  { key: "branch", label: "Branch" },
  { key: "groupsSelected", label: "Groups Interested" },
  { key: "submittedAt", label: "Submitted At" },
];

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
  const header = COLUMNS.map((c) => c.label).join(",");
  const body = rows
    .map((row) =>
      COLUMNS.map(
        (c) => `"${(row[c.key] ?? "").toString().replace(/"/g, '""')}"`
      ).join(",")
    )
    .join("\n");
  const blob = new Blob([`${header}\n${body}`], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `membership-responses-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function MembershipResponsesManager() {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.membership
      .getAll({ page, limit: pageSize })
      .then((data) => {
        setResponses(data?.responses ?? []);
        setTotal(data?.total ?? 0);
        setTotalPages(data?.totalPages ?? 0);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load responses");
        setLoading(false);
      });
  }, [page, pageSize]);

  // Reset to page 1 when search text changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  const filtered = responses.filter((r) =>
    COLUMNS.some((c) =>
      (r[c.key] ?? "").toString().toLowerCase().includes(search.toLowerCase())
    )
  );

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
        <h2 className="page-title" style={{ margin: 0 }}>
          Membership Responses
        </h2>
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
            placeholder="Search responses…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text)",
              fontSize: 14,
              minWidth: 200,
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

      {/* Offline mode banner */}
      {isOfflineMode && (
        <div
          style={{
            background: "rgba(234,179,8,0.12)",
            border: "1px solid rgba(234,179,8,0.4)",
            borderRadius: 10,
            padding: "10px 16px",
            marginBottom: 20,
            color: "#ca8a04",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <AdminIcon name="AlertTriangle" size={16} />
          <span>
            <strong>Offline Mode</strong> — Connect Google Apps Script for live
            membership data. Set <code>VITE_MEMBERSHIP_SCRIPT_URL</code> in your{" "}
            <code>.env</code>.
          </span>
        </div>
      )}

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
        <EmptyState
          icon="Inbox"
          title="No Membership Responses"
          description="There are currently no membership responses available."
        />
      )}

      {!loading && !error && total > 0 && filtered.length === 0 && (
        <EmptyState
          icon="Search"
          title="No Matching Responses"
          description="No responses match your current search query."
          actionLabel="Clear Search"
          onAction={() => setSearch("")}
        />
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
                      {c.key === "submittedAt"
                        ? formatDate(row[c.key])
                        : (row[c.key] ?? "—")}
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
