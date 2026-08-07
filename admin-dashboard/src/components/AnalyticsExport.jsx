/**
 * Analytics Export Component
 * Provides functionality to export analytics data in CSV and JSON formats
 */

import React, { useState } from "react";
import analyticsAPI from "../services/analyticsAPI.js";

export default function AnalyticsExport({ eventId }) {
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState("csv");
  const [message, setMessage] = useState("");

  const handleExport = async (format) => {
    setExporting(true);
    setMessage("");

    try {
      const blob = await analyticsAPI.exportAnalytics(eventId, format);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `analytics-${eventId}-${new Date().toISOString().split("T")[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setMessage(`✅ Exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error("Export failed:", error);
      setMessage(`❌ Export failed: ${error.message}`);
    } finally {
      setExporting(false);
      // Clear message after 3 seconds
      setTimeout(() => setMessage(""), 3000);
    }
  };

  return (
    <div className="analytics-export-container">
      <div className="export-header">
        <h2>💾 Export Analytics</h2>
      </div>

      <div className="export-content">
        <p className="export-description">
          Download event analytics data for further analysis and reporting.
        </p>

        <div className="export-options">
          <div className="option">
            <button
              onClick={() => handleExport("csv")}
              disabled={exporting}
              className="btn-export btn-csv"
            >
              <span className="icon">📊</span>
              <span className="text">Export as CSV</span>
              <span className="subtext">Spreadsheet format</span>
            </button>
          </div>

          <div className="option">
            <button
              onClick={() => handleExport("json")}
              disabled={exporting}
              className="btn-export btn-json"
            >
              <span className="icon">📄</span>
              <span className="text">Export as JSON</span>
              <span className="subtext">Raw data format</span>
            </button>
          </div>
        </div>

        {exporting && (
          <div className="export-status">
            <div className="spinner"></div>
            <p>Preparing export...</p>
          </div>
        )}

        {message && (
          <div
            className={`export-message ${message.startsWith("✅") ? "success" : "error"}`}
          >
            {message}
          </div>
        )}

        <div className="export-info">
          <h3>📋 What's Included:</h3>
          <ul>
            <li>Event details</li>
            <li>Registration information</li>
            <li>Check-in status</li>
            <li>Timestamps</li>
            <li>Registration dates</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
