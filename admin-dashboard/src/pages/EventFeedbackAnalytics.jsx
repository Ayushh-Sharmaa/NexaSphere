import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";

const EventFeedbackAnalytics = () => {
  const { eventId } = useParams();
  const [analytics, setAnalytics] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const [analyticsRes, feedbacksRes] = await Promise.all([
          api.get(`/api/feedback/analytics/${eventId}`),
          api.get(`/api/feedback/${eventId}`),
        ]);
        if (analyticsRes.data.success)
          setAnalytics(analyticsRes.data.analytics);
        if (feedbacksRes.data.success)
          setFeedbacks(feedbacksRes.data.feedbacks);
      } catch (error) {
        console.error("Failed to fetch feedback:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeedback();
  }, [eventId]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Event Feedback Analytics</h1>
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-4 border rounded shadow">
            <h3 className="text-lg font-semibold">Total Responses</h3>
            <p className="text-3xl">{analytics.totalResponses}</p>
          </div>
          <div className="p-4 border rounded shadow">
            <h3 className="text-lg font-semibold">Average Rating</h3>
            <p className="text-3xl">{analytics.averageRating} / 5</p>
          </div>
          <div className="p-4 border rounded shadow">
            <h3 className="text-lg font-semibold">Sentiment</h3>
            <p className="text-sm">
              Positive: {analytics.sentiments?.positive || 0}
            </p>
            <p className="text-sm">
              Neutral: {analytics.sentiments?.neutral || 0}
            </p>
            <p className="text-sm">
              Negative: {analytics.sentiments?.negative || 0}
            </p>
          </div>
        </div>
      )}

      <h2 className="text-xl font-bold mb-4">Detailed Feedback</h2>
      <div className="space-y-4">
        {feedbacks.map((f) => (
          <div key={f.id} className="p-4 border rounded">
            <p>
              <strong>Rating:</strong> {f.ratingOverall}
            </p>
            <p>
              <strong>Suggestions:</strong> {f.suggestions || "N/A"}
            </p>
            <p>
              <strong>Best Parts:</strong> {f.bestParts || "N/A"}
            </p>
            <p>
              <strong>Sentiment:</strong> {f.sentiment}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventFeedbackAnalytics;
