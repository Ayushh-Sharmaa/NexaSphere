import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../utils/apiClient';

const styles = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg, #0f172a)',
    color: 'var(--t1, #f0f4ff)',
    fontFamily: 'system-ui, sans-serif',
    padding: '2rem 1rem',
  },
  container: { maxWidth: '700px', margin: '0 auto' },
  header: { fontSize: '2rem', fontWeight: '800', marginBottom: '2rem' },
  section: {
    background: '#1e293b',
    border: '1px solid #ffffff0f',
    borderRadius: '16px',
    padding: '2rem',
    marginBottom: '2rem',
  },
  sectionTitle: { fontSize: '1.3rem', fontWeight: '700', marginBottom: '1rem' },
  sectionText: { color: '#94a3b8', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: '1.5' },
  btnPrimary: {
    background: '#3b82f6',
    color: '#fff',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    fontWeight: '700',
    cursor: 'pointer',
    fontSize: '0.95rem',
    transition: 'opacity 0.2s',
  },
  btnDanger: {
    background: 'transparent',
    color: '#ef4444',
    border: '1px solid #ef444450',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    fontWeight: '700',
    cursor: 'pointer',
    fontSize: '0.95rem',
    transition: 'background 0.2s',
  },
  btnDangerConfirm: {
    background: '#ef4444',
    color: '#fff',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    fontWeight: '700',
    cursor: 'pointer',
    fontSize: '0.95rem',
  },
  btnOutline: {
    background: 'transparent',
    color: '#94a3b8',
    border: '1px solid #ffffff20',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '0.95rem',
  },
  input: {
    width: '100%',
    background: '#0f172a',
    border: '1px solid #ffffff20',
    color: '#f0f4ff',
    padding: '0.85rem 1rem',
    borderRadius: '8px',
    fontSize: '0.95rem',
    marginBottom: '1.5rem',
    outline: 'none',
    fontFamily: 'inherit',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: '#000000bb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem',
  },
  modal: {
    background: '#1e293b',
    border: '1px solid #ffffff15',
    borderRadius: '16px',
    padding: '2rem',
    width: '100%',
    maxWidth: '480px',
  },
  modalTitle: { fontSize: '1.2rem', fontWeight: '800', marginBottom: '1rem' },
  modalText: { color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.5' },
  modalBtns: { display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' },
};

export default function AccountSettingsPage() {
  const [exporting, setExporting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const showFeedback = (message, type = 'error') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 5000);
  };
  const navigate = useNavigate();

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const res = await apiClient.get('/api/auth/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `nexasphere-data-export-${new Date().toISOString().split('T')[0]}.json`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      showFeedback(err.response?.data?.error || 'Failed to export data', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.toLowerCase() !== 'delete my account') return;
    try {
      setDeleting(true);
      await apiClient.delete('/api/auth/me');
      window.location.href = '/login';
    } catch (err) {
      showFeedback(err.response?.data?.error || 'Failed to delete account', 'error');
      setDeleting(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {feedback && (
          <div
            role="status"
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: '500',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: feedback.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              color: feedback.type === 'error' ? '#f87171' : '#34d399',
              border: `1px solid ${feedback.type === 'error' ? '#ef4444' : '#10b981'}`,
            }}
          >
            <span>{feedback.type === 'error' ? '⚠️' : '✅'} {feedback.message}</span>
            <button
              onClick={() => setFeedback(null)}
              style={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                fontSize: '1.1rem',
                marginLeft: '12px',
              }}
              aria-label="Dismiss message"
            >
              &times;
            </button>
          </div>
        )}

        <h1 style={styles.header}>Account Settings</h1>

        {notification && (
          <div
            role="alert"
            style={{
              padding: '1rem 1.25rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between',
              background: notification.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
              border: `1px solid ${notification.type === 'error' ? '#ef4444' : '#22c55e'}`,
              color: notification.type === 'error' ? '#fca5a5' : '#86efac',
              fontSize: '0.95rem',
              fontWeight: '500',
            }}
          >
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              style={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                marginLeft: 'auto',
                fontSize: '1.1rem',
                padding: '0 0.5rem',
              }}
              aria-label="Dismiss notification"
            >
              &times;
            </button>
          </div>
        )}

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Export My Data</h2>
          <p style={styles.sectionText}>
            You can request a complete export of your personal data at any time. This includes your
            profile information, event registrations, portfolio data, and forum posts. Your data
            will be downloaded as a JSON file.
          </p>
          <button
            style={{ ...styles.btnPrimary, opacity: exporting ? 0.7 : 1 }}
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? 'Generating Export...' : 'Request Export'}
          </button>
        </div>

        <div style={{ ...styles.section, border: '1px solid #ef444430' }}>
          <h2 style={{ ...styles.sectionTitle, color: '#ef4444' }}>Danger Zone</h2>
          <p style={styles.sectionText}>
            Deleting your account is permanent. It will immediately anonymize your forum posts to
            preserve community threads, but completely erase your personal profile, event
            registrations, and portfolio. This action cannot be undone.
          </p>
          <button style={styles.btnDanger} onClick={() => setShowDeleteModal(true)}>
            Delete My Account
          </button>
        </div>
      </div>

      {showDeleteModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal} className="modal-box" data-theme="light">
            <h3 style={{ ...styles.modalTitle, color: '#ef4444' }}>Delete Account</h3>
            <p style={styles.modalText}>
              This action is irreversible. To confirm you want to permanently delete your account,
              please type <strong>delete my account</strong> below.
            </p>
            <input
              style={styles.input}
              placeholder="delete my account"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
            />
            <div style={styles.modalBtns}>
              <button
                style={styles.btnOutline}
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                style={{
                  ...styles.btnDangerConfirm,
                  opacity: deleteConfirmText.toLowerCase() === 'delete my account' ? 1 : 0.5,
                }}
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText.toLowerCase() !== 'delete my account' || deleting}
              >
                {deleting ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
