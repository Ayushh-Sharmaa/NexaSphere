/**
 * ScheduledReports.jsx
 * admin-dashboard/src/pages/dashboard/ScheduledReports.jsx
 *
 * Three tabs: Schedule Config | Report Archive | Manual Trigger
 */

import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const API = "/api/admin/reports";

const REPORT_TYPES = [
  { value: "daily_attendance", label: "Daily Attendance" },
  { value: "weekly_analytics", label: "Weekly Analytics" },
];

const CRON_PRESETS = [
  { label: "Every day at 7:00 AM", value: "0 7 * * *" },
  { label: "Every Monday at 8:00 AM", value: "0 8 * * 1" },
  { label: "Every hour", value: "0 * * * *" },
  { label: "Every Sunday at midnight", value: "0 0 * * 0" },
  { label: "Custom…", value: "custom" },
];

function cronHumanReadable(expr) {
  const preset = CRON_PRESETS.find((p) => p.value === expr);
  return preset && preset.value !== "custom" ? preset.label : expr;
}

// ─── Schedule Config Tab ──────────────────────────────────────────────────────

function ScheduleTab() {
  const [configs, setConfigs] = useState([]);
  const [form, setForm] = useState({
    reportType: "daily_attendance",
    cronPreset: "0 7 * * *",
    cronExpression: "0 7 * * *",
    recipients: "",
    format: "csv",
    enabled: true,
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    axios.get(`${API}/schedule`).then(({ data }) => setConfigs(data.configs));
  }, []);

  function handlePresetChange(val) {
    if (val === "custom") {
      setForm((f) => ({ ...f, cronPreset: "custom" }));
    } else {
      setForm((f) => ({ ...f, cronPreset: val, cronExpression: val }));
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const recipients = form.recipients
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      await axios.post(`${API}/schedule`, {
        reportType: form.reportType,
        cronExpression: form.cronExpression,
        recipients,
        format: form.format,
        enabled: form.enabled,
      });
      showToast("Schedule saved");
      const { data } = await axios.get(`${API}/schedule`);
      setConfigs(data.configs);
    } catch (e) {
      showToast(e.response?.data?.error || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Current configs */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Active Schedules
        </h3>
        {configs.length === 0 ? (
          <p className="text-sm text-gray-400">
            No schedules configured yet — using defaults.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 uppercase text-xs">
                <tr>
                  {["Report", "Schedule", "Format", "Recipients", "Status"].map(
                    (h) => (
                      <th key={h} className="px-4 py-3 text-left">
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {configs.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-3 font-medium">
                      {c.reportType.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {c.cronExpression}
                      <span className="ml-2 text-gray-400">
                        ({cronHumanReadable(c.cronExpression)})
                      </span>
                    </td>
                    <td className="px-4 py-3 uppercase text-xs">{c.format}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {JSON.parse(c.recipients).join(", ")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          c.enabled
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {c.enabled ? "Active" : "Disabled"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Config form */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
          Add / Update Schedule
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Report Type
            </label>
            <select
              value={form.reportType}
              onChange={(e) =>
                setForm((f) => ({ ...f, reportType: e.target.value }))
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-gray-100"
            >
              {REPORT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Schedule Preset
            </label>
            <select
              value={form.cronPreset}
              onChange={(e) => handlePresetChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-gray-100"
            >
              {CRON_PRESETS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {form.cronPreset === "custom" && (
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Cron Expression
              </label>
              <input
                type="text"
                placeholder="e.g. 0 9 * * 1-5"
                value={form.cronExpression}
                onChange={(e) =>
                  setForm((f) => ({ ...f, cronExpression: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-gray-100 font-mono"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Recipients (comma-separated emails)
            </label>
            <input
              type="text"
              placeholder="admin@example.com, ops@example.com"
              value={form.recipients}
              onChange={(e) =>
                setForm((f) => ({ ...f, recipients: e.target.value }))
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Format
            </label>
            <select
              value={form.format}
              onChange={(e) =>
                setForm((f) => ({ ...f, format: e.target.value }))
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <input
              type="checkbox"
              id="enabled"
              checked={form.enabled}
              onChange={(e) =>
                setForm((f) => ({ ...f, enabled: e.target.checked }))
              }
              className="w-4 h-4 accent-blue-600"
            />
            <label
              htmlFor="enabled"
              className="text-sm text-gray-700 dark:text-gray-300"
            >
              Enable this schedule
            </label>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-5 px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save Schedule"}
        </button>
      </div>

      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-5 py-3 rounded-lg shadow-lg text-sm font-medium text-white z-50 ${
            toast.type === "error" ? "bg-red-600" : "bg-green-600"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ─── Archive Tab ──────────────────────────────────────────────────────────────

function ArchiveTab() {
  const [reports, setReports] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/archive`, {
        params: { page, type: typeFilter || undefined },
      });
      setReports(data.reports);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  function handleDownload(id, filename) {
    window.open(
      `${API}/archive/${id}/download`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 dark:text-gray-100"
        >
          <option value="">All Types</option>
          {REPORT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-400">
          {total} report{total !== 1 ? "s" : ""}
        </span>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 py-8 text-center">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 uppercase text-xs">
              <tr>
                {["Type", "Generated At", "Summary", "Download"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {reports.map((r) => (
                <tr
                  key={r.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="px-4 py-3 font-medium capitalize">
                    {r.reportType.replace(/_/g, " ")}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {new Date(r.generatedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">
                    {r.summary.split("\n")[0]}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDownload(r.id, r.filename)}
                      className="text-xs px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400"
                    >
                      ↓ Download
                    </button>
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    No archived reports yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {total > 20 && (
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>
            Page {page} of {Math.ceil(total / 20)}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border rounded disabled:opacity-40"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * 20 >= total}
              className="px-3 py-1 border rounded disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Manual Trigger Tab ───────────────────────────────────────────────────────

function TriggerTab() {
  const [type, setType] = useState("daily_attendance");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function handleTrigger() {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const { data } = await axios.post(`${API}/generate`, { type });
      setResult(data.report);
    } catch (e) {
      setError(e.response?.data?.error || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md space-y-5">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Manually trigger a report outside its scheduled time. The report will be
        generated, archived, and emailed to configured recipients immediately.
      </p>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Report Type
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-gray-100"
        >
          {REPORT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleTrigger}
        disabled={loading}
        className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-40"
      >
        {loading ? "Generating…" : "▶ Generate Now"}
      </button>

      {result && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
          <p className="text-sm font-semibold text-green-700 dark:text-green-300 mb-1">
            ✅ Report generated
          </p>
          <p className="text-xs text-green-600 dark:text-green-400">
            {result.filename}
          </p>
          <p className="text-xs text-gray-500 mt-1 whitespace-pre-line">
            {result.summary}
          </p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const TABS = ["Schedule Config", "Report Archive", "Manual Trigger"];

export default function ScheduledReports() {
  const [activeTab, setActiveTab] = useState("Schedule Config");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Scheduled Reports
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Configure, view, and manually trigger automated report generation
        </p>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        {activeTab === "Schedule Config" && <ScheduleTab />}
        {activeTab === "Report Archive" && <ArchiveTab />}
        {activeTab === "Manual Trigger" && <TriggerTab />}
      </div>
    </div>
  );
}
