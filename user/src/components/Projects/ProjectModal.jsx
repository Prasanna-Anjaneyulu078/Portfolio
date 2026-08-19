import React from 'react';
import { resolveAssetUrl } from '../../config/api';

const ProjectModal = ({ project, onClose }) => {
  if (!project) return null;

  const techList = Array.isArray(project.techStack) && project.techStack.length > 0
    ? project.techStack
    : typeof project.techStack === 'string' && project.techStack.trim().length > 0
    ? project.techStack.split(',').map((t) => t.trim())
    : [];

  const highlights = Array.isArray(project.highlights) && project.highlights.length > 0
    ? project.highlights
    : Array.isArray(project.tags) && project.tags.length > 0
    ? project.tags
    : [];

  return (
    <div className="project-modal-backdrop" onClick={onClose}>
      <div className="project-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="modal-header-img">
          {project.imageUrl || project.image ? (
            <img
              src={resolveAssetUrl(project.imageUrl || project.image)}
              alt={project.title}
              className="modal-img"
            />
          ) : (
            <div className="modal-img-fallback">
              <span className="material-symbols-outlined">laptop</span>
            </div>
          )}
        </div>

        <div className="modal-body">
          <div className="modal-badge">{project.badge || project.category || 'Project'}</div>
          <h2 className="modal-title">{project.title}</h2>

          <p className="modal-description">{project.description}</p>

          {project.workflow && project.workflow.length > 0 && (
            <div className="workflow-container" style={{ marginBottom: '1.25rem' }}>
              <span className="workflow-label">Pipeline Workflow:</span>
              <div className="workflow-steps">
                {project.workflow.map((step, sIdx) => (
                  <React.Fragment key={sIdx}>
                    <span className="workflow-step">{step}</span>
                    {sIdx < project.workflow.length - 1 && (
                      <span className="workflow-arrow">→</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {techList.length > 0 && (
            <div className="modal-tech-group">
              <h4 className="modal-section-label">Technologies Used</h4>
              <div className="modal-tags">
                {techList.map((tech, idx) => (
                  <span key={idx} className="modal-tag">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {highlights.length > 0 && (
            <div className="modal-tags-group">
              <h4 className="modal-section-label">Key Highlights & Features</h4>
              <div className="modal-tags">
                {highlights.map((tag, idx) => (
                  <span key={idx} className="modal-tag tag-feature">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="modal-actions">
            {project.codeUrl && (
              <a
                href={project.codeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="cta-btn secondary-cta"
              >
                GitHub Source ↗
              </a>
            )}
            {project.demoUrl && (
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="cta-btn primary-cta"
              >
                Live Demo ↗
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectModal;

