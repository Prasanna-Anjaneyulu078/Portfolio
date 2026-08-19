import React, { useState } from 'react';
import axios from 'axios';
import { scrollToProjects } from '../../utils/scrollUtils';
import './Hero.css';

import { ENDPOINTS, resolveAssetUrl } from '../../config/api';

const Hero = ({ userData = {}, educationData = {}, codingProfiles = [] }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  const handleDownloadResume = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    setDownloadError('');

    try {
      const response = await axios({
        url: ENDPOINTS.RESUME_DOWNLOAD,
        method: 'GET',
        responseType: 'blob',
      });

      // If backend returns a JSON error blob (e.g. 404 No resume found)
      if (response.data.type === 'application/json') {
        const text = await response.data.text();
        let errorMsg = 'Resume is currently unavailable.';
        try {
          const json = JSON.parse(text);
          if (json.message) errorMsg = json.message;
        } catch (e) {
          // fallback
        }
        throw new Error(errorMsg);
      }

      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: 'application/pdf' })
      );
      const link = document.createElement('a');
      link.href = url;

      const fileName = `${
        userData.name ? userData.name.replace(/\s+/g, '_') : 'User'
      }_Resume.pdf`;
      link.setAttribute('download', fileName);

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setIsDownloading(false);
    } catch (err) {
      console.error('Resume download error:', err);
      setIsDownloading(false);

      if (err.response && err.response.status === 404) {
        setDownloadError('Resume is currently unavailable.');
      } else if (err.message && err.message.toLowerCase().includes('resume')) {
        setDownloadError('Resume is currently unavailable.');
      } else {
        setDownloadError('Unable to download resume. Please try again.');
      }

      setTimeout(() => {
        setDownloadError('');
      }, 4000);
    }
  };

  const formatUrl = (url) => {
    if (!url) return '#';
    return url.startsWith('http') ? url : `https://${url}`;
  };

  return (
    <section id="home" className="home-section">
      <div className="container">
        <div className="home-grid">
          <div className="home-content">
            <div className="status-badge">
              <span className="dot"></span>
              OPEN TO SOFTWARE ENGINEERING OPPORTUNITIES
            </div>

            {userData.name && <h1 className="home-title">{userData.name}</h1>}
            {userData.role && <h2 className="home-subtitle">{userData.role}</h2>}

            {userData.bio && <p className="home-intro">{userData.bio}</p>}

            {/* Key Highlights / Statistics */}
            <div className="home-highlights">
              <div className="highlight-item">
                <div className="material-symbols-outlined highlight-icon">code_blocks</div>
                <div className="highlight-title">Full Stack</div>
                <div className="highlight-sub">MERN / Web Tech</div>
              </div>
              <div className="highlight-item">
                <div className="material-symbols-outlined highlight-icon">terminal</div>
                <div className="highlight-title">Problem Solving</div>
                <div className="highlight-sub">DSA & Algorithms</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="home-actions-group">
              <div className="home-actions">
                <button
                  className="btn-primary"
                  onClick={handleDownloadResume}
                  disabled={isDownloading}
                  aria-label="Download Resume"
                >
                  <span className="material-symbols-outlined">
                    {isDownloading ? 'hourglass_empty' : 'description'}
                  </span>
                  {isDownloading ? 'Downloading...' : 'Download Resume ↓'}
                </button>
                <a
                  href="#projects"
                  className="btn-outline"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToProjects();
                  }}
                >
                  View Projects
                  <span className="material-symbols-outlined">arrow_forward</span>
                </a>
              </div>
              {downloadError && <span className="resume-error-text">{downloadError}</span>}
            </div>

            {/* Social Links: GitHub / LinkedIn / Email */}
            <div className="social-links">
              {userData.githubUrl && (
                <a
                  href={formatUrl(userData.githubUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-item"
                  aria-label="GitHub Profile"
                  title="GitHub"
                >
                  <svg width="25" height="25" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </a>
              )}

              {userData.linkedinUrl && (
                <a
                  href={formatUrl(userData.linkedinUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-item"
                  aria-label="LinkedIn Profile"
                  title="LinkedIn"
                >
                  <svg width="25" height="25" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
              )}

              {userData.email && (
                <a
                  href={`mailto:${userData.email}`}
                  className="social-item"
                  aria-label="Send Email"
                  title="Email"
                >
                  <svg width="25" height="25" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 5.457v13.909c0 .904-.733 1.635-1.635 1.635h-3.819V11.455L12 16.648l-6.546-5.193v9.545H1.636A1.638 1.638 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.966L12 9.577l8.073-6.086c1.618-1.212 3.927-.057 3.927 1.966z" />
                  </svg>
                </a>
              )}
            </div>
          </div>

          <div className="home-image-wrapper">
            <div className="home-image-container">
              {userData.avatarUrl ? (
                <img
                  src={resolveAssetUrl(userData.avatarUrl)}
                  alt={userData.name || 'User Avatar'}
                  className="home-image"
                />
              ) : (
                <div className="home-image-fallback">
                  {(userData.name || 'P')[0]?.toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
