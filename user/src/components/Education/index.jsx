import React from 'react';
import SectionHeader from '../SectionHeader';
import './Education.css';

const Education = ({ academic = [], loading = false, error = false }) => {
  const educationItems = React.useMemo(() => {
    if (!Array.isArray(academic) || academic.length === 0) {
      return [];
    }

    const mapped = academic.map((item, idx) => {
      const degreeLower = (item.degree || '').toLowerCase();
      const isBTech =
        degreeLower.includes('b.tech') ||
        degreeLower.includes('btech') ||
        degreeLower.includes('artificial intelligence') ||
        degreeLower.includes('bachelor');

      const isDiploma =
        degreeLower.includes('diploma') ||
        degreeLower.includes('polytechnic') ||
        degreeLower.includes('computer engineering');

      // Helper to extract start year for chronological sorting (Oldest → Newest)
      let startYear = 9999;
      if (item.duration) {
        const yearMatch = item.duration.match(/\b(19|20)\d{2}\b/);
        if (yearMatch) {
          startYear = parseInt(yearMatch[0], 10);
        }
      }

      const isCurrent = Boolean(
        item.current ||
          item.isCurrent ||
          item.duration?.toLowerCase().includes('present') ||
          item.duration?.toLowerCase().includes('current')
      );

      // Result formatting: "Score: 90.95%" for Diploma vs "CGPA: 8.0 / 10" for B.Tech
      const rawResult = item.result || item.cgpa || item.percentage || '';
      let resultLabel = '';

      if (rawResult) {
        let valStr = String(rawResult).trim();
        if (isDiploma || item.degreeType?.toUpperCase() === 'DIPLOMA') {
          valStr = valStr.replace(/^CGPA:?\s*/i, '').trim();
          if (!valStr.toLowerCase().startsWith('score:')) {
            resultLabel = `Score: ${valStr}`;
          } else {
            resultLabel = valStr;
          }
        } else {
          valStr = valStr.replace(/^CGPA:?\s*/i, '').trim();
          if (!valStr.toLowerCase().startsWith('cgpa:')) {
            resultLabel = `CGPA: ${valStr}`;
          } else {
            resultLabel = valStr;
          }
        }
      }

      return {
        id: item._id || item.id || `edu-${idx}`,
        duration: item.duration || '',
        degreeType: (
          item.degreeType || (isBTech ? 'B.TECH' : isDiploma ? 'DIPLOMA' : 'DEGREE')
        ).toUpperCase(),
        degree: item.degree || 'Academic Qualification',
        institution: item.institution || '',
        location: item.location || '',
        result: resultLabel,
        current: isCurrent,
        startYear,
        originalIndex: idx,
      };
    });

    // Chronological order: Oldest → Newest. If start years match, preserve original order
    mapped.sort((a, b) => {
      if (a.startYear !== b.startYear) {
        return a.startYear - b.startYear;
      }
      return a.originalIndex - b.originalIndex;
    });

    return mapped;
  }, [academic]);

  // 1. Loading State (Skeleton Timeline)
  if (loading) {
    return (
      <section id="education" className="education-section">
        <div className="container">
          <SectionHeader title="Education" />
          <div className="timeline-horizontal-wrapper">
            <div className="timeline-items-grid">
              {[1, 2].map((n) => (
                <div key={n} className="timeline-column-item skeleton-column">
                  <div className="timeline-node-header">
                    <div className="skeleton-date skeleton-pulse" />
                    <div className="timeline-node skeleton-pulse" />
                  </div>
                  <div className="education-card skeleton-card">
                    <div className="skeleton-line skeleton-badge skeleton-pulse" />
                    <div className="skeleton-line skeleton-title skeleton-pulse" />
                    <div className="skeleton-line skeleton-desc skeleton-pulse" />
                    <div className="skeleton-line skeleton-result skeleton-pulse" />
                  </div>
                </div>
              ))}
            </div>
            <div className="timeline-track-line" aria-hidden="true" />
          </div>
        </div>
      </section>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <section id="education" className="education-section">
        <div className="container">
          <SectionHeader title="Education" />
          <div className="education-status-card education-error-state">
            <p className="education-status-message">Unable to load education information.</p>
          </div>
        </div>
      </section>
    );
  }

  // 3. Empty State
  if (educationItems.length === 0) {
    return (
      <section id="education" className="education-section">
        <div className="container">
          <SectionHeader title="Education" />
          <div className="education-status-card education-empty-state">
            <p className="education-status-message">No education information available.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="education" className="education-section">
      <div className="container">
        <SectionHeader title="Education" />

        <div className="timeline-horizontal-wrapper">
          <div
            className="timeline-items-grid"
            style={{
              gridTemplateColumns: `repeat(${Math.max(1, Math.min(educationItems.length, 3))}, 1fr)`,
            }}
          >
            {educationItems.map((edu) => (
              <div
                key={edu.id}
                className={`timeline-column-item ${edu.current ? 'is-current' : ''}`}
              >
                <div className="timeline-node-header">
                  {edu.duration && <span className="timeline-date">{edu.duration}</span>}
                  <div className="timeline-node">
                    <div className="node-inner" />
                  </div>
                </div>

                <div className="education-card">
                  <div className="card-header-row">
                    <span className="degree-type-label">{edu.degreeType}</span>
                    {edu.current && <span className="current-badge">CURRENT</span>}
                  </div>

                  <h3 className="degree-title">{edu.degree}</h3>

                  <p className="institution-info">
                    <span className="institution-name">{edu.institution}</span>
                    {edu.location && (
                      <span className="institution-location"> · {edu.location}</span>
                    )}
                  </p>

                  {edu.result && (
                    <div className="card-result-row">
                      <span className="result-badge">{edu.result}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {educationItems.length > 1 && (
            <div className="timeline-track-line" aria-hidden="true" />
          )}
        </div>
      </div>
    </section>
  );
};

export default Education;
