
import React from 'react';

export default function SkeletonCell({ width = 75, height = 48 }) {
  return (
    <div
      style={{
        width,
        height,
        backgroundColor: '#e0e0e0',
        borderRadius: 8,
        margin: '0 2px',
        animation: 'skeletonPulse 1.6s infinite ease-in-out',
        opacity: 0.7,
      }}
    />
  );
}

// Dodaj u globalStyles.module.css:
// @keyframes skeletonPulse { 0% { opacity: 0.3; } 50% { opacity: 0.8; } 100% { opacity: 0.3; } }
