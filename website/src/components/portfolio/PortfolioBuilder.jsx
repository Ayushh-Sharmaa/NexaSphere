import React, { useState, useRef, useEffect } from 'react';
import apiClient from '../../utils/apiClient.js';
import { getApiBase } from '../../utils/runtimeConfig';
import { projectsData } from '../../data/projectsData';
import { roadmapData } from '../../data/roadmapData';
import { RepoCardSkeleton } from '../ui/skeleton/RepoCardSkeleton';
import AdvancedCustomizer from './AdvancedCustomizer';

export default function PortfolioBuilder() {
  const [username, setUsername] = useState('');
  const [passkey, setPasskey] = useState('');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [theme, setTheme] = useState('glassmorphic');
  const [isPublic, setIsPublic] = useState(true);
  const [customization, setCustomization] = useState({
    colors: { accent: '#cc1111' },
    typography: { header: 'Orbitron' },
    spacing: { radius: 12, padding: 28 },
    hero: 'centered',
  });
  const [customDomain, setCustomDomain] = useState('');

  // Section Visibilities
  const [visibleSections, setVisibleSections] = useState({
    skillsAndQuests: true,
    roadmaps: true,
    projects: true,
  });

  // Social Links
  const [socialLinks, setSocialLinks] = useState({
    github: '',
    linkedin: '',
    twitter: '',
    resume: '',
  });

  // SEO Metadata
  const [seoMetadata, setSeoMetadata] = useState({
    title: '',
    description: '',
  });

  // Selected Data Elements to showcase
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedRoadmaps, setSelectedRoadmaps] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [customProjects, setCustomProjects] = useState([]);
  const [workExperience, setWorkExperience] = useState([]);

  // GitHub Fetching States
  const [ghUsername, setGhUsername] = useState('');
  const [isFetchingGh, setIsFetchingGh] = useState(false);
  const [ghRepos, setGhRepos] = useState([]);
  const [ghError, setGhError] = useState('');
  const [ghFetchAttempted, setGhFetchAttempted] = useState(false);

  // States
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copied, setCopied] = useState(false);

  // Resume Parsing
  const [isParsing, setIsParsing] = useState(false);
  const resumeInputRef = useRef(null);
  // Extract all unique skills from roadmapData
  const availableSkills = Object.values(roadmapData).reduce((acc, roadmap) => {
    roadmap.nodes.forEach((node) => {
      if (node.concepts) {
        node.concepts.forEach((concept) => {
          if (!acc.includes(concept)) acc.push(concept);
        });
      }
    });
    return acc;
  }, []);

  // Extract all roadmaps domains
  const availableRoadmaps = Object.entries(roadmapData).map(([key, value]) => ({
    key,
    title: value.title,
  }));

  // Extract all available projects
  const availableProjects = projectsData.map((p) => ({
    id: p.id,
    title: p.title,
  }));

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const githubParam = params.get('github');
    if (githubParam) {
      setGhUsername(githubParam);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const loadControllerRef = useRef(null);
  const loadGenRef = useRef(0);

  const handleLoadConfig = async () => {
    if (!username || username.length < 3) return;
    setErrorMsg('');
    setSuccessMsg('');

    const gen = ++loadGenRef.current;
    loadControllerRef.current?.abort();
    const controller = new AbortController();
    loadControllerRef.current = controller;

    try {
      const base = getApiBase();
      const query = passkey ? `?passkey=${encodeURIComponent(passkey)}` : '';
      const url = base
        ? `${base}/api/portfolio/${username}${query}`
        : `/api/portfolio/${username}${query}`;
      const data = await apiClient(url, { signal: controller.signal });
      if (gen !== loadGenRef.current) return;
      if (data) {
        setTitle(data.title || '');
        setBio(data.bio || '');
        setTheme(data.theme || 'glassmorphic');
        setIsPublic(data.isPublic !== false);
        setCustomization(data.customization || customization);
        setCustomDomain(data.customDomain || '');
        setVisibleSections(
          data.visibleSections
            ? {
                ...data.visibleSections,
                skillsAndQuests:
                  data.visibleSections.skillsAndQuests ?? data.visibleSections.quests ?? true,
              }
            : { skillsAndQuests: true, roadmaps: true, projects: true }
        );
        setSocialLinks(data.socialLinks || { github: '', linkedin: '', twitter: '', resume: '' });
        setSeoMetadata(data.seoMetadata || { title: '', description: '' });
        setGhUsername(data.githubUsername || '');
        setSelectedSkills(data.skills || []);
        setSelectedRoadmaps(data.roadmaps || []);
        setSelectedProjects(data.projects || []);
        setCustomProjects(data.customProjects || []);
        setWorkExperience(data.workExperience || []);
        setSuccessMsg('Existing portfolio configuration found and loaded!');
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      if (gen !== loadGenRef.current) return;
      if (err.status === 404) {
        return;
      }
      setErrorMsg(
        err.message || 'Failed to load portfolio. Please check your connection and try again.'
      );
    }
  };

  const handleSave = async (e) => {
    if (isSaving) return;
    e.preventDefault();
    if (!username || username.length < 3) {
      setErrorMsg('Username must be at least 3 characters long.');
      return;
    }
    if (!passkey || passkey.length < 4) {
      setErrorMsg('Passkey must be at least 4 characters long.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setIsSaving(true);

    try {
      const payload = {
        username,
        passkey,
        title,
        bio,
        isPublic,
        theme,
        customization,
        customDomain,
        visibleSections,
        socialLinks,
        seoMetadata,
        skills: selectedSkills,
        roadmaps: selectedRoadmaps,
        projects: selectedProjects,
        customProjects,
        workExperience,
        githubUsername: ghUsername.trim() || undefined,
      };

      const base = getApiBase();
      const url = base ? `${base}/api/portfolio` : `/api/portfolio`;

      await apiClient(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      setSuccessMsg('Portfolio built and synchronized successfully!');
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSkill = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const toggleRoadmap = (roadmapKey) => {
    setSelectedRoadmaps((prev) =>
      prev.includes(roadmapKey) ? prev.filter((r) => r !== roadmapKey) : [...prev, roadmapKey]
    );
  };

  const toggleProject = (projectId) => {
    setSelectedProjects((prev) =>
      prev.includes(projectId) ? prev.filter((p) => p !== projectId) : [...prev, projectId]
    );
  };

  const ghControllerRef = useRef(null);

  const fetchGithubRepos = async () => {
    if (!ghUsername) return;
    if (isFetchingGh) return;

    const validUsername = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(
      ghUsername.trim()
    );
    if (!validUsername) {
      setGhError(
        'Invalid GitHub username format. Usernames can only contain letters, numbers, and hyphens.'
      );
      return;
    }

    if (ghControllerRef.current) {
      ghControllerRef.current.abort();
    }
    const controller = new AbortController();
    ghControllerRef.current = controller;

    setIsFetchingGh(true);
    setGhError('');
    try {
      const response = await fetch(buildGithubReposUrl(ghUsername), { signal: controller.signal });

      if (response.status === 403 || response.status === 429) {
        let errorDetail = {};
        try {
          errorDetail = await response.json();
        } catch {
          // Keep default rate-limit message below.
        }
        const resetTime = errorDetail.rateLimitReset
          ? new Date(errorDetail.rateLimitReset).toLocaleTimeString()
          : 'soon';
        setGhError(
          `GitHub rate limit reached. Too many requests from this network. Please try again after ${resetTime}.`
        );
        return;
      }

      if (response.status === 404) {
        setGhError(
          `GitHub user "${ghUsername.trim()}" not found. Please check the username and try again.`
        );
        return;
      }

      if (!response.ok) {
        let errorDetail = {};
        try {
          errorDetail = await response.json();
        } catch {
          // Keep fallback message below.
        }
        setGhError(
          errorDetail.error || `GitHub API error: ${response.status} ${response.statusText}`
        );
        return;
      }

      const data = await response.json();
      const top5 = [...data].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 5);
      setGhRepos(top5);
      setGhFetchAttempted(true);
    } catch (err) {
      if (err.name === 'AbortError') return;
      setGhError('Failed to fetch repositories. Please check your connection and try again.');
    } finally {
      setIsFetchingGh(false);
    }
  };

  const toggleGithubRepo = (repo) => {
    setCustomProjects((prev) => {
      const exists = prev.find((p) => p.id === repo.id);
      if (exists) {
        return prev.filter((p) => p.id !== repo.id);
      } else {
        const customProj = {
          id: repo.id,
          title: repo.name,
          shortDesc: repo.description || 'GitHub Repository',
          category: 'Open Source',
          techStack: repo.language ? [repo.language] : [],
          github: repo.html_url,
          demo: repo.homepage || '#',
          stars: repo.stargazers_count,
          forks: repo.forks_count,
        };
        return [...prev, customProj];
      }
    });
  };

  const handleLinkedInSync = () => {
    const base = getApiBase();
    const width = 600;
    const height = 700;
    const left = window.innerWidth / 2 - width / 2;
    const top = window.innerHeight / 2 - height / 2;
    const url = base ? `${base}/api/portfolio/linkedin/auth` : `/api/portfolio/linkedin/auth`;

    window.open(url, 'LinkedInSync', `width=${width},height=${height},top=${top},left=${left}`);
  };

  React.useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === 'LINKEDIN_SUCCESS') {
        const payload = event.data.payload;
        setSuccessMsg('LinkedIn data imported successfully!');
        if (payload.socialLink) {
          setSocialLinks((prev) => ({ ...prev, linkedin: payload.socialLink }));
        }
        if (payload.skills && payload.skills.length > 0) {
          const newSkills = payload.skills.map((s) => s.name);
          setSelectedSkills((prev) => {
            const merged = new Set([...prev, ...newSkills]);
            return Array.from(merged);
          });
        }
        if (payload.workExperience) {
          setWorkExperience(payload.workExperience);
        }
      } else if (event.data?.type === 'LINKEDIN_ERROR') {
        setErrorMsg('LinkedIn Import Error: ' + event.data.payload);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const getPortfolioUrl = () => {
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    return `${base}/p/${encodeURIComponent(username)}`;
  };

  const handleCopyLink = () => {
    const url = getPortfolioUrl();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(
        () => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        },
        () => {
          fallbackCopy(url);
        }
      );
    } else {
      fallbackCopy(url);
    }
  };

  const fallbackCopy = (text) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setErrorMsg('Unable to copy link. Please copy it manually from the address bar.');
    }
    document.body.removeChild(textarea);
  };

  return (
    <div className="portfolio-builder-container">
      <div
        className="builder-header"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
      >
        <div>
          <h1 className="builder-title">Portfolio Builder</h1>
          <p className="builder-subtitle">
            Configure your professional showcase, connect external profiles, and customize widgets
          </p>
        </div>
        <button
          type="button"
          onClick={handleLinkedInSync}
          className="btn btn-outline"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px' }}
        >
          <span>LN</span> Import LinkedIn Profile
        </button>
      </div>

      <div className="builder-grid">
        {/* Form Panel */}
        <form onSubmit={handleSubmit} className="builder-form-panel">
          <div className="form-section">
            <h3 className="section-title">Showcase Profile Registry</h3>
            <div className="form-group">
              <label htmlFor="pf-username">Reserved Handle (Username)</label>
              <input
                id="pf-username"
                type="text"
                placeholder="e.g. johndoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="pf-title">Professional Title</label>
              <input
                id="pf-title"
                type="text"
                placeholder="e.g. Full Stack Architect"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="pf-bio">Creative Bio</label>
              <textarea
                id="pf-bio"
                placeholder="Brief description of your expertise, achievements, and goals..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Social Profiles */}
          <div className="form-section">
            <h3 className="section-title">Federated Social Handshakes</h3>
            {['github', 'linkedin', 'twitter', 'resume'].map((soc) => (
              <div className="form-group" key={soc}>
                <label style={{ textTransform: 'capitalize' }}>
                  {soc === 'resume' ? 'Resume URL' : `${soc} Link`}
                </label>
                <input
                  type="url"
                  placeholder={`https://${soc === 'resume' ? 'drive.google.com' : `${soc}.com`}/...`}
                  value={socialLinks[soc] || ''}
                  onChange={(e) => setSocialLinks((prev) => ({ ...prev, [soc]: e.target.value }))}
                />
              </div>
            ))}
          </div>

          {/* Widget Visibility */}
          <div className="form-section">
            <h3 className="section-title">Showcase Display Widgets</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label
                style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
              >
                <input
                  type="checkbox"
                  checked={visibleSections.skillsAndQuests}
                  onChange={(e) =>
                    setVisibleSections((prev) => ({
                      ...prev,
                      skillsAndQuests: e.target.checked,
                    }))
                  }
                />
                Skills & Quests Badge Panel
              </label>
              <label
                style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
              >
                <input
                  type="checkbox"
                  checked={visibleSections.roadmaps}
                  onChange={(e) =>
                    setVisibleSections((prev) => ({ ...prev, roadmaps: e.target.checked }))
                  }
                />
                Active Academic Learning Paths
              </label>
              <label
                style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
              >
                <input
                  type="checkbox"
                  checked={visibleSections.projects}
                  onChange={(e) =>
                    setVisibleSections((prev) => ({ ...prev, projects: e.target.checked }))
                  }
                />
                Federated Projects & Repositories
              </label>
            </div>
          </div>

          {/* Messages */}
          {errorMsg && (
            <div
              role="alert"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                padding: '12px',
                borderRadius: 'var(--r2)',
                fontWeight: 'bold',
              }}
            >
              ⚠️ {errorMsg}
            </div>
          )}

          {successMsg && (
            <div
              role="alert"
              style={{
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                color: '#22c55e',
                padding: '12px',
                borderRadius: 'var(--r2)',
                fontWeight: 'bold',
              }}
            >
              ✓ {successMsg}
            </div>
          )}

          {/* Builder Action Toolbar */}
          <div className="builder-actions">
            <button
              type="submit"
              disabled={isSaving}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '1.05rem',
                fontFamily: 'Orbitron, monospace',
                letterSpacing: '0.05em',
                fontWeight: 'bold',
                textTransform: 'uppercase',
              }}
            >
              {isSaving ? 'Synchronizing Workspace...' : 'Build & Publish Portfolio'}
            </button>

            {successMsg && username && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleCopyLink}
                  style={{ flex: 1, padding: '10px' }}
                >
                  {copied ? 'Copied Showcase Link!' : 'Copy Public URL'}
                </button>
                <a
                  href={`/p/${username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{
                    flex: 1,
                    padding: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  Open Showcase Page
                </a>
              </div>
            )}
          </div>
        </form>

        {/* Live Preview Panel */}
        <div className="preview-container">
          <span className="preview-badge">
            <span
              style={{
                display: 'inline-block',
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--c1b)',
                animation: 'pulse 1.5s infinite',
              }}
            ></span>
            Real-time Live Sandbox Preview
          </span>

          <div className="preview-frame">
            <div
              style={{ height: '100%', overflowY: 'auto', padding: '24px' }}
              className={`theme-${theme} portfolio-shell`}
            >
              <div
                className="portfolio-intro"
                style={{ flexDirection: 'column', textAlign: 'center', gap: '12px' }}
              >
                <img
                  loading="lazy"
                  src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${username || 'preview'}`}
                  alt="avatar"
                  className="portfolio-avatar"
                  style={{ width: '80px', height: '80px' }}
                />
                <div className="portfolio-bio-col">
                  <h2 className="portfolio-name" style={{ fontSize: '1.6rem', margin: 0 }}>
                    {username ? `@${username}` : 'Creative Developer'}
                  </h2>
                  <div
                    className="portfolio-title"
                    style={{ fontSize: '0.95rem', margin: '4px 0 8px 0' }}
                  >
                    {title || 'Tech Specialist & Builder'}
                  </div>
                  <p
                    className="portfolio-bio-text"
                    style={{
                      fontSize: '0.85rem',
                      lineHeight: '1.5',
                      margin: '0 auto',
                      maxWidth: '400px',
                    }}
                  >
                    {bio ||
                      'Define registry credentials and profiles inside the Builder on the left to see your stunning web portfolio render dynamically in this live preview frame.'}
                  </p>
                </div>
              </div>

              {/* Social Link Previews */}
              <div
                className="portfolio-socials"
                style={{ justifyContent: 'center', gap: '10px', margin: '14px 0' }}
              >
                {['github', 'linkedin', 'twitter', 'resume'].map((soc) => {
                  const url = socialLinks[soc];
                  if (!url) return null;
                  return (
                    <span
                      key={soc}
                      className="portfolio-social-btn"
                      style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}
                    >
                      {soc === 'github' && 'GH'}
                      {soc === 'linkedin' && 'LN'}
                      {soc === 'twitter' && 'X'}
                      {soc === 'resume' && 'CV'}
                    </span>
                  );
                })}
              </div>

              {/* Showcase list items */}
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}
              >
                {visibleSections.skillsAndQuests && selectedSkills.length > 0 && (
                  <div className="portfolio-panel" style={{ padding: '16px' }}>
                    <div
                      style={{
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        borderBottom: '1px solid var(--bdr2)',
                        paddingBottom: '6px',
                        marginBottom: '10px',
                      }}
                    >
                      ⚡ Certified Tech Capabilities
                    </div>
                    <div className="portfolio-pills-list">
                      {selectedSkills.map((sk) => (
                        <span
                          key={sk}
                          className="portfolio-pill"
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                        >
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {visibleSections.roadmaps && selectedRoadmaps.length > 0 && (
                  <div className="portfolio-panel" style={{ padding: '16px' }}>
                    <div
                      style={{
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        borderBottom: '1px solid var(--bdr2)',
                        paddingBottom: '6px',
                        marginBottom: '10px',
                      }}
                    >
                      📌 Active Academic Paths
                    </div>
                    <div className="portfolio-roadmaps-list" style={{ gap: '8px' }}>
                      {selectedRoadmaps.map((rm) => (
                        <div
                          key={rm}
                          className="portfolio-roadmap-card"
                          style={{ padding: '8px 12px' }}
                        >
                          <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                            {roadmapData[rm]?.title || rm}
                          </span>
                          <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>In Progress</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {visibleSections.projects && selectedProjects.length > 0 && (
                  <div className="portfolio-panel" style={{ padding: '16px' }}>
                    <div
                      style={{
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        borderBottom: '1px solid var(--bdr2)',
                        paddingBottom: '6px',
                        marginBottom: '10px',
                      }}
                    >
                      ⚙️ Federated Workspaces
                    </div>
                    <div className="portfolio-roadmaps-list" style={{ gap: '8px' }}>
                      {selectedProjects.map((proj) => {
                        const project = projectsData.find((p) => p.id === proj);
                        return (
                          <div
                            key={proj}
                            className="portfolio-roadmap-card"
                            style={{ padding: '8px 12px' }}
                          >
                            <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                              {project?.title || proj}
                            </span>
                            <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                              {project?.category || 'Community Project'}
                            </span>
                          </div>
                        );
                      })}
                      {customProjects.map((proj) => (
                        <div
                          key={proj.id}
                          className="portfolio-roadmap-card"
                          style={{ padding: '8px 12px' }}
                        >
                          <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                            {proj.title}
                          </span>
                          <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>GitHub Import</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
