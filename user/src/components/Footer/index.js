import React from 'react';
import './Footer.css';

const Footer = ({ userData = {} }) => {
  const name = userData.name;
  const role = userData.role;
  const currentYear = new Date().getFullYear();

  const formatUrl = (url) => {
    if (!url) return '#';
    return url.startsWith('http') ? url : `https://${url}`;
  };

  const hasGithub = Boolean(userData.githubUrl);
  const hasLinkedin = Boolean(userData.linkedinUrl);
  const hasEmail = Boolean(userData.email);

  return (
    <footer className="footer-section">
      <div className="container footer-container">
        <div className="footer-divider" aria-hidden="true" />

        <div className="footer-content-row">
          {(hasGithub || hasLinkedin || hasEmail) && (
            <div className="footer-links-group">
              {hasGithub && (
                <a
                  href={formatUrl(userData.githubUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-link"
                >
                  GitHub
                </a>
              )}
              {hasGithub && (hasLinkedin || hasEmail) && <span className="footer-dot">•</span>}
              {hasLinkedin && (
                <a
                  href={formatUrl(userData.linkedinUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-link"
                >
                  LinkedIn
                </a>
              )}
              {hasLinkedin && hasEmail && <span className="footer-dot">•</span>}
              {hasEmail && (
                <a href={`mailto:${userData.email}`} className="footer-link">
                  Email
                </a>
              )}
            </div>
          )}

          <div className="footer-meta-group">
            {name && (
              <div className="footer-copyright">
                © {currentYear} {name}
              </div>
            )}
            {role && <div className="footer-role">{role}</div>}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
