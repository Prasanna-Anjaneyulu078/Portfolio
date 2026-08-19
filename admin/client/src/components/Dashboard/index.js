import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './index.css';

import { API_BASE_URL } from '../../config/api';

const PRIMARY_API = API_BASE_URL;

const apiGet = async (endpoint) => {
  try {
    return await axios.get(`${PRIMARY_API}${endpoint}`);
  } catch (err) {
    if (!err.response || err.code === 'ERR_NETWORK') {
      return await axios.get(`${LOCAL_API}${endpoint}`);
    }
    throw err;
  }
};

const Dashboard = ({ onNavigate }) => {
  const [data, setData] = useState({
    name: "Admin",
    projects: [],
    skillGroups: [],
    academic: [],
    resumes: [],
    certifications: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const [userRes, projectRes, skillRes, eduRes, resumeRes, certRes] = await Promise.all([
          apiGet('/user'),
          apiGet('/projects'),
          apiGet('/skill-groups'),
          apiGet('/education'),
          apiGet('/resumes'),
          apiGet('/certifications')
        ]);

        setData({
          name: userRes.data.name || "Admin",
          projects: projectRes.data || [],
          skillGroups: skillRes.data || [],
          academic: eduRes.data.academic || [],
          resumes: resumeRes.data || [],
          certifications: Array.isArray(certRes.data) ? certRes.data : []
        });
      } catch (err) {
        console.error("Dashboard Fetch Error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // --- CLEAN LOADER ONLY ---
  if (isLoading) {
    return (
      <div className="loading-container" role="status" aria-label="Loading dashboard">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading Dashboard...</p>
      </div>
    );
  }

  const topProjects = data.projects.slice(0, 3);
  const totalSkills = data.skillGroups.reduce((acc, g) => acc + (g.skills?.length || 0), 0);
  const activeResume = data.resumes.find(r => r.isActive);

  return (
    <div className="dashboard-container">
      <div className="overview-hero">
        <div className="hero-content">
          <div className="hero-text">
            <h2>Command Center Overview</h2>
            <p>Welcome back, <strong>{data.name}</strong>. Your portfolio is currently synchronized and live.</p>
          </div>
          <button onClick={() => onNavigate('personal')} className="hero-profile-btn">
            <span className="material-symbols-outlined">account_circle</span>
            Manage Profile
          </button>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="stats-row">
          <StatWidget 
            icon="work_outline" 
            label="Projects" 
            value={data.projects.length} 
            color="#135bec" 
            onClick={() => onNavigate('projects')}
            subLabel="Published Items"
          />
          <StatWidget 
            icon="terminal" 
            label="Tech Skills" 
            value={totalSkills} 
            color="#16a34a" 
            onClick={() => onNavigate('skills')}
            subLabel="Core Stack"
          />
          <StatWidget 
            icon="workspace_premium" 
            label="Certifications" 
            value={data.certifications ? data.certifications.length : 0} 
            color="#6366f1" 
            onClick={() => onNavigate('certifications')}
            subLabel="Verified Credentials"
          />
          <StatWidget 
            icon="description" 
            label="Resumes" 
            value={data.resumes.length} 
            color="#f59e0b" 
            onClick={() => onNavigate('resume')}
            subLabel="Managed Files"
          />
        </div>

        <div className="dashboard-main">
          <div className="summary-card featured-projects">
            <div className="card-header">
              <div className="header-info">
                <span className="material-symbols-outlined">rocket_launch</span>
                <h4>Featured Projects</h4>
              </div>
              <button onClick={() => onNavigate('projects')} className="header-link-btn">View All Library</button>
            </div>
            <div className="project-previews">
              {topProjects.length > 0 ? topProjects.map(project => (
                <div key={project._id} className="preview-item" onClick={() => onNavigate('projects')}>
                  <div className="preview-img" style={{ backgroundImage: `url(${project.imageUrl})` }} />
                  <div className="preview-details">
                    <h5>{project.title}</h5>
                    <div className="preview-tags">
                      {project.techStack?.slice(0, 2).map(tech => (
                        <span key={tech} className="mini-tag">{tech}</span>
                      ))}
                    </div>
                  </div>
                  <span className="material-symbols-outlined preview-arrow">chevron_right</span>
                </div>
              )) : (
                <div className="empty-widget"><p>No projects added yet.</p></div>
              )}
            </div>
          </div>

          <div className="summary-card skill-distribution">
            <div className="card-header">
              <div className="header-info">
                <span className="material-symbols-outlined">query_stats</span>
                <h4>Skill Stack Overview</h4>
              </div>
              <button onClick={() => onNavigate('skills')} className="header-link-btn">Update Skills</button>
            </div>
            <div className="skill-groups-summary">
              {data.skillGroups.length > 0 ? data.skillGroups.map(group => (
                <div key={group._id} className="group-summary-item">
                  <div className="group-label">
                    <span>{group.title}</span>
                    <span className="group-count">{group.skills.length}</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: `${Math.min(group.skills.length * 10, 100)}%`,
                        backgroundColor: '#16a34a' 
                      }} 
                    />
                  </div>
                </div>
              )) : <div className="empty-widget"><p>Add skills to see distribution.</p></div>}
            </div>
          </div>
        </div>

        <div className="dashboard-aside">
          <div className="summary-card resume-status">
              <h4>Active Resume</h4>
              {activeResume ? (
                <div className="active-resume-box">
                  <span className="material-symbols-outlined file-icon" style={{color: '#f59e0b'}}>picture_as_pdf</span>
                  <div className="file-info">
                     <p className="file-name" title={activeResume.fileName}>{activeResume.fileName}</p>
                     <p className="file-date">Last updated: {new Date(activeResume.uploadedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ) : (
                <div className="empty-resume-box">
                  <span className="material-symbols-outlined">warning</span>
                  <p>No primary resume set.</p>
                </div>
              )}
              <button onClick={() => onNavigate('resume')} className="btn-action-full">Go to Resume Manager</button>
          </div>

          <div className="summary-card academic-preview">
            <h4>Latest Education</h4>
            {data.academic.length > 0 ? (
              <div className="latest-edu">
                <p className="edu-title">{data.academic[0].degree}</p>
                <p className="edu-inst">{data.academic[0].institution}</p>
              </div>
            ) : <p className="empty-text">No education records found.</p>}
            <button onClick={() => onNavigate('education')} className="btn-action-full secondary">Manage Education</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatWidget = ({ icon, label, value, color, onClick, subLabel }) => (
  <button onClick={onClick} className="stat-widget-btn">
    <div className="widget-header">
      <div className="widget-icon" style={{ backgroundColor: `${color}15`, color: color }}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div className="widget-value">{value}</div>
    </div>
    <div className="widget-footer">
      <div className="widget-label">{label}</div>
      <div className="widget-sublabel">{subLabel}</div>
    </div>
  </button>
);

export default Dashboard;
