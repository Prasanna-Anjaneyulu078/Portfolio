import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './Footer.css';

const API_URL = 'hhttps://prasanna-portfolio-admin.vercel.app/api/user';

const Footer = () => {
  const [name, setName] = useState('Prasanna Anjaneyulu'); // Fallback name

  useEffect(() => {
    const fetchName = async () => {
      try {
        const response = await axios.get(API_URL);
        if (response.data && response.data.name) {
          setName(response.data.name);
        }
      } catch (err) {
        console.error("Footer fetch error:", err.message);
        // On error, it keeps the default fallback name
      }
    };
    fetchName();
  }, []);

  return (
    <footer className="footer">
      <div className="container footer-content">
        <p className="footer-text">
          © {new Date().getFullYear()} <strong>{name}</strong>. 
          Designed & Built with <span className="heart">MERN Stack</span>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
