import React, { useState } from 'react';

import { useParams, useNavigate } from 'react-router-dom';
import { buildUrl, getApiBase } from '../utils/runtimeConfig';
import { MentionTextarea } from '../components/common/MentionTextarea';

const EventFeedbackForm = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const apiBase = getApiBase();
  const [formData, setFormData] = useState({
    ratingOverall: 5,
    wouldAttendAgain: true,
    recommendFriend: true,
    suggestions: '',
    bestParts: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch(buildUrl(apiBase, '/api/feedback'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, eventId }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || `Failed to submit feedback (${response.status})`);
      }
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to submit feedback.');
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="p-8 bg-white rounded-lg shadow text-center">
          <h2 className="text-2xl font-bold text-green-600 mb-4">Thank You!</h2>
          <p>Your feedback helps us continuously improve our events.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow rounded-lg mt-10">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Event Feedback</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm border border-red-200">
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Overall Rating (1-5)
          </label>
          <input
            type="number"
            min="1"
            max="5"
            value={formData.ratingOverall}
            onChange={(e) =>
              setFormData({ ...formData, ratingOverall: parseInt(e.target.value, 10) })
            }
            className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
            required
          />
        </div>

        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.wouldAttendAgain}
              onChange={(e) => setFormData({ ...formData, wouldAttendAgain: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 shadow-sm"
            />
            <span className="ml-2 text-sm text-gray-700">Would attend again?</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What were the best parts?
          </label>
          <MentionTextarea
            rows="3"
            value={formData.bestParts}
            onChange={(val) => setFormData({ ...formData, bestParts: val })}
            className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Any suggestions for improvement?
          </label>
          <MentionTextarea
            rows="3"
            value={formData.suggestions}
            onChange={(val) => setFormData({ ...formData, suggestions: val })}
            className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
          />
        </div>

        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Submit Feedback
        </button>
      </form>
    </div>
  );
};

export default EventFeedbackForm;
