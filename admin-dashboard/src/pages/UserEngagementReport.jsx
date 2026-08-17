import { useState, useEffect } from "react";
import { api } from "../services/api";
import { Skeleton } from "../components/Skeleton";
import { AdminIcon } from "../components/AdminIcon";
import { DashboardCardSkeleton } from "../components/DashboardCardSkeleton";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export function UserEngagementReport() {
  const [activeTab, setActiveTab] = useState("engagement");

  // Engagement state
  const [users, setUsers] = useState([]);
  const [engagementLoading, setEngagementLoading] = useState(true);
  const [engagementStats, setEngagementStats] = useState(null);

  // Revenue state
  const [revenueData, setRevenueData] = useState(null);
  const [revenueLoading, setRevenueLoading] = useState(true);
  const [revenueError, setRevenueError] = useState("");

  // Fetch engagement data
  useEffect(() => {
    async function loadEngagement() {
      try {
        const data = await api.reports.getEngagement();
        const fetchedUsers = data?.users || [];
        setUsers(fetchedUsers);

        const totalUsers = fetchedUsers.length;
        const activeUsers = fetchedUsers.filter((u) => u.status === "Active");
        const inactiveUsers = fetchedUsers.filter(
          (u) => u.status === "Inactive"
        );
        const totalScore = fetchedUsers.reduce(
          (sum, u) => sum + u.engagementScore,
          0
        );

        setEngagementStats({
          totalActive: activeUsers.length,
          totalInactive: inactiveUsers.length,
          averageScore: totalUsers ? Math.round(totalScore / totalUsers) : 0,
          mostActiveCount: fetchedUsers.filter((u) => u.engagementScore >= 80)
            .length,
        });
      } catch (e) {
        console.error("Failed to load engagement data", e);
      } finally {
        setEngagementLoading(false);
      }
    }
    loadEngagement();
  }, []);

  // Fetch revenue data
  useEffect(() => {
    async function loadRevenue() {
      try {
        setRevenueLoading(true);
        const data = await api.reports.getRevenue();
        setRevenueData(data);
      } catch (e) {
        console.error("Failed to load revenue data", e);
        setRevenueError(e.message || "Failed to load revenue data");
      } finally {
        setRevenueLoading(false);
      }
    }
    loadRevenue();
  }, []);

  const COLORS = [
    "var(--chart-success)",
    "var(--chart-primary)",
    "var(--chart-warning)",
    "var(--chart-danger)",
    "#ec4899",
  ];

  return (
    <div className="page">
      <div className="page-header" style={{ marginBottom: "1.5rem" }}>
        <h2 className="page-title">Reports & Analytics</h2>
        <p className="page-subtitle" style={{ marginTop: "0.5rem" }}>
          Deep-dive insights into NexaSphere community participation, event
          revenue, and financials.
        </p>

        {/* Custom Tab Switcher */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "1.5rem",
            borderBottom: "1px solid var(--admin-border, #333)",
            paddingBottom: "8px",
          }}
        >
          <button
            onClick={() => setActiveTab("engagement")}
            style={{
              padding: "8px 16px",
              background:
                activeTab === "engagement"
                  ? "rgba(204,17,17,0.1)"
                  : "transparent",
              border: "none",
              borderRadius: "6px",
              color:
                activeTab === "engagement"
                  ? "var(--admin-accent, #CC1111)"
                  : "var(--admin-text-muted, #888)",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
              borderBottom:
                activeTab === "engagement"
                  ? "2px solid var(--admin-accent, #CC1111)"
                  : "none",
            }}
          >
            <AdminIcon
              name="Users"
              size={16}
              style={{ marginRight: "8px", verticalAlign: "middle" }}
            />
            User Engagement
          </button>
          <button
            onClick={() => setActiveTab("revenue")}
            style={{
              padding: "8px 16px",
              background:
                activeTab === "revenue" ? "rgba(204,17,17,0.1)" : "transparent",
              border: "none",
              borderRadius: "6px",
              color:
                activeTab === "revenue"
                  ? "var(--admin-accent, #CC1111)"
                  : "var(--admin-text-muted, #888)",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
              borderBottom:
                activeTab === "revenue"
                  ? "2px solid var(--admin-accent, #CC1111)"
                  : "none",
            }}
          >
            <AdminIcon
              name="TrendingUp"
              size={16}
              style={{ marginRight: "8px", verticalAlign: "middle" }}
            />
            Revenue & Payments
          </button>
        </div>
      </div>

      {activeTab === "engagement" ? (
        /* ==================== TAB: ENGAGEMENT ==================== */
        <>
          {engagementLoading ? (
            <div className="stats-grid" style={{ marginBottom: "2rem" }}>
              <DashboardCardSkeleton />
              <DashboardCardSkeleton />
              <DashboardCardSkeleton />
              <DashboardCardSkeleton />
            </div>
          ) : engagementStats ? (
            <div className="stats-grid" style={{ marginBottom: "2rem" }}>
              <div className="stat-card">
                <span className="stat-icon">
                  <AdminIcon name="Users" size={28} aria-hidden="true" />
                </span>
                <div>
                  <div className="stat-value">
                    {engagementStats.totalActive}
                  </div>
                  <div className="stat-label">Active Users</div>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">
                  <AdminIcon name="Target" size={28} aria-hidden="true" />
                </span>
                <div>
                  <div className="stat-value">
                    {engagementStats.averageScore}
                  </div>
                  <div className="stat-label">Avg Engagement Score</div>
                </div>
              </div>
              <div className="stat-card">
                <span
                  className="stat-icon"
                  style={{
                    color: "var(--admin-accent)",
                    background: "rgba(204,17,17,0.1)",
                  }}
                >
                  <AdminIcon name="Award" size={28} aria-hidden="true" />
                </span>
                <div>
                  <div className="stat-value">
                    {engagementStats.mostActiveCount}
                  </div>
                  <div className="stat-label">Most Active (Score ≥ 80)</div>
                </div>
              </div>
              <div className="stat-card">
                <span
                  className="stat-icon"
                  style={{
                    color: "#888",
                    background: "rgba(255,255,255,0.05)",
                  }}
                >
                  <AdminIcon name="Users" size={28} aria-hidden="true" />
                </span>
                <div>
                  <div className="stat-value">
                    {engagementStats.totalInactive}
                  </div>
                  <div className="stat-label">Inactive Users</div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Engagement Details</h3>
              <p
                className="page-subtitle"
                style={{ marginTop: "0.25rem", fontSize: "0.8rem" }}
              >
                <strong>Scoring Logic:</strong> 40% active days (30d), 30%
                events attended, 30% portfolio completion.
                <br />
                <strong>Inactive Logic:</strong> Less than 2 active days in the
                last 30 days and 0 events attended.
              </p>
            </div>
            <div className="card-content" style={{ overflowX: "auto" }}>
              {engagementLoading ? (
                <Skeleton height={40} count={5} />
              ) : users.length === 0 ? (
                <div className="empty-state">No engagement data found.</div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User Name</th>
                      <th>Events Attended</th>
                      <th>Portfolio %</th>
                      <th>Active Days (30d)</th>
                      <th>Active Days (90d)</th>
                      <th>Engagement Score</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td style={{ fontWeight: 500 }}>{user.name}</td>
                        <td>{user.eventsAttended}</td>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <div
                              style={{
                                flex: 1,
                                background: "rgba(255,255,255,0.1)",
                                height: "6px",
                                borderRadius: "3px",
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  width: `${user.portfolioCompletion}%`,
                                  background: "var(--admin-accent)",
                                  height: "100%",
                                }}
                              />
                            </div>
                            <span style={{ fontSize: "0.8rem" }}>
                              {user.portfolioCompletion}%
                            </span>
                          </div>
                        </td>
                        <td>{user.activeDays30}</td>
                        <td>{user.activeDays90}</td>
                        <td>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "2px 8px",
                              borderRadius: "12px",
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              backgroundColor:
                                user.engagementScore >= 80
                                  ? "rgba(34, 197, 94, 0.15)"
                                  : user.engagementScore >= 40
                                    ? "rgba(234, 179, 8, 0.15)"
                                    : "rgba(239, 68, 68, 0.15)",
                              color:
                                user.engagementScore >= 80
                                  ? "#4ade80"
                                  : user.engagementScore >= 40
                                    ? "#facc15"
                                    : "#f87171",
                            }}
                          >
                            {user.engagementScore}
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              color:
                                user.status === "Active"
                                  ? "var(--admin-text)"
                                  : "var(--admin-text-muted)",
                              opacity: user.status === "Active" ? 1 : 0.6,
                            }}
                          >
                            {user.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      ) : (
        /* ==================== TAB: REVENUE & PAYMENTS ==================== */
        <>
          {revenueLoading ? (
            <div className="stats-grid" style={{ marginBottom: "2rem" }}>
              <DashboardCardSkeleton />
              <DashboardCardSkeleton />
              <DashboardCardSkeleton />
              <DashboardCardSkeleton />
            </div>
          ) : revenueError ? (
            <div className="page-error" style={{ marginBottom: "2rem" }}>
              {revenueError}
            </div>
          ) : revenueData ? (
            <>
              {/* Revenue Stats Grid */}
              <div className="stats-grid" style={{ marginBottom: "2rem" }}>
                <div className="stat-card">
                  <span
                    className="stat-icon"
                    style={{
                      color: "#22c55e",
                      background: "rgba(34,197,94,0.1)",
                    }}
                  >
                    <AdminIcon name="TrendingUp" size={28} aria-hidden="true" />
                  </span>
                  <div>
                    <div
                      className="stat-value"
                      style={{ fontFamily: "Orbitron,monospace" }}
                    >
                      ${revenueData.stats.totalRevenue.toLocaleString()}
                    </div>
                    <div className="stat-label">Total Gross Revenue</div>
                  </div>
                </div>
                <div className="stat-card">
                  <span
                    className="stat-icon"
                    style={{
                      color: "#3b82f6",
                      background: "rgba(59,130,246,0.1)",
                    }}
                  >
                    <AdminIcon
                      name="CheckCircle"
                      size={28}
                      aria-hidden="true"
                    />
                  </span>
                  <div>
                    <div
                      className="stat-value"
                      style={{
                        fontFamily: "Orbitron,monospace",
                        color: "#3b82f6",
                      }}
                    >
                      ${revenueData.stats.netRevenue.toLocaleString()}
                    </div>
                    <div className="stat-label">Net Revenue</div>
                  </div>
                </div>
                <div className="stat-card">
                  <span
                    className="stat-icon"
                    style={{
                      color: "#ef4444",
                      background: "rgba(239,68,68,0.1)",
                    }}
                  >
                    <AdminIcon name="Clock" size={28} aria-hidden="true" />
                  </span>
                  <div>
                    <div
                      className="stat-value"
                      style={{
                        fontFamily: "Orbitron,monospace",
                        color: "#ef4444",
                      }}
                    >
                      ${revenueData.stats.totalRefunded.toLocaleString()}
                    </div>
                    <div className="stat-label">Total Refunded</div>
                  </div>
                </div>
                <div className="stat-card">
                  <span
                    className="stat-icon"
                    style={{
                      color: "#8b5cf6",
                      background: "rgba(139,92,246,0.1)",
                    }}
                  >
                    <AdminIcon name="Award" size={28} aria-hidden="true" />
                  </span>
                  <div>
                    <div
                      className="stat-value"
                      style={{
                        fontFamily: "Orbitron,monospace",
                        color: "#8b5cf6",
                      }}
                    >
                      ${revenueData.stats.totalTax.toLocaleString()}
                    </div>
                    <div className="stat-label">Tax Summary (Collected)</div>
                  </div>
                </div>
              </div>

              {/* Chart Visualizations Row */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
                  gap: "1.5rem",
                  marginBottom: "2rem",
                }}
              >
                {/* Daily Revenue Trend Chart */}
                <div className="card" style={{ padding: "1.5rem" }}>
                  <h3
                    className="card-title"
                    style={{ marginBottom: "1.25rem" }}
                  >
                    <AdminIcon
                      name="TrendingUp"
                      size={16}
                      style={{ marginRight: "8px" }}
                    />
                    Daily Revenue Trend
                  </h3>
                  <div style={{ width: "100%", height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueData.revenueTrend}>
                        <defs>
                          <linearGradient
                            id="colorRevenue"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="var(--chart-primary)"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor="var(--chart-primary)"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--chart-grid)"
                        />
                        <XAxis
                          dataKey="date"
                          stroke="var(--chart-text)"
                          tick={{ fontSize: 12, fill: "var(--chart-text)" }}
                          tickMargin={10}
                        />
                        <YAxis
                          stroke="var(--chart-text)"
                          tick={{ fontSize: 12, fill: "var(--chart-text)" }}
                          tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "var(--admin-bg-card, #1a1a2e)",
                            border: "1px solid var(--admin-border, #333)",
                            borderRadius: "8px",
                            color: "#fff",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="var(--chart-primary)"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorRevenue)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Payment Method Breakdown Pie Chart */}
                <div className="card" style={{ padding: "1.5rem" }}>
                  <h3
                    className="card-title"
                    style={{ marginBottom: "1.25rem" }}
                  >
                    <AdminIcon
                      name="Users"
                      size={16}
                      style={{ marginRight: "8px" }}
                    />
                    Payment Method Breakdown
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: 260,
                    }}
                  >
                    <div style={{ width: "60%", height: "100%" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={revenueData.paymentMethodBreakdown}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={80}
                            paddingAngle={3}
                            dataKey="amount"
                          >
                            {revenueData.paymentMethodBreakdown.map(
                              (entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              )
                            )}
                          </Pie>
                          <Tooltip
                            formatter={(value) => `$${value.toLocaleString()}`}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div
                      style={{
                        width: "40%",
                        fontSize: "0.8rem",
                        color: "var(--admin-text, #eee)",
                      }}
                    >
                      {revenueData.paymentMethodBreakdown.map((item, index) => (
                        <div
                          key={item.method}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            marginBottom: "8px",
                          }}
                        >
                          <span
                            style={{
                              display: "inline-block",
                              width: "10px",
                              height: "10px",
                              backgroundColor: COLORS[index % COLORS.length],
                              borderRadius: "50%",
                              marginRight: "8px",
                            }}
                          />
                          <strong>{item.method}</strong>
                          <span
                            style={{
                              marginLeft: "auto",
                              color: "var(--admin-text-muted, #888)",
                            }}
                          >
                            {item.percentage}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Event Revenue Details & Refund Tracking Tables */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
                  gap: "1.5rem",
                }}
              >
                {/* Event Revenue Summary Table */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">Revenue by Event</h3>
                  </div>
                  <div
                    className="card-content"
                    style={{ maxHeight: "350px", overflowY: "auto" }}
                  >
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Event Name</th>
                          <th style={{ textAlign: "right" }}>Total Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {revenueData.revenueByEvent.map((item, index) => (
                          <tr key={index}>
                            <td style={{ fontWeight: 500 }}>
                              {item.eventName}
                            </td>
                            <td
                              style={{
                                textAlign: "right",
                                fontWeight: "bold",
                                color:
                                  item.revenue > 0
                                    ? "#22c55e"
                                    : "var(--admin-text-muted)",
                              }}
                            >
                              ${item.revenue.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Refund Tracking Details Table */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">Refund & Payment Analytics</h3>
                  </div>
                  <div
                    className="card-content"
                    style={{ maxHeight: "350px", overflowY: "auto" }}
                  >
                    {revenueData.refunds.length === 0 ? (
                      <div className="empty-state">
                        No refund logs recorded.
                      </div>
                    ) : (
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Ref Event</th>
                            <th>Category</th>
                            <th style={{ textAlign: "right" }}>
                              Refund Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {revenueData.refunds.map((refund, idx) => (
                            <tr key={idx}>
                              <td>{refund.eventName}</td>
                              <td>{refund.source}</td>
                              <td
                                style={{
                                  textAlign: "right",
                                  color: "#f87171",
                                  fontWeight: 600,
                                }}
                              >
                                -${refund.refundAmount.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
