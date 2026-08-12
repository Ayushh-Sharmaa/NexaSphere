import React, { memo } from 'react';
import { motion } from 'framer-motion';
import SafeImage from '../../shared/SafeImage';

const ProjectCard = memo(({ project, onClick, triggerRef }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="project-card"
      onClick={(e) => {
        if (triggerRef) triggerRef.current = e.currentTarget;
        onClick(project);
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          if (triggerRef) triggerRef.current = e.currentTarget;
          onClick(project);
        }
      }}
      aria-label={`View details for ${project.title}`}
    >
      <div className="project-card-image">
        <SafeImage src={project.image} alt={project.title} loading="lazy" fallbackType="project" />
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
  );
});

ProjectCard.displayName = 'ProjectCard';

export default ProjectCard;
