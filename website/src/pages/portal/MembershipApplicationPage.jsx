import React, { useState } from 'react';
import { useUser, useAuth } from '@clerk/react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/apiClient';

export default function MembershipApplicationPage() {
  const { user } = useUser();
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    phone: '',
    collegeEmail: '',
    rollNumber: '',
    branch: 'CSE',
    section: 'A',
    year: '2nd Year',
    semester: '3rd',
    domainInterest: 'Full-Stack Web Development',
    githubUrl: '',
    linkedinUrl: '',
    whyJoin: '',
  });

  const [errorMessage, setErrorMessage] = useState('');

  const mutation = useMutation({
    mutationFn: (payload) => api.submitApplication('membership', payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['applicationStatus'] });
      queryClient.invalidateQueries({ queryKey: ['userApplications'] });
      navigate('/portal/applications');
    },
    onError: (err) => {
      setErrorMessage(err.message || 'Failed to submit application. Please check your inputs.');
    },
  });

  if (!isSignedIn) {
    return (
      <div className="container" style={{ padding: '60px 16px', textAlign: 'center' }}>
        <h2>Please Sign In</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          You must be signed in to submit a NexaSphere membership application.
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
            marginTop: '16px',
          }}
        >
          Back to Home
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
    if (!formData.fullName.trim() || !formData.rollNumber.trim() || !formData.collegeEmail.trim()) {
      setErrorMessage('Please fill in all required academic fields.');
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
            color: '#CC1111',
            fontWeight: 700,
            textTransform: 'uppercase',
            fontSize: '0.85rem',
            letterSpacing: '1px',
          }}
        >
          Official Recruitment
        </span>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '8px 0' }}>
          NexaSphere Membership Application
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Join the premier tech community at GL Bajaj. Complete the details below to receive your
          official NexaSphere application number.
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
        <h3
          style={{
            fontSize: '1.15rem',
            fontWeight: 700,
            marginBottom: '20px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            paddingBottom: '10px',
          }}
        >
          1. Academic & Student Details
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginBottom: '16px',
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
              Full Name *
            </label>
            <input
              type="text"
              name="fullName"
              required
              value={formData.fullName}
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
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                marginBottom: '6px',
              }}
            >
              WhatsApp / Phone *
            </label>
            <input
              type="tel"
              name="phone"
              required
              placeholder="+91 98765 43210"
              value={formData.phone}
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
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginBottom: '16px',
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
              College Email ID *
            </label>
            <input
              type="email"
              name="collegeEmail"
              required
              placeholder="roll.branch@glbajaj.ac.in"
              value={formData.collegeEmail}
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
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                marginBottom: '6px',
              }}
            >
              University Roll No *
            </label>
            <input
              type="text"
              name="rollNumber"
              required
              placeholder="e.g. 220010010001"
              value={formData.rollNumber}
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
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
            marginBottom: '24px',
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
              Branch
            </label>
            <select
              name="branch"
              value={formData.branch}
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
              <option value="CSE">CSE</option>
              <option value="CSE-AIML">CSE-AIML</option>
              <option value="CSE-DS">CSE-DS</option>
              <option value="IT">IT</option>
              <option value="ECE">ECE</option>
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
              Section
            </label>
            <input
              type="text"
              name="section"
              value={formData.section}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(0,0,0,0.3)',
                color: '#fff',
              }}
            />
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
              Year
            </label>
            <select
              name="year"
              value={formData.year}
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
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
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
              Semester
            </label>
            <input
              type="text"
              name="semester"
              value={formData.semester}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(0,0,0,0.3)',
                color: '#fff',
              }}
            />
          </div>
        </div>

        <h3
          style={{
            fontSize: '1.15rem',
            fontWeight: 700,
            marginBottom: '20px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            paddingBottom: '10px',
          }}
        >
          2. Technical Interests & Links
        </h3>

        <div style={{ marginBottom: '16px' }}>
          <label
            style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}
          >
            Primary Domain Interest
          </label>
          <select
            name="domainInterest"
            value={formData.domainInterest}
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
            <option value="Full-Stack Web Development">Full-Stack Web Development</option>
            <option value="AI / Machine Learning & LLMs">AI / Machine Learning & LLMs</option>
            <option value="Cloud Native & DevOps">Cloud Native & DevOps</option>
            <option value="Competitive Programming & DSA">Competitive Programming & DSA</option>
            <option value="Cyber Security & Networking">Cyber Security & Networking</option>
            <option value="Open Source & Developer Tooling">Open Source & Developer Tooling</option>
          </select>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginBottom: '16px',
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
              GitHub Profile URL
            </label>
            <input
              type="url"
              name="githubUrl"
              placeholder="https://github.com/..."
              value={formData.githubUrl}
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
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                marginBottom: '6px',
              }}
            >
              LinkedIn Profile URL
            </label>
            <input
              type="url"
              name="linkedinUrl"
              placeholder="https://linkedin.com/in/..."
              value={formData.linkedinUrl}
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
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label
            style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}
          >
            Why do you want to join NexaSphere?
          </label>
          <textarea
            name="whyJoin"
            rows="3"
            placeholder="Tell us what you hope to build, learn, or contribute..."
            value={formData.whyJoin}
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
              : 'linear-gradient(135deg, #CC1111 0%, #990000 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '1rem',
            fontWeight: 700,
            cursor: mutation.isPending ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 14px rgba(204, 17, 17, 0.35)',
          }}
        >
          {mutation.isPending ? 'Submitting Application...' : 'Submit Membership Application'}
        </button>
      </form>
    </div>
  );
}
