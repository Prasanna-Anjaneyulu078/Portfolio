import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './Skills.css';

const API_BASE = 'https://prasanna-portfolio-admin.vercel.app/api';

const Skills = () => {
  const [skillCategories, setSkillCategories] = useState([]);
  const [codingProfiles, setCodingProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [skillsRes, profilesRes] = await Promise.all([
          axios.get(`${API_BASE}/skill-groups`),
          axios.get(`${API_BASE}/profiles`)
        ]);
        setSkillCategories(skillsRes.data);
        setCodingProfiles(profilesRes.data);
      } catch (err) {
        console.error("Error fetching skills data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="loading-container" role="status" aria-label="Loading technical skills">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading Technical Skills...</p>
      </div>
    );
  }

  return (
    <section id="skills" className="skills-section">
      <div className="container">
        <div className="skills-header">
          <h2 className="skills-title">Technical Proficiency</h2>
          <p className="skills-subtitle">
            Combining rigorous computer science principles with modern full-stack development practices to build end-to-end solutions.
          </p>
        </div>
        
        {/* Technical Skills Grid */}
        <div className="skills-grid">
          {skillCategories.map((cat) => (
            <div key={cat._id} className="skill-card">
              <div className="skill-card-header">
                <div className="skill-icon">
                  <span className="material-symbols-outlined">{cat.icon || 'terminal'}</span>
                </div>
                <h3 className="skill-category-title">{cat.title}</h3>
              </div>
              <div className="skill-tags">
                {cat.skills.map((skill, index) => (
                  <span key={index} className="skill-badge">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Coding Profiles - Icons Removed */}
        <div className="coding-profiles-container">
          <h3 className="profiles-title">Coding Profiles</h3>
          <div className="profiles-grid">
            {codingProfiles.map((profile) => (
              <a 
                key={profile._id} 
                href={profile.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="profile-link-card"
                style={{ '--brand-color': profile.color || '#135bec' }}
              >
                <span className="profile-name">{profile.platform}</span>
                <span className="material-symbols-outlined open-icon">open_in_new</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Skills;
