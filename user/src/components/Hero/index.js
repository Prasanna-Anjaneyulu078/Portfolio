import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './Hero.css';

const API_URL = "https://prasanna-portfolio-admin.vercel.app/api/user";
const DOWNLOAD_URL = "https://prasanna-portfolio-admin.vercel.app/api/resume/download";

const Hero = () => {
  const [data, setData] = useState({
    name: '',
    role: '',
    email: '',
    bio: '',
    avatarUrl: '',
    githubUrl: '',
    linkedinUrl: '',
  });

  // Fetch user data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(API_URL);
        setData(response.data);
      } catch (err) {
        console.error(`Error fetching user: ${err.message}`);
      }
    };
    fetchData();
  }, []);

  // Handle Real Resume Download from Backend
  const handleDownloadResume = async () => {
    try {
      const response = await axios({
        url: DOWNLOAD_URL,
        method: 'GET',
        responseType: 'blob', // Important for binary PDF data
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const fileName = `${data.name || 'User'}_Resume.pdf`;
      link.setAttribute('download', fileName);
      
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Could not download resume. Please ensure it is uploaded in the Admin panel.");
    }
  };

  return (
    <section id="home" className="hero-section">
      <div className="container hero-container">
        <div className="hero-content">
          <div className="status-badge">
            <span className="dot"></span>
            Open to Software Engineering Roles
          </div>
          <h1 className="hero-title">{data.name || "Loading..."}</h1>
          <h2 className="hero-subtitle">
            {data.role || "Software Engineer | Full Stack Specialist"}
          </h2>
          <p className="hero-description">{data.bio}</p>
          
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={handleDownloadResume}>
              <span className="material-symbols-outlined">description</span>
              Download Resume
            </button>
            <a href="#projects" className="btn btn-outline">
              View My Work
              <span className="material-symbols-outlined">arrow_forward</span>
            </a>
          </div>

          <div className="social-links">
            {/* GitHub */}
            <a href={data.githubUrl?.startsWith("http") ? data.githubUrl : `https://${data.githubUrl}`} target="_blank" rel="noopener noreferrer" className="social-item" aria-label="GitHub">
              <div className="icon-wrapper">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </div>
            </a>

            {/* LinkedIn */}
            <a href={data.linkedinUrl?.startsWith("http") ? data.linkedinUrl : `https://${data.linkedinUrl}`} target="_blank" rel="noopener noreferrer" className="social-item" aria-label="LinkedIn">
              <div className="icon-wrapper">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </div>
            </a>

            {/* Gmail (Newly Added) */}
            <a href={`mailto:${data.email}`} className="social-item" aria-label="Gmail">
              <div className="icon-wrapper">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 5.457v13.909c0 .904-.733 1.635-1.635 1.635h-3.819V11.455L12 16.648l-6.546-5.193v9.545H1.636A1.638 1.638 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.966L12 9.577l8.073-6.086c1.618-1.212 3.927-.057 3.927 1.966z"/>
                </svg>
              </div>
            </a>
          </div>
        </div>
        
        <div className="hero-image-wrapper">
          <div 
            className="hero-image" 
            style={{ backgroundImage: `url(${data.avatarUrl})`}}
          ></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
