import React from 'react';
import './Education.css';

const Education = ({ academic = [] }) => {
  if (!academic || academic.length === 0) {
    return null;
  }

  return (
    <section id="education" className="education-section">
      <div className="container">
        <div className="section-title-wrapper">
          <div className="badge-emphasis">
            Academic Credentials
          </div>
          <h2 className="section-title">
            Education
          </h2>
          <p className="section-subtitle">
            Formal education, academic qualification, and foundation in computer science and technology.
          </p>
        </div>

        <div className="education-grid">
          {academic.map((edu, idx) => {
            const resultText = edu.cgpa || edu.result || edu.percentage;

            return (
              <div key={edu.id || edu._id || idx} className="education-card">
                <div className="edu-header">
                  <div className="edu-icon-box">
                    <span className="material-symbols-outlined">school</span>
                  </div>
                  <div className="edu-title-group">
                    <h3 className="degree-name">{edu.degree}</h3>
                    <p className="institution-name">{edu.institution}</p>
                  </div>
                </div>

                <div className="edu-footer-meta">
                  {edu.duration && (
                    <div className="edu-duration">
                      <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>
                        calendar_today
                      </span>
                      {edu.duration}
                    </div>
                  )}

                  {resultText && (
                    <div className="edu-result-badge">
                      Result: {resultText}
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

export default Education;
