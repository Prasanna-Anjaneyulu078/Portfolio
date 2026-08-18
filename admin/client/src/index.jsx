import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Standard DOM element selection
const rootElement = document.getElementById('root');

// Runtime check to ensure the DOM is ready for React mounting
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Create root and render App without TypeScript generic annotations
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);