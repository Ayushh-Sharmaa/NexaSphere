import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Code, ExternalLink, X, Tag, Users } from 'lucide-react';
import SafeImage from '../../shared/SafeImage';

const ProjectDetailModal = memo(({ selectedProject, onClose }) => {
  return (
    <div
      className="modal-overlay projects-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="modal-box project-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="Close modal"
          autoFocus
        >
          <X size={20} />
        </button>

        <SafeImage
          src={selectedProject.image}
          alt={selectedProject.title}
          className="project-modal-image"
          fallbackType="project"
        />

        <div className="project-modal-content">
          <div className="project-modal-header">
            <div>
              <span className="project-category">{selectedProject.category}</span>
              <h2 id="modal-title" className="project-modal-title">
                {selectedProject.title}
              </h2>
            </div>
            <div className="project-modal-actions">
              {selectedProject.github && (
                <a
                  href={selectedProject.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline"
                >
                  <Code size={16} style={{ marginRight: '6px' }} />
                  Source
                </a>
              )}
              {selectedProject.liveDemo && (
                <a
                  href={selectedProject.liveDemo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  <ExternalLink size={16} style={{ marginRight: '6px' }} />
                  Live Demo
                </a>
              )}
            </div>
          </div>

          <div className="project-modal-body">
            <div className="project-modal-main">
              <h3>About this Project</h3>
              <p>{selectedProject.fullDesc || selectedProject.shortDesc}</p>
              
              <h3>Features</h3>
              <ul>
                {selectedProject.features ? (
                  selectedProject.features.map((feature, idx) => <li key={idx}>{feature}</li>)
                ) : (
                  <li>Innovative solution to complex problems</li>
                )}
              </ul>
            </div>

            <div className="project-modal-sidebar">
              <div className="sidebar-section">
                <h4>
                  <Tag size={16} style={{ marginRight: '6px' }} /> Technologies
                </h4>
                <div className="project-tech-stack">
                  {selectedProject.techStack.map((tech) => (
                    <span key={tech} className="tech-pill">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="sidebar-section">
                <h4>
                  <Users size={16} style={{ marginRight: '6px' }} /> Contributors
                </h4>
                <div className="contributors-list">
                  {selectedProject.contributors ? (
                    selectedProject.contributors.map((c) => (
                      <div key={c.name || c} className="contributor">
                        {c.name || c}
                      </div>
                    ))
                  ) : (
                    <div className="contributor">Community Members</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
});

ProjectDetailModal.displayName = 'ProjectDetailModal';

export default ProjectDetailModal;
