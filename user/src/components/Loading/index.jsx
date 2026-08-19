import React from 'react';
import '../../index.css';

const Loading = ({ text = "Loading Portfolio..." }) => {
  return (
    <div className="loading-container" role="status" aria-label="Loading portfolio">
      <div className="loading-spinner"></div>
      <p className="loading-text">{text}</p>
    </div>
  );
};

export default Loading;
