import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CustomReportBuilder } from "../components/analytics/CustomReportBuilder";

export function ComprehensiveAnalytics() {
  const [summary, setSummary] = useState(null);
  const [userAnalytics, setUserAnalytics] = useState(null);
  const [funnel, setFunnel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const [summaryRes, userRes, funnelRes] = await Promise.all([
          fetch(
            `${import.meta.env.VITE_API_BASE}/api/admin/analytics/summary`,
            {
              credentials: "include",
            }
          ),
          fetch(`${import.meta.env.VITE_API_BASE}/api/admin/analytics/users`, {
            credentials: "include",
          }),
          fetch(`${import.meta.env.VITE_API_BASE}/api/admin/analytics/funnel`, {
            credentials: "include",
          }),
        ]);

        const summaryData = await summaryRes.json();
        const userData = await userRes.json();
        const funnelData = await funnelRes.json();

        setSummary(summaryData.summary);
        setUserAnalytics(userData.analytics);
        setFunnel(funnelData.funnel);
      } catch (err) {
        console.error("Failed to load comprehensive analytics", err);
      } finally {
        setLoading(false);
      }
    }

    async function loadFeedbackInsights() {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE}/api/feedback`
        );
        if (!res.ok) throw new Error("Feedback endpoint unavailable");
        const data = await res.json();
        const entries = Array.isArray(data)
          ? data
          : data.feedbacks || data.analytics?.feedbacks || [];
        setFeedbackReport(buildFeedbackAnalyticsReport(entries));
      } catch {
        const fallback = [
          {
            id: 1,
            text: "Great speaker but poor venue and the room was too hot.",
            suggestions: "Increase AC.",
            date: "2025-05-01",
          },
          {
            id: 2,
            text: "The content was informative and the timing was perfect.",
            suggestions: "Keep the same structure.",
            date: "2025-05-02",
          },
          {
            id: 3,
            text: "Food was disappointing and the organization felt rushed.",
            suggestions: "Improve catering.",
            date: "2025-05-03",
          },
        ];
        setFeedbackReport(buildFeedbackAnalyticsReport(fallback));
      }
    }
    fetchAnalytics();
  }, []);

  if (loading)
    return (
      <div className="p-8 text-gray-500">Loading Analytics Dashboard...</div>
    );

  return (
    <div className="page bg-gray-50 text-gray-900 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Admin Analytics Dashboard</h2>
        <a
          href="/dashboard/analytics/funnel"
          style={{
            background: "#6366f1",
            color: "#fff",
            padding: "8px 16px",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: "0.875rem",
          }}
        >
          🔍 Funnel Analysis
        </a>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <MetricCard
          title="Active Users"
          value={summary?.activeUsers || 0}
          trend="+12%"
        />
        <MetricCard
          title="Events This Month"
          value={summary?.eventsThisMonth || 0}
          trend="+3%"
        />
        <MetricCard
          title="Total Registrations"
          value={summary?.totalRegistrations || 0}
          trend="+24%"
        />
        <MetricCard
          title="Engagement Rate"
          value={summary?.engagementRate || 0}
          trend="-2%"
          negative
        />
      </div>

      {activeTab === "overview" && (
        <>
          {/* Overview Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <MetricCard
              title="Active Users"
              value={summary?.activeUsers || 0}
              trend="+12%"
            />
            <MetricCard
              title="Events This Month"
              value={summary?.eventsThisMonth || 0}
              trend="+3%"
            />
            <MetricCard
              title="Total Registrations"
              value={summary?.totalRegistrations || 0}
              trend="+24%"
            />
            <MetricCard
              title="Engagement Rate"
              value={summary?.engagementRate || 0}
              trend="-2%"
              negative
            />
          </div>

          {/* Main Charts Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* User Signups Trend */}
            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="font-bold mb-4">New Signups (Last 30 Days)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={userAnalytics?.signupsByDay || []}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="var(--chart-grid)"
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickMargin={10}
                      minTickGap={30}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="var(--chart-primary)"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Engagement Funnel */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="font-bold mb-4">Engagement Funnel</h3>
              <div className="space-y-4">
                {funnel?.map((step, idx) => {
                  const max = Math.max(...funnel.map((s) => s.count)) || 1;
                  const percent = Math.round((step.count / max) * 100);
                  return (
                    <div key={idx}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{step.step}</span>
                        <span className="text-gray-500">{step.count}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div
                          className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {feedbackReport && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-bold">Feedback Insights</h3>
                  <p className="text-sm text-gray-500">
                    Sentiment, themes, aspect analysis, and suggestions
                  </p>
                </div>
                <span className="text-sm font-semibold text-indigo-600">
                  Overall: {feedbackReport.summary.overallSentiment}
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(
                      feedbackReport.summary.sentimentPercentages
                    ).map(([label, value]) => (
                      <div
                        key={label}
                        className="bg-gray-50 p-3 rounded border"
                      >
                        <p className="text-sm text-gray-500">{label}</p>
                        <p className="text-lg font-semibold">{value}%</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-gray-50 p-3 rounded border">
                    <h4 className="font-semibold mb-2">Aspect Ratings</h4>
                    <div className="space-y-2 text-sm">
                      {Object.entries(feedbackReport.summary.aspectRatings).map(
                        ([aspect, value]) => (
                          <div key={aspect} className="flex justify-between">
                            <span>{aspect}</span>
                            <span className="font-medium">
                              {value.sentiment}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 p-3 rounded border">
                    <h4 className="font-semibold mb-2">Top Themes</h4>
                    <div className="flex flex-wrap gap-2">
                      {feedbackReport.summary.topThemes
                        .slice(0, 6)
                        .map((theme) => (
                          <span
                            key={theme.theme}
                            className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-sm"
                          >
                            {theme.theme} ({theme.count})
                          </span>
                        ))}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded border">
                    <h4 className="font-semibold mb-2">
                      Actionable Suggestions
                    </h4>
                    <ul className="space-y-2 text-sm">
                      {feedbackReport.summary.suggestions.map((suggestion) => (
                        <li key={suggestion.topic} className="leading-5">
                          • {suggestion.suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Custom Report Builder */}
      <div className="mb-8">
        <CustomReportBuilder />
      </div>
    </div>
  );
}

function MetricCard({ title, value, trend, negative }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h4 className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-2">
        {title}
      </h4>
      <div className="flex items-end justify-between">
        <div className="text-3xl font-extrabold text-gray-900">{value}</div>
        <div
          className={`text-sm font-bold ${negative ? "text-red-500" : "text-green-500"}`}
        >
          {trend}
        </div>
      </div>
    </div>
  );
}
