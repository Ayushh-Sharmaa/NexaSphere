import React, { useState } from 'react';
import DOMPurify from 'dompurify';
import ShareHub from './ShareHub';
import { useWalkthroughStep } from '../hooks/useWalkthroughStep';

const EventCard = React.memo(function EventCard({ event, onClick, id, isFirstForWalkthrough }) {
  const [shareOpen, setShareOpen] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const showFeedback = (message, type = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };
  const ref = useWalkthroughStep(isFirstForWalkthrough ? 'register_event' : null);

  function handleShareClick(e) {
    e.stopPropagation(); // don't trigger the card's onClick
    setShareOpen(true);
  }

  // Calculate dynamic capacity states
  const isUpcoming = event.status === 'upcoming';
  const rsvpCount = event.rsvpCount || 0;
  const capacity = event.capacity || 0;
  const isFull = capacity > 0 && rsvpCount >= capacity;

  function handleActionClick(e) {
    e.stopPropagation(); // Avoid triggering card details popup
    if (isFull) {
      showFeedback(`Added to waitlist for ${event.title || event.name}!`, 'info');
    } else {
      showFeedback(`Successfully registered for ${event.title || event.name}!`, 'success');
    }
  }

  return (
    <>
      <div
        ref={ref}
        className={`event-card ${isFull ? 'event-card-full' : ''}`}
        onClick={() => onClick(id)}
        style={{ cursor: 'pointer' }}
      >
        <h3>{event.title || event.name}</h3>
        <p>{event.date}</p>
        <p>{event.description}</p>
        {event.location && (
          <p>
            <strong>Location:</strong> {event.location}
          </p>
        )}
        <div
          className="event-description-html"
          style={{
            fontSize: '0.9rem',
            marginBottom: '8px',
            color: 'var(--text2)',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(event.description || '') }}
        />
        {event.category && <span className="event-category">{event.category}</span>}

        {/* Capacity Tracking & Status Bar */}
        {capacity > 0 && (
          <div className="event-capacity-container" style={{ margin: '12px 0' }}>
            <div
              className="event-capacity-text"
              style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}
            >
              <span>
                {rsvpCount}/{capacity} spots filled
              </span>
              {isFull && isUpcoming && (
                <span style={{ color: '#ef4444', fontWeight: 'bold' }}>Waitlist Active</span>
              )}
            </div>
            <div
              className="capacity-bar-bg"
              style={{
                background: '#e2e8f0',
                height: '6px',
                borderRadius: '3px',
                marginTop: '4px',
                overflow: 'hidden',
              }}
            >
              <div
                className="capacity-bar-fill"
                style={{
                  width: `${Math.min((rsvpCount / capacity) * 100, 100)}%`,
                  background: isFull ? '#ef4444' : '#10b981',
                  height: '100%',
                }}
              />
            </div>
          </div>
        )}

        {/* Registration Feedback Toast */}
        {feedback && (
          <div
            role="status"
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: '500',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor:
                feedback.type === 'info' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              color: feedback.type === 'info' ? '#60a5fa' : '#34d399',
              border: `1px solid ${feedback.type === 'info' ? '#3b82f6' : '#10b981'}`,
            }}
          >
            <span>
              {feedback.type === 'info' ? 'ℹ️' : '✅'} {feedback.message}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFeedback(null);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                fontSize: '1rem',
                marginLeft: '8px',
              }}
              aria-label="Dismiss feedback"
            >
              &times;
            </button>
          </div>
        )}

        {/* Action Controls */}
        <div
          className="event-card-actions"
          style={{ display: 'flex', gap: '8px', marginTop: '12px' }}
        >
          {isUpcoming && (
            <button
              className={`event-action-btn ${isFull ? 'btn-waitlist' : 'btn-rsvp'}`}
              onClick={handleActionClick}
              style={{
                flexGrow: 1,
                padding: '6px 12px',
                backgroundColor: isFull ? '#4b5563' : '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              {isFull ? 'Join Waitlist' : 'RSVP / Register'}
            </button>
          )}

          <button
            className="event-share-btn"
            onClick={handleShareClick}
            aria-label={`Share ${event.title || event.name}`}
            style={{ padding: '6px 12px' }}
          >
            Share
          </button>
        </div>
      </div>

      <ShareHub
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        data={{
          title: event.title || event.name,
          subtitle: event.date,
          url: `${window.location.origin}/events/${id}`,
          image: event.image || null,
        }}
      />
    </>
  );
});

export default EventCard;
