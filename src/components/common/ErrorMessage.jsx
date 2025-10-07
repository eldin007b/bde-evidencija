import React from 'react';
import './ErrorMessage.css';

const ErrorMessage = ({ message }) => (
  <div className="error-message">
    <span>⚠️ {message}</span>
  </div>
);

export default ErrorMessage;
