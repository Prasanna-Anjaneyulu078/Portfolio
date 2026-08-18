import React, { useState, useEffect } from 'react';
import './Header.css';

// Full ordered master navigation items list
const MASTER_NAV_ITEMS = [
  { id: 'home', name: 'Home', href: '#home' },
  { id: 'skills', name: 'Skills', href: '#skills' },
  { id: 'projects', name: 'Projects', href: '#projects' },
  { id: 'experience', name: 'Experience', href: '#experience' },
  { id: 'education', name: 'Education', href: '#education' },
  { id: 'certifications', name: 'Certifications', href: '#certifications' },
  { id: 'contact', name: 'Contact', href: '#contact' },
];

const Header = ({ visibleSections = [], userData = {} }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  // Filter navbar links to strictly match visible sections
  const navLinks = MASTER_NAV_ITEMS.filter((item) =>
    visibleSections.includes(item.id)
  );

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
      rootMargin: '-15% 0px -65% 0px',
      threshold: 0,
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
  }, [visibleSections]);

  const handleLinkClick = (e, href) => {
    setIsMenuOpen(false);
    const targetId = href.replace('#', '');
    const element = document.getElementById(targetId);
    if (element) {
      e.preventDefault();
      const headerOffset = 72;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });

      setActiveSection(targetId);
    }
  };

  return (
    <header className={`header ${scrolled ? 'header-scrolled' : ''}`}>
      <div className="container header-inner">
        <a className="logo" href="#home" onClick={(e) => handleLinkClick(e, '#home')}>
          <div className="logo-profile-wrapper">
            {userData.avatarUrl ? (
              <img
                src={userData.avatarUrl}
                alt={userData.name || 'User'}
                className="logo-img"
                loading="lazy"
              />
            ) : (
              <span className="logo-fallback">
                {(userData.name || 'P')[0]?.toUpperCase()}
              </span>
            )}
          </div>
          <h2 className="logo-text">{userData.name || 'Portfolio'}</h2>
        </a>

        <nav className="nav-desktop">
          {navLinks.map((link) => (
            <a
              key={link.id}
              className={`nav-link ${activeSection === link.id ? 'active' : ''}`}
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
            key={link.id}
            className={`mobile-link ${activeSection === link.id ? 'active' : ''}`}
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
