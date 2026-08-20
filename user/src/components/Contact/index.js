import React, { useState } from 'react';
import axios from 'axios';
import SectionHeader from '../SectionHeader';
import { ENDPOINTS } from '../../config/api';
import './Contact.css';

const formatUrl = (url) => {
  if (!url) return '#';
  return url.startsWith('http') ? url : `https://${url}`;
};

const Contact = ({ userData = {} }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const email = userData.email || '';
  const github = userData.githubUrl || '';
  const linkedin = userData.linkedinUrl || '';

  const handleDownloadResume = async () => {
    if (isDownloading) return;
    setIsDownloading(true);

    try {
      const response = await axios({
        url: ENDPOINTS.RESUME_DOWNLOAD,
        method: 'GET',
        responseType: 'blob',
      });

      if (response.data.type === 'application/json') {
        throw new Error('Resume is currently unavailable.');
      }

      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: 'application/pdf' })
      );
      window.open(url, '_blank');
      // Revoke the object URL after a delay to allow the new tab to load it
      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
    } catch (error) {
      console.error('Download error:', error);
      alert('Unable to download resume. It may not be available.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <section id="contact" className="contact-section">
      <div className="container">
        <SectionHeader title="Contact" />

        <div className="contact-simplified-layout">
          <h3 className="contact-info-title">Let's Connect</h3>
          <p className="contact-info-desc">
            Open to Software Engineering opportunities and internships.
          </p>

          <div className="contact-cards-container">
            {email && (
              <div className="contact-card">
                <span className="material-symbols-outlined contact-card-icon">mail</span>
                <span className="contact-card-label">Email</span>
                <a href={`mailto:${email}`} className="contact-card-link">Email Me &rarr;</a>
              </div>
            )}

            {linkedin && (
              <div className="contact-card">
                <svg className="contact-card-icon-svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
                <span className="contact-card-label">LinkedIn</span>
                <a href={formatUrl(linkedin)} target="_blank" rel="noopener noreferrer" className="contact-card-link">View Profile</a>
              </div>
            )}

            {github && (
              <div className="contact-card">
                <svg className="contact-card-icon-svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                <span className="contact-card-label">GitHub</span>
                <a href={formatUrl(github)} target="_blank" rel="noopener noreferrer" className="contact-card-link">View Profile</a>
              </div>
            )}
          </div>
          
          <div className="contact-resume-action">
            <button
              onClick={handleDownloadResume}
              disabled={isDownloading}
              className="btn-resume-download"
            >
              <span className="material-symbols-outlined">description</span>
              {isDownloading ? 'Opening...' : 'View Resume'}
            </button>
          </div>
          
        </div>
      </div>
    </section>
  );
};

export default Contact;
