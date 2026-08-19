/**
 * PlatformSettings.jsx
 * admin-dashboard/src/pages/dashboard/PlatformSettings.jsx
 *
 * Tabbed settings management UI.
 * Tabs: General | Event | User | Email | Integrations | History
 */

import { useState, useEffect, useCallback } from "react";
import axiosInstance from "../../api/axiosInstance";

const API_V1 = "/api/v1";
const LEGACY_API = "/api/admin/settings"; // kept for non-recruitment settings until backend is migrated

// Keys managed via the real /api/v1/admin/settings/:key endpoint
const V1_SETTING_KEYS = new Set([
  "core_team_recruitment_open",
  "membership_open",
]);

const TABS = ["General", "Event", "User", "Email", "Integrations", "History"];
const ENVS = ["development", "staging", "production"];

// ─── Field definitions per tab ──────────────────────────────────────────────

const FIELDS = {
  General: [
    {
      key: "core_team_recruitment_open",
      label: "Core Team Recruitment Open",
      type: "boolean",
      description:
        "Allow students to submit Core Team applications. Disable to close recruitment.",
    },
    {
      key: "membership_open",
      label: "Membership Applications Open",
      type: "boolean",
      description:
        "Allow students to submit NexaSphere membership applications.",
    },
    { key: "platform_name", label: "Platform Name", type: "text" },
    { key: "platform_tagline", label: "Tagline", type: "text" },
    { key: "contact_email", label: "Contact Email", type: "email" },
    { key: "support_email", label: "Support Email", type: "email" },
    {
      key: "default_timezone",
      label: "Default Timezone",
      type: "select",
      options: [
        "UTC",
        "America/New_York",
        "America/Los_Angeles",
        "Europe/London",
        "Asia/Kolkata",
      ],
    },
    {
      key: "default_language",
      label: "Default Language",
      type: "select",
      options: ["en", "es", "fr", "de", "hi"],
    },
    {
      key: "registration_mode",
      label: "Registration Mode",
      type: "select",
      options: ["open", "invite-only", "approval-required"],
    },
    {
      key: "max_events_per_user_per_month",
      label: "Max Events / User / Month",
      type: "number",
    },
    {
      key: "max_file_upload_size_mb",
      label: "Max File Upload Size (MB)",
      type: "number",
    },
  ],
  Event: [
    {
      key: "default_event_capacity",
      label: "Default Event Capacity",
      type: "number",
    },
    {
      key: "maximum_event_capacity",
      label: "Maximum Event Capacity",
      type: "number",
    },
    {
      key: "event_approval_required",
      label: "Event Approval Required",
      type: "boolean",
    },
    {
      key: "allow_recurring_events",
      label: "Allow Recurring Events",
      type: "boolean",
    },
    {
      key: "default_rsvp_deadline_days",
      label: "Default RSVP Deadline (days)",
      type: "number",
    },
    {
      key: "auto_cancel_below_minimum",
      label: "Auto-Cancel Below Minimum Attendance",
      type: "boolean",
    },
    {
      key: "photo_upload_enabled",
      label: "Photo Upload Enabled",
      type: "boolean",
    },
  ],
  User: [
    {
      key: "password_min_length",
      label: "Password Min Length",
      type: "number",
    },
    {
      key: "password_require_complexity",
      label: "Require Password Complexity",
      type: "boolean",
    },
    {
      key: "session_timeout_minutes",
      label: "Session Timeout (minutes)",
      type: "number",
    },
    {
      key: "max_concurrent_sessions",
      label: "Max Concurrent Sessions",
      type: "number",
    },
    {
      key: "account_deletion_policy",
      label: "Account Deletion Policy",
      type: "select",
      options: ["soft-delete", "hard-delete", "anonymize"],
    },
    {
      key: "two_factor_required",
      label: "Two-Factor Auth Required",
      type: "boolean",
    },
  ],
  Email: [
    { key: "email_from_name", label: "From Name", type: "text" },
    { key: "email_from_address", label: "From Address", type: "email" },
    { key: "email_reply_to", label: "Reply-To Address", type: "email" },
    { key: "email_footer_text", label: "Footer Text", type: "text" },
    { key: "email_unsubscribe_text", label: "Unsubscribe Text", type: "text" },
    {
      key: "email_sending_limit_per_hour",
      label: "Sending Limit / Hour",
      type: "number",
    },
  ],
  Integrations: [
    {
      key: "google_calendar_enabled",
      label: "Google Calendar Integration",
      type: "boolean",
    },
    { key: "discord_bot_token", label: "Discord Bot Token", type: "secret" },
    { key: "slack_webhook_url", label: "Slack Webhook URL", type: "secret" },
    { key: "sendgrid_api_key", label: "SendGrid API Key", type: "secret" },
    { key: "stripe_api_key", label: "Stripe API Key", type: "secret" },
    {
      key: "analytics_tracking_id",
      label: "Analytics Tracking ID",
      type: "secret",
    },
    {
      key: "social_login_google",
      label: "Google Social Login",
      type: "boolean",
    },
    {
      key: "social_login_github",
      label: "GitHub Social Login",
      type: "boolean",
    },
  ],
};

