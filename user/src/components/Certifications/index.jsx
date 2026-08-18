import React from 'react';
import './Certifications.css';

const Certifications = ({ certifications = [] }) => {
  // Filter active certifications
  const validCerts = (certifications || []).filter(
    (c) => c.isActive !== false
  );

  if (validCerts.length === 0) {
    return null;
  }

  return (
    <section id="certifications" className="certifications-section">
      <div className="container">
        <div className="section-title-wrapper">
          <div className="badge-emphasis">
            Verified Credentials
          </div>
          <h2 className="section-title">
            Certifications
          </h2>
          <p className="section-subtitle">
            Professional certifications, course completions, and technical credentials.
          </p>
        </div>

        <div className="certifications-grid">
          {validCerts.map((cert, idx) => (
            <div key={cert._id || idx} className="cert-card">
              <div className="cert-preview-box">
                {cert.imageUrl ? (
                  <img
                    src={cert.imageUrl}
                    alt={cert.title || 'Certificate Preview'}
                    className="cert-img"
                    loading="lazy"
                  />
                ) : (
                  <div className="cert-img-fallback">
                    <span className="material-symbols-outlined">verified</span>
                  </div>
                )}
              </div>

              <div className="cert-body">
                <h3 className="cert-title">{cert.title}</h3>
                {cert.issuer && <p className="cert-issuer">{cert.issuer}</p>}

                {cert.issueDate && (
                  <div className="cert-meta">
                    <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>
                      event
                    </span>
                    Issued: {cert.issueDate}
                  </div>
                )}

                {cert.verificationUrl && (
                  <div className="cert-action">
                    <a
                      href={cert.verificationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-cert"
                    >
                      View Certificate
                      <span className="material-symbols-outlined">open_in_new</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Certifications;
