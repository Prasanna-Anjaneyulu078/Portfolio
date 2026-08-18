import React from 'react';
import './Footer.css';

const Footer = ({ userData = {}, codingProfiles = [] }) => {
  const name = userData.name || 'Prasanna Anjaneyulu';
  const role = userData.role || 'Software Engineer | Full Stack Developer';

  const formatUrl = (url) => {
    if (!url) return '#';
    return url.startsWith('http') ? url : `https://${url}`;
  };

  const leetcodeProfile = codingProfiles.find(
    (p) => p.platform?.toLowerCase().includes('leetcode')
  );

  return (
    <footer className="footer">
      <div className="container footer-content">
        <div className="footer-name">© {new Date().getFullYear()} {name}</div>
        <div className="footer-title-sub">{role}</div>
        <div className="footer-links">
          {userData.githubUrl && (
            <a href={formatUrl(userData.githubUrl)} target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          )}
          {userData.githubUrl && userData.linkedinUrl && <span className="footer-dot">•</span>}
          {userData.linkedinUrl && (
            <a href={formatUrl(userData.linkedinUrl)} target="_blank" rel="noopener noreferrer">
              LinkedIn
            </a>
          )}
          {leetcodeProfile && <span className="footer-dot">•</span>}
          {leetcodeProfile && (
            <a href={formatUrl(leetcodeProfile.url)} target="_blank" rel="noopener noreferrer">
              LeetCode
            </a>
          )}
          {userData.email && <span className="footer-dot">•</span>}
          {userData.email && (
            <a href={`mailto:${userData.email}`}>
              Email
            </a>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
