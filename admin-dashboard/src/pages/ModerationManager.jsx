import { useState, useEffect } from "react";
import { api } from "../services/api";
import { Pagination } from "../components/Pagination";
import { useToast } from "../hooks/useToast";

export function ModerationManager() {
  const [flags, setFlags] = useState([]);
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("flags");
  const [selectedFlag, setSelectedFlag] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: "pending",
    flagType: "",
    severity: "",
    contentType: "",
  });
  const [stats, setStats] = useState(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, [activeTab, page, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === "flags") {
        const response = await api.moderation.getFlags({
          ...filters,
          limit: 20,
          offset: (page - 1) * 20,
        });
        setFlags(response.flags || []);
        setTotalPages(Math.ceil((response.total || 0) / 20));
      } else if (activeTab === "appeals") {
        const response = await api.moderation.getAppeals({
          status: filters.status,
          limit: 20,
          offset: (page - 1) * 20,
        });
        setAppeals(response.appeals || []);
        setTotalPages(Math.ceil((response.total || 0) / 20));
      } else if (activeTab === "stats") {
        const statsData = await api.moderation.getStats();
        setStats(statsData);
      }
    } catch (error) {
      showToast(error.message || "Failed to load moderation data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (flagId) => {
    try {
      await api.moderation.approveFlag(flagId);
      showToast("Content approved successfully", "success");
      loadData();
    } catch (error) {
      showToast(error.message || "Failed to approve content", "error");
    }
  };

  const handleReject = async (flagId, reason) => {
    try {
      await api.moderation.rejectFlag(flagId, reason);
      showToast("Content rejected successfully", "success");
      loadData();
      setShowDetailModal(false);
    } catch (error) {
      showToast(error.message || "Failed to reject content", "error");
    }
  };

  const handleWarnUser = async (flagId, userId) => {
    try {
      await api.moderation.warnUser(userId);
      await handleReject(flagId, "User warned for violating guidelines");
    } catch (error) {
      showToast(error.message || "Failed to warn user", "error");
    }
  };

  const handleBanUser = async (flagId, userId) => {
    if (!window.confirm("Are you sure you want to permanently ban this user?"))
      return;
    try {
      await api.moderation.banUser(userId);
      await handleReject(flagId, "User banned for repeated violations");
    } catch (error) {
      showToast(error.message || "Failed to ban user", "error");
    }
  };

  const handleApproveAppeal = async (appealId) => {
    try {
      await api.moderation.approveAppeal(appealId, "Appeal approved");
      showToast("Appeal approved successfully", "success");
      loadData();
    } catch (error) {
      showToast(error.message || "Failed to approve appeal", "error");
    }
  };

  const handleRejectAppeal = async (appealId) => {
    try {
      await api.moderation.rejectAppeal(appealId, "Appeal rejected");
      showToast("Appeal rejected successfully", "success");
      loadData();
    } catch (error) {
      showToast(error.message || "Failed to reject appeal", "error");
    }
  };

  const tabs = [
    { key: "flags", label: "Pending Flags" },
    { key: "appeals", label: "Appeals" },
    { key: "stats", label: "Statistics" },
  ];

  const getSeverityClass = (severity) => {
    switch (severity) {
      case "high":
        return "severity-high";
      case "medium":
        return "severity-medium";
      case "low":
        return "severity-low";
      default:
        return "";
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Content Moderation Dashboard</h2>
        <p className="page-subtitle">
          Review and moderate user-generated content
        </p>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`tab ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => {
              setActiveTab(tab.key);
              setPage(1);
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          {/* Flags Tab */}
          {activeTab === "flags" && (
            <div className="section">
              <div className="section-header">
                <h3>Pending Content Review Queue</h3>
                <div className="filter-group">
                  <select
                    value={filters.status}
                    onChange={(e) => {
                      setFilters({ ...filters, status: e.target.value });
                      setPage(1);
                    }}
                  >
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="escalated">Escalated</option>
                  </select>
                  <select
                    value={filters.severity}
                    onChange={(e) => {
                      setFilters({ ...filters, severity: e.target.value });
                      setPage(1);
                    }}
                  >
                    <option value="">All Severity Levels</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setFilters({
                        status: "pending",
                        flagType: "",
                        severity: "",
                        contentType: "",
                      });
                      setPage(1);
                    }}
                  >
                    Clear Filters
                  </button>
                </div>
              </div>

              {flags.length === 0 ? (
                <div className="empty-state">
                  <p>No pending flags to review</p>
                </div>
              ) : (
                <div className="moderation-queue">
                  {flags.map((flag) => (
                    <div key={flag.id} className="flag-card">
                      <div className="flag-header">
                        <div className="flag-meta">
                          <span
                            className={`severity-badge ${getSeverityClass(flag.severity)}`}
                          >
                            {flag.severity.toUpperCase()}
                          </span>
                          <span className="flag-type">{flag.flagType}</span>
                          <span className="content-type">
                            {flag.contentType}
                          </span>
                        </div>
                        <div className="flag-date">
                          {new Date(flag.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flag-content">
                        <div className="content-preview">
                          {flag.contentPreview}
                        </div>
                        <p className="flag-reason">
                          <strong>Reason:</strong> {flag.reason}
                        </p>
                      </div>

                      <div className="flag-info">
                        <span>Reported by: {flag.reportedBy}</span>
                        <span>Content Creator: {flag.userId}</span>
                      </div>

                      <div className="flag-actions">
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleApprove(flag.id)}
                        >
                          Approve Content
                        </button>
                        <button
                          className="btn btn-warning btn-sm"
                          onClick={() => {
                            setSelectedFlag(flag);
                            setShowDetailModal(true);
                          }}
                        >
                          Review & Action
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() =>
                            handleReject(flag.id, "Content violates guidelines")
                          }
                        >
                          Reject Content
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}

          {/* Appeals Tab */}
          {activeTab === "appeals" && (
            <div className="section">
              <div className="section-header">
                <h3>User Appeals</h3>
              </div>

              {appeals.length === 0 ? (
                <div className="empty-state">
                  <p>No appeals to review</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Appeal ID</th>
                        <th>User</th>
                        <th>Original Content</th>
                        <th>Reason for Appeal</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appeals.map((appeal) => (
                        <tr key={appeal.id}>
                          <td>{appeal.id}</td>
                          <td>{appeal.userId}</td>
                          <td>{appeal.contentPreview}</td>
                          <td>{appeal.reason}</td>
                          <td>
                            <span
                              className={`status-badge status-${appeal.status}`}
                            >
                              {appeal.status}
                            </span>
                          </td>
                          <td>
                            {appeal.status === "pending" && (
                              <>
                                <button
                                  className="btn btn-success btn-xs"
                                  onClick={() => handleApproveAppeal(appeal.id)}
                                >
                                  Approve
                                </button>
                                <button
                                  className="btn btn-danger btn-xs"
                                  onClick={() => handleRejectAppeal(appeal.id)}
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === "stats" && stats && (
            <div className="section">
              <div className="section-header">
                <h3>Moderation Statistics</h3>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{stats.totalFlags}</div>
                  <div className="stat-label">Total Flags</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.pendingFlags}</div>
                  <div className="stat-label">Pending Review</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.approvedCount}</div>
                  <div className="stat-label">Approved</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.rejectedCount}</div>
                  <div className="stat-label">Rejected</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.bannedUsersCount}</div>
                  <div className="stat-label">Banned Users</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.warnedUsersCount}</div>
                  <div className="stat-label">Warned Users</div>
                </div>
              </div>

              {stats.flagsByType && (
                <div className="section">
                  <h4>Flags by Type</h4>
                  <div className="flag-types-breakdown">
                    {Object.entries(stats.flagsByType).map(([type, count]) => (
                      <div key={type} className="breakdown-item">
                        <span className="type-name">{type}</span>
                        <span className="type-count">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedFlag && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Review Content</h3>
              <button
                className="close-btn"
                onClick={() => setShowDetailModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-section">
                <h4>Content Information</h4>
                <p>
                  <strong>Type:</strong> {selectedFlag.contentType}
                </p>
                <p>
                  <strong>Flag Type:</strong> {selectedFlag.flagType}
                </p>
                <p>
                  <strong>Severity:</strong> {selectedFlag.severity}
                </p>
                <p>
                  <strong>Reason:</strong> {selectedFlag.reason}
                </p>
              </div>

              <div className="detail-section">
                <h4>Content Preview</h4>
                <div className="content-box">{selectedFlag.contentPreview}</div>
              </div>

              <div className="detail-section">
                <h4>Moderator Action</h4>
                <textarea
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="Add moderation note..."
                  rows="4"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-success"
                onClick={() => {
                  handleApprove(selectedFlag.id);
                  setShowDetailModal(false);
                }}
              >
                Approve Content
              </button>
              <button
                className="btn btn-warning"
                onClick={() =>
                  handleWarnUser(selectedFlag.id, selectedFlag.userId)
                }
              >
                Warn User
              </button>
              <button
                className="btn btn-danger"
                onClick={() =>
                  handleBanUser(selectedFlag.id, selectedFlag.userId)
                }
              >
                Ban User
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setShowDetailModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
