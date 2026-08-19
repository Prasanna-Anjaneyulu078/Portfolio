import React from 'react';
import './SectionHeader.css';

const SectionHeader = ({ title }) => {
  if (!title) return null;
  return (
    <div className="portfolio-section-header">
      <h2 className="portfolio-section-title">{title}</h2>
    </div>
  );
};

export default SectionHeader;
