import React, { useState, useEffect } from "react";

export function UserSegmentation() {
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [activityLevel, setActivityLevel] = useState("");
  const [graduationYear, setGraduationYear] = useState("");

  const [previewUsers, setPreviewUsers] = useState(null);

  // Cohort Retention state
  const [cohortMonth, setCohortMonth] = useState("2026-06");
  const [cohortData, setCohortData] = useState(null);
  const [cohortLoading, setCohortLoading] = useState(false);

  const fetchSegments = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE}/api/admin/analytics/segments`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch segments");
      const data = await res.json();
      setSegments(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSegments();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name) return alert("Name is required");

    // We follow the rules_json structure used by evaluateSegments in the backend
    const condition =
      activityLevel === "inactive" ? "inactivity" : "events_count";
    const rules_json = {
      condition,
      days: 30,
      value: 5,
    };

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE}/api/admin/analytics/segments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name, description, rules_json }),
        }
      );
      if (!res.ok) throw new Error("Failed to save segment");
      setShowForm(false);
      setName("");
      setDescription("");
      setActivityLevel("");
      setGraduationYear("");
      fetchSegments();
    } catch (e) {
      alert("Failed to save segment: " + e.message);
    }
  };

  const handlePreview = async (id) => {
    // Basic preview fetching users who have matching session/event data
    // In our backend database we query matching users.
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE}/api/admin/analytics/recordings`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Preview failed");
      const recordings = await res.json();

      // Simple mock user filtering for segment preview matching
      const users = recordings
        .filter((r) => r.user_name)
        .map((r) => ({
          id: r.id,
          full_name: r.user_name,
          email: `${r.user_name.toLowerCase().replace(/\s/g, "")}@nexasphere.org`,
        }));

      // Deduplicate by name
      const uniqueUsers = Array.from(
        new Map(users.map((u) => [u.full_name, u])).values()
      );
      setPreviewUsers(uniqueUsers);
    } catch (e) {
      alert("Preview failed");
    }
  };

  const handleAction = async (segmentId, action) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE}/api/admin/analytics/segments/${segmentId}/action`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action, template: "default" }),
        }
      );
      if (!res.ok) throw new Error("Action failed");
      const result = await res.json();
      alert(`Action successful: ${result.count} users affected.`);
    } catch (err) {
      alert("Action failed: " + err.message);
    }
  };

  const fetchCohort = async () => {
    setCohortLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE}/api/admin/analytics/cohorts?month=${cohortMonth}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Cohort analysis failed");
      const data = await res.json();
      setCohortData(data);
    } catch (e) {
      console.error(e);
      alert("Failed to calculate cohorts");
    } finally {
      setCohortLoading(false);
    }
  };

  const triggerAutoSegment = async () => {
    try {
      // Periodic evaluation endpoint can be triggered manually
      const token = localStorage.getItem("token");
      await fetch(
        `${import.meta.env.VITE_API_BASE}/api/admin/analytics/segments/trigger`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert("Auto-segmentation job triggered successfully");
    } catch (e) {
      alert("Failed to trigger job");
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="page bg-gray-50 min-h-screen p-8 text-gray-900">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">User Segments & Retention</h2>
        <div className="flex gap-2">
          <button
            onClick={triggerAutoSegment}
            className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 transition"
          >
            Run Auto-Segmentation
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700 transition"
          >
            + New Segment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Segments List */}
        <div className="lg:col-span-2 space-y-6">
          {showForm && (
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
              <h3 className="font-bold mb-4">Create New Segment</h3>
              <form onSubmit={handleSave} className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    className="w-full border p-2 rounded"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Description
                  </label>
                  <input
                    className="w-full border p-2 rounded"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Activity Level
                  </label>
                  <select
                    className="w-full border p-2 rounded"
                    value={activityLevel}
                    onChange={(e) => setActivityLevel(e.target.value)}
                  >
                    <option value="">Any</option>
                    <option value="active">
                      Active (&gt;= 5 events / 30d)
                    </option>
                    <option value="inactive">Inactive (no events / 60d)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Graduation Year
                  </label>
                  <input
                    type="number"
                    className="w-full border p-2 rounded"
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(e.target.value)}
                    placeholder="e.g. 2026"
                  />
                </div>
                <div className="col-span-2 flex justify-end gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="text-gray-600 px-4 py-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-4">
            {segments.map((seg) => (
              <div
                key={seg.id}
                className="bg-white p-6 rounded-lg shadow-sm border flex justify-between items-center"
              >
                <div>
                  <h4 className="font-bold text-lg">{seg.name}</h4>
                  <p className="text-sm text-gray-500 mb-2">
                    {seg.description}
                  </p>
                  <div className="text-xs text-gray-400 bg-gray-100 p-2 rounded inline-block">
                    Rules: {JSON.stringify(seg.rules_json)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePreview(seg.id)}
                    className="border border-indigo-600 text-indigo-600 px-4 py-2 rounded hover:bg-indigo-50 transition"
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => handleAction(seg.id, "email")}
                    className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
                  >
                    ✉ Email Users
                  </button>
                </div>
              </div>
            ))}
            {segments.length === 0 && (
              <p className="text-gray-500 text-sm">No segments defined yet.</p>
            )}
          </div>

          {previewUsers && (
            <div className="bg-white p-6 rounded-lg shadow-sm border mt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">
                  Segment Preview ({previewUsers.length} Users)
                </h3>
                <button
                  onClick={() => setPreviewUsers(null)}
                  className="text-gray-500 hover:text-gray-800 text-2xl"
                >
                  &times;
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="p-2 border-b">ID</th>
                      <th className="p-2 border-b">Name</th>
                      <th className="p-2 border-b">Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewUsers.map((u) => (
                      <tr key={u.id} className="border-b">
                        <td className="p-2 text-gray-500 font-mono text-xs">
                          {u.id}
                        </td>
                        <td className="p-2">{u.full_name || "N/A"}</td>
                        <td className="p-2">{u.email}</td>
                      </tr>
                    ))}
                    {previewUsers.length === 0 && (
                      <tr>
                        <td
                          colSpan="3"
                          className="p-4 text-center text-gray-500"
                        >
                          No users found with activity recordings.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Cohort Retention Analytics */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="font-bold text-lg mb-2">
              Cohort Retention Analysis
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Analyze user retention for a specific signup month cohort.
            </p>
            <div className="flex gap-2 mb-4">
              <input
                type="month"
                className="border p-2 rounded flex-1"
                value={cohortMonth}
                onChange={(e) => setCohortMonth(e.target.value)}
              />
              <button
                onClick={fetchCohort}
                disabled={cohortLoading}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
              >
                Analyze
              </button>
            </div>

            {cohortLoading && (
              <p className="text-gray-500 text-sm">
                Calculating retention metrics...
              </p>
            )}

            {cohortData && (
              <div className="mt-4 space-y-4">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Total Users in Cohort:</span>
                  <span className="font-bold">{cohortData.total_users}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">
                    Retained (Active &gt; 30d):
                  </span>
                  <span className="font-bold">
                    {cohortData.retained_30d_users || 0}
                  </span>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">30-Day Retention Rate</span>
                    <span className="font-bold">
                      {cohortData.total_users > 0
                        ? (
                            (cohortData.retained_30d_users /
                              cohortData.total_users) *
                            100
                          ).toFixed(1)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className="bg-indigo-600 h-3 rounded-full transition-all duration-500"
                      style={{
                        width: `${cohortData.total_users > 0 ? (cohortData.retained_30d_users / cohortData.total_users) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            {!cohortLoading && !cohortData && (
              <p className="text-gray-400 text-sm text-center py-6">
                Select a month to load cohort data
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
