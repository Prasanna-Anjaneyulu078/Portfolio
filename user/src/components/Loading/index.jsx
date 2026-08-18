import React from 'react';

const Loading = ({ text = "Loading Portfolio..." }) => {
  return (
    <div className="full-page-loading" role="status" aria-label="Loading">
      <div className="loading-spinner"></div>
      <p className="loading-text">{text}</p>
    </div>
  );
};

export default Loading;
