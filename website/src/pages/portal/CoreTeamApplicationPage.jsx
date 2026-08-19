import React, { useState } from 'react';
import { useUser, useAuth } from '@clerk/react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/apiClient';

export default function CoreTeamApplicationPage() {
  const { user } = useUser();
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ['applicationStatus'],
    queryFn: () => api.getApplicationStatusSummary(),
    enabled: !!isSignedIn,
  });

  // Check whether core team recruitment is currently open.
  // This is a public endpoint — no auth required — so we always fetch it,
  // allowing the page to show the closed state even to signed-out visitors.
  const { data: recruitmentData, isLoading: recruitmentLoading } = useQuery({
    queryKey: ['recruitmentStatus'],
    queryFn: () => api.getRecruitmentStatus(),
    staleTime: 1000 * 60 * 5, // 5-minute cache — admins can change this at any time
  });

  const [formData, setFormData] = useState({
    targetRole: 'Technical Lead',
    secondaryRole: 'Event Operations Lead',
    pastExperience: '',
    githubProjects: '',
    weeklyCommitmentHours: '10-15 hours/week',
    visionForRole: '',
  });

  const [errorMessage, setErrorMessage] = useState('');

  const mutation = useMutation({
    mutationFn: (payload) => api.submitApplication('core_team', payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['applicationStatus'] });
      queryClient.invalidateQueries({ queryKey: ['userApplications'] });
      navigate('/portal/applications');
    },
    onError: (err) => {
      setErrorMessage(err.message || 'Failed to submit Core Team application.');
    },
  });

  if (!isSignedIn) {
    return (
      <div className="container" style={{ padding: '60px 16px', textAlign: 'center' }}>
        <h2>Sign In Required</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          You must be signed in to apply for the NexaSphere Core Team.
        </p>
        <button
          onClick={() => navigate('/')}
          style={{
            background: '#805AD5',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 20px',
            cursor: 'pointer',
            marginTop: '16px',
          }}
        >
          Return to Home
        </button>
      </div>
    );
  }

  // Show a single loading state while either the recruitment gate or the
  // membership eligibility check is still in flight.
  if (recruitmentLoading || (isSignedIn && statusLoading)) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p style={{ color: 'var(--text-secondary)' }}>Checking recruitment status...</p>
      </div>
    );
  }

  // ── Recruitment gate: show closed state if admins have toggled off ─────────
  const isCoreTeamOpen = recruitmentData?.data?.core_team_open ?? false;

  if (!isCoreTeamOpen) {
    return (
      <div
        className="container"
        style={{ padding: '60px 16px', maxWidth: '600px', textAlign: 'center' }}
      >
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔐</div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '12px' }}>
          Core Team Recruitment is Currently Closed
        </h2>
        <p
          style={{
            color: 'var(--text-secondary)',
            lineHeight: '1.6',
            marginBottom: '24px',
          }}
        >
          We are not accepting Core Team applications at this time. Check back during the next
          recruitment window, announced on our socials.
        </p>
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '0.92rem',
            marginBottom: '24px',
          }}
        >
          Membership applications are open —{' '}
          <button
            onClick={() => navigate('/portal/apply')}
            style={{
              background: 'none',
              border: 'none',
              color: '#CC1111',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.92rem',
              textDecoration: 'underline',
              padding: 0,
            }}
          >
            apply for NexaSphere membership
          </button>{' '}
          to join the community first.
        </p>
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'rgba(255,255,255,0.08)',
            color: 'var(--text-primary, #fff)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '8px',
            padding: '10px 20px',
            cursor: 'pointer',
            fontSize: '0.92rem',
          }}
        >
          Back to Home
        </button>
      </div>
    );
  }

  const summary = statusData?.data || {};

  if (!summary.isMember) {
    return (
      <div
        className="container"
        style={{ padding: '60px 16px', maxWidth: '600px', textAlign: 'center' }}
      >
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔒</div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '12px' }}>
          Approved Membership Required
        </h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '24px' }}>
          Core Team recruitment is open exclusively to verified, active members of NexaSphere.
          Please submit a membership application first.
        </p>
        <button
          onClick={() => navigate('/apply/membership')}
          style={{
            background: '#CC1111',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Apply for Membership
        </button>
      </div>
    );
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!formData.pastExperience.trim() || !formData.visionForRole.trim()) {
      setErrorMessage('Please complete all required leadership and vision fields.');
      return;
    }

    mutation.mutate(formData);
  };

  return (
    <div
      className="container"
      style={{ padding: '40px 16px', maxWidth: '720px', minHeight: '85vh' }}
    >
      <div style={{ marginBottom: '28px' }}>
        <span
          style={{
            color: '#805AD5',
            fontWeight: 700,
            textTransform: 'uppercase',
            fontSize: '0.85rem',
            letterSpacing: '1px',
          }}
        >
          Executive Recruitment
        </span>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '8px 0' }}>
          NexaSphere Core Team Application
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Drive university tech culture, organize high-impact hackathons, and steer engineering
          initiatives.
        </p>
      </div>

      {errorMessage && (
        <div
          style={{
            background: 'rgba(229, 62, 62, 0.15)',
            border: '1px solid #E53E3E',
            color: '#FEB2B2',
            borderRadius: '8px',
            padding: '14px 18px',
            marginBottom: '24px',
            fontSize: '0.92rem',
          }}
        >
          ⚠️ {errorMessage}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          background: 'var(--card-bg, rgba(25, 25, 25, 0.7))',
          border: '1px solid var(--card-border, rgba(255,255,255,0.08))',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginBottom: '20px',
          }}
        >
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                marginBottom: '6px',
              }}
            >
              Primary Role of Interest *
            </label>
            <select
              name="targetRole"
              value={formData.targetRole}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.15)',
                background: '#1c1c1c',
                color: '#fff',
              }}
            >
              <option value="Technical Lead">Technical Lead (Architecture & Builds)</option>
              <option value="Web & Platform Lead">Web & Platform Lead</option>
              <option value="AI / ML Lead">AI / ML Lead</option>
              <option value="Cloud Native & DevOps Lead">Cloud Native & DevOps Lead</option>
              <option value="Event Operations & Hackathon Lead">
                Event Operations & Hackathon Lead
              </option>
              <option value="PR & Outreach Lead">PR & Outreach Lead</option>
              <option value="Design & Media Lead">Design & Media Lead</option>
            </select>
          </div>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                marginBottom: '6px',
              }}
            >
              Secondary Role Choice
            </label>
            <select
              name="secondaryRole"
              value={formData.secondaryRole}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.15)',
                background: '#1c1c1c',
                color: '#fff',
              }}
            >
              <option value="Event Operations Lead">Event Operations Lead</option>
              <option value="Technical Lead">Technical Lead</option>
              <option value="Web & Platform Lead">Web & Platform Lead</option>
              <option value="PR & Outreach Lead">PR & Outreach Lead</option>
              <option value="Design & Media Lead">Design & Media Lead</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label
            style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}
          >
            Estimated Weekly Commitment
          </label>
          <select
            name="weeklyCommitmentHours"
            value={formData.weeklyCommitmentHours}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.15)',
              background: '#1c1c1c',
              color: '#fff',
            }}
          >
            <option value="5-10 hours/week">5 - 10 hours / week</option>
            <option value="10-15 hours/week">10 - 15 hours / week</option>
            <option value="15+ hours/week">15+ hours / week</option>
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label
            style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}
          >
            Relevant Technical Experience & Key Projects *
          </label>
          <textarea
            name="pastExperience"
            required
            rows="4"
            placeholder="Highlight repositories built, hackathons won, technologies mastered, or past leadership roles..."
            value={formData.pastExperience}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(0,0,0,0.3)',
              color: '#fff',
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label
            style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}
          >
            Repository or Portfolio Links
          </label>
          <input
            type="text"
            name="githubProjects"
            placeholder="https://github.com/your-username or project links"
            value={formData.githubProjects}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(0,0,0,0.3)',
              color: '#fff',
            }}
          />
        </div>

        <div style={{ marginBottom: '28px' }}>
          <label
            style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}
          >
            What is your vision for NexaSphere in this role? *
          </label>
          <textarea
            name="visionForRole"
            required
            rows="4"
            placeholder="What initiatives, workshops, or products do you want to launch for GL Bajaj students?"
            value={formData.visionForRole}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(0,0,0,0.3)',
              color: '#fff',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          style={{
            width: '100%',
            background: mutation.isPending
              ? '#777'
              : 'linear-gradient(135deg, #805AD5 0%, #553C9A 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '1rem',
            fontWeight: 700,
            cursor: mutation.isPending ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 14px rgba(128, 90, 213, 0.35)',
          }}
        >
          {mutation.isPending
            ? 'Submitting Core Team Application...'
            : 'Submit Core Team Application'}
        </button>
      </form>
    </div>
  );
}
