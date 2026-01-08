import React, { useState, useEffect } from 'react';
import axios from 'axios'
import Modal from '../Modal';
import './index.css';

const Sidebar = ({ isOpen, onClose, activeTab, onTabChange, avatarUrl }) => {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const navItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: 'dashboard' },
    { id: 'personal', label: 'Personal Details', icon: 'person' },
    { id: 'about', label: 'About & Education', icon: 'school' },
    { id: 'skills', label: 'Skills & Stack', icon: 'code' },
    { id: 'projects', label: 'Project Library', icon: 'work' },
    { id: 'resume', label: 'Resume Manager', icon: 'description' },
  ];

  const [user, setUser] = useState({
    name: '',
    avatarUrl: '',
  })

  const API_URL = 'http://localhost:3002/api/user'

  useEffect(() => {
    const fetchData = async () => {
      try{
        const userData = await axios.get(API_URL)
        const {name, avatarUrl} = userData.data
        setUser({name, avatarUrl})
      } catch(err) {
        console.log(`Error: ${err.message}`)
      }
    }
    fetchData()
  }, [])


  const handleTabClick = (tabId) => {
    onTabChange(tabId);
    // Logic: Auto-close sidebar on mobile/tablet after selection
    if (window.innerWidth < 1024) onClose();
  };

  const handleLogout = () => {
    // Logic for logout would go here
    console.log("Logged out successfully");
    setIsLogoutModalOpen(false);
  };

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar ${isOpen ? 'is-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon image-mode">
              <img src={user.avatarUrl} alt="Admin Logo" />
            </div>
            <div className="sidebar-title">
              <h1>Portfolio Admin</h1>
              <p>{user.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="close-btn">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-group-label">Navigation</div>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <div className="nav-active-indicator" />
                <span className={`material-symbols-outlined nav-icon ${isActive ? 'material-symbols-fill' : ''}`}>
                  {item.icon}
                </span>
                <span className="nav-label-text">{item.label}</span>
                {isActive && <span className="material-symbols-outlined active-mark">chevron_right</span>}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={() => setIsLogoutModalOpen(true)}>
            <span className="material-symbols-outlined">logout</span>
            <p>Logout Session</p>
          </button>
        </div>
      </aside>

      <Modal 
        title="Confirm Logout" 
        isOpen={isLogoutModalOpen} 
        onClose={() => setIsLogoutModalOpen(false)} 
        onSave={handleLogout}
      >
        <div className="logout-confirm-body">
          <div className="logout-icon-circle">
            <span className="material-symbols-outlined">door_open</span>
          </div>
          <h3>Are you sure you want to log out?</h3>
          <p>You will need to sign in again to access the portfolio management dashboard.</p>
        </div>
      </Modal>
    </>
  );
};

export default Sidebar;