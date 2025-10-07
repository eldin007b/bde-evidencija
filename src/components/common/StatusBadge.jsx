import React from 'react';


const StatusBadge = ({ status, children }) => (
  <span style={{
    background: status === 'active' ? '#4caf50' : status === 'pending' ? '#ff9800' : '#607d8b',
    borderRadius: 6,
    padding: '4px 10px',
    color: '#fff',
    fontWeight: 'bold'
  }}>
    {children || status}
  </span>
);

export default StatusBadge;
