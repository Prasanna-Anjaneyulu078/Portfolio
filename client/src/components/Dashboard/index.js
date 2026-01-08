import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './index.css';

const API_BASE = 'https://prasanna-portfolio-admin.vercel.app/api';

const Dashboard = ({ onNavigate }) => {
  const [data, setData] = useState({
    name: "Admin",
    projects: [],
    skillGroups: [],
    academic: [],
    resumes: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const [userRes, projectRes, skillRes, eduRes, resumeRes] = await Promise.all([
          axios.get(`${API_BASE}/user`),
          axios.get(`${API_BASE}/projects`),
          axios.get(`${API_BASE}/skill-groups`),
          axios.get(`${API_BASE}/education`),
          axios.get(`${API_BASE}/resumes`) 
        ]);

        setData({
          name: userRes.data.name || "Admin",
          projects: projectRes.data || [],
          skillGroups: skillRes.data || [],
          academic: eduRes.data.academic || [],
          resumes: resumeRes.data || [] 
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
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <div className="spinner-border text-primary" role="status" style={{ width: '3.5rem', height: '3.5rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
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
            icon="school" 
            label="Certifications" 
            value={data.academic.length} 
            color="#6366f1" 
            onClick={() => onNavigate('about')}
            subLabel="Academic History"
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
            <button onClick={() => onNavigate('about')} className="btn-action-full secondary">Review Background</button>
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
