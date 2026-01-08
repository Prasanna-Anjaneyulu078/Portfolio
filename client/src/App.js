import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import PersonalDetails from './components/PersonalDetails';
import AboutMe from './components/AboutMe';
import SkillsSection from './components/SkillsSection';
import ProjectsSection from './components/ProjectsSection';
import ResumeSection from './components/ResumeSection';
import Dashboard from './components/Dashboard';
import './index.css';
import './App.css';

// Empty structure representing only what the database should provide
const EMPTY_STATE = {
  name: "",
  role: "",
  bio: "",
  location: "",
  email: "",
  githubUrl: "",
  linkedinUrl: "",
  avatarUrl: "",
  coreObjective: "",
  academic: [],
  skillGroups: [], // Will be populated by DB
  codingProfiles: [], // Will be populated by DB
  projects: [],
  resumes: []
};

const API_BASE = 'http://localhost:3002/api';

const App = () => {
  const [data, setData] = useState(EMPTY_STATE);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);

  // FETCH DATA FROM DATABASE ON LOAD
  useEffect(() => {
    const fetchDatabaseData = async () => {
      try {
        setIsLoading(true);
        // Fetching skill groups from your MongoDB
        const skillsRes = await axios.get(`${API_BASE}/skill-groups`);
        
        // Update state with database content
        setData(prev => ({
          ...prev,
          skillGroups: skillsRes.data,
          // If you have a profile sync endpoint, fetch that here too
          // codingProfiles: profilesRes.data 
        }));
      } catch (err) {
        console.error("Error connecting to database:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDatabaseData();
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="loading-container">
          <p>Connecting to Database...</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'overview':
        return <Dashboard data={data} onNavigate={setActiveTab} />;
      case 'personal':
        return <PersonalDetails data={data} onUpdate={setData} />;
      case 'about':
        return <AboutMe data={data} onUpdate={setData} />;
      case 'skills':
        return <SkillsSection data={data} onUpdate={setData} />;
      case 'projects':
        return <ProjectsSection data={data} onUpdate={setData} />;
      case 'resume':
        return <ResumeSection data={data} onUpdate={setData} />;
      default:
        return <Dashboard data={data} onNavigate={setActiveTab} />;
    }
  };

  useEffect(() => {
    const fetchBrandData = async () => {
      try {
        const response = await axios.get('http://localhost:3002/api/user');
        const userData = response.data;

        if (userData) {
          // 1. Update the Browser Tab Title
          document.title = `${userData.name} Admin`;

          // 2. Update the Favicon (Title Logo)
          if (userData.avatarUrl) {
            updateFavicon(userData.avatarUrl);
          }
        }
      } catch (err) {
        console.error("Error setting brand details:", err);
      }
    };

    const updateFavicon = (url) => {
      // Find the existing favicon link or create a new one
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = url;
    };

    fetchBrandData();
  }, []);

  return (
    <div className="app-container">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        avatarUrl={data.avatarUrl}
      />
      
      <main className="main-content">
        <Header 
          onMenuClick={() => setSidebarOpen(true)} 
          activeTab={activeTab} 
          avatarUrl={data.avatarUrl}
          userName={data.name || "Admin"}
        />
        
        <div className="scroll-container">
          <div className="content-wrapper">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;