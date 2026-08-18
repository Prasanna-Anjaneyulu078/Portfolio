import React from 'react';

const ProjectModal = ({ project, onClose }) => {
  if (!project) return null;

  const techList = Array.isArray(project.techStack)
    ? project.techStack
    : typeof project.techStack === 'string'
    ? project.techStack.split(',').map((t) => t.trim())
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
              src={project.imageUrl || project.image}
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
          <div className="modal-badge">{project.category || 'Project'}</div>
          <h2 className="modal-title">{project.title}</h2>

          <p className="modal-description">{project.description}</p>

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

          {project.tags && project.tags.length > 0 && (
            <div className="modal-tags-group">
              <h4 className="modal-section-label">Features & Concepts</h4>
              <div className="modal-tags">
                {project.tags.map((tag, idx) => (
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
                className="btn-primary"
              >
                <span className="material-symbols-outlined">code</span>
                GitHub Source
              </a>
            )}
            {project.demoUrl && (
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline"
              >
                <span className="material-symbols-outlined">rocket_launch</span>
                Live Demo
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectModal;