// ─── Field renderer ──────────────────────────────────────────────────────────

function Field({ field, value, onChange, error }) {
  const base =
    "w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 " +
    (error
      ? "border-red-500 bg-red-50"
      : "border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100");

  if (field.type === "boolean") {
    return (
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(field.key, e.target.checked)}
          className="w-4 h-4 accent-blue-600"
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {field.label}
        </span>
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <select
        value={value ?? ""}
        onChange={(e) => onChange(field.key, e.target.value)}
        className={base}
      >
        {field.options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "secret") {
    return (
      <input
        type="password"
        placeholder={
          value === "***REDACTED***" ? "••••••••• (unchanged)" : "Enter value"
        }
        onChange={(e) => onChange(field.key, e.target.value)}
        className={base}
        autoComplete="new-password"
      />
    );
  }

  return (
    <input
      type={
        field.type === "number"
          ? "number"
          : field.type === "email"
            ? "email"
            : "text"
      }
      value={value ?? ""}
      onChange={(e) =>
        onChange(
          field.key,
          field.type === "number" ? Number(e.target.value) : e.target.value
        )
      }
      className={base}
    />
  );
}

// ─── History tab ─────────────────────────────────────────────────────────────

function HistoryTab({ env, onRollback }) {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [rolling, setRolling] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/history`, {
        params: { env, page },
      });
      setLogs(data.logs);
      setTotal(data.total);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [env, page]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRollback(logId, key) {
    if (!confirm(`Roll back "${key}" to its previous value?`)) return;
    setRolling(logId);
    try {
      await axios.post(`${API}/rollback`, { logId });
      onRollback();
      load();
    } catch (e) {
      alert(e.response?.data?.error || "Rollback failed");
    } finally {
      setRolling(null);
    }
  }

  if (loading)
    return <p className="text-sm text-gray-500 p-4">Loading history…</p>;

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 uppercase text-xs">
            <tr>
              {["Key", "Previous", "New", "By", "Date", "Action"].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {logs.map((l) => (
              <tr
                key={l.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <td className="px-4 py-3 font-mono text-xs">{l.key}</td>
                <td className="px-4 py-3 text-gray-500 max-w-[140px] truncate">
                  {l.previousValue ?? "—"}
                </td>
                <td className="px-4 py-3 max-w-[140px] truncate">
                  {l.newValue}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {l.changedBy?.name ?? "System"}
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                  {new Date(l.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  {l.previousValue && !l.isRollback && (
                    <button
                      onClick={() => handleRollback(l.id, l.key)}
                      disabled={rolling === l.id}
                      className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-700 hover:bg-amber-200 disabled:opacity-50"
                    >
                      {rolling === l.id ? "Rolling…" : "Rollback"}
                    </button>
                  )}
                  {l.isRollback && (
                    <span className="text-xs text-gray-400 italic">
                      rollback
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  No history yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {total > 20 && (
        <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
          <span>{total} total entries</span>
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

// ─── Main component ───────────────────────────────────────────────────────────

export default function PlatformSettings() {
  const [activeTab, setActiveTab] = useState("General");
  const [env, setEnv] = useState(process.env.NODE_ENV || "development");
  const [settings, setSettings] = useState({});
  const [pending, setPending] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [toast, setToast] = useState(null);
  const [localTheme, setLocalTheme] = useState(
    document.documentElement.getAttribute("data-theme") || "light"
  );

  const handleLocalThemeChange = (e) => {
    const newTheme = e.target.value;
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("ns-admin-theme", newTheme);
    setLocalTheme(newTheme);
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Load recruitment flags from the real /api/v1/recruitment-status endpoint
      let recruitmentSettings = {};
      try {
        const { data: rsData } = await axiosInstance.get(
          `${API_V1}/recruitment-status`
        );
        if (rsData?.data) {
          recruitmentSettings = {
            core_team_recruitment_open: rsData.data.core_team_open,
            membership_open: rsData.data.membership_open,
          };
        }
      } catch {
        // Non-fatal: recruitment status may not yet be available
      }

      // 2. Load all other settings from the legacy settings API
      let legacySettings = {};
      try {
        const { data } = await axiosInstance.get(LEGACY_API, {
          params: { env },
        });
        legacySettings = data.settings || {};
      } catch {
        // Non-fatal if the legacy endpoint is absent
      }

      setSettings({ ...legacySettings, ...recruitmentSettings });
      setPending({});
      setErrors({});
    } catch {
      showToast("Failed to load settings", "error");
    } finally {
      setLoading(false);
    }
  }, [env]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  function handleChange(key, value) {
    setPending((p) => ({ ...p, [key]: value }));
    setErrors((e) => {
      const n = { ...e };
      delete n[key];
      return n;
    });
  }

  async function handlePreview() {
    if (!Object.keys(pending).length)
      return showToast("No changes to preview", "info");
    setPreviewing(true);
    try {
      const { data } = await axios.put(API, {
        env,
        updates: pending,
        preview: true,
      });
      setPreviewData(data.preview);
    } catch (e) {
      setErrors(e.response?.data?.errors || {});
      showToast("Validation failed", "error");
    } finally {
      setPreviewing(false);
    }
  }

  async function handleSave() {
    const updates = { ...pending };
    if (!Object.keys(updates).length)
      return showToast("No changes to save", "info");
    setSaving(true);
    try {
      // 1. Save V1-managed keys (recruitment flags) via the real API endpoint
      const v1Keys = Object.keys(updates).filter((k) => V1_SETTING_KEYS.has(k));
      for (const key of v1Keys) {
        await axiosInstance.patch(`${API_V1}/admin/settings/${key}`, {
          value: updates[key],
        });
        delete updates[key]; // remove so we don't also send to legacy endpoint
      }

      // 2. Save remaining keys to the legacy endpoint (if any)
      if (Object.keys(updates).length > 0) {
        await axiosInstance.put(LEGACY_API, { env, updates });
      }

      showToast("Settings saved");
      setPreviewData(null);
      loadSettings();
    } catch (e) {
      const errorData = e.response?.data || {};
      setErrors(errorData.errors || {});
      showToast(
        errorData.error?.message || "Save failed — see highlighted fields",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleExport() {
    const { data } = await axios.get(`${API}/export`, { params: { env } });
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `settings-${env}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const json = JSON.parse(ev.target.result);
        const importSettings = json.settings || json;
        await axios.post(`${API}/import`, { env, settings: importSettings });
        showToast("Settings imported");
        loadSettings();
      } catch (err) {
        showToast(err.response?.data?.error || "Import failed", "error");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  const currentFields = FIELDS[activeTab] || [];
  const hasPending = Object.keys(pending).length > 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Platform Settings
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Configure platform behaviour without code changes
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Environment picker */}
          <select
            value={env}
            onChange={(e) => setEnv(e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2
                       bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {ENVS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>

          {/* Export */}
          <button
            onClick={handleExport}
            className="text-sm px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            ↓ Export
          </button>

          {/* Import */}
          <label
            className="text-sm px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                            text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
          >
            ↑ Import
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportFile}
            />
          </label>

          {/* Preview */}
          {hasPending && (
            <button
              onClick={handlePreview}
              disabled={previewing}
              className="text-sm px-4 py-2 border border-blue-300 rounded-lg text-blue-600 bg-blue-50
                         hover:bg-blue-100 disabled:opacity-50"
            >
              {previewing ? "Previewing…" : "Preview Changes"}
            </button>
          )}

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving || !hasPending}
            className="text-sm px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700
                       disabled:opacity-40 disabled:cursor-not-allowed font-medium"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Preview banner */}
      {previewData && (
        <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2">
            Preview — {Object.keys(previewData).length} pending changes
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(previewData).map(([k, v]) => (
              <span
                key={k}
                className="text-xs bg-amber-100 dark:bg-amber-800/40 text-amber-700 dark:text-amber-200 px-2 py-1 rounded font-mono"
              >
                {k}: {String(v)}
              </span>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Apply Changes"}
            </button>
            <button
              onClick={() => setPreviewData(null)}
              className="text-xs px-3 py-1 bg-white text-gray-600 border rounded hover:bg-gray-50"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
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

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <svg
              className="animate-spin w-6 h-6 mr-2"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              />
            </svg>
            Loading settings…
          </div>
        ) : activeTab === "History" ? (
          <HistoryTab env={env} onRollback={loadSettings} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeTab === "General" && (
              <div className="col-span-1 md:col-span-2 mb-2 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Local Preferences
                </h3>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Admin Dashboard Theme
                  </label>
                  <select
                    value={localTheme}
                    onChange={handleLocalThemeChange}
                    className="w-full md:w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="light">Light Mode</option>
                    <option value="dark">Dark Mode</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    This setting is saved locally in your browser.
                  </p>
                </div>
              </div>
            )}
            {currentFields.map((field) => {
              const currentVal =
                field.key in pending ? pending[field.key] : settings[field.key];
              const isDirty = field.key in pending;

              return (
                <div
                  key={field.key}
                  className={`${field.type === "boolean" ? "flex items-center" : ""}`}
                >
                  {field.type !== "boolean" && (
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {field.label}
                      {isDirty && (
                        <span className="ml-2 text-xs text-blue-500 font-normal">
                          modified
                        </span>
                      )}
                    </label>
                  )}
                  <Field
                    field={field}
                    value={currentVal}
                    onChange={handleChange}
                    error={errors[field.key]}
                  />
                  {errors[field.key] && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors[field.key]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-5 py-3 rounded-lg shadow-lg text-sm font-medium text-white z-50 transition-all ${
            toast.type === "error"
              ? "bg-red-600"
              : toast.type === "info"
                ? "bg-gray-600"
                : "bg-green-600"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
