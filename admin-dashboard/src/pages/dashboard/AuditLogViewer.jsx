import { useState, useEffect, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8787";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getActionColor(action) {
  const method = String(action || "")
    .split(" ")[0]
    .toUpperCase();
  switch (method) {
    case "POST":
      return "bg-green-100 text-green-800";
    case "PUT":
    case "PATCH":
      return "bg-blue-100 text-blue-800";
    case "DELETE":
      return "bg-red-100 text-red-800";
    case "GET":
      return "bg-gray-100 text-gray-700";
    default:
      return "bg-yellow-100 text-yellow-800";
  }
}

function Badge({ action }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getActionColor(action)}`}
    >
      {action}
    </span>
  );
}

function exportCSV(logs) {
  const headers = [
    "Timestamp",
    "Admin ID",
    "Action",
    "IP Address",
    "User Agent",
    "Old State",
    "New State",
  ];
  const rows = logs.map((l) => [
    new Date(l.timestamp).toISOString(),
    l.admin_id,
    l.action,
    l.ip_address ?? "",
    l.user_agent ?? "",
    l.old_state ? JSON.stringify(l.old_state) : "",
    l.new_state ? JSON.stringify(l.new_state) : "",
  ]);
  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `audit-logs-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Stats bar ────────────────────────────────────────────────────────────────

function StatsBar({ stats }) {
  if (!stats) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg border p-4">
        <p className="text-sm text-gray-500">Total logs</p>
        <p className="text-2xl font-bold text-gray-800">
          {stats.total.toLocaleString()}
        </p>
      </div>
      {stats.byAction.slice(0, 3).map(({ action, count }) => (
        <div key={action} className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500 truncate">{action}</p>
          <p className="text-2xl font-bold text-gray-800">
            {count.toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Detail modal ─────────────────────────────────────────────────────────────

function DetailModal({ log, onClose }) {
  if (!log) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl font-bold"
        >
          ×
        </button>
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Log Detail</h3>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
          <dt className="text-gray-500">Timestamp</dt>
          <dd className="text-gray-800">
            {new Date(log.timestamp).toLocaleString()}
          </dd>
          <dt className="text-gray-500">Admin ID</dt>
          <dd className="text-gray-800 truncate">{log.admin_id}</dd>
          <dt className="text-gray-500">Action</dt>
          <dd>
            <Badge action={log.action} />
          </dd>
          <dt className="text-gray-500">IP Address</dt>
          <dd className="text-gray-800">{log.ip_address ?? "—"}</dd>
          <dt className="text-gray-500 col-span-2">User Agent</dt>
          <dd className="text-gray-700 col-span-2 text-xs break-all">
            {log.user_agent ?? "—"}
          </dd>
        </dl>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">
              Old State
            </p>
            <pre className="bg-gray-50 rounded p-3 text-xs overflow-auto max-h-48 text-gray-700">
              {log.old_state ? JSON.stringify(log.old_state, null, 2) : "—"}
            </pre>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">
              New State
            </p>
            <pre className="bg-gray-50 rounded p-3 text-xs overflow-auto max-h-48 text-gray-700">
              {log.new_state ? JSON.stringify(log.new_state, null, 2) : "—"}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AuditLogViewer() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  // Filters
  const [action, setAction] = useState("");
  const [adminId, setAdminId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const limit = 50;

  const fetchLogs = useCallback(
    async (p = 1) => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ page: p, limit });
        if (action) params.set("action", action);
        if (adminId) params.set("adminId", adminId);
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);

        const res = await fetch(`${API_BASE}/api/admin/audit-logs?${params}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setLogs(data.logs ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
        setPage(p);
      } catch (err) {
        setError("Failed to load audit logs. " + err.message);
      } finally {
        setLoading(false);
      }
    },
    [action, adminId, startDate, endDate]
  );

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/audit-logs/stats`, {
        credentials: "include",
      });
      if (!res.ok) return;
      setStats(await res.json());
    } catch {
      // Stats are non-critical; fail silently
    }
  }, []);

  useEffect(() => {
    fetchLogs(1);
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchLogs(1);
  };

  const handleExport = async () => {
    const params = new URLSearchParams({ page: 1, limit: 1000 });
    if (action) params.set("action", action);
    if (adminId) params.set("adminId", adminId);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    const res = await fetch(`${API_BASE}/api/admin/audit-logs?${params}`, {
      credentials: "include",
    });
    const data = await res.json();
    exportCSV(data.logs ?? []);
  };

  const handleExportPDF = async () => {
    const url = new URL(`${API_BASE}/api/admin/audit-logs`);
    url.searchParams.set('limit', 1000);
    if (adminId) url.searchParams.set('adminId', adminId);
    if (action) url.searchParams.set('action', action);
    if (startDate) url.searchParams.set('startDate', startDate);
    if (endDate) url.searchParams.set('endDate', endDate);

    const res = await fetch(url.toString(), { credentials: 'include' });
    const data = await res.json();
    const logs = data.logs ?? [];
    
    const columns = ['Timestamp', 'Admin ID', 'Action', 'IP Address'];
    const rows = logs.map((l) => [
      new Date(l.timestamp).toLocaleString(),
      l.admin_id,
      l.action,
      l.ip_address || '-',
    ]);
    exportToPDF(columns, rows, `audit-logs-${Date.now()}`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Admin activity trail — {total.toLocaleString()} total records
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-50 shadow-sm transition-colors"
          >
            Export CSV
          </button>
          <button
            onClick={handleExportPDF}
            className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-50 shadow-sm transition-colors"
          >
            Export PDF
          </button>
        </div>
      </div>

      {/* Stats */}
      <StatsBar stats={stats} />

      {/* Filters */}
      <form
        onSubmit={handleFilter}
        className="bg-white border rounded-lg p-4 mb-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
      >
        <input
          type="text"
          placeholder="Action contains…"
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="border rounded px-2 py-1.5 text-sm text-gray-700"
        />

        <input
          type="text"
          placeholder="Admin ID…"
          value={adminId}
          onChange={(e) => setAdminId(e.target.value)}
          className="border rounded px-2 py-1.5 text-sm text-gray-700"
        />

        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border rounded px-2 py-1.5 text-sm text-gray-700"
        />

        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border rounded px-2 py-1.5 text-sm text-gray-700"
        />

        <button
          type="submit"
          className="bg-indigo-600 text-white rounded px-4 py-1.5 text-sm hover:bg-indigo-700 transition-colors"
        >
          Apply
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {[
                "Timestamp",
                "Admin ID",
                "Action",
                "IP Address",
                "User Agent",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  Loading…
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  No audit logs found.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelected(log)}
                >
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-800 font-mono text-xs truncate max-w-[160px]">
                    {log.admin_id}
                  </td>
                  <td className="px-4 py-3">
                    <Badge action={log.action} />
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {log.ip_address ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs truncate max-w-[220px]">
                    {log.user_agent ?? "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1 || loading}
              onClick={() => fetchLogs(page - 1)}
              className="px-3 py-1.5 border rounded text-sm disabled:opacity-40 hover:bg-gray-50"
            >
              ← Prev
            </button>
            <button
              disabled={page >= totalPages || loading}
              onClick={() => fetchLogs(page + 1)}
              className="px-3 py-1.5 border rounded text-sm disabled:opacity-40 hover:bg-gray-50"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Detail modal */}
      <DetailModal log={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
