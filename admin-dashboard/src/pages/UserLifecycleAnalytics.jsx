import React, { useState, useEffect } from "react";
import api from "../services/api";

const UserLifecycleAnalytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await api.get("/api/lifecycle/analytics");
        if (response.data.success) {
          setStats(response.data.stats);
        }
      } catch (error) {
        console.error("Failed to fetch lifecycle analytics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <div>Loading Analytics...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">User Lifecycle Analytics</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          "PROSPECT",
          "NEW_USER",
          "ACTIVE",
          "POWER_USER",
          "INACTIVE",
          "ALUMNI",
          "CHURNED",
        ].map((stage) => (
          <div key={stage} className="p-4 border rounded shadow bg-white">
            <h3 className="text-sm text-gray-500 font-semibold">{stage}</h3>
            <p className="text-3xl font-bold text-gray-800">
              {stats?.[stage] || 0}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">
          Automated Interventions
        </h2>
        <ul className="list-disc pl-5 space-y-1 text-sm text-blue-700">
          <li>
            <strong>Prospects:</strong> Onboarding emails are sent
            automatically.
          </li>
          <li>
            <strong>Inactive/Churned:</strong> Win-back campaigns are triggered
            every week.
          </li>
          <li>
            <strong>Power Users:</strong> Automatically highlighted for
            community spotlight.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default UserLifecycleAnalytics;
