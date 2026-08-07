import { useState, useEffect, useMemo } from "react";
import { api } from "../services/api";
import { auth } from "../services/auth";
import { AdminIcon } from "../components/AdminIcon";
import { Skeleton } from "../components/Skeleton";
import { DashboardCardSkeleton } from "../components/DashboardCardSkeleton";
import { exportToCSV, exportToPDF } from "../utils/exportUtils";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";

export function EventAttendanceReport() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [registrations, setRegistrations] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [startTime, setStartTime] = useState("10:00");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All"); // All, Attended, No-Show, Early, Late

  // Load events
  useEffect(() => {
    setLoadingEvents(true);
    api.events
      .getAll()
      .then((data) => {
        if (data?.events) {
          setEvents(data.events);
          if (data.events.length > 0) {
            setSelectedEventId(data.events[0].id);
          }
        }
      })
      .catch((err) => console.error("Failed to fetch events:", err))
      .finally(() => setLoadingEvents(false));
  }, []);

  // Load registrations when selected event changes
  useEffect(() => {
    if (!selectedEventId) return;

    setLoadingData(true);
    api.eventRegistrations
      .list(selectedEventId)
      .then((data) => {
        let list = data?.registrations || [];
        // Seeding mock data in offline mode for demonstration if empty
        if (list.length === 0 && auth.isOfflineMode()) {
          list = generateMockRegistrations(selectedEventId);
        }
        setRegistrations(list);
      })
      .catch((err) => {
        console.error("Failed to fetch registrations:", err);
        if (auth.isOfflineMode()) {
          setRegistrations(generateMockRegistrations(selectedEventId));
        }
      })
      .finally(() => setLoadingData(false));
  }, [selectedEventId]);

  // Selected event object
  const selectedEvent = useMemo(() => {
    return events.find((e) => e.id === selectedEventId);
  }, [events, selectedEventId]);

  // Helper to parse early/late status based on start time
  const checkAttendanceStatus = (reg) => {
    if (!reg.attended) return "No-Show";
    if (!reg.attended_at) return "Attended (Unknown Time)";

    const checkinTime = new Date(reg.attended_at);
    const [hours, minutes] = startTime.split(":").map(Number);
    const limitTime = new Date(checkinTime);
    limitTime.setHours(hours, minutes, 0, 0);

    return checkinTime <= limitTime ? "Early" : "Late";
  };

  // Process registrations for stats & visualizations
  const processedData = useMemo(() => {
    const total = registrations.length;
    const attended = registrations.filter((r) => r.attended).length;
    const noShow = total - attended;
    const noShowRate = total > 0 ? ((noShow / total) * 100).toFixed(1) : "0.0";

    let early = 0;
    let late = 0;
    registrations.forEach((r) => {
      if (r.attended) {
        const status = checkAttendanceStatus(r);
        if (status === "Early") early++;
        if (status === "Late") late++;
      }
    });

    // Check-in timeline (by hour)
    const hourlyDataMap = {};
    registrations.forEach((r) => {
      if (r.attended && r.attended_at) {
        const date = new Date(r.attended_at);
        const hour = date.getHours();
        const ampm = hour >= 12 ? "PM" : "AM";
        const displayHour = `${hour % 12 || 12} ${ampm}`;
        hourlyDataMap[displayHour] = (hourlyDataMap[displayHour] || 0) + 1;
      }
    });

    const hourlyData = Object.entries(hourlyDataMap)
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => {
        const parseHour = (h) => {
          const [num, ampm] = h.split(" ");
          let val = parseInt(num, 10);
          if (ampm === "PM" && val !== 12) val += 12;
          if (ampm === "AM" && val === 12) val = 0;
          return val;
        };
        return parseHour(a.hour) - parseHour(b.hour);
      });

    return {
      total,
      attended,
      noShow,
      noShowRate,
      early,
      late,
      hourlyData,
    };
  }, [registrations, startTime]);

  // Filtered registrations for the detailed table
  const filteredRegistrations = useMemo(() => {
    return registrations.filter((reg) => {
      const matchSearch =
        reg.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reg.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reg.department?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      if (statusFilter === "All") return true;
      if (statusFilter === "Attended") return reg.attended;
      if (statusFilter === "No-Show") return !reg.attended;

      const attStatus = checkAttendanceStatus(reg);
      return attStatus === statusFilter;
    });
  }, [registrations, searchQuery, statusFilter, startTime]);

  // Chart data
  const pieData = [
    { name: "Early Check-ins", value: processedData.early, color: "#22c55e" },
    { name: "Late Check-ins", value: processedData.late, color: "#f59e0b" },
    { name: "No-Shows", value: processedData.noShow, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  // CSV Export
  const handleCSVExport = () => {
    if (registrations.length === 0) return;
    const exportData = registrations.map((r) => ({
      "Full Name": r.full_name,
      Email: r.email,
      Department: r.department || "N/A",
      Year: r.year || "N/A",
      Status: r.status || "confirmed",
      Attended: r.attended ? "Yes" : "No",
      "Check-in Time": r.attended_at
        ? new Date(r.attended_at).toLocaleString()
        : "N/A",
      "Check-in Status": r.attended ? checkAttendanceStatus(r) : "No-Show",
    }));
    const eventNameClean = (selectedEvent?.name || "event")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_");
    exportToCSV(exportData, `${eventNameClean}_attendance_report.csv`);
  };

  // PDF Export
  const handlePDFExport = () => {
    if (registrations.length === 0) return;
    const title = `Attendance Report: ${selectedEvent?.name || "Event"}`;
    const headers = [
      "Name",
      "Email",
      "Department",
      "Year",
      "Status",
      "Check-in Status",
    ];
    const exportData = registrations.map((r) => ({
      Name: r.full_name,
      Email: r.email,
      Department: r.department || "N/A",
      Year: r.year || "N/A",
      Status: r.status || "confirmed",
      "Check-in Status": r.attended ? checkAttendanceStatus(r) : "No-Show",
    }));
    const eventNameClean = (selectedEvent?.name || "event")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_");
    exportToPDF(
      title,
      headers,
      exportData,
      `${eventNameClean}_attendance_report.pdf`
    );
  };

  // Seeder for offline verification
  function generateMockRegistrations(eventId) {
    const departments = [
      "CSE",
      "IT",
      "ECE",
      "ME",
      "CE",
      "CSE (AI&ML)",
      "CSE (DS)",
    ];
    const years = ["1st", "2nd", "3rd", "4th"];
    const names = [
      "Bhavya Jain",
      "Aarav Mehta",
      "Ananya Iyer",
      "Ishaan Verma",
      "Riya Sen",
      "Kabir Kapoor",
      "Aditi Rao",
      "Dev Patel",
      "Kavya Nair",
      "Rohan Das",
      "Sanya Malhotra",
      "Vikram Seth",
      "Meera Rajput",
      "Arjun Saxena",
      "Tanvi Goel",
      "Siddharth Roy",
      "Nisha Sharma",
      "Abhishek Mishra",
      "Prisha Gupta",
      "Yash Wardhan",
    ];

    return names.map((name, index) => {
      const isAttended = index % 5 !== 0; // 80% attendance rate
      let attendedAt = null;
      if (isAttended) {
        const date = new Date();
        // Generate check-in hour around 10:00 AM (some early, some late)
        date.setHours(9, 30 + ((index * 4) % 60), 0, 0);
        attendedAt = date.toISOString();
      }
      const createdDate = new Date();
      createdDate.setDate(createdDate.getDate() - 5 - (index % 3));

      return {
        id: `reg-${eventId}-${index}`,
        event_id: eventId,
        full_name: name,
        email: `${name.toLowerCase().replace(" ", ".")}@example.com`,
        department: departments[index % departments.length],
        year: years[index % years.length],
        status: "confirmed",
        attended: isAttended,
        attended_at: attendedAt,
        created_at: createdDate.toISOString(),
      };
    });
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Event Attendance Report</h2>
        <p className="page-subtitle" style={{ marginTop: "0.5rem" }}>
          Analyze attendance status, timeline check-ins, early vs. late ratios,
          and download offline reports.
        </p>
      </div>

      {/* Selectors and Configuration Panel */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <div className="card-content" style={{ padding: "20px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "20px",
              alignItems: "end",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.8rem",
                  color: "var(--admin-text-muted)",
                  marginBottom: "8px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
              >
                Select Event
              </label>
              {loadingEvents ? (
                <Skeleton height={38} />
              ) : (
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 8,
                    border: "1px solid var(--admin-border)",
                    background: "var(--admin-bg-card)",
                    color: "var(--admin-text)",
                    width: "100%",
                    fontSize: "0.95rem",
                  }}
                >
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name} ({ev.date})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.8rem",
                  color: "var(--admin-text-muted)",
                  marginBottom: "8px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
              >
                Event Start Time (For Early/Late Analysis)
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value || "10:00")}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: "1px solid var(--admin-border)",
                  background: "var(--admin-bg-card)",
                  color: "var(--admin-text)",
                  width: "100%",
                  fontSize: "0.95rem",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={handlePDFExport}
                disabled={registrations.length === 0}
                className="btn btn-primary"
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "10px 16px",
                  fontWeight: 600,
                }}
              >
                <AdminIcon name="FileText" size={16} />
                Export PDF
              </button>
              <button
                onClick={handleCSVExport}
                disabled={registrations.length === 0}
                className="btn btn-secondary"
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "10px 16px",
                  fontWeight: 600,
                }}
              >
                <AdminIcon name="Download" size={16} />
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Summary Grid */}
      {loadingData ? (
        <div className="stats-grid" style={{ marginBottom: "24px" }}>
          <DashboardCardSkeleton />
          <DashboardCardSkeleton />
          <DashboardCardSkeleton />
          <DashboardCardSkeleton />
        </div>
      ) : (
        <div className="stats-grid" style={{ marginBottom: "24px" }}>
          <div className="stat-card">
            <span
              className="stat-icon"
              style={{ color: "#3b82f6", background: "rgba(59,130,246,0.1)" }}
            >
              <AdminIcon name="Users" size={28} />
            </span>
            <div>
              <div
                className="stat-value"
                style={{ fontFamily: "Orbitron, monospace" }}
              >
                {processedData.total}
              </div>
              <div className="stat-label">Total Registered</div>
            </div>
          </div>

          <div className="stat-card">
            <span
              className="stat-icon"
              style={{ color: "#22c55e", background: "rgba(34,197,94,0.1)" }}
            >
              <AdminIcon name="UserCheck" size={28} />
            </span>
            <div>
              <div
                className="stat-value"
                style={{ fontFamily: "Orbitron, monospace" }}
              >
                {processedData.attended}
              </div>
              <div className="stat-label">Total Attended</div>
            </div>
          </div>

          <div className="stat-card">
            <span
              className="stat-icon"
              style={{ color: "#ef4444", background: "rgba(239,68,68,0.1)" }}
            >
              <AdminIcon name="UserX" size={28} />
            </span>
            <div>
              <div
                className="stat-value"
                style={{ fontFamily: "Orbitron, monospace" }}
              >
                {processedData.noShowRate}%
              </div>
              <div className="stat-label">No-Show Rate</div>
            </div>
          </div>

          <div className="stat-card">
            <span
              className="stat-icon"
              style={{ color: "#f59e0b", background: "rgba(245,158,11,0.1)" }}
            >
              <AdminIcon name="Clock" size={28} />
            </span>
            <div>
              <div
                className="stat-value"
                style={{
                  fontFamily: "Orbitron, monospace",
                  fontSize: "1.5rem",
                  display: "flex",
                  gap: "8px",
                  alignItems: "baseline",
                }}
              >
                <span style={{ color: "#22c55e" }}>{processedData.early}e</span>
                <span
                  style={{ fontSize: "1rem", color: "var(--admin-text-muted)" }}
                >
                  /
                </span>
                <span style={{ color: "#f59e0b" }}>{processedData.late}l</span>
              </div>
              <div className="stat-label">Early / Late Check-ins</div>
            </div>
          </div>
        </div>
      )}

      {/* Visual Analytics Charts Section */}
      {!loadingData && registrations.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "24px",
            marginBottom: "24px",
          }}
        >
          {/* Pie Chart Breakdown */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Attendance Status Breakdown</h3>
            </div>
            <div
              className="card-content"
              style={{ height: "260px", position: "relative" }}
            >
              {pieData.length === 0 ? (
                <div className="empty-state">No attendance data to plot.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "var(--admin-bg-card)",
                        border: "1px solid var(--admin-border)",
                        color: "var(--admin-text)",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Hourly Timeline Bar Chart */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Check-in Hourly Distribution</h3>
            </div>
            <div className="card-content" style={{ height: "260px" }}>
              {processedData.hourlyData.length === 0 ? (
                <div className="empty-state">No check-ins recorded yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={processedData.hourlyData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="var(--admin-border)"
                    />
                    <XAxis
                      dataKey="hour"
                      stroke="var(--admin-text-muted)"
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      stroke="var(--admin-text-muted)"
                      tick={{ fontSize: 11 }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--admin-bg-card)",
                        border: "1px solid var(--admin-border)",
                        color: "var(--admin-text)",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="var(--admin-accent, #7c3aed)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Detailed Attendee Table Card */}
      <div className="card">
        <div
          className="card-header"
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <h3 className="card-title" style={{ margin: 0 }}>
            Attendee Registration & Check-in List
          </h3>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid var(--admin-border)",
                background: "var(--admin-bg)",
                color: "var(--admin-text)",
                fontSize: "0.85rem",
              }}
            >
              <option value="All">All Statuses</option>
              <option value="Early">Early Check-ins</option>
              <option value="Late">Late Check-ins</option>
              <option value="No-Show">No-Shows</option>
              <option value="Attended">All Attended</option>
            </select>

            <input
              type="text"
              placeholder="Search name, email, dept..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid var(--admin-border)",
                background: "var(--admin-bg)",
                color: "var(--admin-text)",
                fontSize: "0.85rem",
                minWidth: "200px",
              }}
            />
          </div>
        </div>

        <div className="card-content" style={{ overflowX: "auto", padding: 0 }}>
          {loadingData ? (
            <div style={{ padding: "20px" }}>
              <Skeleton height={40} count={6} />
            </div>
          ) : filteredRegistrations.length === 0 ? (
            <div className="empty-state" style={{ padding: "40px" }}>
              No attendee records found matching the criteria.
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Email Address</th>
                  <th>Dept / Branch</th>
                  <th>Year</th>
                  <th>Registration Status</th>
                  <th>Check-in Time</th>
                  <th>Attendance Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistrations.map((reg) => {
                  const checkinStatus = reg.attended
                    ? checkAttendanceStatus(reg)
                    : "No-Show";
                  return (
                    <tr key={reg.id}>
                      <td style={{ fontWeight: 600 }}>{reg.full_name}</td>
                      <td>{reg.email}</td>
                      <td>{reg.department || "N/A"}</td>
                      <td>{reg.year || "N/A"}</td>
                      <td>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            fontWeight: 600,
                            textTransform: "capitalize",
                            backgroundColor:
                              reg.status === "confirmed"
                                ? "rgba(34,197,94,0.1)"
                                : "rgba(245,158,11,0.1)",
                            color:
                              reg.status === "confirmed"
                                ? "#4ade80"
                                : "#facc15",
                          }}
                        >
                          {reg.status || "confirmed"}
                        </span>
                      </td>
                      <td>
                        {reg.attended_at
                          ? new Date(reg.attended_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            fontWeight: 600,
                            backgroundColor:
                              checkinStatus === "Early"
                                ? "rgba(34, 197, 94, 0.15)"
                                : checkinStatus === "Late"
                                  ? "rgba(234, 179, 8, 0.15)"
                                  : "rgba(239, 68, 68, 0.15)",
                            color:
                              checkinStatus === "Early"
                                ? "#4ade80"
                                : checkinStatus === "Late"
                                  ? "#facc15"
                                  : "#f87171",
                          }}
                        >
                          {checkinStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
