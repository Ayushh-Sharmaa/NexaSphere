import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  ExternalLink,
  Monitor,
  Brain,
  Cloud,
  Smartphone,
  Shield,
  Book,
  FileText,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import { roadmapData } from '../../data/roadmapData';
import BookmarkButton from '../../components/common/BookmarkButton';
import RoadmapBuilder from '../../components/roadmaps/RoadmapBuilder';
import '../../styles/roadmaps.css';

const DOMAIN_ICONS = {
  webdev: Monitor,
  ai_ml: Brain,
  cloud: Cloud,
  android: Smartphone,
  cybersecurity: Shield,
};

const LEARNING_DETAILS_PANEL_ID = 'roadmap-learning-details-panel';

export default function RoadmapsPage({ onBack }) {
  const innerScrollRef = useRef(null);
  const [isBuilderActive, setIsBuilderActive] = useState(false);
  const [activeDomain, setActiveDomain] = useState('webdev');
  const [selectedNode, setSelectedNode] = useState(null);
  const panelRef = useRef(null);
  const nodeRefs = useRef({});

  // Ensure panel scroll resets to top when a new node is selected
  useEffect(() => {
    if (innerScrollRef.current) {
      innerScrollRef.current.scrollTop = 0;
    }
  }, [selectedNode]);

  const domainData = roadmapData[activeDomain];

  // Reset selected node when domain changes
  useEffect(() => {
    setSelectedNode(null);
  }, [activeDomain]);

  // Scroll page to top when domain changes (smooth scroll)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeDomain]);

  // Handle outside click to close the panel
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (selectedNode && panelRef.current && !panelRef.current.contains(e.target)) {
        // If clicked on a roadmap node, don't close (let the node handler do it)
        const isNodeClick = e.target.closest('.roadmap-node-capsule');
        if (!isNodeClick) {
          setSelectedNode(null);
        }
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [selectedNode]);

  // Keyboard navigation — dep array changed from [] to [selectedNode] to
  // match the outside-click handler and avoid a stale closure. Previously
  // the empty dep array caused a second redundant keydown listener to be
  // registered on mount that was never re-registered, while the correct
  // selectedNode-aware listener was already handled by the effect above.
  // Ensure panel scroll resets to top when a new node is selected
  useEffect(() => {
    if (panelRef.current) {
      const innerScroll = panelRef.current.querySelector('.panel-inner-scroll');
      if (innerScroll) {
        innerScroll.scrollTop = 0;
      }
    }
  }, [selectedNode]);

  const IconComponent = DOMAIN_ICONS[activeDomain] || Monitor;

  if (isBuilderActive) {
    return (
      <div className="roadmaps-page-container">
        <RoadmapBuilder onBack={() => setIsBuilderActive(false)} />
      </div>
    );
  }

  return (
    <div className="roadmaps-page-container">
      {/* Header */}
      <div className="roadmaps-header">
        <button
          onClick={onBack}
          className="btn btn-sm btn-outline back-btn"
          aria-label="Go back to Home"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="roadmaps-title">Learning Roadmaps</h1>
        <p className="roadmaps-subtitle">
          Step-by-step guidance, industry-vetted technologies, and premium learning materials
          selected by the NexaSphere team.
        </p>
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
          <button
            aria-label="Interactive element"
            onClick={() => setIsBuilderActive(true)}
            className="btn btn-primary flex items-center gap-2"
            style={{
              fontFamily: "'Orbitron', monospace",
              fontWeight: 800,
              letterSpacing: '0.05em',
              boxShadow: '0 0 20px rgba(230, 57, 70, 0.45)',
              textTransform: 'uppercase',
              fontSize: '0.85rem',
            }}
          >
            <Sparkles size={16} className="text-white animate-pulse" />
            Try Interactive Path Builder
          </button>
        </div>
      </div>

      {/* Domain Selectors */}
      <div className="domain-selectors" role="tablist" aria-label="Select tech stack domain">
        {Object.entries(roadmapData).map(([key, domain]) => {
          const KeyIcon = DOMAIN_ICONS[key] || Monitor;
          const isActive = activeDomain === key;
          return (
            <button
              aria-label="Interactive element"
              key={key}
              role="tab"
              aria-selected={isActive}
              aria-controls={`roadmap-panel-${key}`}
              className={`domain-card-tab ${isActive ? 'active' : ''}`}
              onClick={() => setActiveDomain(key)}
            >
              <div className="domain-card-icon-wrapper">
                <KeyIcon size={20} />
              </div>
              <span className="domain-card-label">{domain.title}</span>
            </button>
          );
        })}
      </div>

      {/* Main Roadmap Display Area */}
      <div className="roadmap-workspace" id={`roadmap-panel-${activeDomain}`}>
        {/* Domain Overview */}
        <div className="domain-overview-card">
          <div className="overview-header">
            <IconComponent size={24} className="overview-icon" />
            <h2 className="overview-title">{domainData.title} Path</h2>
          </div>
          <p className="overview-desc">{domainData.description}</p>
        </div>

        {/* Tree Container */}
        <div className="roadmap-tree-container">
          {/* Connecting SVG Path for Background Visuals */}
          <div className="roadmap-connecting-line-bg" aria-hidden="true">
            <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
              <defs>
                <linearGradient id="glowing-line" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="var(--c1)" />
                  <stop offset="100%" stopColor="var(--c2)" />
                </linearGradient>
              </defs>
              {/* Draw connections based on DOM layouts */}
              <line
                x1="50%"
                y1="20"
                x2="50%"
                y2="98%"
                stroke="url(#glowing-line)"
                strokeWidth="4"
                strokeDasharray="8 6"
              />
            </svg>
          </div>

          {/* Render Nodes sequentially */}
          <div className="roadmap-nodes-list">
            {domainData.nodes.map((node, index) => {
              const isSelected = selectedNode?.id === node.id;
              return (
                <div
                  key={node.id}
                  className="roadmap-node-row"
                  ref={(el) => (nodeRefs.current[node.id] = el)}
                >
                  {/* Step counter badge */}
                  <div className="step-counter" aria-hidden="true">
                    <span>{index + 1}</span>
                  </div>

                  {/* Intersecting node capsule */}
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedNode(isSelected ? null : node)}
                    className={`roadmap-node-capsule ${isSelected ? 'selected' : ''}`}
                    aria-label={`Step ${index + 1}: ${node.label}. Click to toggle learning details panel.`}
                    aria-expanded={isSelected}
                    aria-controls={LEARNING_DETAILS_PANEL_ID}
                  >
                    <div className="node-capsule-glow" />
                    <div className="node-capsule-content">
                      <span className="node-label">{node.label}</span>
                      <p className="node-short-desc">{node.description.substring(0, 75)}...</p>
                    </div>
                  </motion.button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dynamic Slide-Over Learning Panel */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            ref={panelRef}
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="learning-details-panel"
            id={LEARNING_DETAILS_PANEL_ID}
            role="dialog"
            aria-modal="true"
            aria-labelledby="panel-title"
          >
            {/* Panel Close trigger */}
            <button
              onClick={() => setSelectedNode(null)}
              className="panel-close-btn"
              aria-label="Close learning panel"
              style={{ marginRight: '40px' }} // Shift slightly left to make room for BookmarkButton
            >
              &times;
            </button>

            <BookmarkButton
              item={{
                id: `roadmap-${selectedNode.id}`,
                type: 'Roadmap',
                title: `${domainData.title}: ${selectedNode.label}`,
              }}
              style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 20 }}
            />

            <div className="panel-inner-scroll" ref={innerScrollRef}>
              {/* Header */}
              <div className="panel-header-section">
                <span className="panel-category-tag">{domainData.title} · Core Step</span>
                <h3 id="panel-title" className="panel-title">
                  {selectedNode.label}
                </h3>
                <p className="panel-desc">{selectedNode.description}</p>
              </div>

              {/* Core Concepts */}
              <div className="panel-section">
                <h4 className="panel-section-title">
                  <CheckCircle size={16} /> Key Concepts to Master
                </h4>
                <ul className="concepts-pill-list">
                  {selectedNode.concepts.map((concept, idx) => (
                    <li key={`concept-${selectedNode.id}-${idx}`} className="concept-badge-pill">
                      {concept}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Documentation */}
              <div className="panel-section">
                <h4 className="panel-section-title">
                  <FileText size={16} /> Official Documentation
                </h4>
                <a
                  aria-label="Interactive element"
                  href={selectedNode.docs}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="resource-card-link docs-link"
                >
                  <div className="resource-card-body">
                    <span className="resource-title">Official {selectedNode.label} Reference</span>
                    <span className="resource-desc">
                      Read standard documentations and technical specifications.
                    </span>
                  </div>
                  <ExternalLink size={16} className="card-arrow-icon" />
                </a>
              </div>

              {/* Free Tutorials */}
              <div className="panel-section">
                <h4 className="panel-section-title">
                  <BookOpen size={16} /> Recommended Tutorials
                </h4>
                <div className="resources-vertical-stack">
                  {selectedNode.tutorials.map((tutorial, idx) => (
                    <a
                      key={tutorial.url || `tutorial-${selectedNode.id}-${idx}`}
                      aria-label="Interactive element"
                      href={tutorial.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="resource-card-link tutorial-link"
                    >
                      <div className="resource-card-body">
                        <span className="resource-title">{tutorial.title}</span>
                        <span className="resource-desc">Free guided online video or course.</span>
                      </div>
                      <ExternalLink size={16} className="card-arrow-icon" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Practice Resources */}
              <div className="panel-section">
                <h4 className="panel-section-title">
                  <Book size={16} /> Hands-on Practice
                </h4>
                <div className="resources-vertical-stack">
                  {selectedNode.practice.map((item, idx) => (
                    <a
                      key={item.url || `practice-${selectedNode.id}-${idx}`}
                      aria-label="Interactive element"
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="resource-card-link practice-link"
                    >
                      <div className="resource-card-body">
                        <span className="resource-title">{item.title}</span>
                        <span className="resource-desc">
                          Interactive challenges, tests, and playgrounds.
                        </span>
                      </div>
                      <ExternalLink size={16} className="card-arrow-icon" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
