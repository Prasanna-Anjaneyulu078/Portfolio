import React, { useState, useEffect } from 'react';
import axios from 'axios'
import './index.css';

const Header = ({ onMenuClick, activeTab, avatarUrl, userName }) => {
  
  const getPageTitle = (tab) => {
    switch (tab) {
      case 'overview': return 'Dashboard Overview';
      case 'personal': return 'Personal Profile';
      case 'about': return 'About & Education';
      case 'skills': return 'Skills & Footprint';
      case 'projects': return 'Project Library';
      case 'resume': return 'Resume Management';
      default: return 'Portfolio Admin';
    }
  };

  

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

  return (
    <header className="header">
      <div className="header-left">
        <button onClick={onMenuClick} className="menu-btn">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <h2 className="header-title">{getPageTitle(activeTab)}</h2>
      </div>
      
      <div className="header-right">
        {/* <button className="notify-btn">
          <span className="material-symbols-outlined">notifications</span>
        </button> */}
        <div className="user-profile">
          <div className="user-info">
            <p className="user-name">{user.name}</p>
            <p className="user-role">Super Admin</p>
          </div>
          <div className="avatar-container">
            <img src={user.avatarUrl} alt="Avatar" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;