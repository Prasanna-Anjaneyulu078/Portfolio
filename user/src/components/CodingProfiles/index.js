import React from 'react';
import SectionHeader from '../SectionHeader';
import './CodingProfiles.css';

const formatUrl = (url) => {
  if (!url || url === '#') return '';
  return url.startsWith('http') ? url : `https://${url}`;
};

const CodingProfiles = ({ codingProfiles = [], loading = false, error = false }) => {
  // Filter valid profiles from database that have platform name and url
  const validProfiles = React.useMemo(() => {
    if (!Array.isArray(codingProfiles)) return [];
    return codingProfiles.filter(
      (p) => p && p.platform && p.url && p.url.trim().length > 0 && p.url !== '#'
    );
  }, [codingProfiles]);

  // 1. Loading State (Skeleton 2x2 Grid Cards)
  if (loading) {
    return (
      <section id="coding-profiles" className="coding-profiles-section">
        <div className="container">
          <SectionHeader title="Coding Profiles" />
          <div className="profiles-grid-2col">
            {[1, 2, 3, 4].map((n) => (
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

        {/* Dynamic 2-Column Desktop Grid for Coding Profiles */}
        <div className="profiles-grid-2col">
          {validProfiles.map((profile, idx) => {
            const formattedUrl = formatUrl(profile.url);

            return (
              <div key={profile._id || idx} className="profile-item-card">
                <div className="profile-card-header">
                  <span className="profile-name">{profile.platform}</span>
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
                    aria-label={`View ${profile.platform} profile`}
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
