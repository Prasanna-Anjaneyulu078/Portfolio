import React, { useState, useEffect } from 'react';
import axios from 'axios'
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './Header.css';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'About', href: '#about' },
    { name: 'Projects', href: '#projects' },
    { name: 'Skills', href: '#skills' },
    { name: 'Contact', href: '#contact' },
  ];

  const API_URL = "https://prasanna-portfolio-admin.vercel.app/api/user"

  const [data, setData] = useState({
    name: '',
    avatarUrl: '',
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(API_URL)
        const {name, avatarUrl} = response.data
        setData({name: name, avatarUrl: avatarUrl})
        // console.log(response.data)
      } catch (err) {
        console.log(`Error: ${err.message}`)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observerOptions = {
      root: null,
      // Adjusted margin to detect sections when they occupy the top-middle of the viewport
      rootMargin: '-10% 0px -70% 0px',
      threshold: 0
    };

    const handleIntersect = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);
    const sections = document.querySelectorAll('section[id]');
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  const handleLinkClick = (e, href) => {
    // Standard behavior for desktop/anchor navigation
    // On mobile we need to close the menu
    setIsMenuOpen(false);
    
    // Optional: manual scroll if native behavior is inconsistent
    const targetId = href.replace('#', '');
    const element = document.getElementById(targetId);
    if (element) {
      const headerOffset = 72; // height of the sticky header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      
      // Update state immediately to improve UI feedback
      setActiveSection(targetId);
      e.preventDefault();
    }
  };

  return (
    <header className={`header ${scrolled ? 'header-scrolled' : ''}`}>
      <div className="container header-inner">
        <a className="logo" href="#home" onClick={(e) => handleLinkClick(e, '#home')}>
          <div className="logo-profile-wrapper">
            <img 
              src={data.avatarUrl || null}
              alt={data.name || 'User'} 
              className="logo-img" 
              loading="lazy"
            />
          </div>
          <h2 className="logo-text">{data.name}</h2>
        </a>
        
        <nav className="nav-desktop">
          {navLinks.map((link) => (
            <a 
              key={link.name} 
              className={`nav-link ${activeSection === link.href.slice(1) ? 'active' : ''}`} 
              href={link.href}
              onClick={(e) => handleLinkClick(e, link.href)}
            >
              {link.name}
            </a>
          ))}
        </nav>

        <button 
          className="menu-toggle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          <span className="material-symbols-outlined">{isMenuOpen ? 'close' : 'menu'}</span>
        </button>
      </div>

      <div className={`nav-mobile ${isMenuOpen ? 'open' : ''}`}>
        {navLinks.map((link) => (
          <a
            key={link.name}
            className={`mobile-link ${activeSection === link.href.slice(1) ? 'active' : ''}`}
            href={link.href}
            onClick={(e) => handleLinkClick(e, link.href)}
          >
            {link.name}
          </a>
        ))}
      </div>
    </header>
  );
};

export default Header;
