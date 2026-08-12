import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../../utils/apiClient.js';
import { getApiBase } from '../../utils/runtimeConfig';
import { useCertificateExport } from '../../hooks/useCertificateExport';
import { projectsData } from '../../data/projectsData';
import { roadmapData } from '../../data/roadmapData';
import { Helmet } from 'react-helmet-async';
import { generatePortfolioMeta } from '../../utils/seoUtils';
import { safeHref } from '../../utils/safeHref';
import '../../styles/print.css';
import { useStudentAuth } from '../../context/StudentAuthContext';
import ProfileBadges from '../../components/profile/ProfileBadges';

export default function PublicPortfolio({ username, onBack }) {
  const { user } = useStudentAuth();
  const [portfolio, setPortfolio] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [endorseFeedback, setEndorseFeedback] = useState(null);

  const showEndorseFeedback = (message, type = "error") => {
    setEndorseFeedback({ message, type });
    setTimeout(() => setEndorseFeedback(null), 4000);
  };

  useEffect(() => {
    let alive = true;
    const fetchPortfolio = async () => {
      try {
        const base = getApiBase();
        const url = `${base}/api/portfolio/${username}`;

        const data = await apiClient(url);
        if (alive) {
          setPortfolio(data);
          setIsLoading(false);
        }
        // Fire-and-forget view tracking — never blocks rendering or
        // surfaces an error to the visitor if it fails.
        fetch(`${base}/api/portfolio/${username}/view`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ referrer: document.referrer || null }),
        }).catch((err) => {
          console.error('[PublicPortfolio] View tracking failed:', err);
        });
      } catch (err) {
        if (alive) {
          setError(err.message);
          setIsLoading(false);
        }
      }
    };

    fetchPortfolio();
    return () => {
      alive = false;
    };
  }, [username]);

  // SEO & Social sharing headers dynamic updates removed from useEffect
  // We use react-helmet-async directly in the render now.

  const portfolioRef = useRef();

  const { handlePrint, isExporting, exportError } = useCertificateExport({
    content: () => portfolioRef.current,
    documentTitle: `${username}_Portfolio`,
    removeAfterPrint: true,
  });

  const handleEndorse = async (skillName) => {
    if (!user) {
      showEndorseFeedback('You must be signed in as a club member to endorse skills.', 'error');
      return;
    }
    if (user.username && user.username.toLowerCase() === username.toLowerCase()) {
      showEndorseFeedback('You cannot endorse your own skills.', 'error');
      return;
    }
    try {
      const base = getApiBase();
      const res = await apiClient(`${base}/api/portfolio/${username}/endorse`, {
        method: 'POST',
        body: { skillName },
      });
      if (res.success) {
        showEndorseFeedback(`Successfully endorsed ${skillName}!`, 'success');
        setPortfolio((prev) => {
          const updatedSkills = prev.skills.map((s) => {
            const sName = typeof s === 'string' ? s : s.name;
            if (sName === skillName) {
              return {
                name: sName,
                endorsements: (s.endorsements || 0) + 1,
              };
            }
            return typeof s === 'string' ? { name: s, endorsements: 0 } : s;
          });
          return { ...prev, skills: updatedSkills };
        });
      }
    } catch (err) {
      showEndorseFeedback(err.message || 'Failed to endorse skill', 'error');
    }
  };

  const getTopSkills = (skills) => {
    if (!skills || skills.length === 0) return new Set();
    const withCounts = skills.map((s) => ({
      name: typeof s === 'string' ? s : s.name,
      count: typeof s === 'string' ? 0 : s.endorsements || 0,
    }));
    const maxCount = Math.max(...withCounts.map((s) => s.count));
    if (maxCount === 0) return new Set();
    return new Set(withCounts.filter((s) => s.count === maxCount).map((s) => s.name));
  };

  if (isLoading) {
    return <PortfolioSkeleton />;
  }

  if (error || !portfolio) {
    return (
      <div
        style={{
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '40px 24px',
        }}
      >
        <div
          style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: 'clamp(4rem, 15vw, 8rem)',
            fontWeight: 900,
            background: 'linear-gradient(135deg, #CC1111 0%, #EE2222 50%, #FF4444 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: 1,
            marginBottom: '16px',
          }}
        >
          404
        </div>
        <h2
          style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: 'clamp(1.2rem, 3vw, 1.8rem)',
            fontWeight: 700,
            color: 'var(--t1)',
            marginBottom: '12px',
          }}
        >
          Showcase Registry Unresolved
        </h2>
        <p
          style={{
            color: 'var(--t2)',
            fontSize: '1rem',
            maxWidth: '420px',
            lineHeight: 1.7,
            marginBottom: '32px',
          }}
        >
          The developer portfolio for <strong>@{username}</strong> hasn't been built yet or has been
          moved from NexaSphere's catalog.
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-outline" onClick={onBack}>
            ← Back Home
          </button>
          <button className="btn btn-primary" onClick={onBack}>
            Build Yours
          </button>
        </div>
      </div>
    );
  }

  const {
    theme,
    title: profTitle,
    bio,
    visibleSections,
    socialLinks,
    skills,
    roadmaps,
    projects,
    customProjects,
    githubUsername,
  } = portfolio;

  const allProjects = [
    ...(projects || []).map((id) => projectsData.find((p) => p.id === id)).filter(Boolean),
    ...(customProjects || []),
  ];

  const meta = generatePortfolioMeta(portfolio);

  return (
    <div className={`portfolio-presentation-container theme-${theme}`} ref={portfolioRef}>
      <Helmet>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <meta name="keywords" content={meta.keywords} />
        <meta name="author" content={meta.author} />
        <meta name="robots" content="index, follow" />

        <link rel="canonical" href={meta.url} />

        {/* OpenGraph */}
        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:image" content={meta.image} />
        <meta property="og:type" content={meta.type} />
        <meta property="og:url" content={meta.url} />
        <meta property="og:site_name" content="NexaSphere" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={meta.title} />
        <meta name="twitter:description" content={meta.description} />
        <meta name="twitter:image" content={meta.image} />
      </Helmet>

      {/* Dynamic floating toolbar above showcase */}
      <div className="action-floating-header no-print">
        <button className="btn btn-outline" onClick={onBack} aria-label="Back to main page">
          ← Back
        </button>
        <button
          className="btn btn-outline"
          onClick={handlePrint}
          disabled={isExporting}
          aria-label="Export portfolio to PDF"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            style={{ marginRight: '6px', verticalAlign: 'middle' }}
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {isExporting ? 'Exporting...' : 'Export PDF'}
        </button>
        <button
          className="btn btn-primary"
          onClick={onBack}
          aria-label="Build your own developer showcase"
        >
          Build Yours
        </button>
      </div>

      {exportError && (
        <div
          className="no-print"
          style={{
            color: '#ef4444',
            textAlign: 'center',
            margin: '1rem auto',
            padding: '0.5rem',
            background: '#fee2e2',
            borderRadius: '8px',
            border: '1px solid #f87171',
            maxWidth: '800px',
          }}
        >
          {exportError}
        </div>
      )}

      {/* Main presentation sheet */}
      <div className="portfolio-shell">
        {/* Intro profile summary */}
        <header className="portfolio-intro">
          <img
            src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${username}`}
            alt={`${username}'s avatar`}
            className="portfolio-avatar"
            width="120"
            height="120"
          />
          <div className="portfolio-bio-col">
            <h1 className="portfolio-name">@{username}</h1>
            <div className="portfolio-title">{profTitle || 'Tech Specialist & Developer'}</div>
            <p className="portfolio-bio-text">
              {bio ||
                'Welcome to my verified NexaSphere profile. Here is a live showcase of my certified skills, curriculum progress milestones, and collaborative projects synchronized directly from our active developer workspace.'}
            </p>

            {/* Social connections links */}
            <div className="portfolio-socials" role="list">
              {safeHref(socialLinks?.github) && (
                <a
                  href={safeHref(socialLinks.github)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="portfolio-social-btn"
                  aria-label="GitHub Profile"
                  role="listitem"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                  </svg>
                </a>
              )}
              {safeHref(socialLinks?.linkedin) && (
                <a
                  href={safeHref(socialLinks.linkedin)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="portfolio-social-btn"
                  aria-label="LinkedIn Profile"
                  role="listitem"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                    <rect x="2" y="9" width="4" height="12" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                </a>
              )}
              {safeHref(socialLinks?.twitter) && (
                <a
                  href={safeHref(socialLinks.twitter)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="portfolio-social-btn"
                  aria-label="Twitter or X Profile"
                  role="listitem"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                  </svg>
                </a>
              )}
              {safeHref(socialLinks?.resume) && (
                <a
                  href={safeHref(socialLinks.resume)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="portfolio-social-btn"
                  aria-label="Professional Resume"
                  role="listitem"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </header>

        {portfolio.badges && portfolio.badges.length > 0 && (
          <div style={{ padding: '0 24px', marginBottom: '24px' }}>
            <ProfileBadges badges={portfolio.badges} />
          </div>
        )}

        {/* Dynamic section grid layouts */}
        <main className="portfolio-grid">
          {/* Section A: Certified Skills & Badges */}
          {/* skillsAndQuests key controls both Skills and Quests sections */}
          {visibleSections?.skillsAndQuests && skills && skills.length > 0 && (
            <section className="portfolio-panel" aria-labelledby="skills-heading">
              <h2 id="skills-heading" className="portfolio-section-title">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  style={{ color: 'var(--accent-portfolio)' }}
                >
                  <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
                  <line x1="12" y1="22" x2="12" y2="15.5" />
                  <polyline points="22 8.5 12 15.5 2 8.5" />
                  <polyline points="2 15.5 12 8.5 22 15.5" />
                  <line x1="12" y1="2" x2="12" y2="8.5" />
                </svg>
                Certified Capabilities
              </h2>
              <div className="portfolio-pills-list">
                {skills.map((skill) => {
                  const sName = typeof skill === 'string' ? skill : skill.name;
                  const sCount = typeof skill === 'string' ? 0 : skill.endorsements || 0;
                  const isTop = getTopSkills(skills).has(sName);

                  return (
                    <span
                      key={sName}
                      className="portfolio-pill"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                    >
                      {sName}
                      {isTop && <span title="Top Endorsed Skill">🏆</span>}
                      {sCount > 0 && (
                        <span
                          className="endorsement-count"
                          style={{
                            backgroundColor: 'var(--accent-portfolio)',
                            color: '#fff',
                            borderRadius: '50%',
                            padding: '2px 6px',
                            fontSize: '0.8em',
                          }}
                        >
                          {sCount}
                        </span>
                      )}
                      {user && (
                        <button
                          onClick={() => handleEndorse(sName)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0,
                            color: 'var(--accent-portfolio)',
                            fontSize: '1em',
                            opacity: 0.8,
                          }}
                          title="Endorse this skill"
                        >
                          +
                        </button>
                      )}
                    </span>
                  );
                })}
              </div>
            </section>
          )}

          {/* Section B: Curriculum Progress & Node Graphs */}
          {visibleSections?.roadmaps && roadmaps && roadmaps.length > 0 && (
            <section className="portfolio-panel" aria-labelledby="roadmaps-heading">
              <h2 id="roadmaps-heading" className="portfolio-section-title">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  style={{ color: 'var(--accent-portfolio)' }}
                >
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                </svg>
                Curriculum Pathways
              </h2>
              <div className="portfolio-roadmaps-list">
                {roadmaps.map((roadmapKey) => {
                  const data = roadmapData[roadmapKey];
                  if (!data) return null;
                  return (
                    <div key={roadmapKey} className="portfolio-roadmap-card">
                      <div className="roadmap-card-info">
                        <span className="roadmap-card-title">{data.title}</span>
                        <span className="roadmap-card-status">
                          Completed: {data.nodes?.length || 0} Core modules mastered
                        </span>
                      </div>
                      <span
                        className="portfolio-pill"
                        style={{
                          textTransform: 'uppercase',
                          fontSize: '0.75rem',
                          letterSpacing: '0.05em',
                        }}
                      >
                        Active Curriculum
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Section C: Federated Team Projects */}
          {visibleSections?.projects && allProjects.length > 0 && (
            <section className="portfolio-panel" aria-labelledby="projects-heading">
              <h2 id="projects-heading" className="portfolio-section-title">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  style={{ color: 'var(--accent-portfolio)' }}
                >
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
                Federated Workspace Projects
              </h2>
              <div className="portfolio-projects-grid">
                {allProjects.map((proj) => {
                  return (
                    <article key={proj.id} className="portfolio-project-card">
                      <img
                        src={
                          proj.image ||
                          'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800'
                        }
                        alt={proj.title}
                        className="project-card-thumbnail"
                        loading="lazy"
                      />
                      <div className="project-card-body">
                        <span
                          className="portfolio-pill"
                          style={{
                            alignSelf: 'flex-start',
                            padding: '2px 8px',
                            fontSize: '0.7rem',
                            textTransform: 'uppercase',
                          }}
                        >
                          {proj.category}
                        </span>
                        <h3 className="project-card-heading">{proj.title}</h3>
                        <p className="project-card-description">{proj.shortDesc}</p>
                        <div className="portfolio-pills-list" style={{ gap: '6px' }}>
                          {proj.techStack?.slice(0, 4).map((tech) => (
                            <span
                              key={tech}
                              className="portfolio-pill"
                              style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="project-card-footer">
                        {safeHref(proj.github) && proj.github !== '#' && (
                          <a
                            href={safeHref(proj.github)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="portfolio-social-btn"
                            style={{ width: '32px', height: '32px' }}
                            aria-label={`View source code for ${proj.title}`}
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                            >
                              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                            </svg>
                          </a>
                        )}
                        {safeHref(proj.demo) && proj.demo !== '#' && (
                          <a
                            href={safeHref(proj.demo)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="portfolio-social-btn"
                            style={{ width: '32px', height: '32px' }}
                            aria-label={`Open demo for ${proj.title}`}
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                            >
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                              <polyline points="15 3 21 3 21 9" />
                              <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                          </a>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {githubUsername && (
            <section className="portfolio-panel" aria-labelledby="github-activity-heading">
              <h2 id="github-activity-heading" className="portfolio-section-title">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  style={{ color: 'var(--accent-portfolio)' }}
                >
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                </svg>
                GitHub Activity
              </h2>
              <img
                src={`https://ghchart.rshah.org/CC1111/${githubUsername}`}
                alt={`${githubUsername} GitHub contribution graph`}
                style={{ width: '100%', borderRadius: 'var(--r2)' }}
                loading="lazy"
              />
            </section>
          )}
        </main>

        <footer
          className="no-print"
          style={{
            marginTop: 'auto',
            paddingTop: '30px',
            textAlign: 'center',
            fontSize: '0.8rem',
            color: 'var(--text-sub-portfolio, var(--t3))',
            borderTop: '1px solid var(--border-portfolio, var(--bdr2))',
          }}
        >
          <p>
            © {new Date().getFullYear()} NexaSphere Registry. All developer achievements are
            verified and cryptographically stamped.
          </p>
        </footer>
      </div>
    </div>
  );
}
