import React from 'react';
import { useAuth } from '@clerk/react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/apiClient';

export default function ApplicationsTimelinePage() {
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['userApplications'],
    queryFn: () => api.getUserApplications(),
    enabled: !!isSignedIn,
  });

  if (!isSignedIn) {
    return (
      <div className="container" style={{ padding: '60px 16px', textAlign: 'center' }}>
        <h2>Sign In Required</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Sign in to view your application timeline and status history.
        </p>
        <button
          onClick={() => navigate('/')}
          style={{
            background: '#CC1111',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 20px',
            cursor: 'pointer',
          }}
        >
          Back to Home
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p style={{ color: 'var(--text-secondary)' }}>Loading your application records...</p>
      </div>
    );
  }

  const applications = data?.data?.applications || [];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'accepted':
        return { label: 'Accepted', color: '#38A169', bg: 'rgba(56, 161, 105, 0.15)' };
      case 'under_review':
        return { label: 'Under Review', color: '#3182CE', bg: 'rgba(49, 130, 206, 0.15)' };
      case 'on_hold':
        return { label: 'On Hold', color: '#DD6B20', bg: 'rgba(221, 107, 32, 0.15)' };
      case 'rejected':
        return { label: 'Not Selected', color: '#E53E3E', bg: 'rgba(229, 62, 62, 0.15)' };
      case 'withdrawn':
        return { label: 'Withdrawn', color: '#718096', bg: 'rgba(113, 128, 150, 0.15)' };
      default:
        return { label: 'Pending Review', color: '#D69E2E', bg: 'rgba(214, 158, 46, 0.15)' };
    }
  };

  return (
    <div
      className="container"
      style={{ padding: '40px 16px', maxWidth: '840px', minHeight: '85vh' }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 6px 0' }}>
            Your Applications & Status
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.92rem' }}>
            Real-time status, timeline milestones, and notifications from the NexaSphere review
            team.
          </p>
        </div>
        <Link
          to="/portal"
          style={{
            background: 'rgba(255,255,255,0.08)',
            color: 'var(--text-primary)',
            textDecoration: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '0.88rem',
            fontWeight: 600,
          }}
        >
          ← Back to Portal
        </Link>
      </div>

      {applications.length === 0 ? (
        <div
          style={{
            background: 'var(--card-bg, rgba(25, 25, 25, 0.7))',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '48px 24px',
            textAlign: 'center',
          }}
        >
          <h3 style={{ margin: '0 0 10px 0' }}>No Applications Yet</h3>
          <p
            style={{
              color: 'var(--text-secondary)',
              maxWidth: '400px',
              margin: '0 auto 20px auto',
            }}
          >
            You haven't submitted any applications. Apply for NexaSphere membership to get started!
          </p>
          <Link
            to="/apply/membership"
            style={{
              background: '#CC1111',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              fontWeight: 600,
            }}
          >
            Apply for Membership
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {applications.map((app) => {
            const badge = getStatusBadge(app.status);
            return (
              <div
                key={app.id}
                style={{
                  background: 'var(--card-bg, rgba(25, 25, 25, 0.7))',
                  border: '1px solid var(--card-border, rgba(255, 255, 255, 0.08))',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: app.application_type === 'core_team' ? '#805AD5' : '#CC1111',
                        letterSpacing: '1px',
                      }}
                    >
                      {app.application_type === 'core_team'
                        ? 'Core Team Application'
                        : 'Membership Application'}
                    </span>
                    <h3
                      style={{
                        fontSize: '1.25rem',
                        fontWeight: 800,
                        margin: '4px 0 0 0',
                        fontFamily: 'monospace',
                      }}
                    >
                      {app.application_number}
                    </h3>
                  </div>
                  <span
                    style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: badge.color,
                      backgroundColor: badge.bg,
                    }}
                  >
                    {badge.label}
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '10px',
                    padding: '14px',
                    marginBottom: '16px',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Submitted Date:
                    </span>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                      {new Date(app.submitted_at).toLocaleDateString()}
                    </div>
                  </div>
                  {app.reviewed_at && (
                    <div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        Reviewed Date:
                      </span>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                        {new Date(app.reviewed_at).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                  {app.rejection_reason && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <span style={{ fontSize: '0.78rem', color: '#E53E3E' }}>
                        Review Feedback:
                      </span>
                      <div style={{ fontSize: '0.88rem', color: '#FEB2B2', marginTop: '2px' }}>
                        {app.rejection_reason}
                      </div>
                    </div>
                  )}
                  {app.hold_reason && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <span style={{ fontSize: '0.78rem', color: '#DD6B20' }}>
                        Next Steps / Hold Reason:
                      </span>
                      <div style={{ fontSize: '0.88rem', color: '#FBD38D', marginTop: '2px' }}>
                        {app.hold_reason}
                      </div>
                    </div>
                  )}
                </div>

                {/* Visual Timeline Steps */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    position: 'relative',
                    marginTop: '20px',
                    padding: '0 10px',
                  }}
                >
                  {[
                    'Submitted',
                    'Under Review',
                    app.status === 'accepted'
                      ? 'Accepted'
                      : app.status === 'rejected'
                        ? 'Not Selected'
                        : app.status === 'on_hold'
                          ? 'On Hold'
                          : 'Decision',
                  ].map((step, idx) => {
                    const isPassed =
                      idx === 0 ||
                      (idx === 1 &&
                        ['under_review', 'accepted', 'rejected', 'on_hold'].includes(app.status)) ||
                      (idx === 2 && ['accepted', 'rejected', 'on_hold'].includes(app.status));
                    const isCurrent =
                      (idx === 0 && app.status === 'pending') ||
                      (idx === 1 && app.status === 'under_review') ||
                      (idx === 2 && ['accepted', 'rejected', 'on_hold'].includes(app.status));

                    return (
                      <div
                        key={step}
                        style={{ textAlign: 'center', flex: 1, position: 'relative' }}
                      >
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: isPassed ? '#CC1111' : 'rgba(255,255,255,0.1)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 8px auto',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            boxShadow: isCurrent ? '0 0 10px rgba(204, 17, 17, 0.6)' : 'none',
                          }}
                        >
                          {isPassed ? '✓' : idx + 1}
                        </div>
                        <div
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: isCurrent ? 700 : 500,
                            color: isCurrent ? 'var(--text-primary)' : 'var(--text-secondary)',
                          }}
                        >
                          {step}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
