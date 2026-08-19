import React from 'react';
import SectionHeader from '../SectionHeader';
import './CodingProfiles.css';

const formatUrl = (url) => {
  if (!url || url === '#') return '';
  return url.startsWith('http') ? url : `https://${url}`;
};

const CodingProfiles = ({ codingProfiles = [], loading = false, error = false }) => {
  // Filter valid profiles from database
  const validProfiles = React.useMemo(() => {
    if (!Array.isArray(codingProfiles)) return [];
    return codingProfiles.filter((p) => p && p.platform);
  }, [codingProfiles]);

  const gridStyle = React.useMemo(() => {
    const count = validProfiles.length || 5;
    return {
      gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))`,
    };
  }, [validProfiles.length]);

  // 1. Loading State (Skeleton Cards)
  if (loading) {
    return (
      <section id="coding-profiles" className="coding-profiles-section">
        <div className="container">
          <SectionHeader title="Coding Profiles" />
          <div className="profiles-grid-5col" style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="profile-item-card skeleton-card">
                <div className="skeleton-line skeleton-platform skeleton-pulse" style={{ width: '70%', height: '1rem', marginBottom: '0.5rem' }} />
                <div className="skeleton-line skeleton-pulse" style={{ width: '55%', height: '0.75rem' }} />
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

        {/* 1×5 Desktop Grid for Coding Profiles */}
        <div className="profiles-grid-5col" style={gridStyle}>
          {validProfiles.map((profile, idx) => {
            const formattedUrl = formatUrl(profile.url);
            const platformName =
              profile.platform === 'GreeksForGreeks' ? 'GeeksForGeeks' : profile.platform;

            return formattedUrl ? (
              <a
                key={profile._id || idx}
                href={formattedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="profile-item-card"
                aria-label={`View ${platformName} profile`}
              >
                <span className="profile-name">{platformName}</span>
                <span className="profile-view-link">View Profile ↗</span>
              </a>
            ) : (
              <div
                key={profile._id || idx}
                className="profile-item-card profile-item-card-disabled"
              >
                <span className="profile-name">{platformName}</span>
                <span className="profile-view-link profile-view-link-disabled">No Profile</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CodingProfiles;
