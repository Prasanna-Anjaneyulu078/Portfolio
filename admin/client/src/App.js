import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import PersonalDetails from './components/PersonalDetails';
import EducationSection from './components/EducationSection';
import SkillsSection from './components/SkillsSection';
import ProjectsSection from './components/ProjectsSection';
import CertificationsSection from './components/CertificationsSection';
import ExperienceSection from './components/ExperienceSection';
import ResumeSection from './components/ResumeSection';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import './index.css';
import './App.css';

// Attach adminToken cookie to all outbound Axios requests
axios.interceptors.request.use((config) => {
  const token = Cookies.get('adminToken');
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

const EMPTY_STATE = {
  name: "",
  role: "",
  bio: "",
  location: "",
  email: "",
  githubUrl: "",
  linkedinUrl: "",
  avatarUrl: "",
  academic: [],
  skillGroups: [],
  codingProfiles: [],
  projects: [],
  experiences: [],
  resumes: []
};

const PRIMARY_API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api';
const LOCAL_API = 'http://localhost:3002/api';

const apiGet = async (endpoint) => {
  try {
    return await axios.get(`${PRIMARY_API}${endpoint}`);
  } catch (err) {
    if (!err.response) return await axios.get(`${LOCAL_API}${endpoint}`);
    throw err;
  }
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [data, setData] = useState(EMPTY_STATE);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);

  // Setup response interceptor for 401/403 unauthorized handling
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          Cookies.remove('adminToken');
          setIsAuthenticated(false);
          setData(EMPTY_STATE);
          setActiveTab('overview');
        }
        return Promise.reject(error);
      }
    );
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  // Verify existing token on mount & protect browser navigation
  useEffect(() => {
    const verifyToken = async () => {
      const token = Cookies.get('adminToken');
      if (!token) {
        setIsAuthenticated(false);
        setAuthChecking(false);
        return;
      }
      try {
        const verifyUrl = `${PRIMARY_API}/auth/verify`;
        await axios.get(verifyUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsAuthenticated(true);
      } catch (primaryErr) {
        if (!primaryErr.response) {
          try {
            await axios.get(`${LOCAL_API}/auth/verify`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            setIsAuthenticated(true);
          } catch {
            Cookies.remove('adminToken');
            setIsAuthenticated(false);
          }
        } else {
          // Token invalid/expired
          Cookies.remove('adminToken');
          setIsAuthenticated(false);
        }
      } finally {
        setAuthChecking(false);
      }
    };

    verifyToken();

    // Re-verify token on browser Back/Forward or page visibility restore
    const handleNavigation = () => {
      const token = Cookies.get('adminToken');
      if (!token) {
        setIsAuthenticated(false);
        setData(EMPTY_STATE);
        setActiveTab('overview');
      }
    };

    window.addEventListener('popstate', handleNavigation);
    window.addEventListener('pageshow', handleNavigation);
    return () => {
      window.removeEventListener('popstate', handleNavigation);
      window.removeEventListener('pageshow', handleNavigation);
    };
  }, []);

  const handleLogin = (token) => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    Cookies.remove('adminToken');
    setIsAuthenticated(false);
    setData(EMPTY_STATE);
    setActiveTab('overview');
  };

  // FETCH DATA FROM DATABASE ON LOAD (only when authenticated)
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchDatabaseData = async () => {
      try {
        setIsLoading(true);
        const [skillsRes, expRes] = await Promise.allSettled([
          apiGet('/skill-groups'),
          apiGet('/experiences')
        ]);
        setData(prev => ({
          ...prev,
          skillGroups: skillsRes.status === 'fulfilled' ? skillsRes.value.data : [],
          experiences: expRes.status === 'fulfilled' ? expRes.value.data : [],
        }));
      } catch (err) {
        console.error("Error connecting to database:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDatabaseData();
  }, [isAuthenticated]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="loading-container" role="status" aria-label="Loading dashboard">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading Dashboard...</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'overview':
        return <Dashboard data={data} onNavigate={setActiveTab} />;
      case 'personal':
        return <PersonalDetails data={data} onUpdate={setData} />;
      case 'education':
        return <EducationSection data={data} onUpdate={setData} />;
      case 'skills':
        return <SkillsSection data={data} onUpdate={setData} />;
      case 'projects':
        return <ProjectsSection data={data} onUpdate={setData} />;
      case 'experience':
        return <ExperienceSection data={data} onUpdate={setData} />;
      case 'certifications':
        return <CertificationsSection data={data} onUpdate={setData} />;
      case 'resume':
        return <ResumeSection data={data} onUpdate={setData} />;
      default:
        return <Dashboard data={data} onNavigate={setActiveTab} />;
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchBrandData = async () => {
      try {
        const response = await apiGet('/user');
        const userData = response.data;
        if (userData) {
          document.title = `${userData.name} Admin`;
          if (userData.avatarUrl) {
            let link = document.querySelector("link[rel~='icon']");
            if (!link) {
              link = document.createElement('link');
              link.rel = 'icon';
              document.getElementsByTagName('head')[0].appendChild(link);
            }
            link.href = userData.avatarUrl;
          }
        }
      } catch (err) {
        console.error("Error setting brand details:", err);
      }
    };
    fetchBrandData();
  }, [isAuthenticated]);

  // Show nothing while checking auth token
  if (authChecking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
        <div className="loading-container" role="status" style={{ color: 'white' }}>
          <div className="loading-spinner" style={{ borderColor: 'rgba(255,255,255,0.15)', borderTopColor: '#135bec' }}></div>
          <p className="loading-text" style={{ color: 'rgba(255,255,255,0.5)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Show Login page if not authenticated
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        avatarUrl={data.avatarUrl}
        onLogout={handleLogout}
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
