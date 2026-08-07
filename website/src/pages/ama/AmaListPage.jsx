import { useState, useEffect } from 'react';
import { amaThreads } from '../../data/amaData';
import { AmaCard } from '../../components/ama/AmaCard';
import './Ama.css';
import Footer from '../../shared/Footer';

export default function AmaListPage({ onBack }) {
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  const filteredThreads = amaThreads.filter((t) => t.status === activeTab);

  return (
    <div className="ama-page-container">
      {onBack && (
        <button
          onClick={onBack}
          className="ns-back-btn"
          style={{
            position: 'absolute',
            top: '24px',
            left: '28px',
            background: 'var(--card)',
            border: '1px solid var(--bdr)',
            borderRadius: '50px',
            padding: '7px 16px',
            color: 'var(--t2)',
            fontSize: '.8rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 600,
          }}
        >
          ← Back
        </button>
      )}

      <div className="ama-header">
        <h1 className="ama-title">AMA Spaces</h1>
        <p className="ama-subtitle">
          Ask questions, get insights, and learn from verified alumni and mentors in our structured
          Ask-Me-Anything sessions.
        </p>
      </div>

      <div className="ama-tabs">
        <button
          className={`ama-tab-btn ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Active Now
        </button>
        <button
          className={`ama-tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          Upcoming
        </button>
        <button
          className={`ama-tab-btn ${activeTab === 'archived' ? 'active' : ''}`}
          onClick={() => setActiveTab('archived')}
        >
          Archived
        </button>
      </div>

      <div className="ama-grid">
        {filteredThreads.length > 0 ? (
          filteredThreads.map((ama) => <AmaCard key={ama.id} ama={ama} />)
        ) : (
          <div
            style={{
              textAlign: 'center',
              gridColumn: '1 / -1',
              color: 'var(--t3)',
              padding: '40px 0',
            }}
          >
            No {activeTab} AMAs found.
          </div>
        )}
      </div>

      <div style={{ marginTop: '100px' }}>
        <Footer />
      </div>
    </div>
  );
}
