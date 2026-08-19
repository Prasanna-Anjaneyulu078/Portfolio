import React from 'react';
import SectionHeader from '../SectionHeader';
import './Skills.css';

const formatUrl = (url) => {
  if (!url || url === '#') return '';
  return url.startsWith('http') ? url : `https://${url}`;
};

const getPlatformIcon = (platform, customIcon) => {
  if (customIcon && customIcon !== 'code') return customIcon;
  const p = (platform || '').toLowerCase().replace(/[\s_]+/g, '');
  if (p.includes('leetcode')) return 'code';
  if (p.includes('codechef')) return 'terminal';
  if (p.includes('geeks') || p.includes('gfg') || p.includes('greeks')) return 'code_blocks';
  if (p.includes('codeforces')) return 'terminal';
  if (p.includes('hackerrank')) return 'integration_instructions';
  return customIcon || 'code';
};

const Skills = ({
  skillCategories = [],
  codingProfiles = [],
  loading = false,
  error = false,
  profilesError = false,
}) => {
  // Filter valid categories that contain skills from database
  const validCategories = React.useMemo(() => {
    if (!Array.isArray(skillCategories)) return [];
    return skillCategories.filter(
      (c) => c && c.title && Array.isArray(c.skills) && c.skills.length > 0
    );
  }, [skillCategories]);

  // Filter valid profiles from database
  const validProfiles = React.useMemo(() => {
    if (!Array.isArray(codingProfiles)) return [];
    return codingProfiles.filter(
      (p) => p && p.platform
    );
  }, [codingProfiles]);

  // If no categories and no profiles, return empty state or hide
  const hasNoCategories = validCategories.length === 0;
  const hasNoProfiles = validProfiles.length === 0;

  // Dynamic grid column calculation for Technical Skills
  const categoryGridColumns =
    validCategories.length === 1
      ? '1fr'
      : validCategories.length === 2
      ? 'repeat(2, 1fr)'
      : validCategories.length >= 3
      ? 'repeat(3, 1fr)'
      : 'repeat(2, 1fr)';

  return (
    <section id="skills" className="skills-section">
      <div className="container">
        {/* Main Section Heading */}
        <SectionHeader title="Skills" />

        {/* Subsection 1: Technical Skills */}
        <div className="skills-subsection">
          <h3 className="skills-subsection-title">Technical Skills</h3>

          {loading ? (
            <div className="skills-dev-tools-grid">
              {[1, 2, 3].map((n) => (
                <div key={n} className="skill-card skeleton-card">
                  <div className="skeleton-line skeleton-cat-title skeleton-pulse" />
                  <div className="skill-tags">
                    <div className="skeleton-chip skeleton-pulse" style={{ width: '70px' }} />
                    <div className="skeleton-chip skeleton-pulse" style={{ width: '90px' }} />
                    <div className="skeleton-chip skeleton-pulse" style={{ width: '60px' }} />
                    <div className="skeleton-chip skeleton-pulse" style={{ width: '80px' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="skills-status-card skills-error-state">
              <p className="skills-status-message">Unable to load skills information.</p>
            </div>
          ) : hasNoCategories ? (
            <div className="skills-status-card skills-empty-state">
              <p className="skills-status-message">No technical skills available.</p>
            </div>
          ) : (
            <div
              className="skills-dev-tools-grid"
              style={{ gridTemplateColumns: categoryGridColumns }}
            >
              {validCategories.map((cat, idx) => (
                <div key={cat._id || idx} className="skill-card">
                  <h4 className="skill-category-title">{cat.title}</h4>
                  <div className="skill-tags">
                    {cat.skills.map((skill, index) => (
                      <span key={index} className="skill-badge">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Subsection 2: Coding Profiles */}
        <div className="coding-profiles-subsection">
          <h3 className="skills-subsection-title">Coding Profiles</h3>

          {loading ? (
            <div className="profiles-grid-5col">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="profile-item-card skeleton-card">
                  <div className="skeleton-line skeleton-platform skeleton-pulse" />
                  <div className="skeleton-line skeleton-desc skeleton-pulse" />
                  <div className="skeleton-line skeleton-link skeleton-pulse" />
                </div>
              ))}
            </div>
          ) : profilesError ? (
            <div className="skills-status-card skills-error-state">
              <p className="skills-status-message">Unable to load coding profiles.</p>
            </div>
          ) : hasNoProfiles ? (
            <div className="skills-status-card skills-empty-state">
              <p className="skills-status-message">No coding profiles available.</p>
            </div>
          ) : (
            <div className="profiles-grid-5col">
              {validProfiles.map((profile, idx) => {
                const formattedUrl = formatUrl(profile.url);
                const platformName = profile.platform === 'GreeksForGreeks' ? 'GeeksForGeeks' : profile.platform;
                const iconName = getPlatformIcon(profile.platform, profile.icon);

                return (
                  <div key={profile._id || idx} className="profile-item-card">
                    <div className="profile-card-header">
                      <span className="material-symbols-outlined profile-icon" aria-hidden="true">
                        {iconName}
                      </span>
                      <span className="profile-name">{platformName}</span>
                    </div>

                    {profile.description && (
                      <p className="profile-description">{profile.description}</p>
                    )}

                    {formattedUrl ? (
                      <a
                        href={formattedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="profile-view-link"
                        aria-label={`View ${platformName} profile`}
                      >
                        View Profile ↗
                      </a>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Skills;
