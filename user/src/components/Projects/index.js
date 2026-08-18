import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Projects.css';

const API_URL = 'https://prasanna-portfolio-admin.vercel.app/api/projects';

const Projects = () => {
  const [filter, setFilter] = useState('All');
  const [showAll, setShowAll] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const categories = ['All', 'Full Stack', 'Front End'];

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const response = await axios.get(API_URL, {
          params: { category: filter === 'All' ? undefined : filter }
        });
        setProjects(response.data);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [filter]);

  const displayedProjects = showAll ? projects : projects.slice(0, 3);

  const handleFilterChange = (cat) => {
    setFilter(cat);
    setShowAll(false);
  };

  return (
    <section id="projects" className="projects-section">
      <div className="container">
        {/* Header Section */}
        <div className="projects-intro">
          <div className="intro-text">
            <h2 className="projects-title">Featured Work</h2>
            <p className="projects-subtitle">
              A curated selection of technical contributions, ranging from 
              distributed systems to interactive user interfaces.
            </p>
          </div>
          <div className="filter-bar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleFilterChange(cat)}
                className={`filter-btn ${filter === cat ? 'active' : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Content Area with Stable Height */}
        <div className="projects-list-container">
          {loading ? (
            <div className="loading-container" role="status" aria-label="Loading projects">
              <div className="loading-spinner"></div>
              <p className="loading-text">Loading Projects...</p>
            </div>
          ) : projects.length > 0 ? (
            <div className="projects-list">
              {displayedProjects.map((project, idx) => (
                <div key={project._id || idx} className="project-card animate-in">
                  <div className="project-preview">
                    <div className="category-badge">{project.category}</div>
                    <img 
                      src={project.image || project.imageUrl || null} 
                      alt={project.title || 'Project Image'} 
                      className="project-image"
                      loading="lazy"
                    />
                    <div className="image-overlay"></div>
                  </div>

                  <div className="project-details">
                    <div className="project-header">
                      <h3 className="project-name">{project.title}</h3>
                      <div className="project-stack-group">
                        {Array.isArray(project.techStack) 
                          ? project.techStack.map((item, i) => (
                              <span key={i} className="project-stack-tag">{item}</span>
                            ))
                          : (project.techStack || project.stack)?.split(',').map((item, i) => (
                              <span key={i} className="project-stack-tag">{item.trim()}</span>
                            ))
                        }
                      </div>
                    </div>

                    <p className="project-desc">{project.description}</p>
                    
                    <div className="project-tech-section">
                      <div className="project-tags">
                        {project.tags?.map(tag => (
                          <span key={tag} className="tag-item">{tag}</span>
                        ))}
                      </div>
                    </div>

                    <div className="project-card-actions">
                      <a className="action-btn btn-code" href={project.codeUrl} target="_blank" rel="noopener noreferrer">
                        <span className="material-symbols-outlined">code</span> Source
                      </a>
                      <a className="action-btn btn-demo" href={project.demoUrl} target="_blank" rel="noopener noreferrer">
                        <span className="material-symbols-outlined">rocket_launch</span> Demo
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-projects">
              <span className="material-symbols-outlined no-projects-icon">inventory_2</span>
              <p>No projects found in the "{filter}" category.</p>
              <button className="reset-filter-btn" onClick={() => setFilter('All')}>
                View All Projects
              </button>
            </div>
          )}
        </div>

        {/* View All Button */}
        {!loading && projects.length > 3 && (
          <div className="view-all-container">
            <button className="view-all-btn" onClick={() => setShowAll(!showAll)}>
              {showAll ? 'Collapse' : 'View All Projects'}
              <span className="material-symbols-outlined">
                {showAll ? 'expand_less' : 'expand_more'}
              </span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default Projects;
