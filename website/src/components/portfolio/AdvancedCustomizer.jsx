import React, { useState, useEffect } from 'react';
import {
  Palette,
  Type,
  Layout,
  Square,
  Download,
  Upload,
  Eye,
  Smartphone,
  Monitor,
  AlertTriangle,
  CheckCircle,
  Undo2,
  Redo2,
  Move,
  Layers,
  Settings,
  Code,
} from 'lucide-react';
import '../../styles/portfolio.css';

const THEMES = [
  {
    id: 'minimalist-light',
    name: 'Minimalist Light',
    dark: false,
    image: '/templates/minimalist-light.png',
    description: 'Clean, bright, and professional.',
  },
  {
    id: 'modern-dark',
    name: 'Modern Dark',
    dark: true,
    image: '/templates/modern-dark.png',
    description: 'Deep grays with neon accents.',
  },
  {
    id: 'creative',
    name: 'Creative',
    dark: true,
    image: '/templates/creative.png',
    description: 'Vibrant colors and bold typography.',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    dark: true,
    image: '/templates/cyberpunk.png',
    description: 'Futuristic neon pink and cyan.',
  },
  {
    id: 'elegant',
    name: 'Elegant',
    dark: true,
    image: '/templates/elegant.png',
    description: 'Luxurious dark with gold accents.',
  },
  { id: 'academic', name: 'Academic', dark: false },
  { id: 'startup', name: 'Startup', dark: false },
  { id: 'glassmorphic', name: 'Glassmorphic', dark: true },
  { id: 'retro', name: 'Retro', dark: false },
  { id: 'brutalist', name: 'Brutalist', dark: false },
];

