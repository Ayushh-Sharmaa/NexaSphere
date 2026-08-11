import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { projectsData } from '../../data/projectsData';
import SafeImage from '../../shared/SafeImage';
import { ProjectCardSkeleton } from '../../components/ui/skeleton/ProjectCardSkeleton';
import ProjectCard from '../../components/projects/ProjectCard';

const ProjectDetailModal = lazy(() => import('../../components/projects/ProjectDetailModal'));
import '../../styles/projects.css';

const CATEGORIES = [
  'All',
  'Web App',
  'Mobile',
  'Machine Learning',
  'Cybersecurity',
  'UI/UX Design',
];

export default function ProjectsPage({ onBack, loading = false }) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedProject, setSelectedProject] = useState(null);
  const triggerRef = useRef(null);

  // Filter projects based on category
  const filteredProjects =
    activeCategory === 'All'
      ? projectsData
      : projectsData.filter((project) => project.category === activeCategory);

  // Store selectedProject in a ref so the keydown handler can read
  // the current value without being re-registered on every selection
  // change — avoids listener churn when switching between projects.
  const selectedProjectRef = useRef(selectedProject);
  useEffect(() => {
    selectedProjectRef.current = selectedProject;
  }, [selectedProject]);

  // Escape key — registered once on mount, reads from ref.
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedProjectRef.current) {
        setSelectedProject(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Lock body scroll when modal is open.
  // Uses a simple lock/unlock rather than capturing originalOverflow —
  // the captured value approach caused a brief scrollable window when
  // switching directly from one project to another since cleanup ran
  // before the new lock was applied.
  useEffect(() => {
    if (!selectedProject && triggerRef.current?.focus) {
      triggerRef.current.focus();
    }
  }, [selectedProject]);
  useEffect(() => {
    if (selectedProject) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedProject]);

  return (
    <div className="projects-page-container">
      {/* Header section */}
      <div className="projects-header">
        <button className="btn btn-outline back-btn" onClick={onBack} aria-label="Go back to Home">
          ← Back to Home
        </button>
        <h1 className="projects-title">Project Showcase</h1>
        <p className="projects-subtitle">
          Discover the innovative solutions built by the NexaSphere community.
        </p>
      </div>

      {/* Category Filters */}
      <div className="category-filters" role="tablist" aria-label="Project Categories">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            role="tab"
            aria-selected={activeCategory === category}
            className={`filter-pill ${activeCategory === category ? 'active' : ''}`}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Projects Gallery Grid */}
      <motion.div layout className="projects-grid">
        {loading ? (
          <ProjectCardSkeleton count={6} />
        ) : (
          <>
            <AnimatePresence>
              {filteredProjects.map((project) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  key={project.id}
                  className="project-card"
                  onClick={(e) => {
                    triggerRef.current = e.currentTarget;
                    setSelectedProject(project);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      triggerRef.current = e.currentTarget;
                      setSelectedProject(project);
                    }
                  }}
                  aria-label={`View details for ${project.title}`}
                >
                  <div className="project-card-image">
                    <SafeImage
                      src={project.image}
                      alt={project.title}
                      loading="lazy"
                      fallbackType="project"
                    />
                    <div className="project-card-overlay">
                      <span className="view-details-text">View Details</span>
                    </div>
                  </div>
                  <div className="project-card-content">
                    <span className="project-category">{project.category}</span>
                    <h3 className="project-card-title">{project.title}</h3>
                    <p className="project-card-desc">{project.shortDesc}</p>
                    <div className="project-tech-stack">
                      {project.techStack.slice(0, 3).map((tech) => (
                        <span key={tech} className="tech-pill">
                          {tech}
                        </span>
                      ))}
                      {project.techStack.length > 3 && (
                        <span className="tech-pill">+{project.techStack.length - 3}</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {filteredProjects.length === 0 && (
              <div className="no-projects-msg">
                <p>No projects found in this category.</p>
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* Project Details Modal */}
      <AnimatePresence>
        {selectedProject && typeof document !== 'undefined'
          ? createPortal(
              <div
                className="modal-overlay projects-modal-overlay"
                onClick={() => setSelectedProject(null)}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
              >
                <Suspense fallback={<div className="modal-box project-modal" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>Loading...</div>}>
                  <ProjectDetailModal selectedProject={selectedProject} onClose={() => setSelectedProject(null)} />
                </Suspense>
              </div>,
              document.body
            )
          : null}
      </AnimatePresence>
    </div>
  );
}
