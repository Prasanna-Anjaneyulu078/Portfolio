import React from 'react';
import SectionHeader from '../SectionHeader';
import './CodingProfiles.css';

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

const CodingProfiles = ({ codingProfiles = [], loading = false, error = false }) => {
  // Filter valid profiles from database
  const validProfiles = React.useMemo(() => {
    if (!Array.isArray(codingProfiles)) return [];
    return codingProfiles.filter(
      (p) => p && p.platform
    );
  }, [codingProfiles]);

  // 1. Loading State (Skeleton 5-Card Grid)
  if (loading) {
    return (
      <section id="coding-profiles" className="coding-profiles-section">
        <div className="container">
          <SectionHeader title="Coding Profiles" />
          <div className="profiles-grid-5col">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="profile-item-card skeleton-card">
                <div className="skeleton-line skeleton-platform skeleton-pulse" />
                <div className="skeleton-line skeleton-desc skeleton-pulse" />
                <div className="skeleton-line skeleton-link skeleton-pulse" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <section id="coding-profiles" className="coding-profiles-section">
        <div className="container">
          <SectionHeader title="Coding Profiles" />
          <div className="profiles-status-card profiles-error-state">
            <p className="profiles-status-message">Unable to load coding profiles.</p>
          </div>
        </div>
      </section>
    );
  }

  // 3. Empty State
  if (validProfiles.length === 0) {
    return (
      <section id="coding-profiles" className="coding-profiles-section">
        <div className="container">
          <SectionHeader title="Coding Profiles" />
          <div className="profiles-status-card profiles-empty-state">
            <p className="profiles-status-message">No coding profiles available.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="coding-profiles" className="coding-profiles-section">
      <div className="container">
        <SectionHeader title="Coding Profiles" />

        {/* 5-Column Desktop Grid for Coding Profiles */}
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
      </div>
    </section>
  );
};

export default CodingProfiles;
