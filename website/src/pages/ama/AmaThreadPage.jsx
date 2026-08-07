import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { amaThreads } from '../../data/amaData';
import { AmaQuestion } from '../../components/ama/AmaQuestion';
import Footer from '../../shared/Footer';
import { MentionTextarea } from '../../components/common/MentionTextarea';
import './Ama.css';

export default function AmaThreadPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [thread, setThread] = useState(null);
  const [newQuestion, setNewQuestion] = useState('');

  useEffect(() => {
    window.scrollTo({ top: 0 });
    const found = amaThreads.find((t) => t.id === id);
    if (found) {
      setThread(found);
    }
  }, [id]);

  const sortedQuestions = useMemo(() => {
    if (!thread) return [];
    return [...thread.questions].sort((a, b) => b.upvotes - a.upvotes);
  }, [thread]);

  if (!thread) {
    return (
      <div className="ama-page-container" style={{ textAlign: 'center', paddingTop: '20vh' }}>
        <h2>AMA not found.</h2>
        <button className="ns-back-btn" onClick={() => navigate('/ama')}>
          Back to AMAs
        </button>
      </div>
    );
  }

  const handleSubmitQuestion = (e) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;

    const questionObj = {
      id: `q${Date.now()}`,
      author: {
        name: 'You (Student)',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=You',
      },
      content: newQuestion,
      upvotes: 1,
      createdAt: new Date().toISOString(),
      reply: null,
    };

    setThread((prev) => ({
      ...prev,
      questions: [questionObj, ...prev.questions],
      questionsCount: prev.questionsCount + 1,
    }));

    setNewQuestion('');
  };

  return (
    <div className="ama-page-container">
      <button
        onClick={() => navigate('/ama')}
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

      <div className="ama-thread-container">
        <div className="ama-thread-header">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '16px',
            }}
          >
            <span className={`ama-status-badge ${thread.status}`}>{thread.status}</span>
            <span style={{ color: 'var(--t3)', fontSize: '0.9rem' }}>
              {new Date(thread.date).toLocaleDateString()}
            </span>
          </div>

          <h1 className="ama-thread-topic">{thread.topic}</h1>

          <div className="ama-card-mentor" style={{ marginBottom: '24px' }}>
            <img
              src={thread.mentor.avatar}
              alt={thread.mentor.name}
              className="ama-card-avatar"
              style={{ width: 64, height: 64 }}
            />
            <div className="ama-card-mentor-info">
              <span className="ama-card-mentor-name" style={{ fontSize: '1.3rem' }}>
                {thread.mentor.name}
              </span>
              <span className="ama-card-mentor-role" style={{ fontSize: '1rem' }}>
                {thread.mentor.role}
              </span>
            </div>
          </div>

          <p className="ama-thread-desc">{thread.description}</p>
        </div>

        {thread.status !== 'archived' && (
          <form className="ama-question-form" onSubmit={handleSubmitQuestion}>
            <h3 style={{ marginBottom: '16px', fontSize: '1.3rem' }}>Ask a Question</h3>
            <MentionTextarea
              className="ama-q-input"
              placeholder="What would you like to ask?"
              value={newQuestion}
              onChange={setNewQuestion}
            />
            <button type="submit" className="ama-submit-btn" disabled={!newQuestion.trim()}>
              Submit Question
            </button>
            <div style={{ clear: 'both' }}></div>
          </form>
        )}

        <h3
          style={{
            marginBottom: '20px',
            fontSize: '1.5rem',
            borderBottom: '1px solid var(--bdr)',
            paddingBottom: '12px',
          }}
        >
          Questions ({thread.questionsCount})
        </h3>

        <div className="ama-questions-section">
          {sortedQuestions.map((q) => (
            <AmaQuestion key={q.id} question={q} mentorName={thread.mentor.name} />
          ))}

          {sortedQuestions.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--t3)' }}>
              No questions yet. Be the first to ask!
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: '100px' }}>
        <Footer />
      </div>
    </div>
  );
}
