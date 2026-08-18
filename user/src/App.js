import React, {useEffect} from 'react';
import axios from 'axios'
import Header from './components/Header';
import Hero from './components/Hero';
import About from './components/About';
import Projects from './components/Projects';
import Skills from './components/Skills';
import Contact from './components/Contact';
import Footer from './components/Footer';
import './App.css';

const App = () => {

  useEffect(() => {
    const fetchBrandData = async () => {
      try {
        const response = await axios.get('https://prasanna-portfolio-admin.vercel.app/api/user');
        const userData = response.data;

        if (userData) {
          // 1. Update the Browser Tab Title
          document.title = `${userData.name} Portfolio`;

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
    <div className="app-layout">
      <Header />
      <main className="main-content">
        <Hero />
        <About />
        <Projects />
        <Skills />
        <Contact />
      </main>
      <Footer />
    </div>
  );
};

export default App;
