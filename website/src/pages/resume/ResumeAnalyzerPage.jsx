import { useState, useEffect } from 'react';
import ResumeUploader from '../../components/ResumeAnalyzer/ResumeUploader';
import SkillGapChart from '../../components/ResumeAnalyzer/SkillGapChart';
import CareerRecommendationCard from '../../components/ResumeAnalyzer/CareerRecommendationCard';
import ATSScoreBar from '../../components/ResumeAnalyzer/ATSScoreBar';
import '../../styles/resume.css';

const MOCK_RESULT = {
  name: 'Nagajyothi Tammisetti',
  role: 'Frontend Developer',
  resumeScore: 82,
  atsScore: 74,
  skills: [
    { name: 'React', current: 80, required: 90 },
    { name: 'Node.js', current: 55, required: 80 },
    { name: 'TypeScript', current: 40, required: 75 },
    { name: 'DSA', current: 60, required: 85 },
    { name: 'System Design', current: 30, required: 70 },
    { name: 'CSS/Tailwind', current: 85, required: 80 },
  ],
  missingSkills: ['TypeScript', 'System Design', 'GraphQL', 'Docker'],
  recommendations: [
    {
      icon: '🗺️',
      type: 'roadmap',
      title: 'Full Stack Developer Roadmap',
      description: "You're 65% aligned. Strengthen Node.js and System Design to close the gap.",
      link: '/roadmaps',
    },
    {
      icon: '📘',
      type: 'course',
      title: 'TypeScript for React Developers',
      description: 'Highly in-demand skill missing from your profile. Add it in 2–3 weeks.',
      link: 'https://www.typescriptlang.org/docs/',
    },
    {
      icon: '🏗️',
      type: 'project',
      title: 'Build a Full-Stack Dashboard',
      description: 'Showcases React, Node.js, and TypeScript — perfect for your profile.',
      link: '/projects',
    },
    {
      icon: '🏆',
      type: 'certification',
      title: 'AWS Cloud Practitioner',
      description: 'Cloud skills are increasingly expected in mid-level roles. Start here.',
      link: 'https://aws.amazon.com/certification/',
    },
  ],
};

export default function ResumeAnalyzerPage({ onBack }) {
  const [step, setStep] = useState('upload');
  const [result, setResult] = useState(null);

  // Track timer across unmount scopes
  useEffect(() => {
    if (step !== 'analyzing') return;

    const timer = setTimeout(() => {
      setResult(MOCK_RESULT);
      setStep('result');
    }, 2500);

    return () => clearTimeout(timer);
  }, [step]);

  const handleUpload = () => {
    setStep('analyzing');
  };

  return (
    <div className="ra-page">
      {/* Back button — matches NexaSphere pattern */}
      {onBack && (
        <button aria-label="Interactive element" className="ra-back-btn" onClick={onBack}>
          ← Back
        </button>
      )}

      {/* Hero */}
      <div className="ra-hero">
        <h1 className="ra-title">AI Resume Analyzer</h1>
        <p className="ra-subtitle">
          Upload your resume and get personalized career insights, skill gap analysis, and roadmap
          recommendations.
        </p>
      </div>

      {/* Step 1 — Upload */}
      {step === 'upload' && (
        <div className="ra-upload-section">
          <ResumeUploader onUpload={handleUpload} />
        </div>
      )}

      {/* Step 2 — Analyzing */}
      {step === 'analyzing' && (
        <div className="ra-analyzing">
          <div className="analyzing-spinner" />
          <p className="analyzing-text">Analyzing your resume with AI...</p>
          <p className="analyzing-sub">
            Extracting skills · Detecting gaps · Generating recommendations
          </p>
        </div>
      )}

      {/* Step 3 — Results */}
      {step === 'result' && result && (
        <div className="ra-results">
          {/* Profile Card */}
          <div className="ra-profile-card">
            <div className="profile-avatar">
              {result.name
                .split(' ')
                .map((w) => w[0])
                .join('')}
            </div>
            <div>
              <h2 className="profile-name">{result.name}</h2>
              <p className="profile-role">{result.role}</p>
            </div>
            <button
              aria-label="Interactive element"
              className="re-upload-btn"
              onClick={() => setStep('upload')}
            >
              Re-upload Resume
            </button>
          </div>

          {/* Score Cards */}
          <div className="ra-scores">
            {[
              { label: 'Resume Score', value: `${result.resumeScore}%`, color: '#6366f1' },
              { label: 'ATS Score', value: `${result.atsScore}%`, color: '#10b981' },
              { label: 'Skills Detected', value: result.skills.length, color: '#f59e0b' },
              { label: 'Gaps Found', value: result.missingSkills.length, color: '#ef4444' },
            ].map((s, i) => (
              <div key={s.label} className="score-card">
                <p className="score-card-label">{s.label}</p>
                <p className="score-card-value" style={{ color: s.color }}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          {/* Score Bars */}
          <div className="ra-section">
            <h3 className="section-title">Score Breakdown</h3>
            <ATSScoreBar label="Resume Score" score={result.resumeScore} />
            <ATSScoreBar label="ATS Compatibility" score={result.atsScore} />
            <ATSScoreBar label="Keyword Match" score={68} />
            <ATSScoreBar label="Format & Readability" score={91} />
          </div>

          {/* Radar Chart */}
          <div className="ra-section">
            <h3 className="section-title">Skill Gap Analysis</h3>
            <SkillGapChart skills={result.skills} />
          </div>

          {/* Missing Skills */}
          <div className="ra-section">
            <h3 className="section-title">Missing / In-Demand Skills</h3>
            <div className="missing-skills">
              {result.missingSkills.map((s, i) => (
                <span key={s} className="skill-tag missing">
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="ra-section">
            <h3 className="section-title">Personalized Recommendations</h3>
            <CareerRecommendationCard recommendations={result.recommendations} />
          </div>
        </div>
      )}
    </div>
  );
}
