import React, { useState, useEffect, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "";

const STEP_LABELS = {
  PAGE_VIEW: "Event Page View",
  EVENT_REGISTER: "Event Registration",
  EVENT_ATTEND: "Attended Event",
  PROFILE_COMPLETE: "Profile Completed",
  FORM_SUBMIT: "Form Submitted",
  RESOURCE_VIEW: "Resource Viewed",
};

function formatDuration(seconds) {
  if (seconds === null || seconds === undefined) return "—";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${(seconds / 3600).toFixed(1)}h`;
}

function getInsight(funnel) {
  if (!funnel || funnel.length < 2) return null;

  // Find the step with the highest drop-off (excluding first step which has no drop-off)
  let maxDrop = -1;
  let maxDropStep = null;
  let maxDropPrev = null;

  for (let i = 1; i < funnel.length; i++) {
    const drop = funnel[i].dropOffPercent ?? 0;
    if (drop > maxDrop) {
      maxDrop = drop;
      maxDropStep = funnel[i];
      maxDropPrev = funnel[i - 1];
    }
  }

  if (!maxDropStep) return null;

  const suggestions = {
    EVENT_REGISTER:
      "Consider simplifying the registration form or offering one-click sign-up.",
    EVENT_ATTEND:
      "Send automated reminders closer to the event date to boost attendance.",
    PROFILE_COMPLETE:
      "Add prompts or incentives (e.g., badges) for users to complete their profile.",
    FORM_SUBMIT: "Reduce the number of fields in the form to lower friction.",
    RESOURCE_VIEW:
      "Improve discoverability of resources via better navigation or search.",
  };

  const suggestion =
    suggestions[maxDropStep.step] ||
    "Review this step for potential friction points.";

  return {
    fromStep: STEP_LABELS[maxDropPrev?.step] || maxDropPrev?.step,
    toStep: STEP_LABELS[maxDropStep.step] || maxDropStep.step,
    dropOffPercent: maxDrop,
    suggestion,
  };
}

export function FunnelAnalysis() {
  const [availableSteps, setAvailableSteps] = useState([]);
  const [selectedSteps, setSelectedSteps] = useState([
    "PAGE_VIEW",
    "EVENT_REGISTER",
    "EVENT_ATTEND",
  ]);
  const [funnel, setFunnel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch available step types from backend
  useEffect(() => {
    async function fetchStepTypes() {
      try {
        const res = await fetch(
          `${API_BASE}/api/admin/analytics/funnel/steps`,
          {
            credentials: "include",
          }
        );
        if (res.ok) {
          const data = await res.json();
          setAvailableSteps(data.stepTypes || []);
        }
      } catch (err) {
        console.error("Failed to fetch step types", err);
      }
    }
    fetchStepTypes();
  }, []);

  const runFunnel = useCallback(async () => {
    if (selectedSteps.length < 2) {
      setError("Please select at least 2 funnel steps.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/analytics/funnel/custom`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ steps: selectedSteps }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to fetch funnel data");
      }
      const data = await res.json();
      setFunnel(data.funnel || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedSteps]);

  // Auto-run default funnel on mount
  useEffect(() => {
    runFunnel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addStep() {
    const nextAvailable = availableSteps.find(
      (s) => !selectedSteps.includes(s)
    );
    if (nextAvailable) {
      setSelectedSteps((prev) => [...prev, nextAvailable]);
    }
  }

  function removeStep(idx) {
    setSelectedSteps((prev) => prev.filter((_, i) => i !== idx));
  }

  function changeStep(idx, value) {
    setSelectedSteps((prev) => {
      const updated = [...prev];
      updated[idx] = value;
      return updated;
    });
  }

  const insight = getInsight(funnel);
  const maxCount =
    funnel && funnel.length > 0
      ? Math.max(...funnel.map((s) => s.count), 1)
      : 1;

  return (
    <div
      style={{
        padding: "24px",
        fontFamily: "Inter, sans-serif",
        background: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "#1e293b",
            margin: 0,
          }}
        >
          🔍 Funnel Analysis
        </h2>
        <p style={{ color: "#64748b", marginTop: "4px", fontSize: "0.875rem" }}>
          Visualize user journeys, identify drop-offs, and measure time between
          key stages.
        </p>
      </div>

      {/* Funnel Builder */}
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "20px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          border: "1px solid #e2e8f0",
          marginBottom: "24px",
        }}
      >
        <h3
          style={{
            fontWeight: 600,
            color: "#1e293b",
            marginBottom: "16px",
            fontSize: "1rem",
          }}
        >
          Define Funnel Steps
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {selectedSteps.map((step, idx) => (
            <div
              key={idx}
              style={{ display: "flex", alignItems: "center", gap: "12px" }}
            >
              <span
                style={{
                  background: "#6366f1",
                  color: "#fff",
                  borderRadius: "50%",
                  width: "28px",
                  height: "28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  flexShrink: 0,
                }}
              >
                {idx + 1}
              </span>
              <select
                value={step}
                onChange={(e) => changeStep(idx, e.target.value)}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.875rem",
                  color: "#1e293b",
                  background: "#f8fafc",
                }}
              >
                {availableSteps.map((s) => (
                  <option key={s} value={s}>
                    {STEP_LABELS[s] || s}
                  </option>
                ))}
              </select>
              {selectedSteps.length > 2 && (
                <button
                  onClick={() => removeStep(idx)}
                  style={{
                    background: "#fee2e2",
                    color: "#dc2626",
                    border: "none",
                    borderRadius: "6px",
                    padding: "6px 12px",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "0.8rem",
                  }}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
          {selectedSteps.length < availableSteps.length && (
            <button
              onClick={addStep}
              style={{
                padding: "8px 16px",
                background: "#f1f5f9",
                border: "1px dashed #94a3b8",
                borderRadius: "8px",
                color: "#475569",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: 500,
              }}
            >
              + Add Step
            </button>
          )}
          <button
            onClick={runFunnel}
            disabled={loading || selectedSteps.length < 2}
            style={{
              padding: "8px 20px",
              background: loading ? "#a5b4fc" : "#6366f1",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "0.875rem",
              fontWeight: 600,
            }}
          >
            {loading ? "Analyzing…" : "▶ Run Funnel"}
          </button>
        </div>

        {error && (
          <div
            style={{
              marginTop: "12px",
              color: "#dc2626",
              fontSize: "0.875rem",
            }}
          >
            ⚠ {error}
          </div>
        )}
      </div>

      {/* Funnel Visualization */}
      {funnel && funnel.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "24px",
          }}
        >
          {/* Funnel Chart */}
          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              padding: "20px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              border: "1px solid #e2e8f0",
            }}
          >
            <h3
              style={{
                fontWeight: 600,
                color: "#1e293b",
                marginBottom: "20px",
                fontSize: "1rem",
              }}
            >
              Funnel Breakdown
            </h3>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {funnel.map((step, idx) => {
                const barWidth =
                  maxCount > 0 ? Math.round((step.count / maxCount) * 100) : 0;
                const conversionColor =
                  step.dropOffPercent === null
                    ? "#6366f1"
                    : step.dropOffPercent > 60
                      ? "#ef4444"
                      : step.dropOffPercent > 30
                        ? "#f59e0b"
                        : "#10b981";

                return (
                  <div key={idx}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "6px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span
                          style={{
                            background: "#6366f1",
                            color: "#fff",
                            borderRadius: "50%",
                            width: "22px",
                            height: "22px",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {idx + 1}
                        </span>
                        <span
                          style={{
                            fontWeight: 600,
                            color: "#1e293b",
                            fontSize: "0.875rem",
                          }}
                        >
                          {STEP_LABELS[step.step] || step.step}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "12px",
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700,
                            color: "#1e293b",
                            fontSize: "0.875rem",
                          }}
                        >
                          {step.count.toLocaleString()}
                        </span>
                        {step.dropOffPercent !== null && (
                          <span
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              color: conversionColor,
                              background: `${conversionColor}18`,
                              padding: "2px 8px",
                              borderRadius: "12px",
                            }}
                          >
                            ↓ {step.dropOffPercent}% drop-off
                          </span>
                        )}
                      </div>
                    </div>
                    <div
                      style={{
                        width: "100%",
                        background: "#f1f5f9",
                        borderRadius: "6px",
                        height: "12px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${barWidth}%`,
                          height: "100%",
                          background: conversionColor,
                          borderRadius: "6px",
                          transition: "width 0.6s ease",
                        }}
                      />
                    </div>
                    {step.avgSecondsFromPrev !== null && (
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "#94a3b8",
                          marginTop: "4px",
                        }}
                      >
                        ⏱ Avg time from previous step:{" "}
                        {formatDuration(step.avgSecondsFromPrev)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stats Summary + Insight */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {/* Stats */}
            <div
              style={{
                background: "#fff",
                borderRadius: "12px",
                padding: "20px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                border: "1px solid #e2e8f0",
              }}
            >
              <h3
                style={{
                  fontWeight: 600,
                  color: "#1e293b",
                  marginBottom: "16px",
                  fontSize: "1rem",
                }}
              >
                Stage-by-Stage Summary
              </h3>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.875rem",
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <th
                      style={{
                        textAlign: "left",
                        color: "#64748b",
                        fontWeight: 600,
                        padding: "6px 0",
                      }}
                    >
                      Step
                    </th>
                    <th
                      style={{
                        textAlign: "right",
                        color: "#64748b",
                        fontWeight: 600,
                        padding: "6px 0",
                      }}
                    >
                      Users
                    </th>
                    <th
                      style={{
                        textAlign: "right",
                        color: "#64748b",
                        fontWeight: 600,
                        padding: "6px 0",
                      }}
                    >
                      Drop-off
                    </th>
                    <th
                      style={{
                        textAlign: "right",
                        color: "#64748b",
                        fontWeight: 600,
                        padding: "6px 0",
                      }}
                    >
                      Avg Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {funnel.map((step, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td
                        style={{
                          padding: "8px 0",
                          color: "#1e293b",
                          fontWeight: 500,
                        }}
                      >
                        {STEP_LABELS[step.step] || step.step}
                      </td>
                      <td
                        style={{
                          padding: "8px 0",
                          textAlign: "right",
                          fontWeight: 700,
                        }}
                      >
                        {step.count.toLocaleString()}
                      </td>
                      <td style={{ padding: "8px 0", textAlign: "right" }}>
                        {step.dropOffPercent !== null ? (
                          <span
                            style={{
                              color:
                                step.dropOffPercent > 50
                                  ? "#ef4444"
                                  : "#f59e0b",
                              fontWeight: 600,
                            }}
                          >
                            {step.dropOffPercent}%
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td
                        style={{
                          padding: "8px 0",
                          textAlign: "right",
                          color: "#64748b",
                        }}
                      >
                        {formatDuration(step.avgSecondsFromPrev)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Optimization Insight */}
            {insight && (
              <div
                style={{
                  background: "linear-gradient(135deg, #fef3c7, #fffbeb)",
                  borderRadius: "12px",
                  padding: "20px",
                  border: "1px solid #fde68a",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    alignItems: "flex-start",
                  }}
                >
                  <span style={{ fontSize: "1.4rem" }}>💡</span>
                  <div>
                    <h4
                      style={{
                        margin: 0,
                        fontWeight: 700,
                        color: "#92400e",
                        fontSize: "0.95rem",
                      }}
                    >
                      Optimization Opportunity
                    </h4>
                    <p
                      style={{
                        margin: "6px 0 0",
                        color: "#78350f",
                        fontSize: "0.875rem",
                        lineHeight: "1.5",
                      }}
                    >
                      <strong>{insight.dropOffPercent}% drop-off</strong>{" "}
                      between <em>{insight.fromStep}</em> and{" "}
                      <em>{insight.toStep}</em>. {insight.suggestion}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Overall Conversion */}
            {funnel.length >= 2 && (
              <div
                style={{
                  background: "linear-gradient(135deg, #ede9fe, #f5f3ff)",
                  borderRadius: "12px",
                  padding: "20px",
                  border: "1px solid #c4b5fd",
                }}
              >
                <h4
                  style={{
                    margin: 0,
                    fontWeight: 700,
                    color: "#5b21b6",
                    fontSize: "0.95rem",
                  }}
                >
                  Overall Funnel Conversion
                </h4>
                <div
                  style={{
                    marginTop: "10px",
                    display: "flex",
                    alignItems: "baseline",
                    gap: "6px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "2rem",
                      fontWeight: 800,
                      color: "#6d28d9",
                    }}
                  >
                    {funnel[0].count > 0
                      ? Math.round(
                          (funnel[funnel.length - 1].count / funnel[0].count) *
                            100
                        )
                      : 0}
                    %
                  </span>
                  <span style={{ color: "#7c3aed", fontSize: "0.875rem" }}>
                    of users complete the full journey
                  </span>
                </div>
                <p
                  style={{
                    margin: "8px 0 0",
                    color: "#8b5cf6",
                    fontSize: "0.8rem",
                  }}
                >
                  {funnel[funnel.length - 1].count.toLocaleString()} out of{" "}
                  {funnel[0].count.toLocaleString()} users who started
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {funnel && funnel.length === 0 && !loading && (
        <div
          style={{
            background: "#fff",
            borderRadius: "12px",
            padding: "40px",
            textAlign: "center",
            color: "#94a3b8",
            border: "1px solid #e2e8f0",
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📊</div>
          <p>
            No analytics data yet. Events will appear here once users start
            interacting with the platform.
          </p>
        </div>
      )}
    </div>
  );
}
