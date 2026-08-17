import { useState } from 'react';
import { buildUrl } from '../../utils/runtimeConfig';
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
  keywordScore: 68,
  formatScore: 91,
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
      description:
        'Showcases React, Node.js, and TypeScript together — perfect for your portfolio.',
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

export default function ResumeAnalyzerPage() {
  const [step, setStep] = useState('upload');
  const [result, setResult] = useState(null);
  const [isDemo, setIsDemo] = useState(false);

  const handleUpload = async (file) => {
    setStep('analyzing');

    const aiBase = (import.meta?.env?.VITE_AI_API_BASE || '').replace(/\/+$/, '');
    const resumeUrl = aiBase ? buildUrl(aiBase, '/ai/resume') : null;

    if (resumeUrl && file) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(resumeUrl, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          setIsDemo(false);
          setResult({
            ...data,
            keywordScore: data.keywordScore ?? data.keywordMatch ?? data.scores?.keyword,
            formatScore: data.formatScore ?? data.formatReadability ?? data.scores?.format,
          });
          setStep('result');
          return;
        }
      } catch {
        // Network error or backend unavailable — fall through to demo mode
      }
    }

    // Backend unavailable or not configured — show mock data with demo banner
    setIsDemo(true);
    setResult(MOCK_RESULT);
    setStep('result');
  };

  return (
    <div className="ra-page">
      <div className="ra-hero">
        <h1 className="ra-title">AI Resume Analyzer</h1>
        <p className="ra-subtitle">
          Upload your resume and get personalized career insights, skill gap analysis, and roadmap
          recommendations.
        </p>
      </div>

      {step === 'upload' && (
        <div className="ra-upload-section">
          <ResumeUploader onUpload={handleUpload} />
        </div>
      )}

      {step === 'analyzing' && (
        <div className="ra-analyzing">
          <div className="analyzing-spinner" />
          <p className="analyzing-text">Analyzing your resume with AI...</p>
          <p className="analyzing-sub">
            Extracting skills · Detecting gaps · Generating recommendations
          </p>
        </div>
      )}

      {step === 'result' && result && (
        <div className="ra-results">
          {isDemo && (
            <div
              className="ra-demo-banner"
              role="status"
              style={{
                background: 'rgba(245,158,11,0.1)',
                border: '1px solid rgba(245,158,11,0.3)',
                borderRadius: '8px',
                padding: '10px 16px',
                marginBottom: '20px',
                color: '#f59e0b',
                fontSize: '0.85rem',
              }}
            >
              ⚠ Demo mode — resume analysis service is not configured. Showing sample results.
            </div>
          )}

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
            <button className="re-upload-btn" onClick={() => setStep('upload')}>
              Re-upload Resume
            </button>
          </div>

          <div className="ra-scores">
            {[
              { label: 'Resume Score', value: result.resumeScore, color: '#6366f1' },
              { label: 'ATS Score', value: result.atsScore, color: '#10b981' },
              { label: 'Skills Detected', value: result.skills.length, color: '#f59e0b' },
              { label: 'Gaps Found', value: result.missingSkills.length, color: '#ef4444' },
            ].map((s) => (
              <div key={s.label} className="score-card">
                <p className="score-card-label">{s.label}</p>
                <p className="score-card-value" style={{ color: s.color }}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          <div className="ra-section">
            <h3 className="section-title">Score Breakdown</h3>
            <ATSScoreBar label="Resume Score" score={result.resumeScore} />
            <ATSScoreBar label="ATS Compatibility" score={result.atsScore} />
            {typeof result.keywordScore === 'number' && (
              <ATSScoreBar label="Keyword Match" score={result.keywordScore} />
            )}
            {typeof result.formatScore === 'number' && (
              <ATSScoreBar label="Format & Readability" score={result.formatScore} />
            )}
          </div>

          <div className="ra-section">
            <h3 className="section-title">Skill Gap Analysis</h3>
            <SkillGapChart skills={result.skills} />
          </div>

          <div className="ra-section">
            <h3 className="section-title">Missing / In-Demand Skills</h3>
            <div className="missing-skills">
              {result.missingSkills.map((s) => (
                <span key={s} className="skill-tag missing">
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="ra-section">
            <h3 className="section-title">Personalized Recommendations</h3>
            <CareerRecommendationCard recommendations={result.recommendations} />
          </div>
        </div>
      )}
    </div>
  );
}
