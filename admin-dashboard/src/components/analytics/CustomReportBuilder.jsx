import React, { useState } from "react";
import { api } from "../../services/api";
import { exportToCSV, exportToPDF } from "../../utils/exportUtils";

export function CustomReportBuilder() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [metric, setMetric] = useState("page_views");
  const [timeRange, setTimeRange] = useState("30d");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRunReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE}/api/admin/analytics/reports/execute`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ metric, timeRange }),
        }
      );
      const json = await res.json();
      setReportData(json.report?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReport = async () => {
    if (!name) return alert("Please enter a report name");
    try {
      await fetch(
        `${import.meta.env.VITE_API_BASE}/api/admin/analytics/reports`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            description,
            config: { metric, timeRange },
          }),
        }
      );
      alert("Report saved successfully");
    } catch (e) {
      console.error(e);
      alert("Failed to save report");
    }
  };

  const handleExportCSV = () => {
    if (reportData) exportToCSV(reportData, `${metric}_report.csv`);
  };

  const handleExportPDF = () => {
    if (reportData && reportData.length > 0) {
      exportToPDF(
        `Custom Report: ${metric}`,
        Object.keys(reportData[0]),
        reportData,
        `${metric}_report.pdf`
      );
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-bold mb-4">Custom Report Builder</h3>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Report Name</label>
          <input
            className="w-full border rounded p-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="E.g., Monthly Signups"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <input
            className="w-full border rounded p-2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional details"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Metric</label>
          <select
            className="w-full border rounded p-2"
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
          >
            <option value="page_views">Page Views</option>
            <option value="signups">New Signups</option>
            <option value="registrations">Event Registrations</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Time Range</label>
          <select
            className="w-full border rounded p-2"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="30d">Last 30 Days</option>
            <option value="365d">Last Year</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={handleRunReport}
          className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700"
        >
          {loading ? "Running..." : "Run Query"}
        </button>
        <button
          onClick={handleSaveReport}
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded font-medium hover:bg-gray-300"
        >
          Save Configuration
        </button>
      </div>

      {reportData && (
        <div className="mt-4 border-t pt-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold">
              Query Results ({reportData.length} rows)
            </h4>
            <div className="flex gap-2">
              <button
                onClick={handleExportCSV}
                className="text-sm border border-gray-300 px-3 py-1 rounded hover:bg-gray-50"
              >
                Export CSV
              </button>
              <button
                onClick={handleExportPDF}
                className="text-sm border border-gray-300 px-3 py-1 rounded hover:bg-gray-50"
              >
                Export PDF
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100">
                  {reportData.length > 0 &&
                    Object.keys(reportData[0]).map((k) => (
                      <th key={k} className="p-2 border-b font-medium">
                        {k}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {reportData.map((row, i) => (
                  <tr key={i} className="border-b">
                    {Object.values(row).map((val, j) => (
                      <td key={j} className="p-2">
                        {String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
