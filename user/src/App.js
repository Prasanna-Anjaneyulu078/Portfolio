import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './components/Header';
import Hero from './components/Hero';
import Skills from './components/Skills';
import Projects from './components/Projects';
import Experience from './components/Experience';
import Education from './components/Education';
import Certifications from './components/Certifications';
import Contact from './components/Contact';
import Footer from './components/Footer';
import Loading from './components/Loading';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api';

const App = () => {
  const [loading, setLoading] = useState(true);

  // Portfolio Data States
  const [userData, setUserData] = useState({});
  const [educationData, setEducationData] = useState({ academic: [], coreObjective: '' });
  const [skillsData, setSkillsData] = useState([]);
  const [profilesData, setProfilesData] = useState([]);
  const [projectsData, setProjectsData] = useState([]);
  const [experiencesData, setExperiencesData] = useState([]);
  const [certificationsData, setCertificationsData] = useState([]);

  useEffect(() => {
    const fetchAllPortfolioData = async () => {
      try {
        setLoading(true);

        const [
          userRes,
          eduRes,
          skillsRes,
          profilesRes,
          projectsRes,
          expRes,
          certsRes,
        ] = await Promise.allSettled([
          axios.get(`${API_BASE_URL}/user`),
          axios.get(`${API_BASE_URL}/education`),
          axios.get(`${API_BASE_URL}/skill-groups`),
          axios.get(`${API_BASE_URL}/profiles`),
          axios.get(`${API_BASE_URL}/projects?featured=true`),
          axios.get(`${API_BASE_URL}/experiences`),
          axios.get(`${API_BASE_URL}/certifications`),
        ]);

        if (userRes.status === 'fulfilled' && userRes.value.data) {
          setUserData(userRes.value.data);

          // Update Document Title and Favicon
          if (userRes.value.data.name) {
            document.title = `${userRes.value.data.name} Portfolio`;
          }
          if (userRes.value.data.avatarUrl) {
            updateFavicon(userRes.value.data.avatarUrl);
          }
        }

        if (eduRes.status === 'fulfilled' && eduRes.value.data) {
          setEducationData(eduRes.value.data);
        }

        if (skillsRes.status === 'fulfilled' && Array.isArray(skillsRes.value.data)) {
          setSkillsData(skillsRes.value.data);
        }

        if (profilesRes.status === 'fulfilled' && Array.isArray(profilesRes.value.data)) {
          setProfilesData(profilesRes.value.data);
        }

        if (projectsRes.status === 'fulfilled' && Array.isArray(projectsRes.value.data)) {
          setProjectsData(projectsRes.value.data);
        }

        if (expRes.status === 'fulfilled' && Array.isArray(expRes.value.data)) {
          setExperiencesData(expRes.value.data);
        } else {
          setExperiencesData([]);
        }

        if (certsRes.status === 'fulfilled' && Array.isArray(certsRes.value.data)) {
          setCertificationsData(certsRes.value.data);
        } else {
          setCertificationsData([]);
        }
      } catch (err) {
        console.error("Portfolio data fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    const updateFavicon = (url) => {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = url;
    };

    fetchAllPortfolioData();
  }, []);

  if (loading) {
    return <Loading text="Loading Portfolio..." />;
  }

  // Compute active visible section IDs dynamically based on loaded data
  const hasSkills = skillsData.length > 0;
  const hasProjects = projectsData.length > 0;
  const hasExperience = experiencesData.length > 0;
  const hasEducation = Array.isArray(educationData.academic) && educationData.academic.length > 0;
  const hasCertifications = certificationsData.filter((c) => c.isActive !== false).length > 0;

  const visibleSections = [
    'home',
    hasSkills && 'skills',
    hasProjects && 'projects',
    hasExperience && 'experience',
    hasEducation && 'education',
    hasCertifications && 'certifications',
    'contact',
  ].filter(Boolean);

  return (
    <div className="app-layout">
      {/* Header receives only visible section IDs so navbar strictly matches */}
      <Header visibleSections={visibleSections} userData={userData} />

      <main className="main-content">
        {/* Recruiter-Focused Section Order:
            Home -> Skills -> Projects -> Experience -> Education -> Certifications -> Contact */}

        {/* 1. Home (Hero) */}
        <Hero
          userData={userData}
          educationData={educationData}
          codingProfiles={profilesData}
        />

        {/* 2. Skills (Displayed before Projects) */}
        {hasSkills && (
          <Skills skillCategories={skillsData} codingProfiles={profilesData} />
        )}

        {/* 3. Projects */}
        {hasProjects && <Projects projects={projectsData} />}

        {/* 4. Experience (Dynamic show/hide) */}
        {hasExperience && <Experience experiences={experiencesData} />}

        {/* 5. Education (Dynamic show/hide) */}
        {hasEducation && <Education academic={educationData.academic} />}

        {/* 6. Certifications (Dynamic show/hide) */}
        {hasCertifications && (
          <Certifications certifications={certificationsData} />
        )}

        {/* 7. Contact */}
        <Contact userData={userData} />
      </main>

      <Footer userData={userData} codingProfiles={profilesData} />
    </div>
  );
};

export default App;
