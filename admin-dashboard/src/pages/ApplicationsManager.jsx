import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../api/axiosInstance";

export default function ApplicationsManager() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all"); // all, membership, core_team, pending, under_review, accepted, on_hold, rejected
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApp, setSelectedApp] = useState(null);
  const [actionModal, setActionModal] = useState({
    open: false,
    type: "",
    appId: null,
  });
  const [modalReason, setModalReason] = useState("");
  const [modalNotes, setModalNotes] = useState("");

  // Fetch applications list
  const { data, isLoading } = useQuery({
    queryKey: ["adminApplications", activeTab, searchQuery],
    queryFn: async () => {
      const params = {};
      if (["membership", "core_team"].includes(activeTab)) {
        params.type = activeTab;
      } else if (activeTab !== "all") {
        params.status = activeTab;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      const res = await axiosInstance.get("/api/v1/admin/applications", {
        params,
      });
      return res.data?.data || { applications: [] };
    },
  });

  // Status update mutation
  const statusMutation = useMutation({
    mutationFn: async ({ appId, status, notes, reason }) => {
      const res = await axiosInstance.patch(
        `/api/v1/admin/applications/${appId}/status`,
        {
          status,
          notes,
          reason,
        }
      );
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["adminApplications"] });
      if (selectedApp && selectedApp.id === actionModal.appId) {
        setSelectedApp(data?.data?.application || null);
      }
      setActionModal({ open: false, type: "", appId: null });
      setModalReason("");
      setModalNotes("");
    },
    onError: (err) => {
      alert(
        err.response?.data?.error?.message ||
          err.message ||
          "Failed to update status."
      );
    },
  });

  const applications = data?.applications || [];

  const handleStatusAction = (appId, targetStatus) => {
    if (["on_hold", "rejected"].includes(targetStatus)) {
      setActionModal({ open: true, type: targetStatus, appId });
      setModalReason("");
      setModalNotes("");
    } else {
      if (
        confirm(
          `Are you sure you want to transition this application to '${targetStatus}'?`
        )
      ) {
        statusMutation.mutate({ appId, status: targetStatus });
      }
    }
  };

  const submitModalAction = (e) => {
    e.preventDefault();
    if (!modalReason.trim()) {
      alert("Please provide a reason / review note.");
      return;
    }
    statusMutation.mutate({
      appId: actionModal.appId,
      status: actionModal.type,
      reason: modalReason,
      notes: modalNotes,
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "accepted":
        return {
          label: "Accepted",
          color: "#38A169",
          bg: "rgba(56, 161, 105, 0.15)",
        };
      case "under_review":
        return {
          label: "Under Review",
          color: "#3182CE",
          bg: "rgba(49, 130, 206, 0.15)",
        };
      case "on_hold":
        return {
          label: "On Hold",
          color: "#DD6B20",
          bg: "rgba(221, 107, 32, 0.15)",
        };
      case "rejected":
        return {
          label: "Rejected",
          color: "#E53E3E",
          bg: "rgba(229, 62, 62, 0.15)",
        };
      case "withdrawn":
        return {
          label: "Withdrawn",
          color: "#718096",
          bg: "rgba(113, 128, 150, 0.15)",
        };
      default:
        return {
          label: "Pending",
          color: "#D69E2E",
          bg: "rgba(214, 158, 46, 0.15)",
        };
    }
  };

  return (
    <div
      style={{
        padding: "24px",
        maxWidth: "1400px",
        margin: "0 auto",
        color: "var(--text-primary, #fff)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              margin: "0 0 6px 0",
            }}
          >
            Applications & Recruitment Manager
          </h1>
          <p
            style={{
              color: "var(--text-secondary, #a0aec0)",
              margin: 0,
              fontSize: "0.9rem",
            }}
          >
            Unified review console for NexaSphere Membership and Core Team
            applicant portfolios.
          </p>
        </div>

        <input
          type="text"
          placeholder="Search by name, roll no, email, or application ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "8px",
            padding: "10px 16px",
            color: "#fff",
            width: "340px",
            fontSize: "0.9rem",
          }}
        />
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          paddingBottom: "12px",
          marginBottom: "24px",
          overflowX: "auto",
        }}
      >
        {[
          { id: "all", label: "All Applications" },
          { id: "membership", label: "Memberships (NX-MEM)" },
          { id: "core_team", label: "Core Team (NX-CORE)" },
          { id: "pending", label: "Pending Review" },
          { id: "under_review", label: "Under Review" },
          { id: "accepted", label: "Accepted" },
          { id: "on_hold", label: "On Hold" },
          { id: "rejected", label: "Rejected" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background:
                activeTab === tab.id ? "#CC1111" : "rgba(255,255,255,0.05)",
              color:
                activeTab === tab.id
                  ? "#fff"
                  : "var(--text-secondary, #a0aec0)",
              border: "none",
              borderRadius: "6px",
              padding: "8px 14px",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table & Drawer Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: selectedApp ? "1fr 420px" : "1fr",
          gap: "24px",
        }}
      >
        {/* Table List */}
        <div
          style={{
            background: "rgba(25,25,25,0.8)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          {isLoading ? (
            <div
              style={{ padding: "40px", textAlign: "center", color: "#a0aec0" }}
            >
              Loading application entries...
            </div>
          ) : applications.length === 0 ? (
            <div
              style={{ padding: "40px", textAlign: "center", color: "#a0aec0" }}
            >
              No applications found matching the criteria.
            </div>
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                fontSize: "0.88rem",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "rgba(0,0,0,0.3)",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    color: "#a0aec0",
                  }}
                >
                  <th style={{ padding: "12px 16px" }}>App Number</th>
                  <th style={{ padding: "12px 16px" }}>Applicant</th>
                  <th style={{ padding: "12px 16px" }}>Type</th>
                  <th style={{ padding: "12px 16px" }}>Branch / Year</th>
                  <th style={{ padding: "12px 16px" }}>Status</th>
                  <th style={{ padding: "12px 16px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => {
                  const badge = getStatusBadge(app.status);
                  return (
                    <tr
                      key={app.id}
                      onClick={() => setSelectedApp(app)}
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                        cursor: "pointer",
                        background:
                          selectedApp?.id === app.id
                            ? "rgba(204,17,17,0.1)"
                            : "transparent",
                      }}
                    >
                      <td
                        style={{
                          padding: "12px 16px",
                          fontFamily: "monospace",
                          fontWeight: 700,
                          color:
                            app.application_type === "core_team"
                              ? "#B794F4"
                              : "#FEB2B2",
                        }}
                      >
                        {app.application_number}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: 600 }}>
                          {app.full_name || "Student"}
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "#a0aec0" }}>
                          {app.email}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          textTransform: "capitalize",
                        }}
                      >
                        {app.application_type.replace("_", " ")}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#a0aec0" }}>
                        {app.branch || "—"} {app.year ? `(${app.year})` : ""}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: "12px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            color: badge.color,
                            backgroundColor: badge.bg,
                          }}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td
                        style={{ padding: "12px 16px" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div style={{ display: "flex", gap: "6px" }}>
                          {app.status === "pending" && (
                            <button
                              onClick={() =>
                                handleStatusAction(app.id, "under_review")
                              }
                              style={{
                                background: "#3182CE",
                                color: "#fff",
                                border: "none",
                                borderRadius: "4px",
                                padding: "4px 8px",
                                fontSize: "0.75rem",
                                cursor: "pointer",
                              }}
                            >
                              Review
                            </button>
                          )}
                          {["pending", "under_review", "on_hold"].includes(
                            app.status
                          ) && (
                            <button
                              onClick={() =>
                                handleStatusAction(app.id, "accepted")
                              }
                              style={{
                                background: "#38A169",
                                color: "#fff",
                                border: "none",
                                borderRadius: "4px",
                                padding: "4px 8px",
                                fontSize: "0.75rem",
                                cursor: "pointer",
                              }}
                            >
                              Accept
                            </button>
                          )}
                          {["under_review"].includes(app.status) && (
                            <button
                              onClick={() =>
                                handleStatusAction(app.id, "on_hold")
                              }
                              style={{
                                background: "#DD6B20",
                                color: "#fff",
                                border: "none",
                                borderRadius: "4px",
                                padding: "4px 8px",
                                fontSize: "0.75rem",
                                cursor: "pointer",
                              }}
                            >
                              Hold
                            </button>
                          )}
                          {["under_review", "on_hold"].includes(app.status) && (
                            <button
                              onClick={() =>
                                handleStatusAction(app.id, "rejected")
                              }
                              style={{
                                background: "#E53E3E",
                                color: "#fff",
                                border: "none",
                                borderRadius: "4px",
                                padding: "4px 8px",
                                fontSize: "0.75rem",
                                cursor: "pointer",
                              }}
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Selected Applicant Drawer */}
        {selectedApp && (
          <div
            style={{
              background: "rgba(25,25,25,0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              height: "fit-content",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>
                Applicant Dossier
              </h3>
              <button
                onClick={() => setSelectedApp(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#a0aec0",
                  cursor: "pointer",
                  fontSize: "1.1rem",
                }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                background: "rgba(0,0,0,0.3)",
                borderRadius: "8px",
                padding: "12px",
                marginBottom: "16px",
              }}
            >
              <div style={{ fontSize: "0.8rem", color: "#a0aec0" }}>
                Application Number:
              </div>
              <div
                style={{
                  fontSize: "1rem",
                  fontWeight: 800,
                  color: "#CC1111",
                  fontFamily: "monospace",
                }}
              >
                {selectedApp.application_number}
              </div>
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "#a0aec0",
                  marginTop: "6px",
                }}
              >
                Applicant:
              </div>
              <div style={{ fontWeight: 600 }}>
                {selectedApp.full_name} ({selectedApp.email})
              </div>
              {selectedApp.roll_number && (
                <div style={{ fontSize: "0.82rem", color: "#a0aec0" }}>
                  Roll No: {selectedApp.roll_number}
                </div>
              )}
            </div>

            <div style={{ marginBottom: "16px" }}>
              <div
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "#a0aec0",
                  marginBottom: "8px",
                }}
              >
                Submission Payload
              </div>
              <div
                style={{
                  background: "rgba(0,0,0,0.2)",
                  borderRadius: "6px",
                  padding: "10px",
                  fontSize: "0.82rem",
                  maxHeight: "200px",
                  overflowY: "auto",
                }}
              >
                <pre
                  style={{
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                  }}
                >
                  {JSON.stringify(selectedApp.payload, null, 2)}
                </pre>
              </div>
            </div>

            {selectedApp.rejection_reason && (
              <div
                style={{
                  background: "rgba(229,62,62,0.15)",
                  border: "1px solid #E53E3E",
                  borderRadius: "6px",
                  padding: "10px",
                  marginBottom: "16px",
                  fontSize: "0.82rem",
                  color: "#FEB2B2",
                }}
              >
                <strong>Rejection Reason:</strong>{" "}
                {selectedApp.rejection_reason}
              </div>
            )}

            {selectedApp.hold_reason && (
              <div
                style={{
                  background: "rgba(221,107,32,0.15)",
                  border: "1px solid #DD6B20",
                  borderRadius: "6px",
                  padding: "10px",
                  marginBottom: "16px",
                  fontSize: "0.82rem",
                  color: "#FBD38D",
                }}
              >
                <strong>Hold Reason:</strong> {selectedApp.hold_reason}
              </div>
            )}

            <div
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
                marginTop: "auto",
              }}
            >
              {selectedApp.status === "pending" && (
                <button
                  onClick={() =>
                    handleStatusAction(selectedApp.id, "under_review")
                  }
                  style={{
                    flex: 1,
                    background: "#3182CE",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "8px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Start Review
                </button>
              )}
              {["pending", "under_review", "on_hold"].includes(
                selectedApp.status
              ) && (
                <button
                  onClick={() => handleStatusAction(selectedApp.id, "accepted")}
                  style={{
                    flex: 1,
                    background: "#38A169",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "8px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Accept Candidate
                </button>
              )}
              {["under_review"].includes(selectedApp.status) && (
                <button
                  onClick={() => handleStatusAction(selectedApp.id, "on_hold")}
                  style={{
                    flex: 1,
                    background: "#DD6B20",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "8px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Put On Hold
                </button>
              )}
              {["under_review", "on_hold"].includes(selectedApp.status) && (
                <button
                  onClick={() => handleStatusAction(selectedApp.id, "rejected")}
                  style={{
                    flex: 1,
                    background: "#E53E3E",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "8px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Reject
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Reason Modal */}
      {actionModal.open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "#1c1c1c",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "480px",
              width: "100%",
            }}
          >
            <h3
              style={{
                margin: "0 0 12px 0",
                fontSize: "1.2rem",
                fontWeight: 700,
              }}
            >
              {actionModal.type === "rejected"
                ? "Candidate Rejection Feedback"
                : "Hold Application Notice"}
            </h3>
            <p
              style={{
                color: "#a0aec0",
                fontSize: "0.88rem",
                marginBottom: "16px",
              }}
            >
              This feedback will be recorded in the state machine history and
              transmitted to the student.
            </p>

            <form onSubmit={submitModalAction}>
              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    marginBottom: "6px",
                  }}
                >
                  Reason / Decision Notes *
                </label>
                <textarea
                  required
                  rows="3"
                  placeholder="Explain why this decision was reached..."
                  value={modalReason}
                  onChange={(e) => setModalReason(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid rgba(255,255,255,0.2)",
                    background: "rgba(0,0,0,0.4)",
                    color: "#fff",
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    setActionModal({ open: false, type: "", appId: null })
                  }
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "8px 16px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={statusMutation.isPending}
                  style={{
                    background:
                      actionModal.type === "rejected" ? "#E53E3E" : "#DD6B20",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "8px 16px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {statusMutation.isPending
                    ? "Updating..."
                    : "Confirm Decision"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
