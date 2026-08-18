import React from 'react';
import './Skills.css';

const DEFAULT_DEV_SKILLS = ['MongoDB', 'Express.js', 'React.js', 'Node.js'];
const DEFAULT_TOOLS_SKILLS = ['Git', 'GitHub', 'VS Code', 'Vercel'];

const TARGET_PROFILES = [
  { name: 'HackerRank', key: 'hackerrank' },
  { name: 'GeeksforGeeks', key: 'geeksforgeeks' },
  { name: 'Code 360', key: 'code360' },
  { name: 'LeetCode', key: 'leetcode' },
];

const formatUrl = (url) => {
  if (!url || url === '#') return '#';
  return url.startsWith('http') ? url : `https://${url}`;
};

const Skills = ({ skillCategories = [], codingProfiles = [] }) => {
  // Extract Development skills (from props or default)
  const devCategory = skillCategories.find(c => 
    c.title?.toLowerCase().includes('dev') || c.title?.toLowerCase().includes('front') || c.title?.toLowerCase().includes('full')
  );
  const devSkills = (devCategory && Array.isArray(devCategory.skills) && devCategory.skills.length > 0)
    ? devCategory.skills
    : DEFAULT_DEV_SKILLS;

  // Extract Tools skills (from props or default)
  const toolsCategory = skillCategories.find(c => 
    c.title?.toLowerCase().includes('tool') || c.title?.toLowerCase().includes('other')
  );
  const toolsSkills = (toolsCategory && Array.isArray(toolsCategory.skills) && toolsCategory.skills.length > 0)
    ? toolsCategory.skills
    : DEFAULT_TOOLS_SKILLS;

  // Resolve 4 coding profiles to existing stored URLs or profile objects
  const resolvedProfiles = TARGET_PROFILES.map((target) => {
    const match = (codingProfiles || []).find(p => {
      const platformName = p.platform?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
      const targetKey = target.key.replace(/[^a-z0-9]/g, '');
      return platformName.includes(targetKey) || targetKey.includes(platformName);
    });
    return {
      platform: target.name,
      url: match ? match.url : '#'
    };
  });

  return (
    <section id="skills" className="skills-section">
      <div className="container">
        <div className="section-title-wrapper">
          <h2 className="section-title">Technical Skills</h2>
        </div>

        {/* 2-Column Cards Grid: Development & Tools */}
        <div className="skills-dev-tools-grid">
          <div className="skill-card">
            <h3 className="skill-category-title">Development</h3>
            <div className="skill-tags">
              {devSkills.map((skill, index) => (
                <span key={index} className="skill-badge">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="skill-card">
            <h3 className="skill-category-title">Tools</h3>
            <div className="skill-tags">
              {toolsSkills.map((skill, index) => (
                <span key={index} className="skill-badge">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Full-Width Coding & Competitive Profiles Card */}
        <div className="coding-profiles-container">
          <h3 className="profiles-title">Coding & Competitive Profiles</h3>
          <div className="profiles-grid-4col">
            {resolvedProfiles.map((profile, idx) => (
              <div key={idx} className="profile-item-card">
                <span className="profile-name">{profile.platform}</span>
                <a
                  href={formatUrl(profile.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="profile-view-link"
                >
                  View Profile
                  <span className="material-symbols-outlined open-icon">north_east</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Skills;
