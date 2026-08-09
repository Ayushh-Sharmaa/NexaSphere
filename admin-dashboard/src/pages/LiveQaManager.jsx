import { useState, useEffect, useCallback } from "react";
import { api } from "../services/api";
import { eventEmitter, EVENTS } from "../services/eventEmitter";

const SORT_OPTIONS = [
  { value: "upvotes", label: "Top" },
  { value: "recent", label: "Recent" },
  { value: "unanswered", label: "Unanswered" },
];

const STATUS_BADGE = {
  open: { label: "Open", className: "badge-info" },
  answered: { label: "Answered", className: "badge-success" },
  duplicate: { label: "Duplicate", className: "badge-warning" },
};

export function LiveQaManager() {
  const [activeTab, setActiveTab] = useState("qa");
  const [eventId, setEventId] = useState("");
  const [questions, setQuestions] = useState([]);
  const [polls, setPolls] = useState([]);
  const [sortBy, setSortBy] = useState("upvotes");
  const [answerInputs, setAnswerInputs] = useState({});
  const [pollForm, setPollForm] = useState({
    question: "",
    options: ["", ""],
    type: "single",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadQuestions = useCallback(async () => {
    if (!eventId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.qaPoll.getQuestions(eventId.trim(), sortBy);
      setQuestions(result.questions || []);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, [eventId, sortBy]);

  const loadPolls = useCallback(async () => {
    if (!eventId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.qaPoll.getPolls(eventId.trim());
      setPolls(result.polls || []);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    if (activeTab === "qa") loadQuestions();
    else loadPolls();
  }, [activeTab, loadQuestions, loadPolls]);

  useEffect(() => {
    const onUpdate = () => {
      if (activeTab === "qa") loadQuestions();
      else loadPolls();
    };
    eventEmitter.on(EVENTS.QA_UPDATED, onUpdate);
    eventEmitter.on(EVENTS.POLL_UPDATED, onUpdate);
    return () => {
      eventEmitter.off(EVENTS.QA_UPDATED, onUpdate);
      eventEmitter.off(EVENTS.POLL_UPDATED, onUpdate);
    };
  }, [activeTab, loadQuestions, loadPolls]);

  const handleModerate = async (questionId, action) => {
    try {
      await api.qaPoll.moderateQuestion(eventId.trim(), questionId, action);
      loadQuestions();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleAnswer = async (questionId) => {
    const answer = answerInputs[questionId];
    if (!answer?.trim()) return;
    try {
      await api.qaPoll.answerQuestion(eventId.trim(), questionId, answer);
      setAnswerInputs((prev) => ({ ...prev, [questionId]: "" }));
      loadQuestions();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleUpvote = async (questionId) => {
    try {
      await api.qaPoll.upvoteQuestion(eventId.trim(), questionId);
      loadQuestions();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleCreatePoll = async (e) => {
    e.preventDefault();
    const opts = pollForm.options.filter((o) => o.trim());
    if (!pollForm.question.trim() || opts.length < 2) return;
    try {
      await api.qaPoll.createPoll(eventId.trim(), {
        question: pollForm.question,
        options: opts,
        type: pollForm.type,
      });
      setPollForm({ question: "", options: ["", ""], type: "single" });
      loadPolls();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleClosePoll = async (pollId) => {
    try {
      await api.qaPoll.closePoll(eventId.trim(), pollId);
      loadPolls();
    } catch (e) {
      setError(e.message);
    }
  };

  const addPollOption = () => {
    setPollForm((prev) => ({ ...prev, options: [...prev.options, ""] }));
  };

  const updatePollOption = (idx, val) => {
    const opts = [...pollForm.options];
    opts[idx] = val;
    setPollForm((prev) => ({ ...prev, options: opts }));
  };

  const removePollOption = (idx) => {
    if (pollForm.options.length <= 2) return;
    setPollForm((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== idx),
    }));
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Live Q&A &amp; Polling</h1>
      </div>

      <div
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "flex-end",
          marginBottom: "20px",
        }}
      >
        <div className="form-group" style={{ flex: 1 }}>
          <label>Event ID</label>
          <input
            type="text"
            className="form-input"
            placeholder="Enter event ID…"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
          />
        </div>
        <button
          className="btn btn-primary"
          onClick={activeTab === "qa" ? loadQuestions : loadPolls}
        >
          Load
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="tabs" style={{ marginBottom: "20px" }}>
        <button
          className={`tab ${activeTab === "qa" ? "active" : ""}`}
          onClick={() => setActiveTab("qa")}
        >
          Q&amp;A
        </button>
        <button
          className={`tab ${activeTab === "polls" ? "active" : ""}`}
          onClick={() => setActiveTab("polls")}
        >
          Polls
        </button>
      </div>

      {loading && <p className="text-muted">Loading…</p>}

      {activeTab === "qa" && (
        <div>
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`btn btn-sm ${sortBy === opt.value ? "btn-primary" : "btn-outline"}`}
                onClick={() => setSortBy(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {questions.length === 0 && !loading && (
            <p className="text-muted">No questions yet.</p>
          )}

          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {questions.map((q) => (
              <div
                key={q.id}
                className="card"
                style={{
                  borderLeft: q.isFeatured
                    ? "4px solid #CC1111"
                    : "4px solid transparent",
                  opacity: q.status === "duplicate" ? 0.5 : 1,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                        marginBottom: "6px",
                      }}
                    >
                      <span className="badge badge-secondary">{q.askedBy}</span>
                      {STATUS_BADGE[q.status] && (
                        <span
                          className={`badge ${STATUS_BADGE[q.status].className}`}
                        >
                          {STATUS_BADGE[q.status].label}
                        </span>
                      )}
                      {q.isFeatured && (
                        <span className="badge badge-primary">Featured</span>
                      )}
                      {q.isAnonymous && (
                        <span className="badge badge-secondary">Anonymous</span>
                      )}
                    </div>
                    <p style={{ margin: "0 0 8px", fontWeight: 500 }}>
                      {q.text}
                    </p>
                    {q.answer && (
                      <div
                        style={{
                          background: "var(--bg-subtle, #f5f5f5)",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          marginBottom: "8px",
                        }}
                      >
                        <small
                          style={{
                            fontWeight: 600,
                            color: "var(--admin-accent, #CC1111)",
                          }}
                        >
                          {q.answeredBy}:
                        </small>
                        <p style={{ margin: "4px 0 0" }}>{q.answer}</p>
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: "center", minWidth: "60px" }}>
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => handleUpvote(q.id)}
                    >
                      ▲ {q.upvotes}
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "6px",
                    marginTop: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  {q.status !== "answered" && (
                    <>
                      <input
                        className="form-input"
                        style={{ flex: 1, minWidth: "150px" }}
                        placeholder="Type answer…"
                        value={answerInputs[q.id] || ""}
                        onChange={(e) =>
                          setAnswerInputs((prev) => ({
                            ...prev,
                            [q.id]: e.target.value,
                          }))
                        }
                      />
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleAnswer(q.id)}
                      >
                        Answer
                      </button>
                    </>
                  )}
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() =>
                      handleModerate(
                        q.id,
                        q.isFeatured ? "unfeature" : "feature"
                      )
                    }
                  >
                    {q.isFeatured ? "Unfeature" : "Feature"}
                  </button>
                  {q.status !== "answered" && (
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => handleModerate(q.id, "answered")}
                    >
                      Mark Answered
                    </button>
                  )}
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => handleModerate(q.id, "duplicate")}
                  >
                    Duplicate
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleModerate(q.id, "remove")}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "polls" && (
        <div>
          <div className="card" style={{ marginBottom: "20px" }}>
            <h3 style={{ margin: "0 0 12px" }}>Create Poll</h3>
            <form onSubmit={handleCreatePoll}>
              <div className="form-group">
                <label>Question</label>
                <input
                  className="form-input"
                  placeholder="Ask a question…"
                  value={pollForm.question}
                  onChange={(e) =>
                    setPollForm((prev) => ({
                      ...prev,
                      question: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select
                  className="form-input"
                  value={pollForm.type}
                  onChange={(e) =>
                    setPollForm((prev) => ({ ...prev, type: e.target.value }))
                  }
                >
                  <option value="single">Single Choice</option>
                  <option value="multiple">Multiple Choice</option>
                  <option value="rating">Rating Scale</option>
                </select>
              </div>
              {pollForm.options.map((opt, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    gap: "8px",
                    marginBottom: "8px",
                    alignItems: "center",
                  }}
                >
                  <input
                    className="form-input"
                    style={{ flex: 1 }}
                    placeholder={`Option ${idx + 1}`}
                    value={opt}
                    onChange={(e) => updatePollOption(idx, e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() => removePollOption(idx)}
                  >
                    ×
                  </button>
                </div>
              ))}
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={addPollOption}
                >
                  + Add Option
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Poll
                </button>
              </div>
            </form>
          </div>

          {polls.length === 0 && !loading && (
            <p className="text-muted">No polls yet.</p>
          )}

          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {polls.map((poll) => {
              const total =
                poll.totalVotes ||
                poll.options.reduce((s, o) => s + o.votes, 0);
              return (
                <div key={poll.id} className="card">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "8px",
                    }}
                  >
                    <h3 style={{ margin: 0 }}>{poll.question}</h3>
                    <span
                      className={`badge ${poll.status === "active" ? "badge-success" : "badge-secondary"}`}
                    >
                      {poll.status}
                    </span>
                  </div>
                  <div style={{ marginBottom: "8px" }}>
                    {poll.options.map((opt) => {
                      const pct =
                        total > 0 ? Math.round((opt.votes / total) * 100) : 0;
                      return (
                        <div key={opt.id} style={{ marginBottom: "6px" }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: "0.85rem",
                            }}
                          >
                            <span>{opt.text}</span>
                            <span>
                              {opt.votes} vote{opt.votes !== 1 ? "s" : ""} (
                              {pct}%)
                            </span>
                          </div>
                          <div
                            style={{
                              background: "var(--bg-subtle, #eee)",
                              borderRadius: "4px",
                              height: "8px",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: `${pct}%`,
                                height: "100%",
                                background: "var(--admin-accent, #CC1111)",
                                borderRadius: "4px",
                                transition: "width 0.3s",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--t2, #888)" }}>
                    Total votes: {total}
                  </div>
                  {poll.status === "active" && (
                    <button
                      className="btn btn-sm btn-outline"
                      style={{ marginTop: "8px" }}
                      onClick={() => handleClosePoll(poll.id)}
                    >
                      Close Poll
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
