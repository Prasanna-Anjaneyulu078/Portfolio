import React from 'react';
import SectionHeader from '../SectionHeader';
import './Experience.css';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const cleaned = dateStr.trim();
  if (/^\d{4}-\d{2}(-\d{2})?$/.test(cleaned)) {
    const parts = cleaned.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parts[2] ? parseInt(parts[2], 10) : 1;
    const dateObj = new Date(year, month, day);
    return dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
  return cleaned;
};

const extractTechList = (exp) => {
  const rawTech = exp.technologies || exp.techStack || exp.tech || exp.tags || exp.skills || [];
  if (Array.isArray(rawTech)) {
    return rawTech
      .flatMap(item => typeof item === 'string' ? item.split(',') : (item?.name || item?.label || String(item)))
      .map(t => typeof t === 'string' ? t.trim() : '')
      .filter(Boolean);
  }
  if (typeof rawTech === 'string') {
    return rawTech.split(',').map(t => t.trim()).filter(Boolean);
  }
  return [];
};

const Experience = ({ experiences = [] }) => {
  // If no database experience records exist, return null to completely hide section
  if (!Array.isArray(experiences) || experiences.length === 0) {
    return null;
  }

  // Sort experiences: Ongoing first, then by startDate DESC
  const sortedExperiences = [...experiences].sort((a, b) => {
    const aOngoing = Boolean(a.currentlyWorking || a.isCurrentlyWorking || a.isCurrent || a.current);
    const bOngoing = Boolean(b.currentlyWorking || b.isCurrentlyWorking || b.isCurrent || b.current);

    if (aOngoing && !bOngoing) return -1;
    if (!aOngoing && bOngoing) return 1;

    const dateA = new Date(a.startDate || 0).getTime();
    const dateB = new Date(b.startDate || 0).getTime();
    return dateB - dateA;
  });

  return (
    <section id="experience" className="experience-section">
      <div className="container">
        <SectionHeader title="Experience" />

        <div className="experience-timeline-wrapper">
          {sortedExperiences.map((exp, idx) => {
            const roleTitle = exp.jobTitle || exp.role || exp.title;
            const companyName = exp.company || exp.organization || exp.companyName;
            const isOngoing = Boolean(exp.currentlyWorking || exp.isCurrentlyWorking || exp.isCurrent || exp.current);

            const startStr = formatDate(exp.startDate);
            const endStr = isOngoing ? 'Present' : formatDate(exp.endDate);
            const dateRangeText = startStr && endStr ? `${startStr} — ${endStr}` : (startStr || endStr);

            const metaDetails = [
              exp.employmentType,
              exp.location
            ].filter(Boolean).join(' · ');

            const techList = extractTechList(exp);

            const responsibilities = Array.isArray(exp.responsibilities)
              ? exp.responsibilities
              : typeof exp.responsibilities === 'string'
              ? exp.responsibilities.split('\n').map((r) => r.trim()).filter(Boolean)
              : [];

            return (
              <div key={exp._id || idx} className="experience-timeline-node">
                {/* Timeline Axis Line and Dot */}
                <div className="timeline-axis">
                  <div className="timeline-dot">
                    <span className="dot-inner"></span>
                  </div>
                  {idx < sortedExperiences.length - 1 && <div className="timeline-connector"></div>}
                </div>

                {/* Timeline Experience Content Card */}
                <div className="experience-content-card">
                  <div className="card-top-bar">
                    <div className="job-company-group">
                      {roleTitle && <h3 className="job-title-primary">{roleTitle}</h3>}
                      {companyName && <h4 className="company-name-sub">{companyName}</h4>}
                    </div>

                    <div className="date-status-pill">
                      {isOngoing && <span className="ongoing-tag">● Ongoing</span>}
                      {dateRangeText && <span className="duration-text">{dateRangeText}</span>}
                    </div>
                  </div>

                  {metaDetails && (
                    <div className="exp-meta-line">
                      {metaDetails}
                    </div>
                  )}

                  {exp.description && (
                    <p className="exp-description-text">{exp.description}</p>
                  )}

                  {responsibilities.length > 0 && (
                    <ul className="exp-responsibilities-list">
                      {responsibilities.map((resp, rIdx) => (
                        <li key={rIdx}>{resp}</li>
                      ))}
                    </ul>
                  )}

                  {techList.length > 0 && (
                    <div className="exp-tech-chips">
                      {techList.map((tech, tIdx) => (
                        <span key={tIdx} className="tech-chip-item">
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
