/**
 * Analytics Dashboard Page
 * Sample integration page for the real-time analytics dashboard
 */

import React, { useState } from "react";
import AnalyticsDashboard from "../components/AnalyticsDashboard";
import "../styles/analytics-dashboard.css";

export default function AnalyticsDashboardPage() {
  const [selectedEventId, setSelectedEventId] = useState("kss-153"); // Default event

  return (
    <div className="analytics-page">
      <AnalyticsDashboard eventId={selectedEventId} />
    </div>
  );
}
