import React from 'react';

const EmptyState = ({ icon, text, subtext }) => (
  <div style={{ alignItems: 'center', marginTop: 40 }}>
    <span style={{ fontSize: 40, marginBottom: 8 }}>{icon}</span>
    <div style={{ fontSize: 16, fontWeight: 'bold' }}>{text}</div>
    {subtext && <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{subtext}</div>}
  </div>
);

export default EmptyState;
