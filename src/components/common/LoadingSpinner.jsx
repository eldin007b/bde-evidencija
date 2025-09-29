import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = () => (
  <div className="loading-spinner">
    <div className="spinner" />
    <span>Učitavanje...</span>
  </div>
);

export default LoadingSpinner;
