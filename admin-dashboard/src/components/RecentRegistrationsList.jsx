/**
 * Recent Registrations List Component
 * Displays the most recent event registrations with real-time updates
 */

import React from "react";
import { Skeleton } from "./Skeleton";

export default function RecentRegistrationsList({
  registrations = [],
  isLoading,
}) {
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const formatEmail = (email) => {
    if (!email) return "Unknown";
    if (email.length > 30) {
      return email.substring(0, 27) + "...";
    }
    return email;
  };

  const getStatusBadge = (status) => {
    const badges = {
      registered: { color: "#f59e0b", icon: "📝" },
      checked_in: { color: "#10b981", icon: "✅" },
      cancelled: { color: "#ef4444", icon: "❌" },
      no_show: { color: "#6b7280", icon: "⚠️" },
    };
    return badges[status] || { color: "#3b82f6", icon: "📌" };
  };

  return (
    <div className="recent-registrations-container">
      <div className="list-header">
        <h2>🔔 Recent Activity</h2>
        <span className="count">{registrations.length} registrations</span>
      </div>

      {isLoading && registrations.length === 0 ? (
        <div className="registrations-list">
          <div
            className="list-items"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              padding: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <Skeleton width="40px" height="40px" rounded={true} />
              <div style={{ flex: 1 }}>
                <Skeleton height="20px" width="80%" />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <Skeleton width="40px" height="40px" rounded={true} />
              <div style={{ flex: 1 }}>
                <Skeleton height="20px" width="60%" />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <Skeleton width="40px" height="40px" rounded={true} />
              <div style={{ flex: 1 }}>
                <Skeleton height="20px" width="70%" />
              </div>
            </div>
          </div>
        </div>
      ) : registrations.length > 0 ? (
        <div className="registrations-list">
          <div className="list-items">
            {registrations.map((reg, idx) => {
              const badge = getStatusBadge(reg.status);
              return (
                <div key={idx} className="registration-item">
                  <div className="item-icon">{badge.icon}</div>
                  <div className="item-content">
                    <div className="item-email">{formatEmail(reg.email)}</div>
                    <div className="item-status">
                      <span className="status-text">{reg.status}</span>
                      <span className="status-time">
                        {formatDate(reg.createdAt || reg.timestamp)}
                      </span>
                    </div>
                  </div>
                  <div
                    className="item-indicator"
                    style={{ backgroundColor: badge.color }}
                  ></div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <p>📭 No registrations yet</p>
        </div>
      )}
    </div>
  );
}
