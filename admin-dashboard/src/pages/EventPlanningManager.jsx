import { useState, useEffect } from "react";
import { api } from "../services/api";
import { eventEmitter, EVENTS } from "../services/eventEmitter";

export function EventPlanningManager() {
  const [plans, setPlans] = useState({});
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [budgetTotals, setBudgetTotals] = useState({});

  useEffect(() => {
    api.eventPlanning
      .list()
      .then((r) => setPlans(r.plans || {}))
      .catch(() => {});
  }, []);

  const updateBudget = async (eventId) => {
    try {
      await api.eventPlanning.updateBudget(eventId, {
        total: Number(budgetTotals[eventId] || 0),
      });
      eventEmitter.emit(EVENTS.NOTIFY, {
        type: "success",
        message: "Budget updated",
      });
    } catch (e) {
      eventEmitter.emit(EVENTS.NOTIFY, { type: "error", message: e.message });
    }
  };

  const seedTemplates = async (eventId) => {
    try {
      await api.eventPlanning.seedTemplates(eventId);
      eventEmitter.emit(EVENTS.NOTIFY, {
        type: "success",
        message: "Templates seeded",
      });
    } catch (e) {
      eventEmitter.emit(EVENTS.NOTIFY, { type: "error", message: e.message });
    }
  };

  const events = Object.keys(plans);

  return (
    <div className="page-container">
      <h2>Event Planning Manager</h2>
      {events.length === 0 && (
        <p style={{ color: "#888" }}>
          No active event plans yet. Plans are created when team members start
          planning an event.
        </p>
      )}

      {events.map((eventId) => {
        const plan = plans[eventId];
        const tasks = plan?.tasks || [];
        return (
          <div
            key={eventId}
            className="card"
            style={{ marginBottom: 16, padding: 20 }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ margin: 0 }}>{eventId}</h3>
              <button
                className="btn btn-sm btn-outline"
                onClick={() =>
                  setSelectedEvent(selectedEvent === eventId ? null : eventId)
                }
              >
                {selectedEvent === eventId ? "Collapse" : "Details"}
              </button>
            </div>
            <div
              style={{
                display: "flex",
                gap: 24,
                marginTop: 12,
                fontSize: 13,
                color: "#aaa",
              }}
            >
              <span>{tasks.length} tasks</span>
              <span>
                {tasks.filter((t) => t.status === "done").length} done
              </span>
              <span>{plan?.budget?.expenses?.length || 0} expenses</span>
            </div>

            {selectedEvent === eventId && (
              <div style={{ marginTop: 16 }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>Status</th>
                      <th>Priority</th>
                      <th>Assignee</th>
                      <th>Deadline</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((t) => (
                      <tr key={t.id}>
                        <td>{t.title}</td>
                        <td>
                          <span className={`badge badge-${t.status}`}>
                            {t.status}
                          </span>
                        </td>
                        <td>{t.priority}</td>
                        <td>{t.assignee || "-"}</td>
                        <td>
                          {t.deadline
                            ? new Date(t.deadline).toLocaleDateString()
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    marginTop: 16,
                    alignItems: "center",
                  }}
                >
                  <input
                    type="number"
                    placeholder="Budget total"
                    value={budgetTotals[eventId] || ""}
                    onChange={(e) =>
                      setBudgetTotals((prev) => ({
                        ...prev,
                        [eventId]: e.target.value,
                      }))
                    }
                    className="form-input"
                    style={{ width: 160 }}
                  />
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => updateBudget(eventId)}
                  >
                    Set Budget
                  </button>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => seedTemplates(eventId)}
                  >
                    Seed Templates
                  </button>
                </div>

                {plan?.activityLog?.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <h4 style={{ marginBottom: 8 }}>Activity Log</h4>
                    <div
                      style={{
                        maxHeight: 150,
                        overflowY: "auto",
                        fontSize: 12,
                      }}
                    >
                      {plan.activityLog
                        .slice()
                        .reverse()
                        .map((log) => (
                          <div
                            key={log.id}
                            style={{
                              padding: "4 0",
                              borderBottom:
                                "1px solid var(--admin-border, #333)",
                            }}
                          >
                            <strong>{log.user}</strong> {log.details}{" "}
                            <span style={{ color: "#666" }}>
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
