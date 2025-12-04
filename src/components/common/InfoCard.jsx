import React from 'react';

const InfoCard = ({ icon, label, value, color, bgColor }) => (
  <div style={{
    background: bgColor,
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    minWidth: 90,
    boxShadow: '0 2px 8px rgba(23,105,170,0.10)'
  }}>
    {icon && <span style={{ fontSize: 32, marginBottom: 8 }}>{icon}</span>}
    <div style={{ fontSize: 13, color: '#888', marginBottom: 2, textAlign: 'center' }}>{label}</div>
    <div style={{ fontSize: 18, fontWeight: 'bold', color, textAlign: 'center' }}>{value}</div>
  </div>
);

export default InfoCard;