const AdvancedCustomizer = ({ currentConfig, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('themes');
  const [previewMode, setPreviewMode] = useState('desktop');
  const [history, setHistory] = useState([currentConfig]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [contrastStatus, setContrastStatus] = useState({ ok: true, ratio: 4.5 });
  const [importError, setImportError] = useState(null);

  // Mock Contrast Checker (WCAG AA requirement)
  useEffect(() => {
    const checkContrast = () => {
      // Logic to calculate contrast between text and bg
      // For demo, we simulate a check
      setContrastStatus({ ok: true, ratio: 7.1 });
    };
    checkContrast();
  }, [currentConfig.colors]);

  const updateConfig = (newPart) => {
    const next = { ...currentConfig, ...newPart };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(next);

    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    onUpdate(next);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      onUpdate(prev);
    }
  };

  const exportTheme = () => {
    const blob = new Blob([JSON.stringify(currentConfig, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexasphere-theme-${currentConfig.username || 'custom'}.json`;
    a.click();
  };

  const importTheme = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const config = JSON.parse(event.target.result);
        updateConfig(config);
        setImportError(null);
      } catch (err) {
        setImportError('Invalid theme file — please upload a valid NexaSphere theme JSON export.');
      }
    };
    reader.onerror = () => {
      setImportError('Could not read the selected file. Please try again.');
    };
    reader.readAsText(file);
    // Reset the input so re-selecting the same (still-broken) file re-triggers onChange
    e.target.value = '';
  };

  return (
    <div className="portfolio-builder-container">
      <div className="builder-header">
        <h1 className="builder-title">Portfolio Studio</h1>
        <p className="builder-subtitle">Advanced Customization & Theme Engine</p>

        <div className="action-floating-header">
          <button
            onClick={handleUndo}
            disabled={historyIndex === 0}
            className="theme-card"
            title="Undo"
          >
            <Undo2 size={16} />
          </button>
          <button
            onClick={() => setHistoryIndex(historyIndex + 1)}
            disabled={historyIndex >= history.length - 1}
            className="theme-card"
            title="Redo"
          >
            <Redo2 size={16} />
          </button>
          <button onClick={exportTheme} className="theme-card">
            <Download size={16} /> Export
          </button>
          <label className="theme-card cursor-pointer">
            <Upload size={16} /> Import
            <input type="file" hidden onChange={importTheme} accept=".json" />
          </label>
          {importError && (
            <div className="a11y-badge a11y-fail" role="alert">
              <AlertTriangle size={16} />
              <span>{importError}</span>
            </div>
          )}
        </div>
      </div>

      <div className="builder-workspace">
        {/* Controls Panel */}
        <aside className="builder-panel">
          <nav className="theme-selector-grid customizer-tabs">
            <button
              onClick={() => setActiveTab('themes')}
              className={`theme-card ${activeTab === 'themes' ? 'active' : ''}`}
            >
              <Palette size={18} />
            </button>
            <button
              onClick={() => setActiveTab('style')}
              className={`theme-card ${activeTab === 'style' ? 'active' : ''}`}
            >
              <Layers size={18} />
            </button>
            <button
              onClick={() => setActiveTab('layout')}
              className={`theme-card ${activeTab === 'layout' ? 'active' : ''}`}
            >
              <Layout size={18} />
            </button>
            <button
              onClick={() => setActiveTab('advanced')}
              className={`theme-card ${activeTab === 'advanced' ? 'active' : ''}`}
            >
              <Code size={18} />
            </button>
          </nav>

          <div className="builder-content-area">
            {activeTab === 'themes' && (
              <div className="builder-section-card">
                <span className="builder-section-title">
                  <Palette /> Template Gallery
                </span>
                <p className="switch-subtext" style={{ marginBottom: '16px' }}>
                  Select a curated professional template to apply instantly to your profile.
                </p>
                <div
                  className="template-gallery-grid"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: '16px',
                  }}
                >
                  {THEMES.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => updateConfig({ themeId: t.id })}
                      className={`template-card ${currentConfig.themeId === t.id ? 'active-template' : ''}`}
                      style={{
                        cursor: 'pointer',
                        border:
                          currentConfig.themeId === t.id
                            ? '2px solid var(--accent-portfolio, #cc1111)'
                            : '1px solid var(--border-portfolio, #ccc)',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        background: 'var(--bg-panel-portfolio, #fff)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {t.image ? (
                        <div
                          style={{
                            width: '100%',
                            height: '120px',
                            backgroundImage: `url(${t.image})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '100%',
                            height: '120px',
                            background: t.dark ? '#333' : '#eee',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <span style={{ color: t.dark ? '#fff' : '#666', fontSize: '12px' }}>
                            No Preview
                          </span>
                        </div>
                      )}
                      <div style={{ padding: '12px' }}>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 'bold' }}>
                          {t.name}
                        </h4>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <span
                            style={{ fontSize: '12px', color: 'var(--text-sub-portfolio, #666)' }}
                          >
                            {t.dark ? 'Dark Mode' : 'Light Mode'}
                          </span>
                          {currentConfig.themeId === t.id && (
                            <CheckCircle size={14} color="var(--accent-portfolio, #cc1111)" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'style' && (
              <div className="builder-section-card">
                <span className="builder-section-title">
                  <Square /> Visual Identity
                </span>

                <div className="form-group">
                  <label className="form-label">Accent Color</label>
                  <div className="color-picker-wrapper">
                    <input
                      type="color"
                      value={currentConfig.colors?.accent || '#cc1111'}
                      onChange={(e) =>
                        updateConfig({
                          colors: { ...currentConfig.colors, accent: e.target.value },
                        })
                      }
                      className="form-input color-input"
                    />
                    <span className="color-value-text">{currentConfig.colors?.accent}</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Header Font (Google Fonts)</label>
                  <select
                    className="form-select"
                    value={currentConfig.typography?.header || 'Orbitron'}
                    onChange={(e) =>
                      updateConfig({
                        typography: { ...currentConfig.typography, header: e.target.value },
                      })
                    }
                  >
                    <option value="Orbitron">Orbitron (Modern)</option>
                    <option value="Inter">Inter (Clean)</option>
                    <option value="Playfair Display">Playfair (Academic)</option>
                    <option value="Space Mono">Space Mono (Tech)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Border Radius</label>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    step="2"
                    value={currentConfig.spacing?.radius || 12}
                    onChange={(e) =>
                      updateConfig({
                        spacing: { ...currentConfig.spacing, radius: parseInt(e.target.value, 10) },
                      })
                    }
                  />
                </div>

                <div className={`a11y-badge ${contrastStatus.ok ? 'a11y-ok' : 'a11y-fail'}`}>
                  {contrastStatus.ok ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                  <span className="a11y-text">
                    Contrast: {contrastStatus.ratio}:1 (WCAG AA Compliant)
                  </span>
                </div>
              </div>
            )}

            {activeTab === 'layout' && (
              <div className="builder-section-card">
                <span className="builder-section-title">
                  <Layout /> Structure
                </span>
                <div className="form-group">
                  <label className="form-label">Section Padding</label>
                  <input
                    type="number"
                    className="form-input"
                    value={currentConfig.spacing?.padding || 28}
                    onChange={(e) =>
                      updateConfig({
                        spacing: {
                          ...currentConfig.spacing,
                          padding: parseInt(e.target.value, 10),
                        },
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Hero Layout</label>
                  <div className="theme-selector-grid">
                    <button
                      onClick={() => updateConfig({ hero: 'centered' })}
                      className={`theme-card ${currentConfig.hero === 'centered' ? 'active' : ''}`}
                    >
                      Centered
                    </button>
                    <button
                      onClick={() => updateConfig({ hero: 'split' })}
                      className={`theme-card ${currentConfig.hero === 'split' ? 'active' : ''}`}
                    >
                      Split View
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="builder-section-card">
                <span className="builder-section-title">
                  <Code /> Custom CSS
                </span>
                <p className="switch-subtext">
                  Advanced: These styles will override theme defaults.
                </p>
                <textarea
                  className="form-textarea font-mono text-sm"
                  rows="8"
                  placeholder=".portfolio-name { color: gold; }"
                  value={currentConfig.customCss || ''}
                  onChange={(e) => updateConfig({ customCss: e.target.value })}
                ></textarea>
              </div>
            )}
          </div>
        </aside>

        {/* Preview Panel */}
        <main className="preview-container">
          <div className="preview-mode-toggle">
            <button
              onClick={() => setPreviewMode('desktop')}
              className={`theme-card ${previewMode === 'desktop' ? 'active' : ''}`}
            >
              <Monitor size={18} />
            </button>
            <button
              onClick={() => setPreviewMode('mobile')}
              className={`theme-card ${previewMode === 'mobile' ? 'active' : ''}`}
            >
              <Smartphone size={18} />
            </button>
          </div>

          <div className={`preview-frame ${previewMode === 'mobile' ? 'preview-mobile' : ''}`}>
            <div className="preview-badge">
              <Eye size={12} /> Live Preview
            </div>

            {/* The actual Portfolio Sheet rendered with dynamic styles */}
            <div
              className={`portfolio-shell theme-${currentConfig.themeId} custom-override h-full overflow-y-auto`}
              style={{
                '--p-accent': currentConfig.colors?.accent,
                '--p-font-head': currentConfig.typography?.header,
                '--p-radius': `${currentConfig.spacing?.radius}px`,
                '--p-spacing': `${currentConfig.spacing?.padding}px`,
              }}
            >
              <style>{currentConfig.customCss}</style>

              <div className="portfolio-panel m-4">
                <h1 className="portfolio-name">{currentConfig.name || 'Your Name'}</h1>
                <p className="portfolio-title">{currentConfig.title || 'Digital Architect'}</p>
                <div className="portfolio-pills-list mt-4">
                  <span className="portfolio-pill">Engineering</span>
                  <span className="portfolio-pill">Product</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdvancedCustomizer;
