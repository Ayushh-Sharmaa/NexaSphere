/**
 * Live Metrics Cards Component
 * Displays key metrics in card format with animations
 */

import React from "react";

export default function LiveMetricsCards({ metrics }) {
  if (!metrics) {
    return null;
  }

  const cards = [
    {
      title: "Total Registrations",
      value: metrics.totalRegistrations,
      icon: "📝",
      color: "blue",
      description: "All registrations",
    },
    {
      title: "Checked In",
      value: metrics.checkedIn,
      icon: "✅",
      color: "green",
      description: "On-site attendees",
    },
    {
      title: "Pending Check-in",
      value: metrics.pendingCheckIn,
      icon: "⏳",
      color: "orange",
      description: "Not yet checked in",
    },
    {
      title: "Available Seats",
      value: metrics.availableSeats,
      icon: "🪑",
      color: "purple",
      description: `Capacity: ${metrics.maxAttendees || "Unlimited"}`,
    },
    {
      title: "Occupancy Rate",
      value: `${metrics.occupancyRate}%`,
      icon: "📊",
      color: "teal",
      description: "Venue capacity usage",
    },
  ];

  return (
    <div className="metrics-cards-section">
      <div className="metrics-grid">
        {cards.map((card, idx) => (
          <div key={idx} className={`metric-card metric-${card.color}`}>
            <div className="card-icon">{card.icon}</div>
            <div className="card-content">
              <h3 className="card-title">{card.title}</h3>
              <div className="card-value">{card.value}</div>
              <p className="card-description">{card.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
