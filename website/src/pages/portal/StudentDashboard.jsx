import React from 'react';
import { useUser, useAuth } from '@clerk/react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/apiClient';

export default function StudentDashboard() {
  const { user, isLoaded } = useUser();
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();

  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ['applicationStatus'],
    queryFn: () => api.getApplicationStatusSummary(),
    enabled: !!isSignedIn,
  });

  const { data: profileData } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => api.getProfile(),
    enabled: !!isSignedIn,
  });

  const { data: regsData } = useQuery({
    queryKey: ['userRegistrations'],
    queryFn: () => api.getUserEventRegistrations(),
    enabled: !!isSignedIn,
  });

  if (!isLoaded || statusLoading) {
    return (
      <div
        style={{
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid #CC1111',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <p>Loading your student portal...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div
        style={{
          minHeight: '75vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '24px',
        }}
      >
        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '12px' }}>
          Student Technology Portal
        </h2>
        <p style={{ maxWidth: '480px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Sign in to access your NexaSphere membership, manage applications, view registered events,
          and join teams.
        </p>
        <button
          onClick={() => navigate('/')}
          style={{
            background: '#CC1111',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 24px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Return to Home & Sign In
        </button>
      </div>
    );
  }

  const summary = statusData?.data || {};
  const membership = summary.membership;
  const coreTeam = summary.coreTeam;
  const profile = profileData?.data?.profile || {};
  const registrations = regsData?.data?.registrations || [];

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
      style={{ padding: '40px 16px', maxWidth: '1100px', minHeight: '85vh' }}
    >
      {/* Header Banner */}
      <div
        style={{
          background:
            'linear-gradient(135deg, rgba(204, 17, 17, 0.12) 0%, rgba(20, 20, 20, 0.8) 100%)',
          border: '1px solid rgba(204, 17, 17, 0.3)',
          borderRadius: '16px',
          padding: '28px',
          marginBottom: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <img
            src={user?.imageUrl || 'https://via.placeholder.com/64'}
            alt={user?.fullName || 'Student'}
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              border: '2px solid #CC1111',
            }}
          />
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 4px 0' }}>
              Welcome, {user?.fullName || 'Student'}!
            </h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
              {user?.primaryEmailAddress?.emailAddress} •{' '}
              {profile.branch
                ? `${profile.branch} (${profile.year || 'Student'})`
                : 'GL Bajaj Group of Institutions'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Link
            to="/portal/applications"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              color: 'var(--text-primary)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '0.88rem',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Application History
          </Link>
        </div>
      </div>

      {/* Main Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
          marginBottom: '32px',
        }}
      >
        {/* Membership Application Card */}
        <div
          style={{
            background: 'var(--card-bg, rgba(25, 25, 25, 0.7))',
            border: '1px solid var(--card-border, rgba(255, 255, 255, 0.08))',
            borderRadius: '14px',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <span
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  color: '#CC1111',
                }}
              >
                Community Identity
              </span>
              {membership && (
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: getStatusBadge(membership.status).color,
                    backgroundColor: getStatusBadge(membership.status).bg,
                  }}
                >
                  {getStatusBadge(membership.status).label}
                </span>
              )}
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 8px 0' }}>
              NexaSphere Membership
            </h3>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.9rem',
                lineHeight: '1.5',
                margin: '0 0 16px 0',
              }}
            >
              Official membership grants access to hackathons, exclusive technical workshops,
              internal repositories, and peer mentorship.
            </p>

            {membership ? (
              <div
                style={{
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Application No:
                </div>
                <div
                  style={{
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    color: '#CC1111',
                    fontFamily: 'monospace',
                  }}
                >
                  {membership.application_number}
                </div>
                <div
                  style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}
                >
                  Submitted on {new Date(membership.submitted_at).toLocaleDateString()}
                </div>
              </div>
            ) : null}
          </div>

          {!membership ? (
            <Link
              to="/apply/membership"
              style={{
                display: 'block',
                textAlign: 'center',
                background: '#CC1111',
                color: '#fff',
                textDecoration: 'none',
                borderRadius: '8px',
                padding: '10px 16px',
                fontWeight: 600,
                fontSize: '0.92rem',
              }}
            >
              Apply for Membership
            </Link>
          ) : (
            <Link
              to="/portal/applications"
              style={{
                display: 'block',
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.08)',
                color: 'var(--text-primary)',
                textDecoration: 'none',
                borderRadius: '8px',
                padding: '10px 16px',
                fontWeight: 600,
                fontSize: '0.92rem',
              }}
            >
              View Application Timeline
            </Link>
          )}
        </div>

        {/* Core Team Recruitment Card */}
        <div
          style={{
            background: 'var(--card-bg, rgba(25, 25, 25, 0.7))',
            border: '1px solid var(--card-border, rgba(255, 255, 255, 0.08))',
            borderRadius: '14px',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <span
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  color: '#805AD5',
                }}
              >
                Leadership & Execution
              </span>
              {coreTeam && (
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: getStatusBadge(coreTeam.status).color,
                    backgroundColor: getStatusBadge(coreTeam.status).bg,
                  }}
                >
                  {getStatusBadge(coreTeam.status).label}
                </span>
              )}
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 8px 0' }}>
              Core Team Recruitment
            </h3>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.9rem',
                lineHeight: '1.5',
                margin: '0 0 16px 0',
              }}
            >
              Lead technical tracks, organize major campus hackathons, manage university cloud
              infra, and mentor junior builders.
            </p>

            {coreTeam ? (
              <div
                style={{
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Application No:
                </div>
                <div
                  style={{
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    color: '#805AD5',
                    fontFamily: 'monospace',
                  }}
                >
                  {coreTeam.application_number}
                </div>
                <div
                  style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}
                >
                  Submitted on {new Date(coreTeam.submitted_at).toLocaleDateString()}
                </div>
              </div>
            ) : null}
          </div>

          {!coreTeam ? (
            summary.isMember ? (
              <Link
                to="/apply/core-team"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  background: '#805AD5',
                  color: '#fff',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  fontWeight: 600,
                  fontSize: '0.92rem',
                }}
              >
                Apply for Core Team
              </Link>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: '10px 16px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                }}
              >
                Requires approved NexaSphere Membership
              </div>
            )
          ) : (
            <Link
              to="/portal/applications"
              style={{
                display: 'block',
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.08)',
                color: 'var(--text-primary)',
                textDecoration: 'none',
                borderRadius: '8px',
                padding: '10px 16px',
                fontWeight: 600,
                fontSize: '0.92rem',
              }}
            >
              View Application Timeline
            </Link>
          )}
        </div>
      </div>

      {/* Registered Events Section */}
      <div
        style={{
          background: 'var(--card-bg, rgba(25, 25, 25, 0.7))',
          border: '1px solid var(--card-border, rgba(255, 255, 255, 0.08))',
          borderRadius: '14px',
          padding: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        }}
      >
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>
          Your Event Registrations
        </h3>

        {registrations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-secondary)' }}>
            <p style={{ margin: '0 0 12px 0' }}>
              You have not registered for any upcoming events yet.
            </p>
            <button
              onClick={() => navigate('/')}
              style={{
                background: '#CC1111',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Explore Events
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
            }}
          >
            {registrations.map((reg) => (
              <div
                key={reg.id}
                style={{
                  background: 'rgba(0,0,0,0.25)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '10px',
                  padding: '16px',
                }}
              >
                <div style={{ fontSize: '1.2rem', marginBottom: '8px' }}>{reg.icon || '🚀'}</div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 700 }}>
                  {reg.event_name}
                </h4>
                <div
                  style={{
                    fontSize: '0.82rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '4px',
                  }}
                >
                  📅 {reg.date_text || new Date(reg.starts_at).toLocaleDateString()}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  📍 {reg.location || 'GL Bajaj Campus'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
