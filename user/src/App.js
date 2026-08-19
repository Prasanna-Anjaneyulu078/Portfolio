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

import { ENDPOINTS, resolveAssetUrl } from './config/api';

const App = () => {
  const [loading, setLoading] = useState(true);

  // Portfolio Data States
  const [userData, setUserData] = useState({});
  const [educationData, setEducationData] = useState({ academic: [], coreObjective: '' });
  const [educationError, setEducationError] = useState(false);
  const [skillsData, setSkillsData] = useState([]);
  const [skillsError, setSkillsError] = useState(false);
  const [profilesData, setProfilesData] = useState([]);
  const [profilesError, setProfilesError] = useState(false);
  const [projectsData, setProjectsData] = useState([]);
  const [projectsError, setProjectsError] = useState(false);
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
          axios.get(ENDPOINTS.USER),
          axios.get(ENDPOINTS.EDUCATION),
          axios.get(ENDPOINTS.SKILLS),
          axios.get(ENDPOINTS.PROFILES),
          axios.get(ENDPOINTS.PROJECTS),
          axios.get(ENDPOINTS.EXPERIENCES),
          axios.get(ENDPOINTS.CERTIFICATIONS),
        ]);

        if (userRes.status === 'fulfilled' && userRes.value.data) {
          setUserData(userRes.value.data);

          // Update Document Title and Favicon
          if (userRes.value.data.name) {
            document.title = `${userRes.value.data.name} Portfolio`;
          }
          if (userRes.value.data.avatarUrl) {
            updateFavicon(resolveAssetUrl(userRes.value.data.avatarUrl));
          }
        }

        if (eduRes.status === 'fulfilled' && eduRes.value.data) {
          setEducationData(eduRes.value.data);
          setEducationError(false);
        } else {
          setEducationError(true);
        }

        if (skillsRes.status === 'fulfilled' && Array.isArray(skillsRes.value.data)) {
          setSkillsData(skillsRes.value.data);
          setSkillsError(false);
        } else {
          setSkillsError(true);
        }

        if (profilesRes.status === 'fulfilled' && Array.isArray(profilesRes.value.data)) {
          setProfilesData(profilesRes.value.data);
          setProfilesError(false);
        } else {
          setProfilesError(true);
        }

        if (projectsRes.status === 'fulfilled' && Array.isArray(projectsRes.value.data)) {
          setProjectsData(projectsRes.value.data);
          setProjectsError(false);
        } else {
          setProjectsError(true);
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
  const hasSkills =
    skillsData.length > 0 || profilesData.length > 0 || skillsError || profilesError;
  const hasProjects = projectsData.length > 0 || projectsError;
  const hasExperience = Array.isArray(experiencesData) && experiencesData.length > 0;
  const hasEducation =
    (Array.isArray(educationData.academic) && educationData.academic.length > 0) ||
    educationError;
  const hasCertifications =
    Array.isArray(certificationsData) &&
    certificationsData.filter((c) => c.isActive !== false).length > 0;

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
            Home -> Skills (Technical & Coding Profiles) -> Projects -> Experience -> Education -> Certifications -> Contact */}

        {/* 1. Home (Hero) */}
        <Hero
          userData={userData}
          educationData={educationData}
          codingProfiles={profilesData}
        />

        {/* 2. Skills (Includes Technical Skills & Coding Profiles Subsections) */}
        {hasSkills && (
          <Skills
            skillCategories={skillsData}
            codingProfiles={profilesData}
            loading={loading}
            error={skillsError}
            profilesError={profilesError}
          />
        )}

        {/* 3. Projects */}
        {hasProjects && (
          <Projects
            projects={projectsData}
            loading={loading}
            error={projectsError}
          />
        )}

        {/* 4. Experience */}
        {hasExperience && <Experience experiences={experiencesData} />}

        {/* 5. Education */}
        {hasEducation && (
          <Education
            academic={educationData.academic}
            loading={loading}
            error={educationError}
          />
        )}

        {/* 6. Certifications */}
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
