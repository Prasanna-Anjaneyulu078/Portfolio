import React, { useState } from 'react';
import ProjectModal from './ProjectModal';
import './Projects.css';

const Projects = ({ projects = [] }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedProject, setSelectedProject] = useState(null);

  if (!projects || projects.length === 0) {
    return null;
  }

  // Ensure strictly max 3 featured projects are displayed
  const featuredProjectsList = (projects || []).slice(0, 3);

  // Derive categories dynamically from featured projects plus 'All'
  const categories = ['All', ...new Set(featuredProjectsList.map((p) => p.category).filter(Boolean))];

  const filteredProjects = selectedCategory === 'All'
    ? featuredProjectsList
    : featuredProjectsList.filter((p) => p.category === selectedCategory);

  const getTechStackBadges = (techStack) => {
    let list = [];
    if (Array.isArray(techStack)) {
      list = techStack;
    } else if (typeof techStack === 'string') {
      list = techStack.split(',').map((t) => t.trim());
    }
    // Return max 3 to 5 tech badges per card requirement
    return list.slice(0, 4);
  };

  return (
    <section id="projects" className="projects-section">
      <div className="container">
        <div className="projects-intro">
          <div>
            <div className="badge-emphasis">
              Featured Work
            </div>
            <h2 className="section-title">
              Featured Projects
            </h2>
            <p className="section-subtitle">
              A selection of technical projects demonstrating practical software engineering and problem-solving skills.
            </p>
          </div>

          {categories.length > 2 && (
            <div className="filter-bar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`filter-btn ${selectedCategory === cat ? 'active' : ''}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="projects-grid">
          {filteredProjects.map((project, idx) => {
            const techBadges = getTechStackBadges(project.techStack);
            const imageSrc = project.imageUrl || project.image;

            return (
              <div
                key={project._id || idx}
                className="project-card"
                onClick={() => setSelectedProject(project)}
              >
                <div className="project-preview">
                  <span className="category-badge">{project.category || 'Project'}</span>
                  {imageSrc ? (
                    <img
                      src={imageSrc}
                      alt={project.title || 'Project preview'}
                      className="project-image"
                      loading="lazy"
                    />
                  ) : (
                    <div className="project-image-fallback">
                      <span className="material-symbols-outlined">devices</span>
                    </div>
                  )}
                </div>

                <div className="project-details">
                  <h3 className="project-name">{project.title}</h3>

                  {techBadges.length > 0 && (
                    <div className="project-tech-badges">
                      {techBadges.map((tech, i) => (
                        <span key={i} className="tech-badge">
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="project-desc-clamped">{project.description}</p>

                  <div
                    className="project-card-actions"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {project.codeUrl ? (
                      <a
                        className="action-btn btn-code"
                        href={project.codeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span className="material-symbols-outlined">code</span> GitHub
                      </a>
                    ) : (
                      <button
                        className="action-btn btn-code"
                        onClick={() => setSelectedProject(project)}
                      >
                        Details
                      </button>
                    )}

                    {project.demoUrl ? (
                      <a
                        className="action-btn btn-demo"
                        href={project.demoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span className="material-symbols-outlined">rocket_launch</span> Live Demo
                      </a>
                    ) : (
                      <button
                        className="action-btn btn-demo"
                        onClick={() => setSelectedProject(project)}
                      >
                        View More
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Project Details Modal */}
      {selectedProject && (
        <ProjectModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </section>
  );
};

export default Projects;
