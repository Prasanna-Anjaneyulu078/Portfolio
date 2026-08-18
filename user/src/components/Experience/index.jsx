import React from 'react';
import './Experience.css';

const Experience = ({ experiences = [] }) => {
  // Dynamic Experience Show/Hide Logic:
  // experiences.length === 0 -> return null (no section markup, no empty spacing)
  if (!experiences || experiences.length === 0) {
    return null;
  }

  return (
    <section id="experience" className="experience-section">
      <div className="container">
        <div className="section-title-wrapper">
          <div className="badge-emphasis">
            Career Track
          </div>
          <h2 className="section-title">
            Professional Experience
          </h2>
          <p className="section-subtitle">
            Demonstrated background in engineering software solutions, participating in team deliverables, and building web applications.
          </p>
        </div>

        <div className="experience-timeline">
          {experiences.map((exp, idx) => {
            const roleTitle = exp.jobTitle || exp.role || exp.title;
            const companyName = exp.company || exp.companyName;
            const isCurrent = exp.isCurrent || exp.current;

            const techList = Array.isArray(exp.technologies)
              ? exp.technologies
              : typeof exp.technologies === 'string'
              ? exp.technologies.split(',').map((t) => t.trim())
              : Array.isArray(exp.techStack)
              ? exp.techStack
              : [];

            const respList = Array.isArray(exp.responsibilities)
              ? exp.responsibilities
              : typeof exp.responsibilities === 'string'
              ? exp.responsibilities.split('\n').filter(Boolean)
              : [];

            return (
              <div key={exp._id || idx} className="experience-item">
                <div className="experience-dot"></div>
                <div className="experience-card">
                  <div className="experience-header">
                    <div>
                      {roleTitle && <h3 className="job-title">{roleTitle}</h3>}
                      {companyName && (
                        <div className="company-name">
                          <span className="material-symbols-outlined">apartment</span>
                          {companyName}
                        </div>
                      )}
                    </div>

                    <div className="experience-meta">
                      {(exp.startDate || exp.endDate || isCurrent) && (
                        <span className={`date-badge ${isCurrent ? 'current-badge' : ''}`}>
                          {exp.startDate ? `${exp.startDate} - ` : ''}
                          {isCurrent ? 'Present' : exp.endDate || ''}
                        </span>
                      )}

                      {exp.location && (
                        <span className="location-tag">
                          <span className="material-symbols-outlined">location_on</span>
                          {exp.location}
                        </span>
                      )}
                    </div>
                  </div>

                  {exp.description && (
                    <p className="experience-desc">{exp.description}</p>
                  )}

                  {respList.length > 0 && (
                    <ul className="responsibilities-list">
                      {respList.map((resp, i) => (
                        <li key={i} className="responsibility-item">
                          {resp}
                        </li>
                      ))}
                    </ul>
                  )}

                  {techList.length > 0 && (
                    <div className="tech-used-group">
                      <span className="tech-used-label">Stack:</span>
                      {techList.map((tech, i) => (
                        <span key={i} className="tech-chip">
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Experience;
