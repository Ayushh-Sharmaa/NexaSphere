import React, { useEffect, useRef, useState } from 'react';

const FOCUSABLE_SELECTORS =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function JoinRequestModal({ team, onClose, onSubmit }) {
  const modalRef = useRef(null);
  const [pitch, setPitch] = useState('');
  const [skills, setSkills] = useState('');
  const [github, setGithub] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const resetForm = () => {
    setPitch('');
    setSkills('');
    setGithub('');
    setSuccess(false);
  };
  const handleClose = () => {
    resetForm();
    onClose();
  };
  // Store the element that triggered the modal so focus can be
  // returned to it when the modal closes.
  const triggerRef = useRef(document.activeElement);

  // Reset form state whenever the modal opens (team changes)
  // This ensures users start with a fresh form each time they open the modal
  useEffect(() => {
    setPitch('');
    setSkills('');
    setGithub('');
    setSuccess(false);
    setLoading(false);
  }, [team?.id]);

  // Move focus into the modal on mount and return it on unmount.
  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;
    const firstFocusable = modal.querySelectorAll(FOCUSABLE_SELECTORS)[0];
    if (firstFocusable) firstFocusable.focus();

    return () => {
      // Return focus to the element that opened the modal
      if (triggerRef.current && typeof triggerRef.current.focus === 'function') {
        triggerRef.current.focus();
      }
    };
  }, [team?.id]);

  // Focus trap + Escape key handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
        return;
      }

      if (e.key !== 'Tab') return;

      const modal = modalRef.current;
      if (!modal) return;

      const focusables = Array.from(modal.querySelectorAll(FOCUSABLE_SELECTORS));
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey) {
        // Shift+Tab — if focus is on first element, wrap to last
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Tab — if focus is on last element, wrap to first
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (modalRef.current) {
      const firstFocusable = modalRef.current.querySelector(
        'button, input, textarea, select, a[href]'
      );

      firstFocusable?.focus();
    }
  }, []);
  useEffect(() => {
    resetForm();
  }, [team?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({ pitch, skills, github, teamId: team.id });
      setPitch('');
      setSkills('');
      setGithub('');
      setSuccess(true);
      setTimeout(onClose, 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)',
        padding: '24px',
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
        className="glass-panel pop-scale"
        style={{
          width: '100%',
          maxWidth: '500px',
          background: 'var(--bg)',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 40px rgba(204,17,17,0.15)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 id="modal-title" style={{ margin: 0, fontSize: '1.5rem', color: 'var(--t1)' }}>
              Join {team?.name}
            </h2>
            <button
              onClick={handleClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--t2)',
                fontSize: '1.5rem',
                cursor: 'pointer',
              }}
              aria-label="Close modal"
            >
              &times;
            </button>
          </div>
          <p
            id="modal-description"
            style={{ margin: '8px 0 0 0', color: 'var(--c1)', fontSize: '0.9rem' }}
          >
            Pitch yourself for the {team?.vacantRoles?.join(', ')} role(s)
          </p>
        </div>

        <div style={{ padding: '24px' }}>
          {success ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#4CAF50' }}>
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ marginBottom: '16px' }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 style={{ margin: 0 }}>Request Sent!</h3>
              <p style={{ color: 'var(--t2)', fontSize: '0.9rem', marginTop: '8px' }}>
                The team leader will be notified.
              </p>
              <button
                onClick={handleClose}
                autoFocus
                style={{
                  marginTop: '20px',
                  padding: '10px 28px',
                  background: 'linear-gradient(135deg, #CC1111, #880000)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <div>
                <label
                  htmlFor="pitch"
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: 'var(--t2)',
                    fontSize: '0.9rem',
                  }}
                >
                  Why should they pick you?
                </label>
                <textarea
                  id="pitch"
                  required
                  value={pitch}
                  onChange={(e) => setPitch(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '12px',
                    background: 'var(--surface)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: 'var(--t1)',
                    fontSize: '0.95rem',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                  placeholder="I have 2 years of React experience and..."
                />
              </div>

              <div>
                <label
                  htmlFor="skills"
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: 'var(--t2)',
                    fontSize: '0.9rem',
                  }}
                >
                  Key Skills (comma separated)
                </label>
                <input
                  id="skills"
                  type="text"
                  required
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'var(--surface)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: 'var(--t1)',
                    fontSize: '0.95rem',
                  }}
                  placeholder="React, Node.js, UI/UX"
                />
              </div>

              <div>
                <label
                  htmlFor="github"
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: 'var(--t2)',
                    fontSize: '0.9rem',
                  }}
                >
                  GitHub / Portfolio Link
                </label>
                <input
                  id="github"
                  type="url"
                  required
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'var(--surface)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: 'var(--t1)',
                    fontSize: '0.95rem',
                  }}
                  placeholder="https://github.com/yourusername"
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={handleClose}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'var(--surface-hover)',
                    color: 'var(--t1)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 2,
                    padding: '12px',
                    background: 'linear-gradient(135deg, #CC1111, #880000)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? 'Sending...' : 'Submit Request'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
